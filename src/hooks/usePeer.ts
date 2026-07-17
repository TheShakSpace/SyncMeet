import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, MediaConnection } from 'peerjs';
import { peerService } from '../services/peerService';

interface UsePeerProps {
  userId: string | undefined;
  localStream: MediaStream | null;
  onIncomingCall?: (call: MediaConnection) => void;
  onToast?: (message: string) => void;
}

export function usePeer({
  userId,
  localStream,
  onIncomingCall,
  onToast
}: UsePeerProps) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isPeerLoading, setIsPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  localStreamRef.current = localStream; // keep ref updated to avoid closure traps

  const initializePeer = useCallback(() => {
    if (!userId) return;
    if (peerRef.current) return;

    setIsPeerLoading(true);
    setPeerError(null);

    // We can use the userId directly as the PeerJS ID. If PeerJS returns error that 
    // ID is taken (e.g. from hot-reloads or dual browser windows), we fallback to 
    // letting PeerJS generate a random one.
    const newPeer = peerService.createPeer(userId);
    peerRef.current = newPeer;

    newPeer.on('open', (id) => {
      setPeerId(id);
      setPeer(newPeer);
      setIsPeerLoading(false);
      console.log(`PeerJS Connection established. Peer ID: ${id}`);
    });

    // Handle incoming video calls from remote peers
    newPeer.on('call', (call) => {
      console.log(`Incoming call received from remote peer: ${call.peer}`);
      
      // If we have an incoming call handler passed from the parent, trigger it
      if (onIncomingCall) {
        onIncomingCall(call);
      } else {
        // Default behavior: Answer the call with our local stream if active
        if (localStreamRef.current) {
          call.answer(localStreamRef.current);
          console.log(`Answered call from ${call.peer} with local stream.`);
        } else {
          // If local stream is not active yet, answer anyway to establish the connection
          call.answer();
          console.log(`Answered call from ${call.peer} with empty stream.`);
        }
      }
    });

    newPeer.on('error', (err: any) => {
      console.error("PeerJS error received:", err);
      let errMsg = "An error occurred with the peer connection.";
      
      if (err.type === 'peer-unavailable') {
        errMsg = "Requested participant is currently unreachable.";
      } else if (err.type === 'id-taken') {
        errMsg = "Peer connection is already active on another tab or window.";
      } else if (err.type === 'network') {
        errMsg = "Peer network disconnected or firewall blocking connection.";
      }

      setPeerError(err.type);
      if (onToast) {
        onToast(`WebRTC Warning: ${errMsg}`);
      }
      setIsPeerLoading(false);
    });

    // IMPORTANT: Do not auto-reconnect with reconnect() while the component/hook lifecycle
    // is still managing peer creation/destruction. PeerJS cloud reconnect can trigger
    // repeated 'id-taken' / disconnect loops.
    newPeer.on('disconnected', () => {
      console.warn("PeerJS disconnected.");
    });
  }, [userId, onIncomingCall, onToast]);

  const destroyPeer = useCallback(() => {
    if (peerRef.current) {
      const p = peerRef.current;
      peerRef.current = null;
      setPeer(null);
      setPeerId(null);
      
      try {
        p.disconnect();
        p.destroy();
        console.log("PeerJS instance cleanly destroyed.");
      } catch (err) {
        console.error("Error destroying peer instance:", err);
      }
    }
  }, []);

  // Initialize peer when user ID becomes available
  useEffect(() => {
    if (userId) {
      initializePeer();
    }
    return () => {
      destroyPeer();
    };
  }, [userId, initializePeer, destroyPeer]);

  return {
    peer,
    peerId,
    isPeerLoading,
    peerError,
    initializePeer,
    destroyPeer
  };
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, MediaConnection } from 'peerjs';
import { peerService } from '../services/peerService';

interface UsePeerProps {
  userId: string | undefined;
  localStream: MediaStream | null;
  onIncomingCall?: (call: MediaConnection) => void;
  onToast?: (message: string) => void;
}

// Module-level singletons to guarantee exactly one Peer instance
let globalPeer: Peer | null = null;
let globalPeerId: string | null = null;
let activeIncomingCallHandler: ((call: MediaConnection) => void) | null = null;

// In-flight guard to prevent creating a second Peer (and triggering "ID is taken")
let creatingPeer: boolean = false;
let tearingDownPeer: boolean = false;

export function usePeer({
  userId,
  localStream,
  onIncomingCall,
  onToast
}: UsePeerProps) {
  const [peer, setPeer] = useState<Peer | null>(globalPeer);
  const [peerId, setPeerId] = useState<string | null>(globalPeerId);
  const [isPeerLoading, setIsPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  localStreamRef.current = localStream; // keep ref updated to avoid closure traps

  const onIncomingCallRef = useRef(onIncomingCall);
  const onToastRef = useRef(onToast);

  useEffect(() => {
    onIncomingCallRef.current = onIncomingCall;
    onToastRef.current = onToast;
  });

  // Set up activeIncomingCallHandler to route calls to the current callback
  useEffect(() => {
    activeIncomingCallHandler = (call) => {
      if (onIncomingCallRef.current) {
        onIncomingCallRef.current(call);
      } else {
        if (localStreamRef.current) {
          call.answer(localStreamRef.current);
          console.log(`Answered call from ${call.peer} with local stream.`);
        } else {
          call.answer();
          console.log(`Answered call from ${call.peer} with empty stream.`);
        }
      }
    };
    return () => {
      activeIncomingCallHandler = null;
    };
  }, []);

  const initializePeer = useCallback(() => {
    if (!userId) return;



    // Always reuse an existing, not-yet-destroyed peer.
    if (globalPeer && !globalPeer.destroyed) {
      console.log("Reusing existing PeerJS instance.");
      setPeer(globalPeer);
      setPeerId(globalPeerId);
      setIsPeerLoading(false);

      // If disconnected, try to reconnect (do NOT recreate).
      if (globalPeer.disconnected) {
        try {
          globalPeer.reconnect();
        } catch (e) {
          console.warn('[usePeer] reconnect() failed:', e);
        }
      }
      return;
    }

    // Prevent race: if we are in the middle of creating/destroying, don't create another.
    if (creatingPeer || tearingDownPeer) {
      console.warn('[usePeer] initializePeer() skipped due to in-flight create/destroy.');
      return;
    }

    setIsPeerLoading(true);
    setPeerError(null);
    creatingPeer = true;

    const newPeer = peerService.createPeer(userId);
    globalPeer = newPeer;

    newPeer.on('open', (id) => {
      globalPeerId = id;
      setPeerId(id);
      setPeer(newPeer);
      setIsPeerLoading(false);
      creatingPeer = false;
      tearingDownPeer = false;
      console.log(`PeerJS Connection established. Peer ID: ${id}`);
    });

    newPeer.on('call', (call) => {
      console.log(`Incoming call received from remote peer: ${call.peer}`);
      if (activeIncomingCallHandler) {
        activeIncomingCallHandler(call);
      }
    });

    newPeer.on('error', (err: any) => {
      console.error("PeerJS error received:", err);
      let errMsg = "An error occurred with the peer connection.";

      if (err?.type === 'peer-unavailable') {
        errMsg = "Requested participant is currently unreachable.";
      } else if (err?.type === 'id-taken') {
        errMsg = "Peer connection is already active on another tab or window.";
      } else if (err?.type === 'network') {
        errMsg = "Peer network disconnected or firewall blocking connection.";
      }

      setPeerError(err?.type);
      if (onToastRef.current) {
        onToastRef.current(`WebRTC Warning: ${errMsg}`);
      }
      setIsPeerLoading(false);
      creatingPeer = false;

      // Do NOT destroy+recreate on id-taken; allow caller to keep using/handle.
    });

    // Handle reconnects gracefully
    newPeer.on('disconnected', () => {
      console.warn("PeerJS disconnected. Attempting reconnect...");
      if (newPeer && !newPeer.destroyed) {
        try {
          newPeer.reconnect();
        } catch (e) {
          console.warn('[usePeer] reconnect() failed:', e);
        }
      }
    });
  }, [userId]);

  const destroyPeer = useCallback(() => {
    if (!globalPeer) return;

    // Prevent destroy/create race.
    if (tearingDownPeer) return;
    tearingDownPeer = true;

    const p = globalPeer;
    try {
      // Do not null out globalPeer until destroy completes.
      if (!p.destroyed) {
        try {
          p.disconnect();
        } catch (e) {
          console.warn('[usePeer] disconnect() failed:', e);
        }
        p.destroy();
      }

      console.log("PeerJS instance cleanly destroyed.");
    } catch (err) {
      console.error("Error destroying peer instance:", err);
    } finally {
      globalPeer = null;
      globalPeerId = null;
      setPeer(null);
      setPeerId(null);
      setIsPeerLoading(false);
      tearingDownPeer = false;
      creatingPeer = false;
    }
  }, []);

  // Initialize peer when user ID becomes available
  useEffect(() => {
    if (userId) {
      initializePeer();
    }
  }, [userId, initializePeer]);

  return {
    peer,
    peerId,
    isPeerLoading,
    peerError,
    initializePeer,
    destroyPeer
  };
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { Peer, MediaConnection } from 'peerjs';
import { mediaService } from '../services/mediaService';

interface UseRemotePeersProps {
  peer: Peer | null;
  localStream: MediaStream | null;
  onToast?: (message: string) => void;
}

export function useRemotePeers({
  peer,
  localStream,
  onToast
}: UseRemotePeersProps) {
  // Remote streams mapped by peer ID (which is the remote participant's UID or peerId)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  // Speaking status mapped by peer ID
  const [speakingPeers, setSpeakingPeers] = useState<Record<string, boolean>>({});

  // Refs to store active calls and audio analyser cleanups
  const callsRef = useRef<Record<string, MediaConnection>>({});
  const analysersRef = useRef<Record<string, () => void>>({});

  // Clean up a specific peer's connection and audio analysis
  const cleanUpPeerConnection = useCallback((peerId: string) => {
    // 1. Stop audio analyzer
    if (analysersRef.current[peerId]) {
      try {
        analysersRef.current[peerId]();
      } catch (err) {
        console.error("Error cleaning up remote volume analyzer:", err);
      }
      delete analysersRef.current[peerId];
    }

    // 2. Close media connection
    if (callsRef.current[peerId]) {
      try {
        const call = callsRef.current[peerId];
        call.close();
      } catch (err) {
        console.error("Error closing call with peer:", err);
      }
      delete callsRef.current[peerId];
    }

    // 3. Remove from state
    setRemoteStreams(prev => {
      const updated = { ...prev };
      delete updated[peerId];
      return updated;
    });

    setSpeakingPeers(prev => {
      const updated = { ...prev };
      delete updated[peerId];
      return updated;
    });
  }, []);

  // Set up remote stream listener on an active call
  const setupStreamListener = useCallback((call: MediaConnection) => {
    const peerId = call.peer;
    
    // Track active call
    callsRef.current[peerId] = call;

    call.on('stream', (remoteStream) => {
      console.log(`Successfully received live MediaStream from remote peer: ${peerId}`);
      
      // Save remote stream
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: remoteStream
      }));

      // Initialize real-time speaking volume analyzer
      if (analysersRef.current[peerId]) {
        analysersRef.current[peerId]();
      }

      analysersRef.current[peerId] = mediaService.createAudioAnalyser(remoteStream, (isSpeaking) => {
        setSpeakingPeers(prev => {
          if (prev[peerId] === isSpeaking) return prev; // Avoid unnecessary re-renders
          return {
            ...prev,
            [peerId]: isSpeaking
          };
        });
      });
    });

    call.on('close', () => {
      console.log(`Call closed by remote peer: ${peerId}`);
      cleanUpPeerConnection(peerId);
      if (onToast) {
        onToast("A participant disconnected.");
      }
    });

    call.on('error', (err) => {
      console.error(`Call error with peer ${peerId}:`, err);
      cleanUpPeerConnection(peerId);
    });
  }, [cleanUpPeerConnection, onToast]);

  // Initiate an outgoing call to a remote peer
  const callPeer = useCallback((remotePeerId: string) => {
    if (!peer || !localStream) {
      console.warn("Unable to place WebRTC call: PeerJS or local stream is not ready.");
      return;
    }

    // Avoid double-calling
    if (callsRef.current[remotePeerId]) {
      console.log(`WebRTC Call already active or pending with peer: ${remotePeerId}`);
      return;
    }

    console.log(`Calling remote peer: ${remotePeerId}...`);
    try {
      const call = peer.call(remotePeerId, localStream);
      setupStreamListener(call);
    } catch (err) {
      console.error(`Error placing WebRTC call to peer ${remotePeerId}:`, err);
    }
  }, [peer, localStream, setupStreamListener]);

  // Handle answering an incoming call
  const answerIncomingCall = useCallback((call: MediaConnection) => {
    if (!localStream) {
      console.warn("Answering call with empty stream: local stream is not captured yet.");
    }
    
    console.log(`Answering incoming call from peer: ${call.peer}`);
    try {
      call.answer(localStream || undefined);
      setupStreamListener(call);
    } catch (err) {
      console.error(`Error answering incoming call from peer ${call.peer}:`, err);
    }
  }, [localStream, setupStreamListener]);

  // Clean up all active peer connections
  const cleanUpAllConnections = useCallback(() => {
    Object.keys(callsRef.current).forEach(peerId => {
      cleanUpPeerConnection(peerId);
    });
    setRemoteStreams({});
    setSpeakingPeers({});
    callsRef.current = {};
    analysersRef.current = {};
  }, [cleanUpPeerConnection]);

  // Replace the video track in all active calls
  const replaceLocalVideoTrack = useCallback(async (newTrack: MediaStreamTrack) => {
    const promises = Object.values(callsRef.current).map(async (call) => {
      const anyCall = call as any;
      if (anyCall.peerConnection) {
        const senders = anyCall.peerConnection.getSenders();
        const videoSender = senders.find((s: any) => s.track && s.track.kind === 'video');
        if (videoSender) {
          try {
            await videoSender.replaceTrack(newTrack);
          } catch (err) {
            console.error(`Error replacing track for call to ${anyCall.peer}:`, err);
          }
        }
      }
    });
    await Promise.all(promises);
  }, []);

  // Sync calls with local stream changes (e.g. if localStream changes, replace tracks)
  useEffect(() => {
    if (localStream) {
      // For existing active calls, we want to update the sender tracks if supported,
      // or we let them renegotiate. In PeerJS, simply changing track `enabled` state is
      // done locally on the captured tracks, which is synced automagically!
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanUpAllConnections();
    };
  }, [cleanUpAllConnections]);

  return {
    remoteStreams,
    speakingPeers,
    callPeer,
    answerIncomingCall,
    cleanUpPeerConnection,
    cleanUpAllConnections,
    replaceLocalVideoTrack
  };
}

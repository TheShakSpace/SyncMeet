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

  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [speakingPeers, setSpeakingPeers] = useState<Record<string, boolean>>({});

  const callsRef = useRef<Record<string, MediaConnection>>({});
  const analysersRef = useRef<Record<string, () => void>>({});

  const cleanUpPeerConnection = useCallback((peerId: string) => {
    console.log(`[useRemotePeers] 🧹 Cleaning Peer connection for: ${peerId}`);

    if (analysersRef.current[peerId]) {
      try {
        analysersRef.current[peerId]();
      } catch (err) {
        console.error("[useRemotePeers] Error clearing audio analyser:", err);
      }
      delete analysersRef.current[peerId];
    }

    if (callsRef.current[peerId]) {
      try {
        callsRef.current[peerId].close();
      } catch (err) {
        console.error("[useRemotePeers] Error closing call connection:", err);
      }
      delete callsRef.current[peerId];
    }

    setRemoteStreams(prev => {
      const copy = { ...prev };
      delete copy[peerId];
      return copy;
    });

    setSpeakingPeers(prev => {
      const copy = { ...prev };
      delete copy[peerId];
      return copy;
    });

  }, []);

  const setupStreamListener = useCallback((call: MediaConnection) => {
    const peerId = call.peer;

    console.log(`[useRemotePeers] 📞 NEW CONNECTION: Setting up event listeners for remote peer: ${peerId}`);

    callsRef.current[peerId] = call;

    // Track RTCPeerConnection events (ICE state, Connection state, Signaling state)
    const pc = (call as any).peerConnection as RTCPeerConnection;
    if (pc) {
      console.log(`[WebRTC Initialization] Peer: ${peerId}, Initial ICE State: ${pc.iceConnectionState}, Initial Connection State: ${pc.connectionState}`);
      
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC ICE State] Peer: ${peerId}, State: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          console.warn(`[WebRTC ICE Warning] Peer ${peerId} ICE connection is in state: ${pc.iceConnectionState}`);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Connection State] Peer: ${peerId}, State: ${pc.connectionState}`);
      };

      pc.onsignalingstatechange = () => {
        console.log(`[WebRTC Signaling State] Peer: ${peerId}, State: ${pc.signalingState}`);
      };
    }

    call.on("stream", (remoteStream: MediaStream) => {
      console.log(`[useRemotePeers] ✅ REMOTE STREAM RECEIVED from peer: ${peerId}`);
      console.log(`[useRemotePeers] Stream ID: ${remoteStream.id}, Video tracks: ${remoteStream.getVideoTracks().length}, Audio tracks: ${remoteStream.getAudioTracks().length}`);

      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: remoteStream
      }));

      if (analysersRef.current[peerId]) {
        analysersRef.current[peerId]();
      }

      analysersRef.current[peerId] = mediaService.createAudioAnalyser(
        remoteStream,
        (isSpeaking) => {
          setSpeakingPeers(prev => ({
            ...prev,
            [peerId]: isSpeaking
          }));
        }
      );
    });

    call.on("close", () => {
      console.log(`[useRemotePeers] ❌ Call Closed by peer: ${peerId}`);
      cleanUpPeerConnection(peerId);
      if (onToast) {
        onToast("Participant disconnected.");
      }
    });

    call.on("error", (err) => {
      console.error(`[useRemotePeers] ❌ PeerJS Call Error with peer ${peerId}:`, err);
      cleanUpPeerConnection(peerId);
    });

  }, [cleanUpPeerConnection, onToast]);

  const callPeer = useCallback((remotePeerId: string) => {
    if (!peer || peer.destroyed || peer.disconnected) {
      console.warn("[useRemotePeers] Cannot call: Local Peer is not connected/ready.");
      return;
    }
    if (!localStream || localStream.getVideoTracks().length === 0) {
      console.warn("[useRemotePeers] Cannot call: Local stream video track is not active.");
      return;
    }
    if (!remotePeerId || remotePeerId === peer.id) {
      return;
    }

    if (callsRef.current[remotePeerId]) {
      console.log(`[useRemotePeers] Already connected or connecting to: ${remotePeerId}`);
      return;
    }

    try {
      console.log(`[useRemotePeers] 📤 OUTGOING CALL: Calling remote Peer ID: ${remotePeerId} from my Peer ID: ${peer.id}`);
      const call = peer.call(remotePeerId, localStream);
      setupStreamListener(call);
    } catch (err) {
      console.error(`[useRemotePeers] peer.call failed for target ${remotePeerId}:`, err);
    }

  }, [peer, localStream, setupStreamListener]);

  const answerIncomingCall = useCallback((call: MediaConnection) => {
    const remotePeerId = call.peer;
    if (!peer || peer.destroyed) return;

    if (callsRef.current[remotePeerId]) {
      console.log(`[useRemotePeers] Duplicate incoming call from: ${remotePeerId}. Rejecting duplicate.`);
      return;
    }

    try {
      console.log(`[useRemotePeers] 📥 INCOMING CALL: Answering incoming call from peer: ${remotePeerId}`);
      call.answer(localStream || undefined);
      setupStreamListener(call);
    } catch (err) {
      console.error(`[useRemotePeers] Answering incoming call failed from ${remotePeerId}:`, err);
    }

  }, [peer, localStream, setupStreamListener]);

  const cleanUpAllConnections = useCallback(() => {
    console.log("[useRemotePeers] 🧹 Cleaning all remote peer connections");
    Object.keys(callsRef.current).forEach(cleanUpPeerConnection);
    callsRef.current = {};
    analysersRef.current = {};
    setRemoteStreams({});
    setSpeakingPeers({});
  }, [cleanUpPeerConnection]);

  const replaceLocalVideoTrack = useCallback(async (newTrack: MediaStreamTrack) => {
    console.log(`[useRemotePeers] 🔄 Replacing video track for all remote peers with: ${newTrack.label}`);
    for (const call of Object.values(callsRef.current)) {
      const pc = (call as any).peerConnection;
      if (!pc) continue;
      const sender = pc
        .getSenders()
        .find((s: RTCRtpSender) => s.track?.kind === "video");

      if (sender) {
        try {
          await sender.replaceTrack(newTrack);
          console.log("[useRemotePeers] 🎥 Video track replaced successfully in peer sender");
        } catch (err) {
          console.error("[useRemotePeers] Failed to replace video track in connection:", err);
        }
      }
    }
  }, []);

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
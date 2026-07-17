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

    console.log("🧹 Cleaning Peer:", peerId);

    if (analysersRef.current[peerId]) {
      try {
        analysersRef.current[peerId]();
      } catch (err) {
        console.error(err);
      }
      delete analysersRef.current[peerId];
    }

    if (callsRef.current[peerId]) {
      try {
        callsRef.current[peerId].close();
      } catch (err) {
        console.error(err);
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

    console.log("====================================");
    console.log("📞 NEW CONNECTION");
    console.log("Remote Peer:", peerId);
    console.log("====================================");

    callsRef.current[peerId] = call;

    call.on("stream", (remoteStream: MediaStream) => {

      console.log("====================================");
      console.log("✅ REMOTE STREAM RECEIVED");
      console.log("Peer:", peerId);
      console.log("Stream ID:", remoteStream.id);
      console.log("Tracks:", remoteStream.getTracks());
      console.log("Video:", remoteStream.getVideoTracks().length);
      console.log("Audio:", remoteStream.getAudioTracks().length);
      console.log("====================================");

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

      console.log("❌ Call Closed:", peerId);

      cleanUpPeerConnection(peerId);

      if (onToast) {
        onToast("Participant disconnected.");
      }

    });

    call.on("error", (err) => {

      console.error("❌ PeerJS Call Error");
      console.error(err);

      cleanUpPeerConnection(peerId);

    });

  }, [cleanUpPeerConnection, onToast]);

  const callPeer = useCallback((remotePeerId: string) => {

    console.log("====================================");
    console.log("📤 OUTGOING CALL");
    console.log("My Peer:", peer?.id);
    console.log("Remote Peer:", remotePeerId);
    console.log("Local Stream:", localStream);
    console.log("====================================");

    if (!peer || !localStream) {
      console.warn("Peer or Local Stream not ready.");
      return;
    }

    if (callsRef.current[remotePeerId]) {
      console.log("Already connected:", remotePeerId);
      return;
    }

    try {

      const call = peer.call(remotePeerId, localStream);

      console.log("☎️ peer.call() executed");

      setupStreamListener(call);

    } catch (err) {

      console.error("peer.call failed");
      console.error(err);

    }

  }, [peer, localStream, setupStreamListener]);

  const answerIncomingCall = useCallback((call: MediaConnection) => {

    console.log("====================================");
    console.log("📥 INCOMING CALL");
    console.log("From:", call.peer);
    console.log("My Peer:", peer?.id);
    console.log("Local Stream:", localStream);
    console.log("====================================");

    try {

      call.answer(localStream || undefined);

      console.log("✅ Call Answered");

      setupStreamListener(call);

    } catch (err) {

      console.error("Answer failed");
      console.error(err);

    }

  }, [peer, localStream, setupStreamListener]);

  const cleanUpAllConnections = useCallback(() => {

    console.log("🧹 Cleaning all peer connections");

    Object.keys(callsRef.current).forEach(cleanUpPeerConnection);

    callsRef.current = {};
    analysersRef.current = {};

    setRemoteStreams({});
    setSpeakingPeers({});

  }, [cleanUpPeerConnection]);

  const replaceLocalVideoTrack = useCallback(async (newTrack: MediaStreamTrack) => {

    for (const call of Object.values(callsRef.current)) {

      const pc = (call as any).peerConnection;

      if (!pc) continue;

      const sender = pc
        .getSenders()
        .find((s: RTCRtpSender) => s.track?.kind === "video");

      if (sender) {

        try {

          await sender.replaceTrack(newTrack);

          console.log("🎥 Video track replaced");

        } catch (err) {

          console.error(err);

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
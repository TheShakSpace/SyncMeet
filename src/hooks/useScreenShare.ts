import { useState, useCallback, useRef, useEffect } from 'react';
import { screenShareService } from '../services/screenShareService';

interface UseScreenShareProps {
  meetingId: string | undefined;
  userId: string | undefined;
  localStream: MediaStream | null;
  onReplaceVideoTrack: (track: MediaStreamTrack) => void;
  onRestoreWebcam: () => Promise<void>;
  onToast?: (message: string) => void;
  isFirebaseEnabled?: boolean;
}

export function useScreenShare({
  meetingId,
  userId,
  localStream,
  onReplaceVideoTrack,
  onRestoreWebcam,
  onToast,
  isFirebaseEnabled
}: UseScreenShareProps) {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    setIsSharing(false);

    // Restore webcam
    try {
      await onRestoreWebcam();
      if (onToast) {
        onToast("Screen sharing stopped. Reverting to camera.");
      }
    } catch (err) {
      console.error("Error restoring camera after screen share:", err);
    }
  }, [screenStream, onRestoreWebcam, onToast]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await screenShareService.getScreenStream();
      const videoTrack = stream.getVideoTracks()[0];

      if (!videoTrack) {
        throw new Error("No video track found in screen stream.");
      }

      setScreenStream(stream);
      setIsSharing(true);
      screenTrackRef.current = videoTrack;

      // Replace video track in active WebRTC connections
      onReplaceVideoTrack(videoTrack);

      // Handle when user clicks the browser's native "Stop Sharing" button
      videoTrack.onended = () => {
        stopScreenShare();
      };

      if (onToast) {
        onToast("You are now presenting your screen.");
      }
    } catch (err: any) {
      console.error("Error starting screen share:", err);
      if (onToast) {
        onToast("Could not initiate screen sharing.");
      }
      throw err;
    }
  }, [onReplaceVideoTrack, stopScreenShare, onToast]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
    };
  }, []);

  return {
    screenStream,
    isSharing,
    startScreenShare,
    stopScreenShare
  };
}

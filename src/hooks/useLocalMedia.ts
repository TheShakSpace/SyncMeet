import { useState, useEffect, useRef, useCallback } from 'react';
import { mediaService } from '../services/mediaService';

interface UseLocalMediaProps {
  initialMicOn?: boolean;
  initialCameraOn?: boolean;
  onToast?: (message: string) => void;
}

export function useLocalMedia({
  initialMicOn = true,
  initialCameraOn = true,
  onToast
}: UseLocalMediaProps = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(initialMicOn);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraOn);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const analyserCleanupRef = useRef<(() => void) | null>(null);

  // Initialize and capture local media stream
  const startLocalStream = useCallback(async () => {
    // If we already have an active stream, stop it first
    if (streamRef.current) {
      mediaService.stopStream(streamRef.current);
    }

    try {
      setMediaError(null);
      const stream = await mediaService.getLocalStream(true, true);
      
      streamRef.current = stream;
      setLocalStream(stream);

      // Apply initial mic and camera enabled states on tracks
      mediaService.toggleAudio(stream, isMicOn);
      mediaService.toggleVideo(stream, isCameraOn);

      // Initialize speaking volume analyser
      if (analyserCleanupRef.current) {
        analyserCleanupRef.current();
      }
      analyserCleanupRef.current = mediaService.createAudioAnalyser(stream, (isSpeaking) => {
        setIsLocalSpeaking(isSpeaking);
      });

      if (onToast) {
        onToast("Camera and microphone initialized successfully.");
      }
    } catch (err: any) {
      let errorMessage = "Could not access camera or microphone.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Camera/Microphone permission was denied. Please allow device access in your browser settings.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "No camera or microphone devices found on this system.";
      }
      
      setMediaError(errorMessage);
      if (onToast) {
        onToast(errorMessage);
      }

      // Fallback: Try audio-only if full video fails
      try {
        const audioOnlyStream = await mediaService.getLocalStream(true, false);
        streamRef.current = audioOnlyStream;
        setLocalStream(audioOnlyStream);
        setIsCameraOn(false);
        mediaService.toggleAudio(audioOnlyStream, isMicOn);
        
        if (analyserCleanupRef.current) {
          analyserCleanupRef.current();
        }
        analyserCleanupRef.current = mediaService.createAudioAnalyser(audioOnlyStream, (isSpeaking) => {
          setIsLocalSpeaking(isSpeaking);
        });
        
        setMediaError("Using microphone-only fallback (Camera blocked or unavailable).");
        if (onToast) {
          onToast("Microphone active; camera unavailable.");
        }
      } catch (fallbackErr) {
        // Complete device blockage: create an empty dummy stream to prevent UI crashes
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(0, 0, 640, 480);
        }
        
        try {
          const dummyStream = (canvas as any).captureStream ? (canvas as any).captureStream() : new MediaStream();
          streamRef.current = dummyStream;
          setLocalStream(dummyStream);
          setIsMicOn(false);
          setIsCameraOn(false);
        } catch (dummyErr) {
          console.warn("Failed to create dummy canvas fallback stream:", dummyErr);
        }
      }
    }
  }, [isMicOn, isCameraOn, onToast]);

  // Clean up stream tracks
  const stopLocalStream = useCallback(() => {
    if (analyserCleanupRef.current) {
      analyserCleanupRef.current();
      analyserCleanupRef.current = null;
    }
    if (streamRef.current) {
      mediaService.stopStream(streamRef.current);
      streamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  // Toggle Microphone Audio Track
  const toggleMic = useCallback(() => {
    setIsMicOn(prev => {
      const next = !prev;
      if (streamRef.current) {
        mediaService.toggleAudio(streamRef.current, next);
      }
      return next;
    });
  }, []);

  // Toggle Camera Video Track
  const toggleCamera = useCallback(() => {
    setIsCameraOn(prev => {
      const next = !prev;
      if (streamRef.current) {
        mediaService.toggleVideo(streamRef.current, next);
      }
      return next;
    });
  }, []);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalStream();
    };
  }, [stopLocalStream]);

  return {
    localStream,
    isMicOn,
    isCameraOn,
    mediaError,
    isLocalSpeaking,
    startLocalStream,
    stopLocalStream,
    toggleMic,
    toggleCamera
  };
}

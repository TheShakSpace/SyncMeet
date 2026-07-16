import { useState, useRef, useEffect, useCallback } from 'react';

interface RecordingMeta {
  duration: string;
  size: string;
  timestamp: string;
}

interface UseMeetingRecorderProps {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  onToast: (message: string) => void;
  onBroadcastSystemMessage?: (text: string) => void;
}

export function useMeetingRecorder({
  localStream,
  screenStream,
  remoteStreams,
  onToast,
  onBroadcastSystemMessage
}: UseMeetingRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // in seconds
  const [recorderError, setRecorderError] = useState<string | null>(null);
  
  // Completed recording artifacts
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingMeta, setRecordingMeta] = useState<RecordingMeta | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamToRecordRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Helper: Format bytes to human readable form
  const formatBytes = (bytes: number, decimals = 1): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper: Format duration to HH:MM:SS or MM:SS
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h > 0 ? h : null,
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Helper: Get supported MIME types
  const getSupportedMimeType = (): string => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  // Start recording
  const startRecording = useCallback(() => {
    try {
      setRecorderError(null);
      chunksRef.current = [];
      setRecordingDuration(0);

      // Check browser compatibility
      if (typeof MediaRecorder === 'undefined') {
        throw new Error("Your browser does not support the MediaRecorder API. Please try Google Chrome or Mozilla Firefox.");
      }

      // Track selection
      const tracks: MediaStreamTrack[] = [];

      // 1. Get video track
      let videoTrack: MediaStreamTrack | null = null;
      if (screenStream && screenStream.getVideoTracks().length > 0) {
        videoTrack = screenStream.getVideoTracks()[0];
      } else if (localStream && localStream.getVideoTracks().length > 0) {
        videoTrack = localStream.getVideoTracks()[0];
      }

      if (!videoTrack) {
        throw new Error("No active video feed found. Please turn on your webcam or start screen sharing first.");
      }
      tracks.push(videoTrack);

      // 2. Mix audios (microphone, screen share audio, peer audios)
      let mixedAudioTrack: MediaStreamTrack | null = null;
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const dest = audioContext.createMediaStreamDestination();
        let hasAudioSource = false;

        // Input 1: Local microphone
        if (localStream && localStream.getAudioTracks().length > 0) {
          const micSource = audioContext.createMediaStreamSource(localStream);
          micSource.connect(dest);
          hasAudioSource = true;
        }

        // Input 2: Screen share audio
        if (screenStream && screenStream.getAudioTracks().length > 0) {
          const screenAudioSource = audioContext.createMediaStreamSource(screenStream);
          screenAudioSource.connect(dest);
          hasAudioSource = true;
        }

        // Input 3: Remote peers audio
        Object.values(remoteStreams).forEach(pStream => {
          if (pStream.getAudioTracks().length > 0) {
            const remoteSource = audioContext.createMediaStreamSource(pStream);
            remoteSource.connect(dest);
            hasAudioSource = true;
          }
        });

        if (hasAudioSource && dest.stream.getAudioTracks().length > 0) {
          mixedAudioTrack = dest.stream.getAudioTracks()[0];
        }
      } catch (err) {
        console.warn("Failed to initialize Web Audio API mixer. Falling back to simple microphone track:", err);
      }

      // If Web Audio mixer succeeded, use its output, otherwise fallback to local mic
      if (mixedAudioTrack) {
        tracks.push(mixedAudioTrack);
      } else if (localStream && localStream.getAudioTracks().length > 0) {
        tracks.push(localStream.getAudioTracks()[0]);
      }

      // Construct stream to record
      const streamToRecord = new MediaStream(tracks);
      streamToRecordRef.current = streamToRecord;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error("No compatible recording formats found on this browser.");
      }

      const recorder = new MediaRecorder(streamToRecord, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(finalBlob);
        
        setRecordingBlob(finalBlob);
        setRecordingUrl(url);
        
        setRecordingMeta({
          duration: formatDuration(recordingDuration),
          size: formatBytes(finalBlob.size),
          timestamp: new Date().toLocaleString()
        });

        // Cleanup stream to record
        if (streamToRecordRef.current) {
          streamToRecordRef.current.getTracks().forEach(t => t.stop());
          streamToRecordRef.current = null;
        }

        // Close AudioContext
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
          audioContextRef.current = null;
        }

        setIsRecording(false);
        setIsPaused(false);
        onToast("Meeting recording processed and saved successfully.");
      };

      // Handle on-error
      recorder.onerror = (e: any) => {
        console.error("MediaRecorder error:", e);
        setRecorderError(e.message || "An error occurred during media recording.");
        stopRecording();
      };

      // Start recording & timer
      recorder.start(1000); // chunk every 1 sec
      setIsRecording(true);
      setIsPaused(false);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      onToast("Meeting recording started successfully.");
      
      if (onBroadcastSystemMessage) {
        onBroadcastSystemMessage("Meeting recording has started.");
      }
    } catch (err: any) {
      console.error("Failed to start MediaRecorder:", err);
      const msg = err.message || "Permission denied or device conflict encountered.";
      setRecorderError(msg);
      onToast(`Recording error: ${msg}`);
    }
  }, [localStream, screenStream, remoteStreams, onToast, onBroadcastSystemMessage, recordingDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping MediaRecorder:", err);
      }
    }

    if (onBroadcastSystemMessage) {
      onBroadcastSystemMessage("Meeting recording has ended.");
    }
  }, [onBroadcastSystemMessage]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      onToast("Recording paused.");
      if (onBroadcastSystemMessage) {
        onBroadcastSystemMessage("Meeting recording paused.");
      }
    }
  }, [onToast, onBroadcastSystemMessage]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      onToast("Recording resumed.");
      if (onBroadcastSystemMessage) {
        onBroadcastSystemMessage("Meeting recording resumed.");
      }
    }
  }, [onToast, onBroadcastSystemMessage]);

  // Clear active recording artifact
  const clearRecording = useCallback(() => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }
    setRecordingBlob(null);
    setRecordingUrl(null);
    setRecordingMeta(null);
  }, [recordingUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    formattedDuration: formatDuration(recordingDuration),
    recorderError,
    recordingBlob,
    recordingUrl,
    recordingMeta,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  };
}

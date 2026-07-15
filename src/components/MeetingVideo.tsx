import React, { useEffect, useRef } from 'react';

interface MeetingVideoProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  isSelf?: boolean;
  className?: string;
  id?: string;
}

export const MeetingVideo: React.FC<MeetingVideoProps> = ({
  stream,
  isMuted = false,
  isSelf = false,
  className = '',
  id
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      // Bind MediaStream to HTML video source object
      videoElement.srcObject = stream;
      
      // Auto-play stream once attached
      videoElement.play().catch(err => {
        console.warn("Autoplay blocked or stream paused: ", err);
      });
    } else {
      videoElement.srcObject = null;
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <video
      id={id || `meeting-video-${isSelf ? 'self' : 'remote'}`}
      ref={videoRef}
      muted={isMuted}
      playsInline
      autoPlay
      className={`w-full h-full object-cover transition-opacity duration-300 ${isSelf ? 'scale-x-[-1]' : ''} ${className}`}
    />
  );
};

export default React.memo(MeetingVideo);

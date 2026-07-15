export const mediaService = {
  // Capture local webcam and microphone stream
  async getLocalStream(audio: boolean = true, video: boolean = true): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
        video: video ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } : false
      };
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      console.error("Failed to acquire user media: ", err);
      throw err;
    }
  },

  // Safely stop all active tracks in a media stream
  stopStream(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch (err) {
        console.error("Error stopping track:", err);
      }
    });
  },

  // Toggle active status of audio tracks
  toggleAudio(stream: MediaStream | null, enabled: boolean): void {
    if (!stream) return;
    stream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  },

  // Toggle active status of video tracks
  toggleVideo(stream: MediaStream | null, enabled: boolean): void {
    if (!stream) return;
    stream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  },

  // Create an real-time audio volume analyzer for active speaker detection
  createAudioAnalyser(stream: MediaStream, onVolume: (isSpeaking: boolean) => void): () => void {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      onVolume(false);
      return () => {};
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let javascriptNode: ScriptProcessorNode | null = null;
    let isDestroyed = false;

    try {
      // Create new audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return () => {};

      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      let speakingCounter = 0;
      let silentCounter = 0;

      javascriptNode.onaudioprocess = () => {
        if (isDestroyed) return;
        const array = new Uint8Array(analyser!.frequencyBinCount);
        analyser!.getByteFrequencyData(array);
        let values = 0;

        const length = array.length;
        for (let i = 0; i < length; i++) {
          values += array[i];
        }

        const average = values / length;
        // Threshold of volume level to detect human speech
        const threshold = 12;

        if (average > threshold) {
          speakingCounter++;
          silentCounter = 0;
          if (speakingCounter > 2) {
            onVolume(true);
          }
        } else {
          silentCounter++;
          speakingCounter = 0;
          if (silentCounter > 4) {
            onVolume(false);
          }
        }
      };
    } catch (err) {
      console.warn("Audio Context creation failed (could be browser tab autoplay security):", err);
    }

    // Cleanup callback
    return () => {
      isDestroyed = true;
      try {
        if (javascriptNode) javascriptNode.disconnect();
        if (microphone) microphone.disconnect();
        if (analyser) analyser.disconnect();
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      } catch (err) {
        console.error("Error cleaning up audio context:", err);
      }
    };
  }
};

export const screenShareService = {
  // Capture display media stream (screen, window, tab)
  async getScreenStream(): Promise<MediaStream> {
    try {
      const constraints: DisplayMediaStreamOptions = {
        video: {
          displaySurface: 'monitor',
        },
        audio: true
      };
      return await navigator.mediaDevices.getDisplayMedia(constraints);
    } catch (err) {
      console.error("Failed to acquire screen share media:", err);
      throw err;
    }
  }
};

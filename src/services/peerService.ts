import { Peer } from 'peerjs';

export const peerService = {
  // Initialize a PeerJS peer instance
  createPeer(userId: string): Peer {
    // We append a simple prefix to make it a distinct peer namespace if needed, 
    // but utilizing the direct userId is ideal. We fallback to default cloud config.
    const config = {
      host: '0.peerjs.com',
      port: 443,
      secure: true,
      debug: 1 // Only log errors
    };

    try {
      return new Peer(userId, config);
    } catch (err) {
      console.error("PeerJS initialization failed, instantiating with default settings:", err);
      return new Peer(config);
    }
  }
};

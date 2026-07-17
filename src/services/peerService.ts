import { Peer } from 'peerjs';

export const peerService = {
  // Initialize a PeerJS peer instance (stable single peer per user).
  createPeer(userId: string): Peer {
    // Dynamically use the current window host and port
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const port = typeof window !== 'undefined' && window.location.port ? parseInt(window.location.port) : 3000;
    const secure = typeof window !== 'undefined' ? window.location.protocol === 'https:' : false;

    const config = {
      host,
      port,
      path: '/peerjs',
      secure,
      debug: 1 // Enable logging to trace signaling/connection states
    };

    console.log(`[PeerService] Initializing Peer with ID: ${userId} connecting to: ${secure ? 'https' : 'http'}://${host}:${port}/peerjs`);

    return new Peer(userId, config);
  }
};

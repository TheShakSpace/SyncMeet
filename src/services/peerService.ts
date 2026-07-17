import { Peer } from 'peerjs';

export const peerService = {
  // Initialize a PeerJS peer instance (stable single peer per user).
  createPeer(userId: string): Peer {
    // Use PeerJS cloud. If you want a stable self-hosted PeerServer,
    // switch host/port/secure below.
    const config = {
      host: '0.peerjs.com',
      port: 443,
      secure: true,
      // Keep logs minimal; production readiness
      debug: 0
    };

    // PeerJS ID must be stable per user to prevent duplicate IDs.
    return new Peer(userId, config);
  }
};


import { doc, updateDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Participant } from '../types';

export const meetingConnectionService = {
  // Register a PeerJS Peer ID in Firestore so other participants can discover and connect to us
  async registerPeerId(meetingId: string, userId: string, peerId: string): Promise<void> {
    try {
      const participantRef = doc(db, 'meetings', meetingId, 'participants', userId);
      await updateDoc(participantRef, {
        peerId,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error registering Peer ID in Firestore:", err);
    }
  },

  // Update real-time microphone and camera states in Firestore
  async updateMediaState(
    meetingId: string, 
    userId: string, 
    audioEnabled: boolean, 
    videoEnabled: boolean
  ): Promise<void> {
    try {
      const participantRef = doc(db, 'meetings', meetingId, 'participants', userId);
      await updateDoc(participantRef, {
        audioEnabled,
        videoEnabled,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error updating media states in Firestore:", err);
    }
  },

  // Listen to active participants in the meeting room (including their peer IDs)
  listenToParticipants(meetingId: string, onUpdate: (participants: Participant[]) => void): () => void {
    const participantsRef = collection(db, 'meetings', meetingId, 'participants');
    
    return onSnapshot(participantsRef, (snapshot) => {
      const activeParticipantsList: Participant[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Ignore left participants
        if (data.leftAt) return;
        
        activeParticipantsList.push({
          uid: docSnap.id,
          displayName: data.displayName || 'Anonymous',
          photoURL: data.photoURL || '',
          audioEnabled: data.audioEnabled ?? true,
          videoEnabled: data.videoEnabled ?? true,
          screenShareEnabled: data.screenShareEnabled ?? false,
          isHost: data.isHost ?? false,
          joinedAt: data.joinedAt ? new Date(data.joinedAt.seconds * 1000).toISOString() : new Date().toISOString(),
          handRaised: data.handRaised ?? false,
          isSpeaking: data.isSpeaking ?? false,
          peerId: data.peerId // Include custom peerId if present
        } as any);
      });
      onUpdate(activeParticipantsList);
    }, (err) => {
      console.error("Error streaming participants from Firestore:", err);
    });
  }
};

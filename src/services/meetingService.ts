import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Meeting, Participant, ChatMessage } from '../types';

export const meetingService = {
  // Create a new meeting in Firestore
  async createMeeting(meetingId: string, meetingData: Omit<Meeting, 'id'>): Promise<void> {
    try {
      const docRef = doc(db, 'meetings', meetingId);
      await setDoc(docRef, {
        ...meetingData,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error creating meeting doc in Firestore:", err);
      throw err;
    }
  },

  // Check if a meeting exists and retrieve its details
  async getMeeting(meetingId: string): Promise<Meeting | null> {
    try {
      const docRef = doc(db, 'meetings', meetingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          durationMinutes: data.durationMinutes || data.duration || 30,
          status: data.status || 'active',
          hostId: data.hostId || '',
          hostName: data.hostName || '',
          scheduledTime: data.scheduledTime || new Date().toISOString(),
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
        } as Meeting;
      }
      return null;
    } catch (err) {
      console.error("Error getting meeting details:", err);
      return null;
    }
  },

  // Join a participant into a meeting
  async joinParticipant(meetingId: string, participant: Omit<Participant, 'joinedAt'>): Promise<void> {
    try {
      const docRef = doc(db, 'meetings', meetingId, 'participants', participant.uid);
      await setDoc(docRef, {
        ...participant,
        joinedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error joining participant to Firestore:", err);
      throw err;
    }
  },

  // Leave a participant from a meeting
  async removeParticipant(meetingId: string, uid: string): Promise<void> {
    try {
      const docRef = doc(db, 'meetings', meetingId, 'participants', uid);
      await setDoc(docRef, { status: 'offline' }, { merge: true });
    } catch (err) {
      console.error("Error removing participant from meeting:", err);
    }
  },

  // Send a real-time message to a meeting's chat room
  async sendMessage(meetingId: string, message: { senderId: string, senderName: string, senderPhotoURL: string, text: string }): Promise<void> {
    try {
      const messagesRef = collection(db, 'meetings', meetingId, 'messages');
      await addDoc(messagesRef, {
        ...message,
        timestamp: serverTimestamp(),
        isSystem: false
      });
    } catch (err) {
      console.error("Error sending chat message:", err);
      throw err;
    }
  }
};

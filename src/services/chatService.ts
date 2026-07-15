import { collection, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const chatService = {
  // Send a new chat message to Firestore
  async sendMessage(
    meetingId: string, 
    userId: string, 
    userName: string, 
    userPhoto: string, 
    text: string
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'meetings', meetingId, 'messages');
      await addDoc(messagesRef, {
        senderId: userId,
        senderName: userName,
        senderPhotoURL: userPhoto || '',
        text: text.trim(),
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending chat message in chatService:", err);
    }
  },

  // Update typing indicator in Firestore participant doc
  async setTypingStatus(
    meetingId: string, 
    userId: string, 
    isTyping: boolean
  ): Promise<void> {
    try {
      const participantRef = doc(db, 'meetings', meetingId, 'participants', userId);
      await updateDoc(participantRef, {
        isTyping,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error updating typing status:", err);
    }
  },

  // Broadcast an emoji reaction
  async sendReaction(
    meetingId: string,
    userId: string,
    userName: string,
    emoji: string
  ): Promise<void> {
    try {
      const reactionsRef = collection(db, 'meetings', meetingId, 'reactions');
      await addDoc(reactionsRef, {
        userId,
        userName,
        emoji,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending reaction:", err);
    }
  }
};

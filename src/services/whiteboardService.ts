import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const whiteboardService = {
  // Save whiteboard canvas state as JSON to Firestore
  async saveWhiteboardState(meetingId: string, canvasJson: any): Promise<void> {
    try {
      const docRef = doc(db, 'meetings', meetingId, 'whiteboard', 'current');
      await setDoc(docRef, {
        json: JSON.stringify(canvasJson),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving whiteboard state:", err);
    }
  },

  // Listen to whiteboard state updates in real-time
  listenToWhiteboard(meetingId: string, onUpdate: (jsonStr: string) => void): () => void {
    const docRef = doc(db, 'meetings', meetingId, 'whiteboard', 'current');
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.json) {
          onUpdate(data.json);
        }
      }
    }, (err) => {
      console.error("Whiteboard snapshot listener error:", err);
    });
  }
};

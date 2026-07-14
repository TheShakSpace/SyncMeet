import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MeetingPreferences } from '../types';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  preferences?: MeetingPreferences;
}

export const userService = {
  // Retrieve user profile information including preferences
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      console.error("Error retrieving user profile from Firestore:", err);
      return null;
    }
  },

  // Store user profile details
  async saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, {
        uid,
        ...profile,
        updatedAt: new Date()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving user profile to Firestore:", err);
      throw err;
    }
  },

  // Save specific local meeting preferences
  async saveUserPreferences(uid: string, preferences: MeetingPreferences): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        preferences,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error("Error updating user preferences:", err);
      throw err;
    }
  }
};

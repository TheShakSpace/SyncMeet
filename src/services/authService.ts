import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase/config';

export const authService = {
  // Google Authentication Sign-In
  async signInWithGoogle(): Promise<FirebaseUser> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  },

  // Passwordless Email Sandbox Auth bypass
  async signInWithEmail(email: string): Promise<FirebaseUser> {
    const dummyPassword = "SyncMeetPassword123";
    try {
      // Attempt to register first
      const result = await createUserWithEmailAndPassword(auth, email, dummyPassword);
      return result.user;
    } catch (err: any) {
      // If user already exists, authenticate directly
      if (err.code === 'auth/email-already-in-use') {
        const result = await signInWithEmailAndPassword(auth, email, dummyPassword);
        return result.user;
      }
      throw err;
    }
  },

  // Log Out current session
  async logOut(): Promise<void> {
    await signOut(auth);
  },

  // Auth State Listener subscription
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};

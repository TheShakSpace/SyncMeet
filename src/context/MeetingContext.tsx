import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  User, 
  Meeting, 
  Participant, 
  ChatMessage, 
  MeetingPreferences, 
  AppStats 
} from '../types';
import { 
  isFirebaseConfigured, 
  db, 
  auth 
} from '../firebase/config';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';

interface MeetingContextType {
  currentUser: User | null;
  meetings: Meeting[];
  activeMeeting: Meeting | null;
  activeParticipants: Participant[];
  chatMessages: ChatMessage[];
  preferences: MeetingPreferences;
  isFirebaseEnabled: boolean;
  isLoading: boolean;
  stats: AppStats;
  
  // Auth actions
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Meeting actions
  createMeeting: (title: string, description?: string, duration?: number) => Promise<string>;
  joinMeeting: (roomId: string) => Promise<void>;
  leaveMeeting: () => Promise<void>;
  
  // In-meeting interactive actions
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  toggleHandRaise: () => void;
  sendChatMessage: (text: string) => Promise<void>;
  
  // Profile / Settings actions
  updateProfile: (displayName: string, bio: string) => void;
  updatePreferences: (prefs: Partial<MeetingPreferences>) => void;
  
  // System alerts / notifications
  notifications: string[];
  addNotification: (message: string) => void;
  clearNotifications: () => void;
}


const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

const DEFAULT_PREFS: MeetingPreferences = {
  micOnDefault: true,
  cameraOnDefault: true,
  hdVideo: true,
  noiseCancellation: true,
  meetingLayout: 'grid'
};

const INITIAL_STATS: AppStats = {
  totalMeetings: 12,
  totalMinutes: 340,
  participantsMet: 48,
  activeRooms: 3
};

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [preferences, setPreferences] = useState<MeetingPreferences>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [stats, setStats] = useState<AppStats>(INITIAL_STATS);

  const simulationIntervalsRef = useRef<number[]>([]);
  const unsubscribeListRef = useRef<(() => void)[]>([]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Local helper: Add ephemeral system notification
  const addNotification = (message: string) => {
    setNotifications(prev => {
      const next = [...prev.slice(-4), message];
      return next;
    });
    setTimeout(() => {
      setNotifications(prev => prev.filter(m => m !== message));
    }, 4000);
  };


  // Safe wrapper for localStorage
  const getLocalStorageData = <T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Initialize Auth & App State
  useEffect(() => {
    if (isFirebaseConfigured) {
      console.log("SyncMeet is running with LIVE Firebase integration!");
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userProfile: User;
          
          try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              userProfile = docSnap.data() as User;
            } else {
              // Create user record in firestore
              userProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'SyncMeeter',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
                bio: 'Productive SyncMeet user.',
                joinedAt: new Date().toISOString(),
                preferences: DEFAULT_PREFS
              };
              await setDoc(userDocRef, userProfile);
            }
            setCurrentUser(userProfile);
            setPreferences(userProfile.preferences || DEFAULT_PREFS);
            addNotification(`Welcome back, ${userProfile.displayName}!`);
          } catch (error) {
            console.error("Firestore user fetch failed: ", error);
            // Fallback user if firestore has permissions issues or offline
            const fallbackUser: User = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              joinedAt: new Date().toISOString(),
              preferences: DEFAULT_PREFS
            };
            setCurrentUser(fallbackUser);
          }
        } else {
          setCurrentUser(null);
        }
        setIsLoading(false);
      });
      unsubscribeListRef.current.push(unsubscribeAuth);
    } else {
      console.log("SyncMeet running in HIGH-FIDELITY Simulation Mode (No Firebase Credentials).");
      // Check for cached user
      const cachedUser = getLocalStorageData<User | null>('syncmeet_user', null);
      if (cachedUser) {
        setCurrentUser(cachedUser);
        setPreferences(cachedUser.preferences || DEFAULT_PREFS);
        addNotification(`Logged in as ${cachedUser.displayName}`);
      }
      setIsLoading(false);
    }

    // Load custom mock meeting list
    const cachedMeetings = getLocalStorageData<Meeting[]>('syncmeet_meetings', [
      {
        id: 'design-sync-101',
        title: 'Weekly UI Design Review',
        description: 'Reviewing the new Linear-inspired glass dashboard and meeting room layout.',
        hostId: 'system- Sarah',
        hostName: 'Sarah Connor',
        scheduledTime: new Date(Date.now() - 3600000 * 2).toISOString(),
        durationMinutes: 45,
        status: 'ended',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'webrtc-prep-704',
        title: 'WebRTC & PeerJS Strategy',
        description: 'Planning out peer connections, signalling servers, and multi-user room state.',
        hostId: 'system-alex',
        hostName: 'Alex Rivera',
        scheduledTime: new Date(Date.now() + 3600000 * 24).toISOString(),
        durationMinutes: 60,
        status: 'upcoming',
        createdAt: new Date().toISOString()
      }
    ]);
    setMeetings(cachedMeetings);

    return () => {
      // Cleanup any active listeners / intervals
      unsubscribeListRef.current.forEach(unsub => unsub());
      simulationIntervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  // Persist local user if offline
  useEffect(() => {
    if (!isFirebaseConfigured && currentUser) {
      localStorage.setItem('syncmeet_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Handle live Firestore meeting listeners
  useEffect(() => {
    if (isFirebaseConfigured && currentUser) {
      const meetingsQuery = query(collection(db, 'meetings'), orderBy('createdAt', 'desc'));
      const unsubMeetings = onSnapshot(meetingsQuery, (snapshot) => {
        const meetingsList: Meeting[] = [];
        snapshot.forEach((doc) => {
          meetingsList.push({ id: doc.id, ...doc.data() } as Meeting);
        });
        if (meetingsList.length > 0) {
          setMeetings(meetingsList);
        }
      }, (error) => {
        console.error("Firestore meetings stream error: ", error);
      });
      unsubscribeListRef.current.push(unsubMeetings);
    }
  }, [currentUser]);

  // Auth: Google Login
  const loginWithGoogle = async () => {
    if (isFirebaseConfigured) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (error) {
        addNotification("Google Sign-In failed. Running offline fallback.");
        console.error(error);
      }
    } else {
      // Simulate Google auth
      const mockUser: User = {
        uid: 'g-user-' + Math.random().toString(36).substr(2, 9),
        displayName: 'Google Dev User',
        email: 'dev.user@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        bio: 'Senior developer exploring SyncMeet.',
        joinedAt: new Date().toISOString(),
        preferences: DEFAULT_PREFS
      };
      setCurrentUser(mockUser);
      addNotification("Signed in via Google account!");
    }
  };

  // Auth: Email Login (Easy developer sandbox email sign-in)
  const loginWithEmail = async (email: string, name: string) => {
    if (isFirebaseConfigured) {
      try {
        // Just create a fast user/log-in
        const dummyPass = "SyncMeetPassword123";
        try {
          await createUserWithEmailAndPassword(auth, email, dummyPass);
        } catch {
          // If already exists, just sign in
          await signInWithEmailAndPassword(auth, email, dummyPass);
        }
        if (auth.currentUser) {
          // Update display name
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const profile: User = {
            uid: auth.currentUser.uid,
            displayName: name || email.split('@')[0],
            email: email,
            photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${auth.currentUser.uid}`,
            bio: 'Productive developer at SyncMeet.',
            joinedAt: new Date().toISOString(),
            preferences: DEFAULT_PREFS
          };
          await setDoc(userDocRef, profile);
          setCurrentUser(profile);
        }
      } catch (error) {
        console.error(error);
        addNotification("Auth failed. Standard mock sign-in bypass activated.");
        // Fallback to mock
        const mockUser: User = {
          uid: 'e-user-' + Math.random().toString(36).substr(2, 9),
          displayName: name || email.split('@')[0],
          email: email,
          joinedAt: new Date().toISOString(),
          preferences: DEFAULT_PREFS
        };
        setCurrentUser(mockUser);
      }
    } else {
      const mockUser: User = {
        uid: 'e-user-' + Math.random().toString(36).substr(2, 9),
        displayName: name || email.split('@')[0],
        email: email,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
        bio: 'Productive developer at SyncMeet.',
        joinedAt: new Date().toISOString(),
        preferences: DEFAULT_PREFS
      };
      setCurrentUser(mockUser);
      addNotification(`Signed in as ${mockUser.displayName}`);
    }
  };

  // Auth: Log Out
  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setActiveMeeting(null);
    localStorage.removeItem('syncmeet_user');
    addNotification("Logged out successfully");
  };

  // Meetings: Create Meeting
  const createMeeting = async (title: string, description?: string, duration = 30) => {
    if (!currentUser) throw new Error("Authentication required");

    // Format ID: abc-defg-hij
    const part1 = Math.random().toString(36).substring(2, 5);
    const part2 = Math.random().toString(36).substring(2, 6);
    const part3 = Math.random().toString(36).substring(2, 5);
    const roomId = `${part1}-${part2}-${part3}`;

    const newMeeting: Meeting = {
      id: roomId,
      title,
      description: description || 'Workspace sync room',
      hostId: currentUser.uid,
      hostName: currentUser.displayName,
      scheduledTime: new Date().toISOString(),
      durationMinutes: duration,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'meetings', roomId), newMeeting);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `meetings/${roomId}`);
      }
    } else {
      const updatedMeetings = [newMeeting, ...meetings];
      setMeetings(updatedMeetings);
      localStorage.setItem('syncmeet_meetings', JSON.stringify(updatedMeetings));
      
      // Increment stats
      setStats(prev => ({
        ...prev,
        totalMeetings: prev.totalMeetings + 1,
        totalMinutes: prev.totalMinutes + duration
      }));
    }

    addNotification(`Meeting "${title}" created successfully!`);
    return roomId;
  };

  // Meetings: Join Meeting
  const joinMeeting = async (roomId: string) => {
    if (!currentUser) throw new Error("Authentication required");
    
    // Normalize format
    const cleanId = roomId.trim().toLowerCase();

    let targetMeeting: Meeting | null = null;

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'meetings', cleanId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          targetMeeting = docSnap.data() as Meeting;
        }
      } catch (err) {
        console.error("Firestore find meeting failed: ", err);
      }
    }

    // Fallback/Search in existing meeting list
    if (!targetMeeting) {
      targetMeeting = meetings.find(m => m.id === cleanId) || null;
    }

    // If still not found, create a placeholder meeting so they can join anything!
    if (!targetMeeting) {
      targetMeeting = {
        id: cleanId,
        title: `Room: ${cleanId.toUpperCase()}`,
        description: 'Instant joining room session.',
        hostId: 'external-host',
        hostName: 'SyncMeet Room',
        scheduledTime: new Date().toISOString(),
        durationMinutes: 40,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      if (!isFirebaseConfigured) {
        setMeetings(prev => [targetMeeting!, ...prev]);
      }
    }

    setActiveMeeting(targetMeeting);
    addNotification(`Joining Room: ${cleanId}`);

    // Set local client participant state
    const localParticipant: Participant = {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      audioEnabled: preferences.micOnDefault,
      videoEnabled: preferences.cameraOnDefault,
      screenShareEnabled: false,
      isHost: targetMeeting.hostId === currentUser.uid,
      joinedAt: new Date().toISOString()
    };

    // Initialize list of participants
    const initialParticipants: Participant[] = [localParticipant];

    // Clear old simulation intervals
    simulationIntervalsRef.current.forEach(interval => clearInterval(interval));
    simulationIntervalsRef.current = [];

    // Set initial chat messages
    const initialChat: ChatMessage[] = [
      {
        id: 'msg-welcome',
        senderId: 'system',
        senderName: 'SyncMeet Bot',
        text: `Welcome to SyncMeet secure meeting room. Room ID: ${cleanId}. Share this code to let others join.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }
    ];

    setChatMessages(initialChat);

    // If Firebase is configured, set up sub-collections listeners for messages and participants
    if (isFirebaseConfigured) {
      const messagesRef = collection(db, 'meetings', cleanId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
      const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          msgs.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderPhotoURL: data.senderPhotoURL,
            text: data.text,
            timestamp: new Date(data.timestamp?.seconds * 1000 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: data.isSystem
          });
        });
        if (msgs.length > 0) {
          setChatMessages(prev => {
            const welcomeMsg = prev.filter(m => m.isSystem);
            return [...welcomeMsg, ...msgs.filter(m => !prev.some(p => p.id === m.id))];
          });
        }
      });
      unsubscribeListRef.current.push(unsubMessages);

      // Create live participant in Firestore
      try {
        await setDoc(doc(db, 'meetings', cleanId, 'participants', currentUser.uid), {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL || '',
          audioEnabled: preferences.micOnDefault,
          videoEnabled: preferences.cameraOnDefault,
          screenShareEnabled: false,
          isHost: targetMeeting.hostId === currentUser.uid,
          joinedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to add participant to firestore: ", err);
      }

      // Stream participants
      const participantsRef = collection(db, 'meetings', cleanId, 'participants');
      const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
        const parts: Participant[] = [];
        const now = Date.now();
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.leftAt) return;

          // Filter out stale participants (no update in last 30 seconds)
          if (data.updatedAt) {
            const lastUpdate = data.updatedAt.seconds ? data.updatedAt.seconds * 1000 : new Date(data.updatedAt).getTime();
            if (now - lastUpdate > 30000) {
              return; // Stale participant
            }
          }

          parts.push({
            uid: doc.id,
            displayName: data.displayName || 'Anonymous',
            photoURL: data.photoURL || '',
            audioEnabled: data.audioEnabled ?? true,
            videoEnabled: data.videoEnabled ?? true,
            screenShareEnabled: data.screenShareEnabled ?? false,
            isHost: data.isHost ?? false,
            joinedAt: data.joinedAt ? (data.joinedAt.seconds ? new Date(data.joinedAt.seconds * 1000).toISOString() : new Date(data.joinedAt).toISOString()) : new Date().toISOString(),
            peerId: data.peerId,
            handRaised: data.handRaised ?? false,
            isSpeaking: data.isSpeaking ?? false
          });
        });
        setActiveParticipants(parts);
      });
      unsubscribeListRef.current.push(unsubParticipants);

    } else {
      // Simulation mode (Local Sandbox)
      setActiveParticipants(initialParticipants);
    }
  };

  // Leave meeting
  const leaveMeeting = async () => {
    if (activeMeeting) {
      if (isFirebaseConfigured && currentUser) {
        try {
          // Remove from database
          await updateDoc(doc(db, 'meetings', activeMeeting.id, 'participants', currentUser.uid), {
            leftAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Leaving meeting failed to update firestore:", e);
        }
      }
      
      // Cleanup simulations
      simulationIntervalsRef.current.forEach(interval => clearInterval(interval));
      simulationIntervalsRef.current = [];
      
      addNotification(`Left room: ${activeMeeting.id}`);
      setActiveMeeting(null);
      setActiveParticipants([]);
      setChatMessages([]);
    }
  };

  // In-meeting actions: Mic
  const toggleMic = async () => {
    if (!currentUser || !activeMeeting) return;
    
    const newStatus = !activeParticipants.find(p => p.uid === currentUser.uid)?.audioEnabled;

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'meetings', activeMeeting.id, 'participants', currentUser.uid), {
          audioEnabled: newStatus
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setActiveParticipants(prev => 
        prev.map(p => p.uid === currentUser.uid ? { ...p, audioEnabled: newStatus, isSpeaking: false } : p)
      );
    }
    addNotification(newStatus ? "Microphone Unmuted" : "Microphone Muted");
  };

  // In-meeting actions: Camera
  const toggleCamera = async () => {
    if (!currentUser || !activeMeeting) return;

    const newStatus = !activeParticipants.find(p => p.uid === currentUser.uid)?.videoEnabled;

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'meetings', activeMeeting.id, 'participants', currentUser.uid), {
          videoEnabled: newStatus
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setActiveParticipants(prev => 
        prev.map(p => p.uid === currentUser.uid ? { ...p, videoEnabled: newStatus } : p)
      );
    }
    addNotification(newStatus ? "Camera Started" : "Camera Stopped");
  };

  // In-meeting actions: Screen share
  const toggleScreenShare = async () => {
    if (!currentUser || !activeMeeting) return;

    const newStatus = !activeParticipants.find(p => p.uid === currentUser.uid)?.screenShareEnabled;

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'meetings', activeMeeting.id, 'participants', currentUser.uid), {
          screenShareEnabled: newStatus
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setActiveParticipants(prev => 
        prev.map(p => {
          if (p.uid === currentUser.uid) {
            return { ...p, screenShareEnabled: newStatus };
          }
          // Only one participant can share screen at a time in standard UI
          return p.screenShareEnabled ? { ...p, screenShareEnabled: false } : p;
        })
      );
    }
    addNotification(newStatus ? "Sharing screen" : "Stopped screen share");
  };

  // In-meeting actions: Hand raise
  const toggleHandRaise = async () => {
    if (!currentUser || !activeMeeting) return;

    const newStatus = !activeParticipants.find(p => p.uid === currentUser.uid)?.handRaised;

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'meetings', activeMeeting.id, 'participants', currentUser.uid), {
          handRaised: newStatus
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setActiveParticipants(prev => 
        prev.map(p => p.uid === currentUser.uid ? { ...p, handRaised: newStatus } : p)
      );
    }
    addNotification(newStatus ? "Hand Raised" : "Hand Lowered");
  };

  // In-meeting actions: Chat
  const sendChatMessage = async (text: string) => {
    if (!currentUser || !activeMeeting || !text.trim()) return;

    const displayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isFirebaseConfigured) {
      try {
        const messagesRef = collection(db, 'meetings', activeMeeting.id, 'messages');
        await addDoc(messagesRef, {
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          senderPhotoURL: currentUser.photoURL || '',
          text: text.trim(),
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `meetings/${activeMeeting.id}/messages`);
      }
    } else {
      const newMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL,
        text: text.trim(),
        timestamp: displayTime
      };
      setChatMessages(prev => [...prev, newMsg]);
    }
  };

  // Profile management
  const updateProfile = (displayName: string, bio: string) => {
    if (!currentUser) return;
    
    const updatedUser = { 
      ...currentUser, 
      displayName: displayName.trim() || currentUser.displayName, 
      bio: bio.trim() 
    };
    
    setCurrentUser(updatedUser);
    
    if (isFirebaseConfigured) {
      try {
        setDoc(doc(db, 'users', currentUser.uid), updatedUser, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }
    
    addNotification("Profile updated successfully!");
  };

  // Preferences / Settings management
  const updatePreferences = (prefs: Partial<MeetingPreferences>) => {
    const updatedPrefs = { ...preferences, ...prefs };
    setPreferences(updatedPrefs);
    
    if (currentUser) {
      const updatedUser = { ...currentUser, preferences: updatedPrefs };
      setCurrentUser(updatedUser);
      
      if (isFirebaseConfigured) {
        try {
          setDoc(doc(db, 'users', currentUser.uid), { preferences: updatedPrefs }, { merge: true });
        } catch (err) {
          console.error(err);
        }
      }
    }
    
    addNotification("Meeting preferences saved!");
  };

  return (
    <MeetingContext.Provider value={{
      currentUser,
      meetings,
      activeMeeting,
      activeParticipants,
      chatMessages,
      preferences,
      isFirebaseEnabled: isFirebaseConfigured,
      isLoading,
      stats,
      loginWithGoogle,
      loginWithEmail,
      logout,
      createMeeting,
      joinMeeting,
      leaveMeeting,
      toggleMic,
      toggleCamera,
      toggleScreenShare,
      toggleHandRaise,
      sendChatMessage,
      updateProfile,
      updatePreferences,
      notifications,
      addNotification,
      clearNotifications
    }}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};

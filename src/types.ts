/**
 * Types & Interfaces for SyncMeet SaaS Application
 */

export interface MeetingPreferences {
  micOnDefault: boolean;
  cameraOnDefault: boolean;
  hdVideo: boolean;
  noiseCancellation: boolean;
  meetingLayout: 'grid' | 'sidebar' | 'spotlight';
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  joinedAt: string;
  preferences: MeetingPreferences;
}

export interface Meeting {
  id: string; // The join code, e.g., "abc-defg-hij"
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  scheduledTime: string; // ISO String
  durationMinutes: number;
  status: 'upcoming' | 'active' | 'ended';
  createdAt: string;
}

export interface Participant {
  uid: string;
  displayName: string;
  photoURL?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  isHost: boolean;
  joinedAt: string;
  isSpeaking?: boolean;
  handRaised?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  text: string;
  timestamp: string; // ISO String or display time
  isSystem?: boolean;
}

export interface AppStats {
  totalMeetings: number;
  totalMinutes: number;
  participantsMet: number;
  activeRooms: number;
}

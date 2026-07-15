import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, limit, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { chatService } from '../services/chatService';

interface UseChatProps {
  meetingId: string | undefined;
  userId: string | undefined;
  userName: string | undefined;
  userPhoto: string | undefined;
  onReactionReceived?: (reaction: { id: string; emoji: string; userName: string }) => void;
  isFirebaseEnabled?: boolean;
}

export function useChat({
  meetingId,
  userId,
  userName,
  userPhoto,
  onReactionReceived,
  isFirebaseEnabled
}: UseChatProps) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!meetingId || !userId || !userName) return;
    await chatService.sendMessage(meetingId, userId, userName, userPhoto || '', text);
  }, [meetingId, userId, userName, userPhoto]);

  // Set typing
  const handleTyping = useCallback(() => {
    if (!meetingId || !userId) return;
    
    if (!isTyping) {
      setIsTyping(true);
      if (isFirebaseEnabled) {
        chatService.setTypingStatus(meetingId, userId, true);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (isFirebaseEnabled) {
        chatService.setTypingStatus(meetingId, userId, false);
      }
    }, 3000);
  }, [meetingId, userId, isTyping, isFirebaseEnabled]);

  // Send Reaction
  const sendReaction = useCallback(async (emoji: string) => {
    if (!meetingId || !userId || !userName) return;
    if (isFirebaseEnabled) {
      await chatService.sendReaction(meetingId, userId, userName, emoji);
    } else {
      // Local fallback
      if (onReactionReceived) {
        onReactionReceived({
          id: Math.random().toString(),
          emoji,
          userName: "You"
        });
      }
    }
  }, [meetingId, userId, userName, onReactionReceived, isFirebaseEnabled]);

  // Listen for real-time reactions in Firestore
  useEffect(() => {
    if (!isFirebaseEnabled || !meetingId || !onReactionReceived) return;

    const reactionsRef = collection(db, 'meetings', meetingId, 'reactions');
    // Limit to latest reactions to avoid historical spam
    const q = query(reactionsRef, orderBy('timestamp', 'desc'), limit(15));

    let isFirstLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        return; // Skip initial historical records
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Trigger reaction callback
          onReactionReceived({
            id: change.doc.id,
            emoji: data.emoji,
            userName: data.userName || 'Someone'
          });
        }
      });
    }, (err) => {
      console.error("Reactions stream error:", err);
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [meetingId, onReactionReceived, isFirebaseEnabled]);

  return {
    sendMessage,
    handleTyping,
    sendReaction
  };
}

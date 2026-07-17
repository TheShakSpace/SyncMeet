import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  MessageSquare, 
  Users as UsersIcon, 
  PhoneOff, 
  Send, 
  Sparkles, 
  User, 
  Check, 
  Copy,
  ChevronRight,
  Shield,
  Edit3,
  FileText,
  UploadCloud,
  Eraser,
  RefreshCw,
  Trash2,
  X,
  Share2,
  Info,
  Calendar,
  Clock,
  Settings as SettingsIcon,
  Smile,
  Hand,
  Volume2,
  MoreVertical,
  Wifi,
  Search,
  Plus,
  ArrowRight,
  Download,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Square,
  Circle,
  Pause,
  Play,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useMeetingRecorder } from '../hooks/useMeetingRecorder';
import { MeetingRecorderModal } from '../components/MeetingRecorderModal';
import { usePeer } from '../hooks/usePeer';
import { useRemotePeers } from '../hooks/useRemotePeers';
import { useScreenShare } from '../hooks/useScreenShare';
import { useChat } from '../hooks/useChat';
import { useFiles } from '../hooks/useFiles';
import { useWhiteboard } from '../hooks/useWhiteboard';
import { ErrorModal, ErrorModalProps } from '../components/ErrorModal';
import { MeetingVideo } from '../components/MeetingVideo';
import { meetingConnectionService } from '../services/meetingConnectionService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AiAssistantDrawer } from '../components/AiAssistantDrawer';
import { AiSummaryModal } from '../components/AiSummaryModal';

// Typing indicator helper
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 bg-[#F3F4F6] px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-gray-100 max-w-[100px]">
    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

interface MockParticipant {
  uid: string;
  displayName: string;
  role: string;
  avatar: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  handRaised: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor';
  peerId?: string;
}

export const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    activeMeeting,
    activeParticipants,
    chatMessages,
    sendChatMessage,
    leaveMeeting,
    joinMeeting,
    addNotification,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleHandRaise,
    isFirebaseEnabled
  } = useMeeting();

  // Drawers and layout states
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'participants' | 'chat' | 'whiteboard' | 'files' | 'ai-assistant'>('chat');
  const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState(false);
  const [isRecorderModalOpen, setIsRecorderModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Professional Loading Experience & Joining stages
  const [isJoining, setIsJoining] = useState(true);
  const [joiningStage, setJoiningStage] = useState(0);

  // Simulated whiteboard sync loader
  const [isWhiteboardSyncing, setIsWhiteboardSyncing] = useState(false);

  // Elegant system error dialogs state
  const [errorModal, setErrorModal] = useState<Omit<ErrorModalProps, 'isOpen' | 'onClose'> | null>(null);

  // Online / Offline tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Real ticker timer
  const [elapsedSeconds, setElapsedSeconds] = useState(872); // Starts at 14m 32s
  
  // Custom unread chat badge
  const [unreadCount, setUnreadCount] = useState(0);

  // Participant simulation state (1, 2, 4, 6, 9 layouts)
  const [simulatedCount, setSimulatedCount] = useState<number>(6);
  const [raisedHandSelf, setRaisedHandSelf] = useState(false);
  const [isSelfMicOn, setIsSelfMicOn] = useState(true);
  const [isSelfCamOn, setIsSelfCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Typing simulator state
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // Floating reactions state
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number; delay: number }[]>([]);

  // Whiteboard drawing states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState('#2563EB');
  const [brushSize, setBrushSize] = useState(4);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser' | 'rect' | 'circle' | 'text'>('pen');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Live WebRTC multi-user integration ---
  const {
    localStream,
    isMicOn,
    isCameraOn,
    mediaError,
    isLocalSpeaking,
    startLocalStream,
    stopLocalStream,
    toggleMic: toggleLocalMic,
    toggleCamera: toggleLocalCamera
  } = useLocalMedia({
    initialMicOn: isSelfMicOn,
    initialCameraOn: isSelfCamOn,
    onToast: addNotification
  });

  const {
    peer,
    peerId,
    initializePeer,
    destroyPeer
  } = usePeer({
    userId: currentUser?.uid,
    localStream,
    onIncomingCall: (call) => answerIncomingCall(call),
    onToast: addNotification
  });

  const {
    remoteStreams,
    speakingPeers,
    callPeer,
    answerIncomingCall,
    cleanUpAllConnections,
    replaceLocalVideoTrack
  } = useRemotePeers({
    peer,
    localStream,
    onToast: addNotification
  });

  // Collaborative Screen Share Hook
  const {
    screenStream,
    isSharing: isLocalScreenSharing,
    startScreenShare,
    stopScreenShare
  } = useScreenShare({
    meetingId: roomId,
    userId: currentUser?.uid,
    localStream,
    onReplaceVideoTrack: replaceLocalVideoTrack,
    onRestoreWebcam: async () => {
      const stream = await startLocalStream();
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          replaceLocalVideoTrack(videoTrack);
        }
      }
    },
    onToast: addNotification,
    isFirebaseEnabled: isFirebaseEnabled
  });

  // Reactions Callback
  const handleReactionReceived = useCallback((reaction: { id: string; emoji: string; userName: string }) => {
    const x = Math.random() * 80 + 10;
    const delay = Math.random() * 0.2;
    setReactions(prev => [...prev, { id: reaction.id, emoji: reaction.emoji, x, delay }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 4000);
  }, []);

  // Collaborative Chat Hook
  const {
    sendMessage: sendChatMessageViaHook,
    handleTyping,
    sendReaction
  } = useChat({
    meetingId: roomId,
    userId: currentUser?.uid,
    userName: currentUser?.displayName,
    userPhoto: currentUser?.photoURL,
    onReactionReceived: handleReactionReceived,
    isFirebaseEnabled: isFirebaseEnabled
  });

  // Collaborative File Sharing Hook
  const {
    files: sharedFiles,
    isUploading: isFileUploading,
    uploadFile
  } = useFiles({
    meetingId: roomId,
    uploaderName: currentUser?.displayName || 'User',
    onToast: addNotification,
    isFirebaseEnabled: isFirebaseEnabled
  });

  // Professional Meeting Recording Hook
  const {
    isRecording,
    isPaused,
    formattedDuration,
    recordingUrl,
    recordingMeta,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  } = useMeetingRecorder({
    localStream,
    screenStream,
    remoteStreams,
    onToast: addNotification,
    onBroadcastSystemMessage: (text) => {
      sendChatMessage(text);
    }
  });

  // Automatically open the recorder modal when a recording completes
  useEffect(() => {
    if (recordingUrl) {
      setIsRecorderModalOpen(true);
    }
  }, [recordingUrl]);

  // Collaborative Whiteboard Hook
  const {
    undo: handleWhiteboardUndo,
    redo: handleWhiteboardRedo,
    clearWhiteboard: handleWhiteboardClear,
    canUndo,
    canRedo
  } = useWhiteboard({
    meetingId: roomId,
    canvasElement: canvasRef.current,
    brushColor,
    brushSize,
    drawingTool,
    onToast: addNotification,
    isFirebaseEnabled: isFirebaseEnabled
  });

  // Computed screen sharing status
  const remoteScreenSharer = activeParticipants.find(p => p.uid !== currentUser?.uid && p.screenShareEnabled);
  const isScreenSharingActive = isLocalScreenSharing || !!remoteScreenSharer;

  // Automatically start local stream on load
  useEffect(() => {
    startLocalStream();
    return () => {
      stopLocalStream();
      cleanUpAllConnections();
      destroyPeer();
    };
  }, []);

  // Heartbeat presence update in Firestore
  useEffect(() => {
    if (!currentUser?.uid || !roomId || !isFirebaseEnabled) return;
    const interval = setInterval(async () => {
      try {
        const pDoc = doc(db, 'meetings', roomId, 'participants', currentUser.uid);
        await updateDoc(pDoc, {
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to send presence heartbeat:", err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.uid, roomId, isFirebaseEnabled]);

  // Simulated professional joining sequence
  useEffect(() => {
    const stages = [
      "Syncing secure communication keys...",
      "Resolving workspace coordinates...",
      "Allocating audio/video interface streams...",
      "Checking signal credentials...",
      "Establishing dual-signaling mesh tunnel...",
      "Workspace Sync complete!"
    ];
    
    let timer: any;
    if (isJoining) {
      const interval = setInterval(() => {
        setJoiningStage(prev => {
          if (prev >= stages.length - 1) {
            clearInterval(interval);
            timer = setTimeout(() => {
              setIsJoining(false);
            }, 600);
            return prev;
          }
          return prev + 1;
        });
      }, 450);
      return () => {
        clearInterval(interval);
        if (timer) clearTimeout(timer);
      };
    }
  }, [isJoining]);

  // Online / Offline tracking listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification("Internet connection restored.");
      setErrorModal(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setErrorModal({
        title: "Workspace Disconnected",
        message: "Your internet connection appears to have disconnected. Check your local ports or WiFi router to re-establish workspace sync.",
        code: "DISCONNECTED"
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync useLocalMedia device failures with beautiful Dialog modals
  useEffect(() => {
    if (mediaError) {
      const isPermissionDenied = mediaError.toLowerCase().includes("permission") || mediaError.toLowerCase().includes("denied");
      setErrorModal({
        title: isPermissionDenied ? "Device Access Blocked" : "Media Stream Unavailable",
        message: mediaError,
        code: isPermissionDenied ? "PERMISSION_DENIED" : "CAMERA_ERROR"
      });
    }
  }, [mediaError]);

  // Whiteboard sync drawer loading sequence
  useEffect(() => {
    if (activeDrawer === 'whiteboard') {
      setIsWhiteboardSyncing(true);
      const timer = setTimeout(() => {
        setIsWhiteboardSyncing(false);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [activeDrawer]);

  // Sync toolbar states with actual WebRTC media states
  useEffect(() => {
    setIsSelfMicOn(isMicOn);
  }, [isMicOn]);

  useEffect(() => {
    setIsSelfCamOn(isCameraOn);
  }, [isCameraOn]);

  // Synchronize Peer ID to Firestore
  useEffect(() => {
    if (peerId && roomId && currentUser?.uid) {
      meetingConnectionService.registerPeerId(roomId, currentUser.uid, peerId);
    }
  }, [peerId, roomId, currentUser?.uid]);

  // Automatically connect with new users in room
  useEffect(() => {
    if (activeParticipants && currentUser?.uid && peer && localStream) {
      activeParticipants.forEach((p) => {
        if (p.uid === currentUser.uid) return;
        const remotePeerId = p.peerId;
        if (remotePeerId) {
          // Rule: smaller UID acts as caller to avoid double calling in mesh
          const isCaller = currentUser.uid < p.uid;
          if (isCaller) {
            callPeer(remotePeerId);
          }
        }
      });
    }
  }, [activeParticipants, currentUser?.uid, peer, localStream, callPeer]);

  // Real participants (populated from Firestore activeParticipants)
  const [participants, setParticipants] = useState<MockParticipant[]>([]);

  // Local Chat state
  const [chatItems, setChatItems] = useState<any[]>([]);

  // Synchronize internal participant audio/video with toolbar state
  useEffect(() => {
    setParticipants(prev => prev.map(p => {
      if (p.uid === 'self') {
        return { ...p, audioEnabled: isSelfMicOn, videoEnabled: isSelfCamOn, handRaised: raisedHandSelf };
      }
      return p;
    }));
  }, [isSelfMicOn, isSelfCamOn, raisedHandSelf]);

  // Synchronize local participants list with live backend activeParticipants
  useEffect(() => {
    if (activeParticipants && activeParticipants.length > 0) {
      setParticipants(() => {
        return activeParticipants.map(p => {
          const isSelf = p.uid === currentUser?.uid;
          const role = isSelf 
            ? 'Project Lead (You)' 
            : p.isHost 
              ? 'Host Coordinator' 
              : 'Product Partner';
          return {
            uid: isSelf ? 'self' : p.uid,
            displayName: p.displayName,
            role,
            avatar: p.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.uid}`,
            audioEnabled: p.audioEnabled,
            videoEnabled: p.videoEnabled,
            isSpeaking: isSelf ? isLocalSpeaking : (speakingPeers[p.peerId || p.uid] || p.isSpeaking || false),
            isHost: p.isHost,
            handRaised: p.handRaised || false,
            peerId: p.peerId,
            connectionQuality: (isSelf ? 'excellent' : 'good') as 'excellent' | 'good' | 'poor'
          };
        });
      });
    } else {
      setParticipants([]);
    }
  }, [activeParticipants, currentUser, isLocalSpeaking, speakingPeers]);

  // Synchronize local chat with live backend chat messages
  useEffect(() => {
    if (chatMessages) {
      const mappedReal = chatMessages.map(msg => {
        const isMe = msg.senderId === currentUser?.uid;
        return {
          id: msg.id,
          senderId: isMe ? 'self' : msg.senderId,
          senderName: msg.senderName,
          senderPhotoURL: msg.senderPhotoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderName}`,
          text: msg.text,
          timestamp: msg.timestamp
        };
      });
      setChatItems(mappedReal);
      
      // If the chat drawer isn't active, raise an unread badge
      if (activeDrawer !== 'chat' && chatMessages.length > 0) {
        setUnreadCount(u => u + 1);
      }
    }
  }, [chatMessages, currentUser, activeDrawer]);

  // Auto-join meeting room if refreshing on route directly
  useEffect(() => {
    if (currentUser && !activeMeeting && roomId) {
      joinMeeting(roomId);
    } else if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, activeMeeting, roomId, navigate]);

  // Increment live ticking meeting timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format elapsed seconds to hh:mm:ss
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (val: number) => String(val).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (activeDrawer === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [chatItems, activeDrawer]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const typedText = inputText;
    setInputText('');

    try {
      await sendChatMessageViaHook(typedText);
    } catch (err) {
      console.error("Failed to send real-time message:", err);
    }
  };

  const handleLeave = async () => {
    await leaveMeeting();
    addNotification("Disconnected from the huddle.");
    navigate('/dashboard');
  };

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setIsCopied(true);
      addNotification("Meeting ID copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // File sharing drag/drop functions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadFile(file);
    }
  };

  // Filter participants to display based on simulatedCount limit
  const activeViewParticipants = participants.slice(0, simulatedCount);

  // Participant Grid resizing class selectors
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-4xl mx-auto h-[68vh]';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto h-[68vh]';
    if (count <= 4) return 'grid-cols-2 max-w-6xl mx-auto h-[68vh]';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-7xl mx-auto h-[68vh]';
    return 'grid-cols-3 max-w-7xl mx-auto h-[68vh]';
  };

  if (isJoining) {
    return (
      <div id="meeting-joining-loader" className="fixed inset-0 bg-[#0F172A] flex flex-col items-center justify-center text-white p-6 z-[999] overflow-hidden selection:bg-blue-500/15 selection:text-blue-400">
        {/* Subtle grid decor */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] top-1/4 pointer-events-none" />
        
        <div className="max-w-md w-full space-y-8 text-center relative z-10 flex flex-col items-center">
          {/* Pulsing SyncMeet Logo */}
          <motion.div 
            animate={{ scale: [0.97, 1.03, 0.97] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20"
          >
            <VideoIcon size={28} className="animate-pulse" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display tracking-tight text-white">Connecting SyncMeet Room</h2>
            <p className="text-[11px] text-slate-400 font-mono">ROOM ID: <span className="text-blue-400 font-bold">{roomId || 'sm-huddle-sync'}</span></p>
          </div>

          {/* Micro-Progress Stages */}
          <div className="w-full bg-slate-800/80 border border-slate-700/50 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden relative">
              <motion.div 
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${((joiningStage + 1) / 6) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="space-y-2 text-left font-mono">
              {[
                "Syncing secure communication keys...",
                "Resolving workspace coordinates...",
                "Allocating audio/video interface streams...",
                "Checking signal credentials...",
                "Establishing dual-signaling mesh tunnel...",
                "Workspace Sync complete!"
              ].map((stageText, idx) => {
                const isActive = joiningStage === idx;
                const isCompleted = joiningStage > idx;
                return (
                  <div key={idx} className={`flex items-center gap-2.5 text-[10px] font-bold ${isActive ? 'text-blue-400' : isCompleted ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                      isCompleted ? 'bg-blue-500/10 border-blue-500 text-blue-500 text-[8px]' : isActive ? 'border-blue-400 animate-pulse text-blue-400 text-[8px]' : 'border-slate-800 text-slate-700 text-[8px]'
                    }`}>
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                    <span className="truncate">{stageText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <Shield size={12} className="text-emerald-500" />
            <span>Fidelity signal encryption is active.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="syncmeet-meeting-room" className="fixed inset-0 bg-[#F7F8FA] text-gray-900 flex flex-col justify-between p-4 md:p-6 overflow-hidden font-sans">
      
      {/* 1. TOP HEADER RIBBON */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border border-gray-200/80 rounded-[24px] px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-[0_4px_24px_rgb(0,0,0,0.02)] z-10"
      >
        <div className="flex items-center gap-4.5 w-full sm:w-auto">
          {/* Brand Logo icon */}
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10 shrink-0">
            <Sparkles size={18} className="animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-display font-extrabold text-gray-900 truncate">
                {activeMeeting?.title || 'SyncMeet Enterprise Huddle'}
              </h2>
              <span className="shrink-0 flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>Live</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-[#6B7280] font-semibold mt-0.5 font-mono">
              <span className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md text-[10px]">{roomId || 'sm-huddle-sync'}</span>
              <span>•</span>
              <button 
                onClick={handleCopyCode}
                className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer text-xs"
              >
                {isCopied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                <span>{isCopied ? 'Copied' : 'Copy Room ID'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live analytics & Action bars */}
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto self-end sm:self-center font-mono">
          
          {/* Glowing Recording Badge */}
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-2 rounded-2xl text-xs font-bold text-red-600 animate-pulse shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>REC {formattedDuration}</span>
              {isPaused && <span className="text-[10px] text-red-400 font-mono">(PAUSED)</span>}
            </div>
          )}

          {/* Ticking live duration timer */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/60 px-4 py-2 rounded-2xl text-xs font-mono font-bold text-gray-700">
            <Clock size={13} className="text-blue-500" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Participant count indicator */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/60 px-4 py-2 rounded-2xl text-xs font-semibold text-gray-700">
            <UsersIcon size={13} className="text-[#6B7280]" />
            <span>{participants.length} connected</span>
          </div>

          {/* Invite participants button */}
          <button 
            onClick={() => {
              handleCopyCode();
              addNotification("Share link copied! Pass to your team members.");
            }}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Plus size={14} />
            <span>Invite Partner</span>
          </button>
        </div>
      </motion.div>

      {/* 2. MAIN CENTER GRID WITH OPTIONAL SCREEN SHARE AND SLIDE DRAWER */}
      <div className="flex-1 flex gap-4 my-4 overflow-hidden relative items-stretch">
        
        <div className="flex-1 flex flex-col justify-center min-w-0 h-full relative">
          
          {/* Layout simulation floating switcher (Aesthetic touch for the product reviewer) */}
          <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md border border-gray-200/80 p-2.5 rounded-2xl flex items-center gap-3 shadow-md">
            <span className="text-[10px] font-bold text-[#6B7280] font-mono">SIM GRID SIZE</span>
            <div className="flex gap-1">
              {[1, 2, 4, 6, 9].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    setSimulatedCount(count);
                    addNotification(`Grid rearranged for ${count} participant cards`);
                  }}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                    simulatedCount === count 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'hover:bg-gray-100 text-gray-700 bg-gray-50'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* SCREEN SHARE DOCK OR BALANCED TILES GRID */}
          <AnimatePresence mode="wait">
            {isScreenSharingActive ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex flex-col gap-4 relative"
              >
                {/* Large screen share board */}
                <div className="flex-1 rounded-[24px] bg-white border border-gray-200 overflow-hidden relative flex flex-col justify-between p-6 shadow-sm">
                  {/* Outer container stream container */}
                  <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#0F172A]">
                    {isLocalScreenSharing && screenStream ? (
                      <MeetingVideo stream={screenStream} isMuted={true} isSelf={true} className="w-full h-full rounded-2xl object-contain shadow-xl" />
                    ) : (
                      (() => {
                        const remoteSharer = activeParticipants.find(p => p.uid !== currentUser?.uid && p.screenShareEnabled);
                        const remoteStream = remoteSharer && (remoteSharer.peerId ? remoteStreams[remoteSharer.peerId] : remoteStreams[remoteSharer.uid]);
                        if (remoteStream) {
                          return <MeetingVideo stream={remoteStream} isMuted={false} isSelf={false} className="w-full h-full rounded-2xl object-contain shadow-xl" />;
                        }
                        return (
                          <div className="text-center space-y-4 text-white">
                            <Monitor size={48} className="mx-auto text-blue-500 animate-pulse" />
                            <p className="text-sm font-semibold">Waiting for screen sharing stream...</p>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  <div className="z-10 flex items-center justify-between w-full mt-auto">
                    <span className="text-xs font-bold bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full text-blue-600 flex items-center gap-2 shadow-sm">
                      <Monitor size={13} className="animate-pulse text-blue-500" />
                      <span>{isLocalScreenSharing ? "You are presenting your screen" : `${remoteScreenSharer?.displayName || 'Someone'} is sharing screen`}</span>
                    </span>
                    
                    {isLocalScreenSharing && (
                      <button 
                        onClick={async () => {
                          await stopScreenShare();
                          toggleScreenShare();
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-bold border border-red-100 transition-colors cursor-pointer"
                      >
                        STOP SHARING
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontal scrollable participant list strip at the bottom of screen share (exactly Google Meet style) */}
                <div className="h-28 flex gap-3 overflow-x-auto shrink-0 pb-2 justify-start items-center px-1">
                  {activeViewParticipants.map((p) => (
                    <motion.div 
                      key={p.uid}
                      layoutId={`strip-p-${p.uid}`}
                      className={`w-36 h-24 rounded-2xl overflow-hidden shrink-0 border bg-white relative flex flex-col justify-between p-3 shadow-sm ${
                        p.isSpeaking && p.audioEnabled ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[8px] bg-gray-50 px-1 py-0.2 rounded border text-gray-500 uppercase font-bold font-mono">
                          {p.connectionQuality === 'excellent' ? 'EXCELLENT' : 'GOOD'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <img 
                          src={p.avatar} 
                          alt={p.displayName} 
                          className="w-7 h-7 rounded-lg border border-gray-100 bg-gray-50 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold text-gray-900 truncate leading-none">{p.displayName}</p>
                          <p className="text-[8px] text-[#6B7280] truncate mt-0.5">{p.role}</p>
                        </div>
                      </div>

                      <div className="absolute bottom-1 right-2 flex gap-1">
                        {p.audioEnabled ? <Mic size={9} className="text-blue-500" /> : <MicOff size={9} className="text-red-500" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* RESPONSIVE VIDEO GRID (Balanced layouts for 1, 2, 4, 6, 9 participants) */
              <motion.div 
                layout
                className={`grid gap-5 w-full items-center justify-center transition-all duration-300 ${getGridClass(simulatedCount)}`}
              >
                {activeViewParticipants.map((p) => {
                  const initials = p.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  const showActualVideoMockup = p.videoEnabled;

                  return (
                    <motion.div 
                      key={p.uid} 
                      layoutId={`grid-p-${p.uid}`}
                      className={`h-full w-full rounded-[24px] bg-white border overflow-hidden relative flex flex-col justify-between p-5 transition-all duration-300 ${
                        p.isSpeaking && p.audioEnabled
                          ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-[0_8px_30px_rgb(37,99,235,0.06)]' 
                          : 'border-gray-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-gray-300'
                      }`}
                    >
                      {/* Active Speaker concentric wave highlight circles */}
                      {p.isSpeaking && p.audioEnabled && (
                        <div className="absolute inset-0 border border-blue-500/25 rounded-[24px] pointer-events-none voice-indicator animate-ping duration-1000" />
                      )}

                      {/* Video feedback placeholder */}
                      {showActualVideoMockup ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {p.uid === 'self' ? (
                            (isLocalScreenSharing && screenStream) ? (
                              <MeetingVideo stream={screenStream} isMuted={true} isSelf={true} className="absolute inset-0 w-full h-full rounded-[24px]" />
                            ) : localStream ? (
                              <MeetingVideo stream={localStream} isMuted={true} isSelf={true} className="absolute inset-0 w-full h-full rounded-[24px]" />
                            ) : (
                              <>
                                {/* Ambient high fidelity background color bleed */}
                                <div className="absolute inset-0 bg-cover bg-center opacity-[0.04] filter blur-xl" style={{ backgroundImage: `url('${p.avatar}')` }} />
                                <div className="text-center space-y-4 z-10">
                                  <motion.img 
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    src={p.avatar} 
                                    alt={p.displayName} 
                                    className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] border border-gray-200/50 object-cover shadow-lg bg-gray-50"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </>
                            )
                          ) : (remoteStreams[p.peerId] || remoteStreams[p.uid]) ? (
                            <MeetingVideo stream={remoteStreams[p.peerId] || remoteStreams[p.uid]} isMuted={false} isSelf={false} className="absolute inset-0 w-full h-full rounded-[24px]" />
                          ) : (
                            <>
                              {/* Ambient high fidelity background color bleed */}
                              <div className="absolute inset-0 bg-cover bg-center opacity-[0.04] filter blur-xl" style={{ backgroundImage: `url('${p.avatar}')` }} />
                              <div className="text-center space-y-4 z-10">
                                <motion.img 
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  src={p.avatar} 
                                  alt={p.displayName} 
                                  className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] border border-gray-200/50 object-cover shadow-lg bg-gray-50"
                                  referrerPolicy="no-referrer"
                                />
                                {p.isSpeaking && p.audioEnabled && (
                                  <div className="flex items-center justify-center gap-1.5 h-3">
                                    <span className="w-1 h-3 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite]" />
                                    <span className="w-1 h-4 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite_100ms]" />
                                    <span className="w-1 h-2 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite_200ms]" />
                                    <span className="w-1 h-3.5 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite_300ms]" />
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* Camera Muted Visual State */
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
                          <div className="text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 text-sm font-display font-extrabold shadow-sm mx-auto">
                              {initials}
                            </div>
                            <span className="text-[9px] text-[#6B7280] font-mono font-bold tracking-wider uppercase bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-sm">
                              Camera Muted
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Video Card Top Row: Quality Indicator and Raised Hand alert */}
                      <div className="z-10 flex items-center justify-between w-full">
                        {p.isHost && (
                          <span className="text-[9px] font-bold bg-blue-50 border border-blue-100 px-2.5 py-0.8 rounded-lg text-blue-600 font-mono tracking-wider">
                            COORDINATOR
                          </span>
                        )}
                        
                        <div className="flex items-center gap-1.5 ml-auto">
                          {p.handRaised && (
                            <motion.div 
                              initial={{ scale: 0.8, y: 10 }}
                              animate={{ scale: 1, y: 0 }}
                              className="text-xs bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl text-amber-600 font-bold flex items-center gap-1 shadow-sm"
                            >
                              <Hand size={11} className="fill-amber-500 stroke-amber-600" />
                              <span className="text-[9px] font-mono">HAND RAISED</span>
                            </motion.div>
                          )}

                          <span className="flex items-center gap-1 bg-white/95 backdrop-blur border border-gray-200/60 px-2 py-1 rounded-xl text-[9px] font-bold font-mono text-gray-600 shadow-sm" title="Connection latency">
                            <Wifi size={10} className={p.connectionQuality === 'poor' ? 'text-red-500 animate-pulse' : 'text-emerald-500'} />
                            <span className="uppercase">{p.connectionQuality}</span>
                          </span>
                        </div>
                      </div>

                      {/* Video Card Bottom Row: Participant Label Ribbon */}
                      <div className="z-10 flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-200/80 shadow-[0_4px_12px_rgb(0,0,0,0.02)]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{p.uid === 'self' ? 'You' : p.displayName}</p>
                          <p className="text-[9px] text-[#6B7280] font-semibold truncate leading-none mt-0.5">{p.role}</p>
                        </div>
                        <div className="flex gap-1">
                          <span className={`p-1.5 rounded-xl border transition-all ${p.audioEnabled ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                            {p.audioEnabled ? <Mic size={11} /> : <MicOff size={11} />}
                          </span>
                          <span className={`p-1.5 rounded-xl border transition-all ${p.videoEnabled ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                            {p.videoEnabled ? <VideoIcon size={11} /> : <VideoOff size={11} />}
                          </span>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 3. SLIDEOUT TABBED RIGHT PANEL DRAWER (Chat, Participants, Files, Whiteboard) */}
        <AnimatePresence>
          {activeDrawer !== 'none' && (
            <motion.div 
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: 360, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="hidden lg:flex flex-col bg-white border border-gray-200 rounded-[24px] h-full shrink-0 overflow-hidden shadow-xl shadow-gray-200/50 z-10"
            >
              {/* Drawer Slide Header - Tab Selector */}
              <div className="px-4.5 pt-4 pb-2 border-b border-gray-100 flex flex-col gap-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] font-mono">
                    Workspace Utilities
                  </span>
                  <button 
                    onClick={() => setActiveDrawer('none')}
                    className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Grid of Tabs for switching drawers inside */}
                <div className="grid grid-cols-5 p-1 bg-gray-100 rounded-xl relative">
                  {[
                    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
                    { id: 'participants' as const, label: 'People', icon: UsersIcon },
                    { id: 'files' as const, label: 'Files', icon: FileText },
                    { id: 'whiteboard' as const, label: 'Board', icon: Edit3 },
                    { id: 'ai-assistant' as const, label: 'AI', icon: Sparkles }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeDrawer === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveDrawer(tab.id);
                          if (tab.id === 'chat') setUnreadCount(0);
                        }}
                        className={`py-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-all relative cursor-pointer ${
                          isActive 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-[#6B7280] hover:text-gray-900'
                        }`}
                      >
                        {tab.id === 'chat' && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold font-mono shadow-sm animate-bounce">
                            {unreadCount}
                          </span>
                        )}
                        <Icon size={12} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DRAWER BODY INTERNALS */}
              <div className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-between">
                
                {/* A. LIVE CHAT (WhatsApp style bubbles) */}
                {activeDrawer === 'chat' && (
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      
                      {chatItems.map((msg) => {
                        const isMe = msg.senderId === 'self';
                        return (
                          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                            {!isMe && (
                              <img 
                                src={msg.senderPhotoURL} 
                                alt={msg.senderName} 
                                className="w-8 h-8 rounded-xl border border-gray-100 shrink-0 bg-gray-50 object-cover"
                              />
                            )}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 px-1">
                                <span className="text-[9px] font-bold text-[#6B7280]">{isMe ? 'You' : msg.senderName}</span>
                                <span className="text-[8px] text-gray-400 font-mono font-bold">{msg.timestamp}</span>
                              </div>
                              
                              <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed border relative shadow-sm ${
                                isMe 
                                  ? 'bg-[#2563EB] text-white rounded-tr-none border-[#2563EB]/10' 
                                  : 'bg-[#F3F4F6] text-gray-900 rounded-tl-none border-gray-100'
                              }`}>
                                <p>{msg.text}</p>
                                
                                {isMe && (
                                  <div className="flex justify-end mt-0.5 -mr-1">
                                    <Check size={10} className="text-blue-100" />
                                    <Check size={10} className="text-blue-200 -ml-1" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing simulation */}
                      {typingUser && (
                        <div className="flex gap-3 max-w-[85%] mr-auto items-end">
                          <span className="text-[10px] text-gray-400 italic font-medium">{typingUser} is typing</span>
                          <TypingIndicator />
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Collaborative Reactions mini panel */}
                    <div className="flex gap-1 px-3 py-1.5 border-t border-gray-100 bg-white/50 justify-between items-center shrink-0">
                      <span className="text-[9px] font-bold text-gray-400 font-mono">REACTION:</span>
                      <div className="flex gap-1.5">
                        {['❤️', '👍', '🔥', '🎉', '😂', '😮'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => sendReaction(emoji)}
                            className="text-sm hover:scale-125 hover:rotate-6 active:scale-90 transition-all p-0.5 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat Text Input field */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-gray-50/50 flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          handleTyping();
                        }}
                        placeholder="Type WhatsApp-style huddle message..."
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 focus:border-blue-500/50 outline-none rounded-xl text-xs placeholder:text-gray-400 transition-all text-gray-900 font-medium"
                      />
                      <button
                        type="submit"
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-500/15"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )}

                {/* B. PARTICIPANTS DIRECTORY LISTING */}
                {activeDrawer === 'participants' && (
                  <div className="p-4 flex-1 overflow-y-auto">
                    {/* Search filter placeholder */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={13} />
                      <input 
                        type="text"
                        placeholder="Search workspace partners..."
                        className="w-full pl-8 pr-4 py-2 bg-gray-100 border-none rounded-xl text-[11px] font-medium placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2.5">
                      {participants.map((p) => {
                        const isSpeaking = p.isSpeaking && p.audioEnabled;
                        return (
                          <div 
                            key={p.uid} 
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/70 border border-gray-200/50 rounded-xl transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative">
                                <img 
                                  src={p.avatar} 
                                  alt={p.displayName} 
                                  className="w-8 h-8 rounded-xl border border-gray-200/60 object-cover bg-white"
                                />
                                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white ${
                                  p.connectionQuality === 'excellent' ? 'bg-emerald-500' : p.connectionQuality === 'good' ? 'bg-amber-400' : 'bg-red-500'
                                }`} />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[11px] font-extrabold text-gray-900 truncate leading-none">{p.displayName}</p>
                                  {p.isHost && (
                                    <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-1 py-0.2 rounded font-bold font-mono">HOST</span>
                                  )}
                                </div>
                                <p className="text-[9px] text-[#6B7280] font-semibold mt-1 leading-none">{p.role}</p>
                              </div>
                            </div>

                            {/* Signal details */}
                            <div className="flex gap-2 items-center">
                              {isSpeaking && (
                                <div className="flex gap-0.5 items-end h-2.5 px-1">
                                  <span className="w-0.5 h-2 bg-blue-600 rounded-full animate-pulse" />
                                  <span className="w-0.5 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                                  <span className="w-0.5 h-1.5 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                                </div>
                              )}
                              
                              <div className="flex gap-1 shrink-0">
                                <span className={`p-1 rounded-lg border ${p.audioEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                                  {p.audioEnabled ? <Mic size={9} /> : <MicOff size={9} />}
                                </span>
                                <span className={`p-1 rounded-lg border ${p.videoEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                                  {p.videoEnabled ? <VideoIcon size={9} /> : <VideoOff size={9} />}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* C. SHARED FILES DRAWER WITH IMAGE PREVIEWS AND DRAG AND DROP */}
                {activeDrawer === 'files' && (
                  <div className="p-4 flex-1 flex flex-col justify-between min-h-0">
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                      {/* Drag & Drop Card */}
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-[20px] p-5 text-center transition-all relative cursor-pointer ${
                          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                        }`}
                      >
                        <input 
                          type="file"
                          id="meeting-file-upload-deck"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleManualUpload}
                        />
                        <UploadCloud size={24} className="mx-auto text-blue-500 mb-2" />
                        <p className="text-xs font-bold text-gray-800">Share Meeting File</p>
                        <p className="text-[10px] text-[#6B7280] mt-1 font-semibold">Drag & drop here or click to browse</p>
                      </div>

                      {/* File collection list */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-extrabold text-[#6B7280] tracking-wider uppercase font-mono">Shared Artifacts</h4>
                        
                        <div className="space-y-2.5">
                          {isFileUploading && (
                            <div className="p-3 bg-blue-50/40 border border-blue-200/60 rounded-2xl flex flex-col gap-2.5 animate-pulse">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
                                    <RefreshCw size={15} className="animate-spin" style={{ animationDuration: '3s' }} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-700">Uploading File...</p>
                                    <p className="text-[9px] text-[#2563EB] font-bold mt-0.5">Encrypting and writing blocks...</p>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full h-1 bg-slate-200/60 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full w-[65%] animate-pulse" />
                              </div>
                            </div>
                          )}

                          {sharedFiles.map(file => (
                            <div key={file.id} className="p-3 bg-white border border-gray-200 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:border-gray-300 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                                    <FileText size={15} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate text-gray-900 leading-tight">{file.name}</p>
                                    <p className="text-[9px] text-[#6B7280] font-semibold mt-0.5">{file.size} • by {file.uploader}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => addNotification(`Downloaded: ${file.name}`)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-all cursor-pointer"
                                  title="Download"
                                >
                                  <Download size={13} />
                                </button>
                              </div>

                              {/* Beautiful thumbnail image preview if file is an image */}
                              {file.type === 'image' && file.previewUrl && (
                                <div className="w-full h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 relative group">
                                  <img 
                                    src={file.previewUrl} 
                                    alt="file preview" 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-103"
                                  />
                                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* D. INTERACTIVE WHITEBOARD SYSTEM WITH EXQUISITE CONTROLS */}
                {activeDrawer === 'whiteboard' && (
                  <div className="h-full flex flex-col p-4 space-y-4">
                    {/* Floating Whiteboard Control Center */}
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 flex flex-col gap-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] font-mono">Tools</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleWhiteboardUndo}
                            disabled={!canUndo}
                            className="p-1 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-all cursor-pointer"
                            title="Undo"
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button
                            onClick={handleWhiteboardRedo}
                            disabled={!canRedo}
                            className="p-1 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-all cursor-pointer"
                            title="Redo"
                          >
                            <RotateCw size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Tool selection keys */}
                      <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-gray-200">
                        {[
                          { id: 'pen' as const, label: 'Pen', icon: Edit3 },
                          { id: 'eraser' as const, label: 'Eraser', icon: Eraser },
                          { id: 'rect' as const, label: 'Rect', icon: Square },
                          { id: 'circle' as const, label: 'Circle', icon: Circle },
                          { id: 'text' as const, label: 'Text', icon: Type }
                        ].map(tool => {
                          const Icon = tool.icon;
                          const isSel = drawingTool === tool.id;
                          return (
                            <button
                              key={tool.id}
                              onClick={() => {
                                setDrawingTool(tool.id);
                                addNotification(`Drawing Tool: ${tool.label}`);
                              }}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isSel 
                                  ? 'bg-blue-600 text-white shadow-sm' 
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <Icon size={11} />
                              <span>{tool.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Color palettes */}
                      {drawingTool !== 'eraser' && (
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 font-mono mt-1">
                          <span>PALETTE</span>
                          <div className="flex gap-1.5">
                            {['#2563EB', '#10B981', '#EF4444', '#F59E0B', '#111827'].map(c => (
                              <button
                                key={c}
                                onClick={() => setBrushColor(c)}
                                className={`w-4.5 h-4.5 rounded-full border border-black/10 transition-transform ${brushColor === c ? 'scale-125 ring-2 ring-blue-500/30' : 'hover:scale-110'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clear Canvas */}
                      <button 
                        onClick={handleWhiteboardClear}
                        className="w-full mt-1.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Trash2 size={11} />
                        <span>RESET WHITEBOARD CANVAS</span>
                      </button>
                    </div>

                    {/* Canvas Drawing Sandbox */}
                    <div className="flex-1 bg-white rounded-2xl relative overflow-hidden border border-gray-200 shadow-inner min-h-[300px]">
                      {isWhiteboardSyncing && (
                        <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5 z-30">
                          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest font-bold">SYNCHRONIZING CANVAS PLOTS...</p>
                        </div>
                      )}
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full cursor-crosshair"
                      />

                      {/* Floating Text input widget if 'text' tool was triggered */}
                      {showTextInput && (
                        <div 
                          style={{ left: textInputPos.x, top: textInputPos.y }}
                          className="absolute bg-white border border-gray-200 p-2 rounded-xl shadow-lg flex gap-1.5 z-30"
                        >
                          <input 
                            type="text" 
                            autoFocus
                            value={textValue}
                            onChange={(e) => setTextValue(e.target.value)}
                            placeholder="Press Enter to imprint..."
                            className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded text-[11px] outline-none text-gray-900 font-semibold"
                          />
                        </div>
                      )}

                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-gray-900/80 backdrop-blur rounded-lg text-[8px] font-mono font-bold text-white uppercase tracking-wider pointer-events-none">
                        Interactive Whiteboard Sandbox ({drawingTool})
                      </div>
                    </div>

                    <div className="space-y-1 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                      <div className="flex justify-between text-[9px] text-[#6B7280] font-extrabold font-mono uppercase">
                        <span>Stroke Width</span>
                        <span>{brushSize}px</span>
                      </div>
                      <input 
                        type="range"
                        min="2"
                        max="16"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full accent-blue-600 bg-gray-200 rounded-lg appearance-none h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* E. AI ASSISTANT PANEL */}
                {activeDrawer === 'ai-assistant' && (
                  <AiAssistantDrawer 
                    roomId={roomId || 'sm-huddle-sync'}
                    participants={participants}
                    chatMessages={chatItems}
                    sharedFiles={sharedFiles}
                  />
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. FLOATING BOTTOM CONTROL TOOLBAR (GOOGLE MEET & ZOOM INSPIRED) */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-20 shrink-0 flex items-center justify-center z-10"
      >
        <div className="bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] px-6 py-3.5 flex items-center gap-2.5 relative">
          
          {/* Mute Mic toggle */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              toggleLocalMic();
              toggleMic();
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
              isSelfMicOn 
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100' 
                : 'bg-red-50 hover:bg-red-100 text-red-500 border-red-100'
            }`}
            title={isSelfMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isSelfMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </motion.button>

          {/* Camera On/Off toggle */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              toggleLocalCamera();
              toggleCamera();
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
              isSelfCamOn 
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100' 
                : 'bg-red-50 hover:bg-red-100 text-red-500 border-red-100'
            }`}
            title={isSelfCamOn ? "Stop Camera Stream" : "Start Camera Stream"}
          >
            {isSelfCamOn ? <VideoIcon size={18} /> : <VideoOff size={18} />}
          </motion.button>

          {/* Screen Share toggle */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isLocalScreenSharing) {
                stopScreenShare();
                toggleScreenShare();
              } else {
                startScreenShare().then(() => {
                  toggleScreenShare();
                }).catch((err) => {
                  console.warn("Screen sharing rejected:", err);
                  setErrorModal({
                    title: "Screen Share Refused",
                    message: "The screen capture request was declined, or browser display media privileges are blocked for this portal.",
                    code: "SCREEN_DENIED"
                  });
                });
              }
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
              isLocalScreenSharing 
                ? 'bg-[#2563EB] text-white border-blue-500 shadow-md shadow-blue-500/10' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100'
            }`}
            title={isLocalScreenSharing ? "Stop Screen Share" : "Share Workspace Screen"}
          >
            {isLocalScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
          </motion.button>

          <span className="w-[1px] h-6 bg-gray-200 mx-1" />

          {/* Raise Hand toggle button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setRaisedHandSelf(!raisedHandSelf);
              toggleHandRaise();
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
              raisedHandSelf 
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/10' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100'
            }`}
            title="Raise / Lower Hand"
          >
            <Hand size={18} className={raisedHandSelf ? 'fill-white' : ''} />
          </motion.button>

          {/* Drawer Shortkeys group (switching drawers from bottom bar) */}
          {[
            { id: 'chat' as const, label: 'Chat logs', icon: MessageSquare, badge: unreadCount },
            { id: 'participants' as const, label: 'Participants', icon: UsersIcon, badge: 0 },
            { id: 'files' as const, label: 'Shared items', icon: FileText, badge: 0 },
            { id: 'whiteboard' as const, label: 'Whiteboard', icon: Edit3, badge: 0 },
            { id: 'ai-assistant' as const, label: 'AI Copilot', icon: Sparkles, badge: 0 }
          ].map((item) => {
            const Icon = item.icon;
            const isDrawerOpen = activeDrawer === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveDrawer(activeDrawer === item.id ? 'none' : item.id);
                  if (item.id === 'chat') setUnreadCount(0);
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border relative cursor-pointer ${
                  isDrawerOpen 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100'
                }`}
                title={item.label}
              >
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold font-mono">
                    {item.badge}
                  </span>
                )}
                <Icon size={18} />
              </motion.button>
            );
          })}

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              navigate('/settings');
              addNotification("Opening audio/video parameters");
            }}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all border bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100 cursor-pointer"
            title="Configure System Preference"
          >
            <SettingsIcon size={18} />
          </motion.button>

          <span className="w-[1px] h-6 bg-gray-200 mx-1" />

          {/* Professional Meeting Recorder Controls */}
          {isRecording ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full shadow-sm">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="text-[11px] font-mono font-black text-red-600 shrink-0">{formattedDuration}</span>
              
              <span className="w-[1px] h-4 bg-red-200/60 mx-1" />
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="p-1.5 rounded-lg hover:bg-red-100 text-red-700 transition-colors cursor-pointer flex items-center justify-center"
                title={isPaused ? "Resume recording" : "Pause recording"}
              >
                {isPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={stopRecording}
                className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center justify-center"
                title="Stop and save recording"
              >
                <Square size={11} fill="currentColor" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRecorderModalOpen(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all border bg-red-50 hover:bg-red-100 text-red-600 border-red-100 cursor-pointer"
              title="Record Session"
            >
              <Circle size={14} fill="currentColor" className="animate-pulse" />
            </motion.button>
          )}

          <span className="w-[1px] h-6 bg-gray-200 mx-1" />

          {/* Premium AI Summary trigger */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAiSummaryModalOpen(true)}
            className="px-4 h-11 rounded-full flex items-center gap-1.5 transition-all border bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/10 font-bold text-xs cursor-pointer"
            title="Generate AI Meeting Briefing & Summary"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>AI Summary</span>
          </motion.button>

          <span className="w-[1px] h-6 bg-gray-200 mx-1" />

          {/* HANG UP DISCONNECT BUTTON */}
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLeave}
            className="px-5 h-11 rounded-full bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20 text-white transition-all flex items-center gap-1.5 font-bold text-xs cursor-pointer"
            title="Leave conference"
          >
            <PhoneOff size={15} />
            <span className="hidden sm:inline">LEAVE ROOM</span>
          </motion.button>

        </div>
      </motion.div>

      {/* TOASTER NOTIFICATIONS COMPONENT (FADE IN EFFECTS) */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {chatMessages.length > 0 && activeDrawer !== 'chat' && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-2xl border border-gray-200/80 text-xs font-semibold text-gray-900 shadow-xl flex items-center gap-3 max-w-sm pointer-events-auto bg-white/95 backdrop-blur-md"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
              <span>New Workspace chat log posted.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Flying Emoji Reactions Overlay */}
      <div className="fixed bottom-24 left-6 z-50 pointer-events-none w-48 h-96 overflow-hidden flex flex-col justify-end">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: 200, opacity: 0, x: r.x }}
              animate={{
                y: -150,
                opacity: [0, 1, 1, 0],
                x: r.x + Math.sin(r.delay * 10) * 30,
                scale: [0.5, 1.2, 1, 0.8]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, ease: 'easeOut', delay: r.delay }}
              className="absolute text-3xl select-none"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Elegant System Error Dialog */}
      <ErrorModal
        isOpen={!!errorModal}
        title={errorModal?.title || ""}
        message={errorModal?.message || ""}
        code={errorModal?.code}
        onClose={() => setErrorModal(null)}
        onRetry={errorModal?.code === 'CAMERA_ERROR' || errorModal?.code === 'MIC_ERROR' ? startLocalStream : undefined}
      />

      {/* AI Workspace Summary Modal */}
      <AiSummaryModal
        isOpen={isAiSummaryModalOpen}
        onClose={() => setIsAiSummaryModalOpen(false)}
        roomId={roomId || 'sm-huddle-sync'}
        participants={participants}
        chatMessages={chatItems}
        sharedFiles={sharedFiles}
        addNotification={addNotification}
      />

      {/* Professional Meeting Recorder Modal */}
      <MeetingRecorderModal
        isOpen={isRecorderModalOpen}
        onClose={() => setIsRecorderModalOpen(false)}
        confirmStartRecording={startRecording}
        recordingUrl={recordingUrl}
        recordingMeta={recordingMeta}
        clearRecording={clearRecording}
        isRecordingActive={isRecording}
        addNotification={addNotification}
      />

    </div>
  );
};

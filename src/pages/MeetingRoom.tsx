import React, { useState, useEffect, useRef } from 'react';
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
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    toggleHandRaise
  } = useMeeting();

  // Drawers and layout states
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'participants' | 'chat' | 'whiteboard' | 'files'>('chat');
  const [inputText, setInputText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
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

  // File states (with image previews)
  const [sharedFiles, setSharedFiles] = useState([
    { id: '1', name: 'Sprint_2_DesignSystem_v4.png', size: '3.6 MB', uploader: 'Aria Rose', date: '10:15 AM', type: 'image', previewUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=120&q=80' },
    { id: '2', name: 'SyncMeet_ProductSpecs.pdf', size: '4.2 MB', uploader: 'Marcus Vance', date: '09:42 AM', type: 'pdf', previewUrl: '' },
    { id: '3', name: 'Interface_Whiteboard_Draft.jpg', size: '1.2 MB', uploader: 'Sarah Jenkins', date: '09:12 AM', type: 'image', previewUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=120&q=80' },
  ]);

  // Whiteboard drawing states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#2563EB');
  const [brushSize, setBrushSize] = useState(4);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser' | 'rect' | 'circle' | 'text'>('pen');
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');

  // Canvas drawing reference
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulated participants with beautiful profiles
  const [participants, setParticipants] = useState<MockParticipant[]>([
    {
      uid: 'self',
      displayName: currentUser?.displayName || 'Product Partner',
      role: 'Project Lead (You)',
      avatar: currentUser?.photoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=self',
      audioEnabled: true,
      videoEnabled: true,
      isSpeaking: false,
      isHost: true,
      handRaised: false,
      connectionQuality: 'excellent'
    },
    {
      uid: 'aria',
      displayName: 'Aria Rose',
      role: 'Lead Product Designer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      audioEnabled: true,
      videoEnabled: true,
      isSpeaking: true,
      isHost: false,
      handRaised: false,
      connectionQuality: 'excellent'
    },
    {
      uid: 'marcus',
      displayName: 'Marcus Vance',
      role: 'Staff Systems Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      audioEnabled: false,
      videoEnabled: true,
      isSpeaking: false,
      isHost: false,
      handRaised: false,
      connectionQuality: 'excellent'
    },
    {
      uid: 'liam',
      displayName: 'Liam Sterling',
      role: 'Frontend Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      audioEnabled: true,
      videoEnabled: false,
      isSpeaking: false,
      isHost: false,
      handRaised: true,
      connectionQuality: 'good'
    },
    {
      uid: 'sarah',
      displayName: 'Sarah Jenkins',
      role: 'Security Compliance',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
      audioEnabled: false,
      videoEnabled: false,
      isSpeaking: false,
      isHost: false,
      handRaised: false,
      connectionQuality: 'good'
    },
    {
      uid: 'james',
      displayName: 'James Chen',
      role: 'Senior Backend Architect',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
      audioEnabled: true,
      videoEnabled: true,
      isSpeaking: false,
      isHost: false,
      handRaised: false,
      connectionQuality: 'excellent'
    },
    {
      uid: 'elena',
      displayName: 'Dr. Elena Rostova',
      role: 'AI Specialist',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
      audioEnabled: true,
      videoEnabled: true,
      isSpeaking: true,
      isHost: false,
      handRaised: true,
      connectionQuality: 'excellent'
    },
    {
      uid: 'oliver',
      displayName: 'Oliver Dupont',
      role: 'Group Product Manager',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80',
      audioEnabled: false,
      videoEnabled: true,
      isSpeaking: false,
      isHost: false,
      handRaised: false,
      connectionQuality: 'poor'
    },
    {
      uid: 'sophia',
      displayName: 'Sophia Martinez',
      role: 'QA Automation Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      audioEnabled: true,
      videoEnabled: false,
      isSpeaking: false,
      isHost: false,
      handRaised: false,
      connectionQuality: 'good'
    }
  ]);

  // Local Chat state
  const [chatItems, setChatItems] = useState([
    { id: 'm1', senderId: 'aria', senderName: 'Aria Rose', senderPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', text: 'Hey team, I uploaded the latest visual designs for Sprint 2! They are ready to view in the Files tab.', timestamp: '10:14 AM' },
    { id: 'm2', senderId: 'marcus', senderName: 'Marcus Vance', senderPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', text: 'Excellent. Let me cross-verify the layout with the schema rules on the server side.', timestamp: '10:15 AM' },
    { id: 'm3', senderId: 'liam', senderName: 'Liam Sterling', senderPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', text: 'Can we also test the drawing whiteboard with the new styling brush today?', timestamp: '10:16 AM' }
  ]);

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
      setParticipants(prev => {
        // Map active participants
        const mappedReal = activeParticipants.map(p => {
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
            isSpeaking: p.isSpeaking || false,
            isHost: p.isHost,
            handRaised: p.handRaised || false,
            connectionQuality: (isSelf ? 'excellent' : 'good') as 'excellent' | 'good' | 'poor'
          };
        });

        // To keep the room beautifully populated for demo, let's keep the system/mock participants 
        // that do not overlap with our real participants.
        const defaultMocks = [
          {
            uid: 'aria',
            displayName: 'Aria Rose',
            role: 'Lead Product Designer',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
            audioEnabled: true,
            videoEnabled: true,
            isSpeaking: false,
            isHost: false,
            handRaised: false,
            connectionQuality: 'excellent' as const
          },
          {
            uid: 'marcus',
            displayName: 'Marcus Vance',
            role: 'Staff Systems Architect',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
            audioEnabled: false,
            videoEnabled: true,
            isSpeaking: false,
            isHost: false,
            handRaised: false,
            connectionQuality: 'excellent' as const
          },
          {
            uid: 'liam',
            displayName: 'Liam Sterling',
            role: 'Frontend Engineer',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
            audioEnabled: true,
            videoEnabled: false,
            isSpeaking: false,
            isHost: false,
            handRaised: false,
            connectionQuality: 'good' as const
          },
          {
            uid: 'sarah',
            displayName: 'Sarah Jenkins',
            role: 'Security Compliance',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
            audioEnabled: false,
            videoEnabled: false,
            isSpeaking: false,
            isHost: false,
            handRaised: false,
            connectionQuality: 'good' as const
          },
          {
            uid: 'james',
            displayName: 'James Chen',
            role: 'Senior Backend Architect',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
            audioEnabled: true,
            videoEnabled: true,
            isSpeaking: false,
            isHost: false,
            handRaised: false,
            connectionQuality: 'excellent' as const
          }
        ];

        // Filter mocks to only include those that don't match any real participant's uid/displayName
        const activeMocks = defaultMocks.filter(m => 
          !mappedReal.some(r => r.displayName.toLowerCase() === m.displayName.toLowerCase() || r.uid === m.uid)
        );

        // Combine
        return [...mappedReal, ...activeMocks];
      });
    }
  }, [activeParticipants, currentUser]);

  // Synchronize local chat with live backend chat messages
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      setChatItems(prev => {
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

        // Combine default onboarding messages with mapped ones, preventing duplicate ids
        const defaults = [
          { id: 'm1', senderId: 'aria', senderName: 'Aria Rose', senderPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', text: 'Hey team, I uploaded the latest visual designs for Sprint 2! They are ready to view in the Files tab.', timestamp: '10:14 AM' },
          { id: 'm2', senderId: 'marcus', senderName: 'Marcus Vance', senderPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', text: 'Excellent. Let me cross-verify the layout with the schema rules on the server side.', timestamp: '10:15 AM' },
          { id: 'm3', senderId: 'liam', senderName: 'Liam Sterling', senderPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', text: 'Can we also test the drawing whiteboard with the new styling brush today?', timestamp: '10:16 AM' }
        ];

        // Filter out any default that might conflict or exist
        const nonConflictingDefaults = defaults.filter(d => 
          !mappedReal.some(r => r.text === d.text)
        );

        return [...nonConflictingDefaults, ...mappedReal];
      });
      
      // If the chat drawer isn't active, raise an unread badge
      if (activeDrawer !== 'chat') {
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

  // Setup canvas drawings
  useEffect(() => {
    if (activeDrawer === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Handle resizing based on parent container width/height
        const resizeCanvas = () => {
          const tempImg = canvas.toDataURL();
          canvas.width = canvas.parentElement?.clientWidth || 500;
          canvas.height = canvas.parentElement?.clientHeight || 450;
          
          // Re-draw temp image
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = tempImg;

          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushSize;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Initial snapshot
        const initialImg = canvas.toDataURL();
        if (canvasHistory.length === 0) {
          setCanvasHistory([initialImg]);
          setHistoryIndex(0);
        }

        return () => window.removeEventListener('resize', resizeCanvas);
      }
    }
  }, [activeDrawer]);

  // Update canvas properties
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = drawingTool === 'eraser' ? '#FFFFFF' : brushColor;
        ctx.lineWidth = brushSize;
      }
    }
  }, [brushColor, brushSize, drawingTool]);

  // Soundwave mock simulation (Randomly toggle participant's active speaking highlight)
  useEffect(() => {
    const speakerInterval = setInterval(() => {
      setParticipants(prev => prev.map(p => {
        if (p.uid === 'self') return p; // Don't randomly speaking toggle self
        // Random speaking trigger if audio is enabled
        if (p.audioEnabled && Math.random() > 0.7) {
          return { ...p, isSpeaking: !p.isSpeaking };
        }
        return p;
      }));
    }, 4000);
    return () => clearInterval(speakerInterval);
  }, []);

  // Simulating custom smart responses in chat to look incredibly rich and realistic
  const simulateBotResponse = (userMsg: string) => {
    // Determine target bot
    const botPool = [
      { name: 'Aria Rose', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', id: 'aria' },
      { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', id: 'marcus' },
      { name: 'Liam Sterling', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', id: 'liam' }
    ];
    const responder = botPool[Math.floor(Math.random() * botPool.length)];

    setTimeout(() => {
      setTypingUser(responder.name);
    }, 1000);

    setTimeout(() => {
      setTypingUser(null);
      const responses = [
        `That sounds perfect! Let's incorporate it in the visual mockups.`,
        `Completely agree. I'll document this requirement in the meeting spec PDF.`,
        `Nice idea. I will run a local container compile to verify it compiles properly.`,
        `Let me review that file again. It looks excellent!`,
        `Should we update the project rules to reflect this sync?`
      ];
      const replyText = responses[Math.floor(Math.random() * responses.length)];
      
      const replyMsg = {
        id: Math.random().toString(),
        senderId: responder.id,
        senderName: responder.name,
        senderPhotoURL: responder.avatar,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatItems(prev => [...prev, replyMsg]);
      if (activeDrawer !== 'chat') {
        setUnreadCount(u => u + 1);
        addNotification(`New chat message from ${responder.name}`);
      }
    }, 3500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const typedText = inputText;
    setInputText('');

    try {
      await sendChatMessage(typedText);
    } catch (err) {
      console.error("Failed to send real-time message:", err);
    }
    
    // Trigger mock smart typing reply
    simulateBotResponse(typedText);
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

  // Canvas drawing functions
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = canvas.toDataURL();
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    setCanvasHistory([...newHistory, state]);
    setHistoryIndex(newHistory.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = canvasHistory[prevIndex];
        addNotification("Whiteboard drawing undone");
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = canvasHistory[nextIndex];
        addNotification("Whiteboard drawing redone");
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      startPosRef.current = { x, y };
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (drawingTool === 'pen' || drawingTool === 'eraser') {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (drawingTool === 'rect' && snapshotRef.current) {
        // Restore canvas to snap
        ctx.putImageData(snapshotRef.current, 0, 0);
        ctx.beginPath();
        const width = x - startPosRef.current.x;
        const height = y - startPosRef.current.y;
        ctx.rect(startPosRef.current.x, startPosRef.current.y, width, height);
        ctx.stroke();
      } else if (drawingTool === 'circle' && snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(x - startPosRef.current.x, 2) + Math.pow(y - startPosRef.current.y, 2));
        ctx.arc(startPosRef.current.x, startPosRef.current.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && drawingTool === 'text' && startPosRef.current) {
        const rect = canvas.getBoundingClientRect();
        setTextInputPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        setShowTextInput(true);
      } else {
        saveCanvasState();
      }
    }
  };

  const handlePlaceText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValue.trim()) {
      setShowTextInput(false);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.font = `${brushSize * 4}px Inter, sans-serif`;
      ctx.fillStyle = brushColor;
      ctx.fillText(textValue, textInputPos.x, textInputPos.y);
      setTextValue('');
      setShowTextInput(false);
      saveCanvasState();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveCanvasState();
      addNotification("Whiteboard cleared.");
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
      const isImage = file.type.startsWith('image/');
      const newFile = {
        id: Math.random().toString(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        uploader: currentUser?.displayName || 'User',
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: isImage ? 'image' : 'file',
        previewUrl: isImage ? URL.createObjectURL(file) : ''
      };
      setSharedFiles(prev => [newFile, ...prev]);
      addNotification(`File uploaded: ${file.name}`);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith('image/');
      const newFile = {
        id: Math.random().toString(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        uploader: currentUser?.displayName || 'User',
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: isImage ? 'image' : 'file',
        previewUrl: isImage ? URL.createObjectURL(file) : ''
      };
      setSharedFiles(prev => [newFile, ...prev]);
      addNotification(`Shared artifact: ${file.name}`);
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
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto self-end sm:self-center">
          
          {/* Ticking live duration timer */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/60 px-4 py-2 rounded-2xl text-xs font-mono font-bold text-gray-700">
            <Clock size={13} className="text-blue-500" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Participant count indicator */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/60 px-4 py-2 rounded-2xl text-xs font-semibold text-gray-700">
            <UsersIcon size={13} className="text-[#6B7280]" />
            <span>{simulatedCount} connected</span>
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
            {isScreenSharing ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex flex-col gap-4 relative"
              >
                {/* Large screen share board */}
                <div className="flex-1 rounded-[24px] bg-white border border-gray-200 overflow-hidden relative flex flex-col justify-between p-6 shadow-sm">
                  {/* Outer container image preview */}
                  <div className="absolute inset-0 flex items-center justify-center p-6 bg-gray-50/50">
                    <div className="w-full max-w-4xl aspect-video bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between font-mono text-xs leading-relaxed shadow-xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-cover bg-center opacity-[0.08]" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80')` }} />
                      
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                          <span className="font-bold">SyncMeet Live Presenter Workspace</span>
                        </div>
                        <span className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono">
                          HD 1080p
                        </span>
                      </div>
                      
                      {/* Simulating code editing workspace */}
                      <div className="flex-1 py-4 text-gray-700 overflow-hidden font-mono text-left space-y-2 text-xs">
                        <p className="text-gray-400">// Synchronizing client interfaces in high definition...</p>
                        <p className="text-blue-600">import <span className="text-[#111827]">{"{ webrtcMesh }"}</span> from <span className="text-emerald-600">"syncmeet-fidelity"</span>;</p>
                        <p className="text-[#111827]">const connection = webrtcMesh.createHub({"{"} code: "{roomId || 'sm-huddle-sync'}" {"}"});</p>
                        <p className="text-[#6B7280]">connection.on("mesh-ready", () =&gt; {"{"}</p>
                        <p className="text-[#111827]">&nbsp;&nbsp;console.log("Dual stream pipeline established with 60 FPS feedback.");</p>
                        <p className="text-[#111827]">&nbsp;&nbsp;attachLocalAudioContext();</p>
                        <p className="text-[#6B7280]">{"});"}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-gray-400 text-[10px]">
                        <span>60 FPS • High Fidelity • Latency: 12ms</span>
                        <span>Client UTF-8 Stream</span>
                      </div>
                    </div>
                  </div>

                  <div className="z-10 flex items-center justify-between w-full">
                    <span className="text-xs font-bold bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full text-blue-600 flex items-center gap-2 shadow-sm">
                      <Monitor size={13} className="animate-pulse text-blue-500" />
                      <span>You are presenting your screen</span>
                    </span>
                    
                    <button 
                      onClick={() => setIsScreenSharing(false)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-bold border border-red-100 transition-colors cursor-pointer"
                    >
                      STOP SHARING
                    </button>
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
                          {/* Ambient high fidelity background color bleed */}
                          <div className="absolute inset-0 bg-cover bg-center opacity-[0.04] filter blur-xl" style={{ backgroundImage: `url('${p.avatar}')` }} />
                          <div className="text-center space-y-4">
                            <motion.img 
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              src={p.avatar} 
                              alt={p.displayName} 
                              className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] border border-gray-200/50 object-cover shadow-lg bg-gray-50"
                              referrerPolicy="no-referrer"
                            />
                            {/* Live speaking voice decibel wave animation */}
                            {p.isSpeaking && p.audioEnabled && (
                              <div className="flex items-center justify-center gap-1.5 h-3">
                                <span className="w-1 h-3 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite]" />
                                <span className="w-1 h-4 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite_100ms]" />
                                <span className="w-1 h-2 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite_200ms]" />
                                <span className="w-1 h-3.5 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite_300ms]" />
                              </div>
                            )}
                          </div>
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
                <div className="grid grid-cols-4 p-1 bg-gray-100 rounded-xl relative">
                  {[
                    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
                    { id: 'participants' as const, label: 'People', icon: UsersIcon },
                    { id: 'files' as const, label: 'Files', icon: FileText },
                    { id: 'whiteboard' as const, label: 'Board', icon: Edit3 }
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

                    {/* Chat Text Input field */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-gray-50/50 flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
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
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className="p-1 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-all cursor-pointer"
                            title="Undo"
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button
                            onClick={handleRedo}
                            disabled={historyIndex >= canvasHistory.length - 1}
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
                        onClick={clearCanvas}
                        className="w-full mt-1.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Trash2 size={11} />
                        <span>RESET WHITEBOARD CANVAS</span>
                      </button>
                    </div>

                    {/* Canvas Drawing Sandbox */}
                    <div className="flex-1 bg-white rounded-2xl relative overflow-hidden border border-gray-200 shadow-inner min-h-[300px]">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="absolute inset-0 w-full h-full cursor-crosshair"
                      />

                      {/* Floating Text input widget if 'text' tool was triggered */}
                      {showTextInput && (
                        <form 
                          onSubmit={handlePlaceText}
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
                          <button 
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded p-1"
                          >
                            <Check size={11} />
                          </button>
                        </form>
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
              setIsSelfMicOn(!isSelfMicOn);
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
              setIsSelfCamOn(!isSelfCamOn);
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
              setIsScreenSharing(!isScreenSharing);
              toggleScreenShare();
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
              isScreenSharing 
                ? 'bg-[#2563EB] text-white border-blue-500 shadow-md shadow-blue-500/10' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100'
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Workspace Screen"}
          >
            {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
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
            { id: 'whiteboard' as const, label: 'Whiteboard', icon: Edit3, badge: 0 }
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

    </div>
  );
};

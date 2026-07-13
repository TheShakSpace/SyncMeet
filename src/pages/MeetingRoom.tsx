import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Monitor, 
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
  MonitorOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    activeMeeting,
    activeParticipants,
    chatMessages,
    sendChatMessage,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    leaveMeeting,
    joinMeeting,
    notifications,
    addNotification
  } = useMeeting();

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-join meeting room if refreshing on route directly
  useEffect(() => {
    if (currentUser && !activeMeeting && roomId) {
      joinMeeting(roomId);
    } else if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, activeMeeting, roomId, navigate]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      await sendChatMessage(inputText);
      setInputText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeave = async () => {
    await leaveMeeting();
    navigate('/dashboard');
  };

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setIsCopied(true);
      addNotification("Room code copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  if (!currentUser || !activeMeeting) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl border-t-2 border-r-2 border-blue-500 animate-spin"></div>
        <p className="text-sm text-gray-400 font-mono">Initializing SyncMeet Secure Tunnel...</p>
      </div>
    );
  }

  // Find if current user states are toggled
  const localParticipant = activeParticipants.find(p => p.uid === currentUser.uid);
  const isMicOn = localParticipant?.audioEnabled ?? true;
  const isCameraOn = localParticipant?.videoEnabled ?? true;
  const isSharingScreen = localParticipant?.screenShareEnabled ?? false;

  // Check if anyone else is sharing screen
  const screenSharer = activeParticipants.find(p => p.screenShareEnabled);

  return (
    <div id="meeting-room-canvas" className="h-[calc(100vh-10rem)] flex flex-col justify-between -m-6 md:-m-8 p-4 md:p-6 bg-[#0B1017] overflow-hidden select-none">
      
      {/* Top Header Panel of Room */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLeave}
            className="p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/15 transition-all text-gray-400 hover:text-white"
            title="Back to workspace"
          >
            <PhoneOff size={16} className="text-red-400 transform rotate-135" />
          </button>
          <div>
            <h2 className="text-sm md:text-base font-display font-bold truncate max-w-[200px] md:max-w-[400px]">
              {activeMeeting.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span className="font-mono text-blue-400">{roomId}</span>
              <span>•</span>
              <button 
                onClick={handleCopyCode}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span className="text-[10px] font-mono">Copy Code</span>
              </button>
            </div>
          </div>
        </div>

        {/* Network / Privacy Status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#141C27]/50 border border-white/5 rounded-full text-xs text-gray-400 font-mono">
          <Shield size={12} className="text-blue-400" />
          <span className="hidden sm:inline">Encrypted Client Link</span>
        </div>
      </div>

      {/* Main Middle section (Webcams/Grid + Side panels) */}
      <div className="flex-1 flex gap-4 my-4 overflow-hidden relative">
        
        {/* WEBCAMS/PARTICIPANTS GRID AREA */}
        <div className="flex-1 flex flex-col justify-center min-w-0 h-full relative">
          
          {/* If someone is sharing screen, present screen share dominant view */}
          {screenSharer ? (
            <div className="h-full flex flex-col gap-4 relative">
              {/* dominant view */}
              <div className="flex-1 rounded-2xl border border-blue-500/30 overflow-hidden relative glass flex flex-col justify-between p-4 bg-radial from-[#121B2A] to-[#0B1017]">
                
                {/* Simulated Screen share graphic */}
                <div className="absolute inset-0 flex items-center justify-center p-8 opacity-90">
                  <div className="w-full max-w-2xl aspect-video bg-black/60 rounded-xl border border-white/5 p-4 flex flex-col justify-between font-mono text-[10px] leading-relaxed shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1 text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        <span>main.tsx</span>
                      </div>
                      <span className="text-blue-400 text-[9px] uppercase tracking-wider font-bold">Vite HMR Sandbox</span>
                    </div>
                    <div className="flex-1 py-4 text-emerald-400 overflow-hidden font-mono text-left space-y-1">
                      <p className="text-blue-400">// Importing SyncMeet live WebRTC signaller...</p>
                      <p className="text-purple-400">import <span className="text-white">{"{ PeerJS, Signaller }"}</span> from <span className="text-yellow-300">"./webrtc"</span>;</p>
                      <p className="text-white">const signaller = new Signaller({"{"} roomId: "{roomId}" {"}"});</p>
                      <p className="text-emerald-400">signaller.on("connection", (peer) =&gt; {"{"}</p>
                      <p className="text-white">&nbsp;&nbsp;console.log("Connected to remote sync node: ", peer.id);</p>
                      <p className="text-white">&nbsp;&nbsp;peer.streamCamera(localVideoBuffer);</p>
                      <p className="text-emerald-400">{"});"}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 text-gray-500 text-[9px]">
                      <span>Line 14, Col 1</span>
                      <span>UTF-8</span>
                    </div>
                  </div>
                </div>

                <div className="z-10 flex items-center justify-between">
                  <span className="text-xs font-mono bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 flex items-center gap-1.5 animate-pulse">
                    <Monitor size={12} />
                    <span>{screenSharer.displayName} is presenting</span>
                  </span>
                </div>

                <div className="z-10 text-xs text-gray-400 font-mono bg-black/40 backdrop-blur-md px-3 py-1.5 border border-white/5 rounded-xl w-fit">
                  Live Terminal Sharing Screen
                </div>
              </div>

              {/* Mini participant row below the screen share */}
              <div className="h-28 flex gap-4 overflow-x-auto shrink-0 pb-1 justify-center">
                {activeParticipants.map((p) => (
                  <div 
                    key={p.uid} 
                    className={`w-36 rounded-xl overflow-hidden shrink-0 border relative flex items-center justify-center glass ${
                      p.isSpeaking ? 'border-blue-500' : 'border-white/5'
                    }`}
                  >
                    {/* Speaker feedback */}
                    {p.isSpeaking && (
                      <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                    )}
                    
                    {/* User Feed inside mini frame */}
                    {p.videoEnabled ? (
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-indigo-900/10 flex items-center justify-center">
                        <img 
                          src={p.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.uid}`} 
                          alt={p.displayName} 
                          className="w-10 h-10 rounded-full border border-white/10"
                        />
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-gray-400 text-xs font-bold uppercase">
                          {p.displayName.charAt(0)}
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[9px] border border-white/5">
                      <span className="truncate max-w-[80px] font-medium">{p.displayName}</span>
                      <span>{p.audioEnabled ? <Mic size={8} className="text-blue-400" /> : <MicOff size={8} className="text-red-400" />}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Standard Grid Layout */
            <div className={`grid gap-4 w-full h-full transition-all duration-300 ${
              activeParticipants.length <= 1 
                ? 'grid-cols-1' 
                : activeParticipants.length <= 2 
                ? 'grid-cols-1 md:grid-cols-2' 
                : 'grid-cols-2 lg:grid-cols-2'
            }`}>
              {activeParticipants.map((p) => {
                const initials = p.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div 
                    key={p.uid} 
                    id={`video-cell-${p.uid}`}
                    className={`rounded-2xl border overflow-hidden relative flex flex-col justify-between p-4 bg-radial from-[#141C27]/90 to-[#0B1017] group transition-all duration-300 ${
                      p.isSpeaking && p.audioEnabled
                        ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[0.99]' 
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Active Speaker Animated Rings */}
                    {p.isSpeaking && p.audioEnabled && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-blue-500/20 voice-indicator pointer-events-none" />
                    )}

                    {/* Background camera feed simulation */}
                    {p.videoEnabled ? (
                      <div className="absolute inset-0 bg-radial from-[#121B2A] to-[#0B1017] overflow-hidden">
                        {/* Beautiful procedural ambient graphic layer */}
                        <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=80')` }}></div>
                        
                        {/* Live mesh gradients moving */}
                        <div className="absolute w-[200px] h-[200px] rounded-full bg-blue-500/5 blur-3xl top-1/4 left-1/3 animate-pulse"></div>
                        <div className="absolute w-[180px] h-[180px] rounded-full bg-indigo-500/5 blur-3xl bottom-1/4 right-1/3 animate-pulse"></div>
                        
                        {/* Display User photo float center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img 
                            src={p.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.uid}`} 
                            alt={p.displayName} 
                            className="w-20 h-20 md:w-24 md:h-24 rounded-3xl border border-white/15 object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Camera Muted placeholder */
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0B1017]">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 text-lg md:text-xl font-display font-bold tracking-tight shadow-xl">
                            {initials}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                            Camera Muted
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Video cell top row tags */}
                    <div className="z-10 flex items-center justify-between">
                      {p.isHost && (
                        <span className="text-[9px] font-mono font-medium px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
                          Host Coordinator
                        </span>
                      )}
                      
                      {p.isSpeaking && p.audioEnabled && (
                        <span className="text-[9px] font-mono font-medium px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                          <span>SPEAKING</span>
                        </span>
                      )}
                    </div>

                    {/* Video cell bottom info drawer bar */}
                    <div className="z-10 flex items-center justify-between bg-[#141C27]/75 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{p.uid === currentUser.uid ? 'You (Coordinator)' : p.displayName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md border ${
                          p.audioEnabled 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {p.audioEnabled ? <Mic size={11} /> : <MicOff size={11} />}
                        </span>
                        
                        <span className={`p-1 rounded-md border ${
                          p.videoEnabled 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {p.videoEnabled ? <VideoIcon size={11} /> : <VideoOff size={11} />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SIDE DRAWER PANELS PANEL (CHANNELS/PARTICIPANTS OR CHAT) */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:flex flex-col bg-[#141C27]/40 border border-white/5 rounded-2xl h-full shrink-0 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#141C27]/25">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-400" />
                  <span className="text-sm font-semibold">Live Chat Feed</span>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Chat log messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="text-center py-2">
                        <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-1 rounded text-gray-400 leading-relaxed max-w-xs inline-block">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isMe = msg.senderId === currentUser.uid;
                  return (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <img 
                          src={msg.senderPhotoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.senderId}`} 
                          alt={msg.senderName} 
                          className="w-7 h-7 rounded-lg border border-white/10"
                        />
                      )}
                      <div className={`max-w-[80%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center gap-1.5 justify-start flex-wrap">
                          <span className="text-[10px] font-bold text-gray-300">{isMe ? 'You' : msg.senderName}</span>
                          <span className="text-[9px] text-gray-500 font-mono mt-0.5">{msg.timestamp}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed inline-block ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input sending panel */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-[#141C27]/30 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Send a secure message..."
                  className="flex-1 px-3 py-2.5 bg-black/40 border border-white/5 hover:border-white/10 focus:border-blue-500/50 outline-none rounded-xl text-xs placeholder:text-gray-600 transition-all"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all shadow shadow-blue-500/20 active:scale-95"
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PARTICIPANTS DRAWER */}
        <AnimatePresence>
          {isParticipantsOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:flex flex-col bg-[#141C27]/40 border border-white/5 rounded-2xl h-full shrink-0 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#141C27]/25">
                <div className="flex items-center gap-2">
                  <UsersIcon size={16} className="text-blue-400" />
                  <span className="text-sm font-semibold">Active Board ({activeParticipants.length})</span>
                </div>
                <button 
                  onClick={() => setIsParticipantsOpen(false)}
                  className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Participants Directory */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {activeParticipants.map((p) => (
                  <div key={p.uid} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl border border-transparent transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={p.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.uid}`} 
                        alt={p.displayName} 
                        className="w-7 h-7 rounded-lg border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">{p.displayName}</p>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">{p.isHost ? 'Coordinator' : 'Participant'}</p>
                      </div>
                    </div>
                    
                    {/* Status signals */}
                    <div className="flex gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.audioEnabled ? 'bg-blue-400' : 'bg-red-400'}`}></span>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.videoEnabled ? 'bg-blue-400' : 'bg-red-400'}`}></span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM COMMAND BAR CONTROL DECK (TOOLBAR) */}
      <div className="h-20 border-t border-white/5 pt-4 flex items-center justify-between shrink-0 z-10">
        
        {/* Left Side indicators */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Feed: HD Video</span>
          <span className="text-gray-600 font-mono">|</span>
          <span className="font-mono">{roomId}</span>
        </div>

        {/* Center Control Deck buttons */}
        <div className="flex items-center gap-3 mx-auto md:mx-0">
          {/* Microphone control toggle */}
          <button
            onClick={toggleMic}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
              isMicOn 
                ? 'bg-[#141C27] hover:bg-[#1C2837] text-white border-white/10' 
                : 'bg-red-500/20 hover:bg-red-500/25 text-red-400 border-red-500/35'
            }`}
            title={isMicOn ? "Mute mic" : "Unmute mic"}
          >
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Camera control toggle */}
          <button
            onClick={toggleCamera}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
              isCameraOn 
                ? 'bg-[#141C27] hover:bg-[#1C2837] text-white border-white/10' 
                : 'bg-red-500/20 hover:bg-red-500/25 text-red-400 border-red-500/35'
            }`}
            title={isCameraOn ? "Stop camera" : "Start camera"}
          >
            {isCameraOn ? <VideoIcon size={18} /> : <VideoOff size={18} />}
          </button>

          {/* Screen share control toggle */}
          <button
            onClick={toggleScreenShare}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
              isSharingScreen 
                ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/40 animate-pulse' 
                : 'bg-[#141C27] hover:bg-[#1C2837] text-white border-white/10'
            }`}
            title={isSharingScreen ? "Stop sharing" : "Share screen"}
          >
            {isSharingScreen ? <MonitorOff size={18} /> : <Monitor size={18} />}
          </button>

          {/* RED DISCONNECT PHONE LEVER */}
          <button
            onClick={handleLeave}
            className="w-14 h-11 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg shadow-red-900/30"
            title="Leave conference"
          >
            <PhoneOff size={20} />
          </button>
        </div>

        {/* Right Side Toggle Panels */}
        <div className="flex items-center gap-2">
          {/* Mobile indicator layout */}
          <button
            onClick={() => {
              setIsParticipantsOpen(!isParticipantsOpen);
              if (isChatOpen) setIsChatOpen(false);
            }}
            className={`p-2.5 rounded-xl border transition-all ${
              isParticipantsOpen 
                ? 'bg-blue-600/15 border-blue-500/30 text-blue-400' 
                : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            title="Participants directory"
          >
            <UsersIcon size={16} />
          </button>

          <button
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (isParticipantsOpen) setIsParticipantsOpen(false);
            }}
            className={`p-2.5 rounded-xl border transition-all ${
              isChatOpen 
                ? 'bg-blue-600/15 border-blue-500/30 text-blue-400' 
                : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            title="Meeting Chat logs"
          >
            <MessageSquare size={16} />
          </button>
        </div>
      </div>

      {/* Toaster Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className="glass px-4 py-3 rounded-xl border-blue-500/30 text-xs font-medium text-white shadow-2xl flex items-center gap-2.5 max-w-sm pointer-events-auto bg-[#141C27]/90 backdrop-blur-xl"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></div>
              <span>{msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

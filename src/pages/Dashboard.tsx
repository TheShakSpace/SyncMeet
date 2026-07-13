import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { 
  Plus, 
  Keyboard, 
  Calendar, 
  Clock, 
  Users, 
  Radio, 
  Video, 
  Copy, 
  Check, 
  ArrowRight, 
  Trash2, 
  User as UserIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { 
    currentUser, 
    meetings, 
    createMeeting, 
    joinMeeting, 
    stats,
    notifications,
    addNotification 
  } = useMeeting();

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [joinCode, setJoinCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  // Redirect if logged out
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addNotification("Meeting title is required!");
      return;
    }
    try {
      const generatedCode = await createMeeting(newTitle, newDesc, newDuration);
      setNewTitle('');
      setNewDesc('');
      setIsCreating(false);
      // Auto redirect to the new room!
      await joinMeeting(generatedCode);
      navigate(`/meeting/${generatedCode}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      addNotification("Please enter a meeting code!");
      return;
    }
    // Clean code: format is letters and hyphens
    const cleanedCode = joinCode.replace(/\s+/g, '').toLowerCase();
    try {
      await joinMeeting(cleanedCode);
      navigate(`/meeting/${cleanedCode}`);
    } catch (err) {
      console.error(err);
      addNotification("Failed to join meeting room.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    addNotification("Room code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Split past and upcoming meetings
  const recentMeetings = meetings.filter(m => m.status === 'ended' || m.status === 'active');
  const upcomingMeetings = meetings.filter(m => m.status === 'upcoming');

  const kpiData = [
    { name: 'Total Meetings', value: stats.totalMeetings, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Total Minutes', value: `${stats.totalMinutes}m`, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Participants Met', value: stats.participantsMet, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { name: 'Active Rooms', value: stats.activeRooms, icon: Radio, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  return (
    <div id="dashboard-container" className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
            Welcome back, {currentUser?.displayName || 'SyncMeeter'}!
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Create an instant workspace sync or enter a custom conference room code.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all self-start"
        >
          <Plus size={16} />
          <span>New Meeting</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="glass p-5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-medium block">{stat.name}</span>
                <span className="text-xl md:text-2xl font-display font-bold">{stat.value}</span>
              </div>
              <div className={`w-11 h-11 rounded-xl ${stat.bg} border border-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Block Panel (Create vs Join Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Create/Join form widgets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-display font-semibold border-b border-white/5 pb-3">
              Meeting Controls
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Create Widget */}
              <div className="space-y-4">
                <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl w-fit text-blue-400">
                  <Video size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Instant Call</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Instantly create a secure SyncMeet URL and join immediately.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Configure & Launch</span>
                </button>
              </div>

              {/* Quick Join Widget */}
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl w-fit text-purple-400">
                  <Keyboard size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Join via Code</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Enter the standard `abc-defg-hij` room identifier to join.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. xyz-fkgj-sfg"
                    className="flex-1 px-3 py-2 bg-black/35 border border-white/5 hover:border-white/10 rounded-xl text-xs outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <span>Join</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Past/Recent Meetings Table */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-display font-semibold border-b border-white/5 pb-3">
              Past Sync Rooms
            </h3>
            {recentMeetings.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No recent meeting logs on record.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recentMeetings.map((meet) => (
                  <div key={meet.id} className="py-3 flex items-center justify-between gap-4 group">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
                        {meet.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-mono">{meet.id}</span>
                        <span>•</span>
                        <span>{new Date(meet.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(meet.id)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-colors"
                        title="Copy meeting code"
                      >
                        {copiedId === meet.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={async () => {
                          await joinMeeting(meet.id);
                          navigate(`/meeting/${meet.id}`);
                        }}
                        className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/25 rounded-xl text-xs font-semibold text-blue-400 hover:text-white transition-all flex items-center gap-1"
                      >
                        <span>Rejoin</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Upcoming schedule / creation modal preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Meetings Panel */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-display font-semibold border-b border-white/5 pb-3 flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" />
              <span>Scheduled Calls</span>
            </h3>
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-gray-500">No scheduled upcoming sessions.</p>
                <p className="text-[10px] text-gray-600 leading-relaxed max-w-[200px] mx-auto">
                  Use the meeting builder to schedule custom team coordinates.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meet) => (
                  <div key={meet.id} className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold">{meet.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{meet.description}</p>
                      </div>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/25 rounded-full text-indigo-400 shrink-0">
                        {meet.durationMinutes}m
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{new Date(meet.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button
                        onClick={async () => {
                          await joinMeeting(meet.id);
                          navigate(`/meeting/${meet.id}`);
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-blue-600 border border-white/5 hover:border-blue-500 text-[11px] font-semibold rounded-lg transition-all"
                      >
                        Start Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info Box: WebRTC/PeerJS details */}
          <div className="glass p-6 rounded-2xl space-y-3 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/10">
            <h4 className="text-sm font-semibold flex items-center gap-1.5 text-blue-400">
              <Plus size={16} />
              <span>Next Integration Sprint</span>
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              SyncMeet contains pre-wired architectural services for **WebRTC**, **PeerJS**, and **Socket.io** multi-party audio/video signaling.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">Peer-to-Peer</span>
              <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">Mesh Node</span>
              <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">SFU Signaling</span>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MEETING SLIDE-OVER / MODAL CONTAINER */}
      <AnimatePresence>
        {isCreating && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="fixed inset-0 bg-black z-50"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="fixed inset-0 m-auto max-w-lg h-fit z-50 p-6 glass-premium rounded-3xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-xl font-display font-bold">New Meeting Session</h3>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 text-xs font-mono"
                >
                  ESC
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Daily Standup & Handoff"
                    className="w-full px-4 py-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Description (Optional)</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Review core achievements, milestones, and blockers..."
                    className="w-full px-4 py-3 h-24 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Duration</label>
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-sm focus:border-blue-500/50 outline-none transition-all text-gray-300"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Security</label>
                    <div className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-sm text-gray-400 font-mono select-none flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>TLS Secure</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-900/15"
                  >
                    Create & Join Room
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ephemeral Notification Toaster */}
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

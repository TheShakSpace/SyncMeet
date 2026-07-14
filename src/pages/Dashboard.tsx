import React, { useState, useEffect } from 'react';
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
  FileText, 
  Pin, 
  User, 
  PlusCircle,
  TrendingUp,
  Sliders,
  Send,
  Download,
  MoreVertical,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Cell
} from 'recharts';

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
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  // Redirect if logged out
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Hook into the AppLayout topbar search event
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSearchQuery(customEvent.detail || '');
    };
    window.addEventListener('meetingSearch', handleSearch);
    return () => window.removeEventListener('meetingSearch', handleSearch);
  }, []);

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
      
      // Auto join and redirect to the new room
      await joinMeeting(generatedCode);
      navigate(`/meeting/${generatedCode}`);
    } catch (err) {
      console.error(err);
      addNotification("Failed to create the meeting room.");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      addNotification("Please enter a meeting code!");
      return;
    }
    const cleanedCode = joinCode.replace(/\s+/g, '').toLowerCase();
    try {
      await joinMeeting(cleanedCode);
      navigate(`/meeting/${cleanedCode}`);
    } catch (err) {
      console.error(err);
      addNotification("Failed to join meeting room. Verify the code exists.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    addNotification("Room code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter meetings based on Search Query
  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recentMeetings = filteredMeetings.filter(m => m.status === 'ended' || m.status === 'active');
  const upcomingMeetings = filteredMeetings.filter(m => m.status === 'upcoming');

  // Custom data structure for charts
  const chartData = [
    { day: 'Mon', sessions: 2, minutes: 45 },
    { day: 'Tue', sessions: 4, minutes: 120 },
    { day: 'Wed', sessions: 3, minutes: 90 },
    { day: 'Thu', sessions: 5, minutes: 180 },
    { day: 'Fri', sessions: stats.totalMeetings || 4, minutes: stats.totalMinutes || 150 },
    { day: 'Sat', sessions: 1, minutes: 30 },
    { day: 'Sun', sessions: 0, minutes: 0 },
  ];

  // Team members list
  const teamMembers = [
    { id: '1', name: 'Aria Rose', role: 'Lead Product Designer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', status: 'online' },
    { id: '2', name: 'Marcus Vance', role: 'Staff Systems Architect', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', status: 'online' },
    { id: '3', name: 'Liam Sterling', role: 'Frontend Engineer', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Liam', status: 'away' },
    { id: '4', name: 'Sarah Jenkins', role: 'Security Compliance', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', status: 'offline' },
  ];

  // Pinned conversations
  const pinnedConversations = [
    { id: 'general', name: '⚡ Design Sync Sprint 2', lastMsg: 'Aria uploaded 3 wireframe files', time: '10:14 AM' },
    { id: 'tech', name: '⚙️ Core Infrastructure Huddle', lastMsg: 'PeerJS signaling is fully certified', time: 'Yesterday' },
  ];

  // Recent shared files
  const sharedFiles = [
    { name: 'SyncMeet_ProductSpecs.pdf', size: '4.2 MB', uploader: 'Aria Rose', date: 'Jul 12' },
    { name: 'Figma_ArcStyleRail_v3.png', size: '12.8 MB', uploader: 'Marcus Vance', date: 'Jul 11' },
    { name: 'firestore_security_rules.spec', size: '48 KB', uploader: 'System Security', date: 'Jul 10' },
  ];

  return (
    <div id="dashboard-container" className="space-y-10 max-w-7xl mx-auto pb-12">
      
      {/* 1. TOP GREETING & METRIC HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-[#111827]">
            Welcome, {currentUser?.displayName || 'Product Partner'}
          </h2>
          <p className="text-[#6B7280] text-xs font-semibold mt-1">
            Enterprise collaboration hub. Schedule calls, manage artifacts, and sync instantly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 1 }}
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Session</span>
          </motion.button>
        </div>
      </div>

      {/* 2. MEETING STATISTICS GRAPH (Beautiful charts instead of cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Statistics Chart Panel */}
        <div className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity size={16} className="text-[#2563EB]" />
                <span>Workspace Performance Report</span>
              </h3>
              <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">Real-time telemetry and minutes logged in collaborative sprints.</p>
            </div>
            
            <div className="flex items-center gap-6 font-mono text-[10px] text-gray-600 font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]/25 border border-[#2563EB]" />
                <span>{stats.totalMeetings} total meetings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/25 border border-[#10B981]" />
                <span>{stats.totalMinutes} total minutes</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  stroke="#9CA3AF" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '16px',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSessions)" 
                  name="Sessions Started"
                />
                <Area 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorMinutes)" 
                  name="Minutes Spent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick controls panel (Create Meeting & Quick Join) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Create Meeting Quick Widget */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                <Video size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Create New Room</h4>
                <p className="text-[11px] text-[#6B7280] font-medium leading-relaxed mt-1">
                  Instantly spawn an encrypted room, configure permissions, and synchronize team members.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-5 w-full py-2.5 bg-blue-50 border border-blue-100 text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Configure & Launch Session</span>
            </button>
          </div>

          {/* Quick Join form Widget */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm flex-1 flex flex-col justify-between">
            <form onSubmit={handleJoin} className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                  <Keyboard size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Quick Join via Code</h4>
                  <p className="text-[11px] text-[#6B7280] font-medium leading-relaxed mt-1">
                    Enter the room identifier to securely dock your signal in the live call.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 mt-4">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. xyz-fkgj-sfg"
                  className="flex-1 px-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs outline-none focus:border-[#2563EB] focus:bg-white transition-all font-mono placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Join</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* 3. DETAILED COLLECTIONS: Meetings & Workspace Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Meetings Tables (Upcoming and Recent) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Upcoming Meetings List */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#2563EB]" />
              <span>Upcoming Scheduled Meetings</span>
            </h3>

            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-xs text-gray-400 font-medium">No upcoming sessions scheduled.</p>
                <p className="text-[10px] text-[#6B7280] max-w-sm mx-auto">
                  Click "Create Session" to configure dates, invitees, and calendar sync parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.map((meet) => (
                  <div key={meet.id} className="p-4 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 transition-all">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900">{meet.title}</h4>
                      {meet.description && (
                        <p className="text-[11px] text-[#6B7280] line-clamp-1 leading-relaxed">{meet.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium mt-1">
                        <span className="font-mono text-gray-900 bg-gray-200/50 px-2 py-0.5 rounded-md">{meet.id}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {meet.durationMinutes} minutes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => copyToClipboard(meet.id)}
                        className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600 transition-colors cursor-pointer"
                        title="Copy meeting code"
                      >
                        {copiedId === meet.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                      <button
                        onClick={async () => {
                          await joinMeeting(meet.id);
                          navigate(`/meeting/${meet.id}`);
                        }}
                        className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Launch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Meetings History List */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#6B7280]" />
              <span>Recent Meeting Activities</span>
            </h3>

            {recentMeetings.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium py-8 text-center">No past conference history.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentMeetings.map((meet) => (
                  <div key={meet.id} className="py-3.5 flex items-center justify-between gap-4 group">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-[#2563EB] transition-colors">
                        {meet.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium mt-1">
                        <span className="font-mono text-gray-700">{meet.id}</span>
                        <span>•</span>
                        <span>{new Date(meet.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(meet.id)}
                        className="p-2 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-gray-500 transition-colors cursor-pointer"
                        title="Copy meeting code"
                      >
                        {copiedId === meet.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                      <button
                        onClick={async () => {
                          await joinMeeting(meet.id);
                          navigate(`/meeting/${meet.id}`);
                        }}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[11px] font-bold text-gray-800 transition-all cursor-pointer"
                      >
                        Rejoin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Section: Workspace Details (Pinned chats, Shared Files, Team members) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Team Members Panel */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-[#2563EB]" />
                <span>Workspace Partners</span>
              </h3>
              <span className="text-[10px] text-gray-500 font-mono font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                4 listed
              </span>
            </div>

            <div className="space-y-3.5">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 p-1.5 hover:bg-[#F7F8FA] rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-9 h-9 rounded-xl border border-gray-100 object-cover bg-gray-50"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        member.status === 'online' ? 'bg-[#10B981]' : member.status === 'away' ? 'bg-amber-400' : 'bg-gray-300'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-900">{member.name}</h4>
                      <p className="text-[10px] text-[#6B7280] font-medium leading-none mt-0.5">{member.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addNotification(`Call invitation issued to ${member.name}`)}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 text-gray-600 rounded-xl transition-all cursor-pointer"
                    title="Invite to immediate workspace"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pinned Conversations Panel */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4 flex items-center gap-2">
              <Pin size={15} className="text-[#2563EB] rotate-45" />
              <span>Pinned Huddles</span>
            </h3>

            <div className="space-y-3">
              {pinnedConversations.map((chat) => (
                <div key={chat.id} className="p-3.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl hover:border-gray-300 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-gray-900">{chat.name}</h4>
                    <span className="text-[9px] text-[#6B7280] font-bold font-mono">{chat.time}</span>
                  </div>
                  <p className="text-[10px] text-[#6B7280] font-semibold mt-1 leading-relaxed truncate">{chat.lastMsg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Shared Files Panel */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#2563EB]" />
              <span>Recent Artifacts & Files</span>
            </h3>

            <div className="space-y-3">
              {sharedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2 hover:bg-[#F7F8FA] rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-gray-900 truncate">{file.name}</h4>
                      <p className="text-[9px] text-[#6B7280] font-medium mt-0.5">{file.size} • by {file.uploader}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addNotification(`Simulating file download of: ${file.name}`)}
                    className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* CREATE MEETING FULLSCREEN / MODAL POPUP */}
      <AnimatePresence>
        {isCreating && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-0 m-auto max-w-lg h-fit z-50 p-6 bg-white border border-[#E5E7EB] rounded-[24px] shadow-xl premium-shadow-lg space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-display font-extrabold text-gray-900">New Conference Room</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold mt-0.5">Define room properties, bandwidth configuration, and initial security parameters.</p>
                </div>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-1.5 text-[#6B7280] hover:text-gray-900 hover:bg-gray-100 rounded-xl text-xs font-semibold font-mono cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Session Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Design Sprint & Sync Meeting"
                    className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Topic Description (Optional)</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief agenda details, wireframe links, or huddle targets..."
                    className="w-full px-4 py-3 h-24 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Time Duration</label>
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:bg-white outline-none transition-all text-gray-800 font-semibold"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Signal Type</label>
                    <div className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs text-gray-600 font-semibold select-none flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                      <span>Secure WebRTC Peer</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-5 border-t border-gray-100 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    Spawn & Open Room
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

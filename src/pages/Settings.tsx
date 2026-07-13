import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { 
  User, 
  Video, 
  Volume2, 
  Palette, 
  Check, 
  ShieldAlert, 
  HelpCircle,
  Save,
  Moon,
  VolumeX,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    preferences, 
    updateProfile, 
    updatePreferences,
    notifications,
    addNotification 
  } = useMeeting();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  
  // Meeting states
  const [micOnDefault, setMicOnDefault] = useState(preferences.micOnDefault);
  const [cameraOnDefault, setCameraOnDefault] = useState(preferences.cameraOnDefault);
  const [hdVideo, setHdVideo] = useState(preferences.hdVideo);
  const [noiseCancellation, setNoiseCancellation] = useState(preferences.noiseCancellation);
  const [meetingLayout, setMeetingLayout] = useState(preferences.meetingLayout);

  // Notification states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [joinAlerts, setJoinAlerts] = useState(true);
  const [browserBanner, setBrowserBanner] = useState(true);

  // Themes state (visual only)
  const [selectedTheme, setSelectedTheme] = useState('dark-modern');

  // Redirect if logged out
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(displayName, bio);
  };

  const handleSavePreferences = () => {
    updatePreferences({
      micOnDefault,
      cameraOnDefault,
      hdVideo,
      noiseCancellation,
      meetingLayout
    });
  };

  const themes = [
    { id: 'dark-modern', name: 'Dark Modern (Linear)', primary: 'bg-[#0B1017]', border: 'border-blue-500/50', active: true },
    { id: 'cosmic', name: 'Cosmic Slate', primary: 'bg-[#090D16]', border: 'border-indigo-500/20', active: false },
    { id: 'notion', name: 'Notion Charcoal', primary: 'bg-[#191919]', border: 'border-white/10', active: false },
    { id: 'mono', name: 'SaaS Cyberpunk', primary: 'bg-black', border: 'border-yellow-500/20', active: false },
  ];

  return (
    <div id="settings-container" className="space-y-8 max-w-4xl mx-auto pb-12">
      
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">System Configuration</h2>
        <p className="text-gray-400 text-sm mt-1">
          Manage your SyncMeet developer profile, devices, alerts, and conference default states.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column Settings Navigation shortcuts */}
        <div className="md:col-span-4 space-y-2">
          <div className="glass p-4 rounded-2xl space-y-1">
            <button className="w-full text-left px-3 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <User size={14} />
              <span>Identity Profile</span>
            </button>
            <button className="w-full text-left px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors">
              <Video size={14} />
              <span>Audio & Video</span>
            </button>
            <button className="w-full text-left px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors">
              <Volume2 size={14} />
              <span>Alert Notifications</span>
            </button>
            <button className="w-full text-left px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors">
              <Palette size={14} />
              <span>Theme Layout</span>
            </button>
          </div>

          <div className="glass p-4 rounded-2xl space-y-2 text-xs text-gray-400 leading-relaxed">
            <h4 className="font-semibold text-gray-300 flex items-center gap-1">
              <ShieldAlert size={12} className="text-blue-400" />
              <span>TLS Security Active</span>
            </h4>
            <p className="text-[11px] text-gray-500">
              All profile payloads and meeting preferences are securely persist-validated via the master database.
            </p>
          </div>
        </div>

        {/* Right Column Settings forms panels */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Section 1: User Profile Customizer */}
          <div className="glass p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-display font-semibold border-b border-white/5 pb-3">
              Identity Profile
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-white/5 pb-4">
                <img 
                  src={currentUser?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.uid}`} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-2xl border border-white/10 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-semibold">User Avatar Preview</h4>
                  <p className="text-[11px] text-gray-500 font-mono">Synced with secure third-party provider accounts.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-black/35 border border-white/5 hover:border-white/10 rounded-xl text-xs focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Email Coordinates</label>
                  <div className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-500 font-mono select-none">
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Short Biography</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I am a SaaS designer exploring premium video rooms..."
                  className="w-full px-4 py-3 h-20 bg-black/35 border border-white/5 hover:border-white/10 rounded-xl text-xs focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600 resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/10 active:scale-95 ml-auto"
              >
                <Save size={13} />
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>

          {/* Section 2: Meeting Preferences Devices */}
          <div className="glass p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-display font-semibold">
                Meeting Preferences
              </h3>
              <button
                onClick={handleSavePreferences}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all"
              >
                Sync Defaults
              </button>
            </div>

            <div className="space-y-4">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-xs font-semibold">Join with Mic Enabled</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Always activate microphone instantly when entering a room.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMicOnDefault(!micOnDefault)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                    micOnDefault ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                    micOnDefault ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-xs font-semibold">Join with Camera Enabled</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Always stream webcam instantly when entering a room.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCameraOnDefault(!cameraOnDefault)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                    cameraOnDefault ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                    cameraOnDefault ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-xs font-semibold">High-Definition Feed (HD)</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Optimize bandwidth coordinates for crystal clear 1080p resolution.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHdVideo(!hdVideo)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                    hdVideo ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                    hdVideo ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 4 */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-xs font-semibold">Smart Noise Cancellation</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Isolate background vocal disturbances dynamically.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoiseCancellation(!noiseCancellation)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                    noiseCancellation ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                    noiseCancellation ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Default Grid Layout select */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-xs font-semibold">Standard Conference Layout</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Control focus layouts for active meetings.</p>
                </div>
                <select
                  value={meetingLayout}
                  onChange={(e) => setMeetingLayout(e.target.value as 'grid' | 'sidebar' | 'spotlight')}
                  className="px-3 py-1.5 bg-[#0B1017] border border-white/5 hover:border-white/10 rounded-lg text-[11px] font-semibold text-gray-300 focus:outline-none"
                >
                  <option value="grid">CSS Grid View</option>
                  <option value="spotlight">Spotlight Speaker</option>
                  <option value="sidebar">Sidebar Directory</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Themes layout select */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-display font-semibold border-b border-white/5 pb-3">
              Theme Selector
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    addNotification(`Theme switched to ${theme.name}`);
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between group transition-all cursor-pointer ${
                    selectedTheme === theme.id 
                      ? 'bg-blue-600/10 border-blue-500 text-white' 
                      : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-400'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold group-hover:text-white transition-colors">{theme.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">Ready for deploy</p>
                  </div>
                  <div className={`w-6 h-6 rounded-lg ${theme.primary} border flex items-center justify-center text-[10px] ${
                    selectedTheme === theme.id ? 'border-blue-500' : 'border-white/5'
                  }`}>
                    {selectedTheme === theme.id ? <Check size={11} className="text-blue-400" /> : <Moon size={11} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Alerts Notifications */}
          <div className="glass p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-display font-semibold border-b border-white/5 pb-3">
              Alert Notifications
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold">Tones & Sound Alerts</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Enable acoustic feedback for incoming team coordinate alerts.</p>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl border transition-all ${
                    soundEnabled 
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                      : 'bg-white/5 border-transparent text-gray-500'
                  }`}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold">Participant Entry Indicators</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Toggle system signals whenever someone enters active rooms.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setJoinAlerts(!joinAlerts)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                    joinAlerts ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                    joinAlerts ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toaster notifications */}
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

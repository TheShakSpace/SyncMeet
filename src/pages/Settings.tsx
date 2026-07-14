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
  Laptop,
  Bell,
  Cpu,
  Tv,
  CheckCircle,
  AlertCircle,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SettingsTab = 'profile' | 'audio-video' | 'devices' | 'notifications' | 'appearance';

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

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form states
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  
  // Audio/Video preference states
  const [micOnDefault, setMicOnDefault] = useState(preferences.micOnDefault);
  const [cameraOnDefault, setCameraOnDefault] = useState(preferences.cameraOnDefault);
  const [hdVideo, setHdVideo] = useState(preferences.hdVideo);
  const [noiseCancellation, setNoiseCancellation] = useState(preferences.noiseCancellation);
  const [meetingLayout, setMeetingLayout] = useState(preferences.meetingLayout);

  // Device selection states (Mock)
  const [micDevice, setMicDevice] = useState('system-default');
  const [cameraDevice, setCameraDevice] = useState('facetime-hd');
  const [speakerDevice, setSpeakerDevice] = useState('system-output');

  // Notification states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [joinAlerts, setJoinAlerts] = useState(true);
  const [browserBanner, setBrowserBanner] = useState(true);

  // Appearance themes
  const [selectedTheme, setSelectedTheme] = useState('light-modern');

  // Redirect if logged out
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(displayName, bio);
    addNotification("Profile identity updated successfully!");
  };

  const handleSavePreferences = () => {
    updatePreferences({
      micOnDefault,
      cameraOnDefault,
      hdVideo,
      noiseCancellation,
      meetingLayout
    });
    addNotification("Preferences synchronized to the cloud!");
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile Identity', icon: User, color: 'bg-blue-500 text-white' },
    { id: 'audio-video' as SettingsTab, label: 'Audio & Video', icon: Video, color: 'bg-emerald-500 text-white' },
    { id: 'devices' as SettingsTab, label: 'Connected Devices', icon: Cpu, color: 'bg-indigo-500 text-white' },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell, color: 'bg-rose-500 text-white' },
    { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Palette, color: 'bg-amber-500 text-white' },
  ];

  return (
    <div id="settings-container" className="space-y-10 max-w-5xl mx-auto pb-12 font-sans">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-gray-900">
          System Preferences
        </h2>
        <p className="text-[#6B7280] text-xs font-semibold mt-1">
          Configure devices, customize profile details, and establish conference default coordinates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: APPLE SETTINGS SIDEBAR */}
        <div className="md:col-span-4 bg-white border border-[#E5E7EB] rounded-[24px] p-4 shadow-sm space-y-4">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gray-50 text-gray-900 border-l-4 border-l-[#2563EB]' 
                      : 'text-[#6B7280] hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg ${tab.color} flex items-center justify-center shrink-0`}>
                      <Icon size={13} />
                    </div>
                    <span>{tab.label}</span>
                  </div>
                  <ChevronRight size={13} className={`text-gray-400 transition-transform ${isActive ? 'translate-x-0.5 text-[#2563EB]' : ''}`} />
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 px-2.5">
            <div className="flex items-start gap-2.5 text-[10px] text-gray-500 leading-relaxed font-semibold">
              <ShieldAlert size={14} className="text-[#2563EB] shrink-0" />
              <span>TLS connection is active. All system payload configurations are verified and encrypted.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CORRESPONDING TAB FORMS WITH ANIMATIONS */}
        <div className="md:col-span-8 bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm min-h-[480px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              {/* TAB 1: PROFILE IDENTITY */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                      Profile Identity
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-semibold mt-1">Manage public identifiers and credentials across SyncMeet rooms.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="flex items-center gap-5 bg-[#F7F8FA] p-4 rounded-2xl border border-[#E5E7EB]">
                      <img 
                        src={currentUser?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.uid}`} 
                        alt="Avatar preview" 
                        className="w-14 h-14 rounded-xl border border-gray-100 shadow-sm object-cover bg-gray-50"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-900">User Avatar Profile</h4>
                        <p className="text-[10px] text-[#6B7280] font-medium">Automatic system generation based on OAuth login credential tokens.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Display Name"
                          className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:bg-white outline-none transition-all placeholder:text-gray-400 font-semibold"
                          required
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Account Email</label>
                        <div className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs text-gray-400 font-mono select-none font-semibold">
                          {currentUser?.email}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Short Biography</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="e.g. Lead Designer coordinating core team sprints..."
                        className="w-full px-4 py-3 h-24 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:bg-white outline-none transition-all placeholder:text-gray-400 font-semibold resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                      >
                        <Save size={13} />
                        <span>Save Profile Identity</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: AUDIO & VIDEO DEFAULT SETTINGS */}
              {activeTab === 'audio-video' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Audio & Video Tunnels
                      </h3>
                      <p className="text-[11px] text-[#6B7280] font-semibold mt-1">Configure automated signals and camera definitions.</p>
                    </div>
                    <button
                      onClick={handleSavePreferences}
                      className="px-3.5 py-1.5 bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                    >
                      Save Defaults
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {/* Toggle: micOnDefault */}
                    <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Automated Microphone Capture</h4>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">Enables voice transmission immediately upon entering any live room.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMicOnDefault(!micOnDefault)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer ${
                          micOnDefault ? 'bg-[#2563EB]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          micOnDefault ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Toggle: cameraOnDefault */}
                    <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Automated Camera Stream</h4>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">Launches primary visual stream immediately when joining a conference.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCameraOnDefault(!cameraOnDefault)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer ${
                          cameraOnDefault ? 'bg-[#2563EB]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          cameraOnDefault ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Toggle: hdVideo */}
                    <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Ultra-HD Resolution Format (1080p)</h4>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">Streams higher rendering formats (requires 5MB/s symmetric bandwidth).</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHdVideo(!hdVideo)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer ${
                          hdVideo ? 'bg-[#2563EB]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          hdVideo ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Toggle: noiseCancellation */}
                    <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Intelligent Vocals Isolation</h4>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">Utilizes client-side audio node decibel cancellation to remove desk background noise.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNoiseCancellation(!noiseCancellation)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer ${
                          noiseCancellation ? 'bg-[#2563EB]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          noiseCancellation ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONNECTED HARDWARE DEVICES */}
              {activeTab === 'devices' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                      Connected Audio & Video Hardware
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-semibold mt-1">Select physical hardware sources linked to client audio/video context.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Device A: Camera Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Video Camera Source</label>
                      <select
                        value={cameraDevice}
                        onChange={(e) => {
                          setCameraDevice(e.target.value);
                          addNotification(`Camera set to: ${e.target.selectedOptions[0].text}`);
                        }}
                        className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:bg-white outline-none font-bold text-gray-800"
                      >
                        <option value="facetime-hd">FaceTime HD Built-in Camera (Internal)</option>
                        <option value="logitech-streamcam">Logitech StreamCam 4K (External USB-C)</option>
                        <option value="virtual-cam">OBS Virtual Video Frame Source (Software)</option>
                      </select>
                    </div>

                    {/* Device B: Microphone Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Audio Microphone Input</label>
                      <select
                        value={micDevice}
                        onChange={(e) => {
                          setMicDevice(e.target.value);
                          addNotification(`Microphone set to: ${e.target.selectedOptions[0].text}`);
                        }}
                        className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:bg-white outline-none font-bold text-gray-800"
                      >
                        <option value="system-default">Macbook Pro Array Microphone (System Default)</option>
                        <option value="yeti-usb">Blue Yeti Professional Condenser Mic (USB Source)</option>
                        <option value="airpods-mic">AirPods Bluetooth Audio Input (Wireless Headset)</option>
                      </select>
                    </div>

                    {/* Device C: Speaker Output */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Audio Output Speakers</label>
                      <select
                        value={speakerDevice}
                        onChange={(e) => {
                          setSpeakerDevice(e.target.value);
                          addNotification(`Speaker set to: ${e.target.selectedOptions[0].text}`);
                        }}
                        className="w-full px-4 py-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:bg-white outline-none font-bold text-gray-800"
                      >
                        <option value="system-output">Macbook Pro Built-in Speakers (System Output)</option>
                        <option value="headphones">External Jack Headphones (Wired Port Output)</option>
                        <option value="airpods-stereo">AirPods Stereo Output Nodes (Wireless High-Fidelity)</option>
                      </select>
                    </div>

                    {/* Live signal indicator graphics */}
                    <div className="bg-[#F7F8FA] border border-[#E5E7EB] p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-800">
                        <span>AUDIO MIC LEVEL FEEDBACK</span>
                        <span className="text-[#10B981] animate-pulse">LIVE SIGNAL ONLINE</span>
                      </div>
                      <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                        <div className="h-full bg-[#10B981] w-[15%]" />
                        <div className="h-full bg-[#10B981] w-[20%]" />
                        <div className="h-full bg-[#10B981] w-[10%]" />
                        <div className="h-full bg-gray-200 w-[55%]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ALERTS AND NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                      Alert Notifications
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-semibold mt-1">Configure acoustic and modal system coordinates inside collaborative workspaces.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Switch: Sound alert */}
                    <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Tones & Sound Indicators</h4>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">Acoustic chimes for new incoming files or private messages.</p>
                      </div>
                      <button
                        onClick={() => {
                          setSoundEnabled(!soundEnabled);
                          addNotification(`Sound Alerts: ${!soundEnabled ? 'Enabled' : 'Muted'}`);
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          soundEnabled 
                            ? 'bg-blue-50 border-[#E5E7EB] text-[#2563EB]' 
                            : 'bg-gray-100 border-transparent text-gray-400'
                        }`}
                      >
                        {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                      </button>
                    </div>

                    {/* Switch: Participant alert */}
                    <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Participant Gatekeeper Entry Tones</h4>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">Emits a soft alert whenever team members join or exit rooms.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setJoinAlerts(!joinAlerts);
                          addNotification(`Gatekeeper Tones: ${!joinAlerts ? 'Enabled' : 'Muted'}`);
                        }}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer ${
                          joinAlerts ? 'bg-[#2563EB]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          joinAlerts ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Switch: browser banner */}
                    <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">System Banner Messages</h4>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">Enables slide-over popup prompts for files shared outside the foreground window.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBrowserBanner(!browserBanner);
                          addNotification(`System Banners: ${!browserBanner ? 'Active' : 'Muted'}`);
                        }}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer ${
                          browserBanner ? 'bg-[#2563EB]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          browserBanner ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: APPEARANCE VISUAL STYLING */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                      Theme & Layout Appearance
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-semibold mt-1">Manage standard focus styling layouts inside active conference hubs.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Layout option select */}
                    <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Standard Room Layout</h4>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-0.5">Rearrange rendering configurations of remote video cells.</p>
                      </div>
                      <select
                        value={meetingLayout}
                        onChange={(e) => {
                          setMeetingLayout(e.target.value as 'grid' | 'sidebar' | 'spotlight');
                          addNotification(`Default layout altered to: ${e.target.value}`);
                        }}
                        className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#2563EB]"
                      >
                        <option value="grid">Balanced Video Grid</option>
                        <option value="spotlight">Spotlight (Active Speaker)</option>
                        <option value="sidebar">Sidebar (Coordinators Row)</option>
                      </select>
                    </div>

                    {/* Pre-designed card presets */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Workspace Theme Accent</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'light-modern', name: 'Modern Light (SaaS Slate)', colors: 'bg-[#F7F8FA] border-[#2563EB]' },
                          { id: 'dark-classic', name: 'Dark Slate (Google Meet Style)', colors: 'bg-gray-900 border-transparent text-white' },
                        ].map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => {
                              setSelectedTheme(theme.id);
                              addNotification(`System theme preset: ${theme.name}`);
                            }}
                            className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                              selectedTheme === theme.id 
                                ? 'bg-[#2563EB]/5 border-[#2563EB] text-gray-900' 
                                : 'bg-[#F7F8FA] border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'
                            }`}
                          >
                            <div>
                              <h5 className="text-[11px] font-bold">{theme.name}</h5>
                              <p className="text-[9px] text-gray-400 font-semibold mt-1">Ready for Deploy</p>
                            </div>
                            <div className={`w-6 h-6 rounded-lg ${theme.colors} border flex items-center justify-center`}>
                              {selectedTheme === theme.id && <Check size={11} className="text-[#2563EB]" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Sync status bottom banner inside right column */}
          <div className="border-t border-gray-100 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-semibold text-[#6B7280]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Status: Fully Synced with Firestore Blueprints</span>
            </div>
            {activeTab !== 'profile' && (
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Sync Configuration Changes
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Embedded Toaster feedback */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className="px-4 py-3 bg-gray-900 border border-white/10 text-xs font-medium text-white rounded-xl shadow-2xl flex items-center gap-2.5 max-w-sm pointer-events-auto bg-[#141C27]/95 backdrop-blur-xl"
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

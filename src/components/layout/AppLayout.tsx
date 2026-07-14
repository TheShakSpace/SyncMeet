import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useMeeting } from '../../context/MeetingContext';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search, 
  Video, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, logout, notifications, clearNotifications } = useMeeting();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Workspace', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div id="app-shell" className="min-h-screen bg-[#F7F8FA] text-[#111827] font-sans flex flex-col selection:bg-blue-500/15 selection:text-blue-600">
      
      {/* 1. TOP BAR NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/85 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between px-6 z-40">
        
        {/* Left: Logo & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)} 
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            id="mobile-menu-btn"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Video size={18} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-display font-bold tracking-tight text-gray-900 leading-none">SyncMeet</h1>
              <span className="text-[10px] text-[#6B7280] font-medium tracking-wide">Enterprise Sync</span>
            </div>
          </div>
        </div>

        {/* Center: Search meetings input */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search rooms, files, or team workspace..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Dispatch a custom event to communicate with the Dashboard component
                window.dispatchEvent(new CustomEvent('meetingSearch', { detail: e.target.value }));
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] focus:border-[#2563EB] focus:bg-white text-xs text-gray-900 rounded-2xl outline-none transition-all placeholder:text-gray-400 font-medium"
            />
          </div>
        </div>

        {/* Right: Notifications & Profile Avatar */}
        <div className="flex items-center gap-4">
          {/* Notifications Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all relative"
              id="notifications-bell-btn"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotificationsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-[#E5E7EB] rounded-3xl shadow-xl premium-shadow-lg p-5 z-50 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                    <span className="font-semibold text-gray-900">Activity & Alerts</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] text-[#2563EB] hover:underline font-semibold"
                      >
                        Dismiss All
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-[#6B7280]">
                        <Sparkles className="mx-auto text-gray-300 mb-2" size={24} />
                        <p className="font-medium">All caught up!</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">No pending workspace notifications.</p>
                      </div>
                    ) : (
                      notifications.map((msg, index) => (
                        <div key={index} className="flex gap-2.5 items-start p-2 hover:bg-gray-50 rounded-xl transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                          <p className="text-[#111827] leading-relaxed font-medium">{msg}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Avatar */}
          {currentUser && (
            <div 
              className="flex items-center gap-3 pl-3 border-l border-[#E5E7EB] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate('/settings')}
            >
              <img 
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`} 
                alt={currentUser.displayName} 
                className="w-9 h-9 rounded-2xl border border-[#E5E7EB] object-cover bg-gray-100"
                referrerPolicy="no-referrer"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-none">{currentUser.displayName}</p>
                <p className="text-[10px] text-[#6B7280] mt-1 font-medium">{currentUser.email}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. FLOATING NAVIGATION RAIL (ARC BROWSER STYLE) */}
      <nav 
        id="arc-rail" 
        className="fixed left-6 top-28 bottom-6 w-20 bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm hidden md:flex flex-col justify-between items-center py-8 z-30"
      >
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Main workspace navigation links */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all group ${
                  isActive 
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/15' 
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FA]'
                }`}
              >
                <Icon size={20} className="group-hover:scale-105 transition-transform" />
                
                {/* Minimal Arc Indicator line */}
                {isActive && (
                  <span className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-white rounded-r-full" />
                )}

                {/* Tooltip */}
                <div className="absolute left-16 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 pointer-events-none transition-all duration-150 bg-gray-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-md z-50">
                  {item.name}
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom utility: Sign out button */}
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition-all group"
          title="Sign Out"
        >
          <LogOut size={20} className="group-hover:scale-105 transition-transform" />
          <div className="absolute left-16 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 pointer-events-none transition-all duration-150 bg-red-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-md z-50">
            Sign Out
          </div>
        </button>
      </nav>

      {/* 3. DYNAMIC PAGE VIEW FRAME */}
      <main className="flex-1 md:pl-32 pt-28 pb-12 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. RESPONSIVE MOBILE NAVIGATION DRAWER */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 md:hidden backdrop-blur-sm"
            />
            
            {/* Slide Drawer */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-80 bg-white border-r border-[#E5E7EB] p-6 z-50 flex flex-col justify-between md:hidden"
            >
              <div className="space-y-8">
                {/* Header with Close */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-md">
                      <Video size={18} />
                    </div>
                    <div>
                      <h1 className="text-base font-display font-bold text-gray-900 leading-none">SyncMeet</h1>
                      <span className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wide">Enterprise Sync</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Search Bar Mobile */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      window.dispatchEvent(new CustomEvent('meetingSearch', { detail: e.target.value }));
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#2563EB] transition-all placeholder:text-gray-400 font-medium"
                  />
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB]' 
                            : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} />
                          <span>{item.name}</span>
                        </div>
                        <ChevronRight size={14} className={isActive ? 'text-[#2563EB]' : 'text-gray-300'} />
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Details & Logout */}
              <div className="space-y-5 pt-6 border-t border-gray-100">
                {currentUser && (
                  <div className="flex items-center gap-3 px-2">
                    <img 
                      src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`} 
                      alt={currentUser.displayName} 
                      className="w-10 h-10 rounded-2xl border border-gray-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 leading-none">{currentUser.displayName}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-1">{currentUser.email}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                >
                  <LogOut size={16} />
                  <span>Sign Out of SyncMeet</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

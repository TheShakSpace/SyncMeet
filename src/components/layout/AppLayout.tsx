import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useMeeting } from '../../context/MeetingContext';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Clock, 
  Database, 
  Video, 
  ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, logout, isFirebaseEnabled, activeMeeting, leaveMeeting } = useMeeting();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Live clock state
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="app-shell" className="min-h-screen bg-[#0B1017] text-white flex font-sans overflow-x-hidden">
      
      {/* Desktop Sidebar */}
      <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 bg-[#141C27]/40 backdrop-blur-xl border-r border-white/5 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Video size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold tracking-tight bg-gradient-to-r from-white via-white to-blue-400 bg-clip-text text-transparent">
                SyncMeet
              </h1>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Real-time SaaS</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-600/15 border border-blue-500/20 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile card & Logout */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          {currentUser && (
            <div className="flex items-center gap-3 px-2 py-1">
              <img 
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`} 
                alt={currentUser.displayName} 
                className="w-10 h-10 rounded-xl border border-white/10 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate leading-tight">{currentUser.displayName}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{currentUser.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 px-6 bg-[#0B1017]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-40 sticky top-0">
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)} 
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Title / Action context */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">
                {location.pathname === '/dashboard' ? 'Workspace' : 'Preferences'}
              </span>
              {activeMeeting && (
                <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Active Call: {activeMeeting.id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats / Right area */}
          <div className="flex items-center gap-4">
            {/* Connection Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono border ${
              isFirebaseEnabled 
                ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' 
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              <Database size={13} />
              <span className="hidden sm:inline">
                {isFirebaseEnabled ? 'Firebase Live' : 'Demo Sandbox'}
              </span>
            </div>

            {/* Local Clock */}
            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium font-mono px-3 py-1.5 bg-white/5 rounded-xl">
              <Clock size={14} />
              <span>{timeStr}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Frame */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />
            
            {/* Drawer */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#0B1017] border-r border-white/5 p-6 z-50 flex flex-col justify-between md:hidden"
            >
              <div className="space-y-8">
                {/* Header with Close */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Video size={20} />
                    </div>
                    <div>
                      <h1 className="text-lg font-display font-bold">SyncMeet</h1>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Real-time SaaS</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Mobile Nav Links */}
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive 
                            ? 'bg-blue-600/15 border border-blue-500/20 text-blue-400' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Profile & Logout */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                {currentUser && (
                  <div className="flex items-center gap-3 px-2">
                    <img 
                      src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`} 
                      alt={currentUser.displayName} 
                      className="w-10 h-10 rounded-xl border border-white/10"
                    />
                    <div>
                      <p className="text-sm font-semibold">{currentUser.displayName}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{currentUser.email}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 transition-all"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

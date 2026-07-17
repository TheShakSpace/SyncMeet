import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { 
  Video, Shield, Zap, Sparkles, Layout, Users, MoveRight, 
  Lock, MessageSquare, ArrowRight, Share2, Clipboard, 
  Activity, CheckCircle2, Cloud, Globe, Code
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useMeeting();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      // motion@ uses Easing types; keep it simple for TS compatibility
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/10 selection:text-blue-600 overflow-x-hidden">
      {/* Decorative background grid and blur */}
      <div className="absolute top-0 left-0 right-0 h-[650px] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-80 left-0 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/10">
              <Video size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">SyncMeet</h1>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold font-mono">Secure Real-Time Collaboration</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#why-us" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">Why SyncMeet</a>
            <a href="#security" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/10 transition-all cursor-pointer"
              >
                <span>Enter Workspace</span>
                <MoveRight size={14} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        <motion.div 
          className="grid lg:grid-cols-12 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100/80 text-blue-600 text-[11px] font-bold"
            >
              <Sparkles size={12} />
              <span>Next-Generation Peer-to-Peer Workspace</span>
            </motion.div>

            <motion.h2 
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-none"
            >
              Collaborate in <br />
              <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">True Real-Time</span>.
            </motion.h2>

            <motion.p 
              variants={itemVariants}
              className="text-slate-500 text-sm md:text-base leading-relaxed font-medium max-w-lg"
            >
              Experience high-fidelity, ultra-low latency audio, video, collaborative whiteboarding, 
              safe drag-and-drop file sharing, and live presence in one unified interface. 
              Built for high-performance distributed teams.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all cursor-pointer"
              >
                <span>Launch Space Instantly</span>
                <ArrowRight size={14} />
              </button>
              <a
                href="#features"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Explore Features
              </a>
            </motion.div>

            {/* Performance Badges */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-3 gap-4 border-t border-slate-200/60 pt-8"
            >
              <div>
                <p className="text-lg font-extrabold text-slate-900 font-mono">100ms</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Average Latency</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 font-mono">256-bit</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Signal Encrypted</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 font-mono">0s</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Setup Required</p>
              </div>
            </motion.div>
          </div>

          {/* Hero Right Interactive Illustration / Mockup */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative aspect-[4/3] bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-4 overflow-hidden"
            >
              {/* Fake Window bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="px-3 py-0.5 rounded-lg bg-slate-50 border border-slate-200/40 text-[9px] font-mono text-slate-400 font-semibold flex items-center gap-1">
                  <Globe size={10} className="text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>https://syncmeet.net/room/design-sync</span>
                </div>
                <div className="w-12" />
              </div>

              {/* Layout Mockup of SyncMeet App */}
              <div className="h-[84%] grid grid-cols-12 gap-3">
                {/* Meeting Feed */}
                <div className="col-span-8 bg-slate-50 rounded-2xl border border-slate-100 p-3 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-500 text-white text-[8px] font-bold font-mono">P2P LIVE</span>
                    <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Activity size={10} />
                    </span>
                  </div>
                  
                  {/* Central placeholder content representing whiteboard or video stream */}
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                      <Users size={20} />
                    </div>
                    <p className="text-[11px] text-slate-800 font-bold">Collaborative Canvas Active</p>
                    <p className="text-[9px] text-slate-400">Sarah Jenkins is sketching on Whiteboard</p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 border border-slate-100">🎙️</div>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 border border-slate-100">📹</div>
                    <div className="w-10 h-8 rounded-xl bg-blue-600 text-white shadow-md flex items-center justify-center text-xs">Share</div>
                  </div>
                </div>

                {/* Sidebar Feed */}
                <div className="col-span-4 flex flex-col gap-3">
                  <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <MessageSquare size={10} className="text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-500 font-mono">SECURE CHAT</span>
                    </div>
                    <div className="space-y-1.5 flex-1 pt-2">
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100 text-[8px]">
                        <p className="font-bold text-slate-800">Marcus Vance</p>
                        <p className="text-slate-500">I've dropped the specs pdf!</p>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100 text-[8px]">
                        <p className="font-bold text-slate-800 font-mono">System</p>
                        <p className="text-blue-500">Connecting peers...</p>
                      </div>
                    </div>
                    <div className="h-6 bg-white border border-slate-200/80 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Floating notification decor */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute top-10 left-8 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2.5 shadow-lg max-w-[180px]"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-950">Active Call Synced</h4>
                  <p className="text-[8px] text-emerald-700">Media streams active</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="bg-white py-20 relative border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold font-mono uppercase tracking-wider">
              Rich Features
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              One fluid canvas for real-time creation.
            </h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              We combined high-performance calling channels with powerful visual and document exchange utilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 bg-slate-50 rounded-2xl border border-slate-200/40 hover:border-blue-200 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Video size={18} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Fidelity WebRTC Calling</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Symmetric Peer-to-Peer room structures routing HD audio, webcams, and workspace views with no server lags.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 bg-slate-50 rounded-2xl border border-slate-200/40 hover:border-blue-200 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clipboard size={18} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Collaborative Whiteboard</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Live infinite whiteboard driven by Vector engines. Sketch diagrams, place texts, draw geometric shapes in full sync.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 bg-slate-50 rounded-2xl border border-slate-200/40 hover:border-blue-200 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Share2 size={18} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Sovereign File Sharing</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Drag-and-drop secure file transfers directly registered to the room storage, allowing image previews and immediate downloads.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-6 bg-slate-50 rounded-2xl border border-slate-200/40 hover:border-blue-200 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare size={18} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Presence & Reactions</h4>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Express ideas without breaking conversational flow with WhatsApp-style messaging, typing states, and floating flying emojis.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose SyncMeet section */}
      <section id="why-us" className="py-20 bg-slate-50 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold font-mono uppercase tracking-wider">
                Superior Tech Stack
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Designed for speed. <br />
                Hardened for security.
              </h3>
              <p className="text-slate-500 text-xs md:text-sm font-medium">
                Unlike bloated legacy video conferencing solutions that lag and require client-side app downloads, SyncMeet runs natively in your browser.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Decentralized Mesh Connection</h5>
                    <p className="text-slate-500 text-[11px] leading-normal font-medium">Direct Peer-to-Peer architecture minimizes roundtrip hops, keeping latencies under 150ms.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Firestore Micro-State Engine</h5>
                    <p className="text-slate-500 text-[11px] leading-normal font-medium">Document synchronization scales globally, tracking whiteboard coordinates, chat pieces, and dynamic reactions instantly.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Universal Session Persistence</h5>
                    <p className="text-slate-500 text-[11px] leading-normal font-medium">Join rooms, schedule calendar invites, and view workspace history securely on any device.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="p-8 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Lock size={14} />
                  </div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider">Enterprise Security Guard</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Signaling channel</p>
                    <p className="text-xs font-bold text-white mt-1">256-bit TLS/SSL</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Media Streams</p>
                    <p className="text-xs font-bold text-white mt-1">Secure Real-time P2P</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Auth Security</p>
                    <p className="text-xs font-bold text-white mt-1">Sovereign identity key</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Storage Integrity</p>
                    <p className="text-xs font-bold text-white mt-1">Firestore Locked Rules</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal font-mono font-medium">
                  * SyncMeet never acts as a middleman for video. Media streams are directly encrypted and dispatched between authenticated participant ports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Deep Dive Section */}
      <section id="security" className="py-20 bg-white border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <Shield size={22} />
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Enterprise-Grade Secure Sandbox
            </h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              We implement comprehensive security layers from connection signals down to document repositories 
              to guard corporate communication boundaries.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 rounded-2xl border border-slate-200/60 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-2 font-mono uppercase tracking-wider">
                <Lock size={14} className="text-blue-500" />
                Auth Locking
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                Flexible secure gateway options using audited Google OAuth tokens or secure isolated sessions to block room snooping or spoofing.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/60 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-2 font-mono uppercase tracking-wider">
                <Globe size={14} className="text-blue-500" />
                Decentralized Hosting
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                Leverages resilient multi-regional hosting with automatic fallback to prevent server downtimes and guarantee seamless service availability.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/60 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-2 font-mono uppercase tracking-wider">
                <Code size={14} className="text-blue-500" />
                Validated Inputs
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed font-medium">
                Sovereign backend parsers sanitize, monitor, and clean every chat line and shared document metadata to intercept injections or bad scripts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-950 text-white py-20 relative overflow-hidden">
        {/* Subtle grid and glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] [background-size:3rem_3rem] opacity-10" />
        <div className="absolute w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-6">
          <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Ready to experience SyncMeet?
          </h3>
          <p className="text-slate-400 text-xs md:text-sm font-medium max-w-lg mx-auto">
            Connect your team in seconds. No credit cards, no tedious user setups, no complex setups. Just click and sync.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Get Started Now</span>
              <MoveRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/10">
              <Video size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">SyncMeet</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">Secure Real-Time Collaboration</p>
            </div>
          </div>

          <p className="text-slate-500 text-[10px] font-semibold text-center font-mono">
            © 2026 SyncMeet Inc. Crafted for ultra high-performance teams.
          </p>

          <div className="flex items-center gap-6">
            <a href="#features" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider font-mono">Features</a>
            <a href="#why-us" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider font-mono">Technology</a>
            <a href="#security" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider font-mono">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

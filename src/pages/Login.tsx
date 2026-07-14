import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { Mail, ArrowRight, Video, ShieldCheck, Sparkles, User } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, currentUser } = useMeeting();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, name || email.split('@')[0]);
      navigate('/dashboard');
    } catch (err) {
      setError('Something went wrong during authentication');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="login-screen" className="min-h-screen bg-[#F7F8FA] flex items-stretch overflow-hidden selection:bg-blue-500/15 selection:text-blue-600">
      
      {/* Left Column: Form Panel */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 md:p-16 z-10 bg-white border-r border-[#E5E7EB] relative">
        {/* Background decoration (extremely subtle) */}
        <div className="absolute inset-0 bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
        
        {/* Branding header */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Video size={16} />
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-gray-900 tracking-tight leading-none">SyncMeet</h1>
            <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-semibold">Workspace Suite</span>
          </div>
        </div>

        {/* Central Auth Card */}
        <div className="my-auto max-w-md w-full space-y-8 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-[11px] font-semibold">
              <Sparkles size={12} />
              <span>Next-Generation Video Rooms</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-gray-900 leading-tight">
              Connect securely. <br />
              <span className="text-[#2563EB]">
                Sync instantly.
              </span>
            </h2>
            <p className="text-[#6B7280] text-xs leading-relaxed font-medium">
              A meticulously designed video-conferencing workspace and scheduling portal, engineered for modern collaborative work. No installations required.
            </p>
          </div>

          <div className="space-y-5">
            {/* Google OAuth Button */}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ y: 1 }}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 border border-[#E5E7EB] rounded-2xl text-xs font-bold text-gray-800 transition-all shadow-sm group cursor-pointer"
            >
              <svg className="w-4 h-4 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.256-3.133C18.29 1.844 15.49 1 12.24 1c-6.077 0-11 4.923-11 11s4.923 11 11 11c6.34 0 10.55-4.462 10.55-10.74 0-.723-.075-1.275-.165-1.685H12.24z"
                />
              </svg>
              <span>Continue with Google Account</span>
            </motion.button>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB]"></div>
              </div>
              <span className="relative px-3.5 text-[10px] uppercase tracking-wider text-[#6B7280] bg-white font-mono font-bold">or use instant pass</span>
            </div>

            {/* Email form login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Display Name (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Liam Sterling"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-gray-400 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">Work Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400">
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@workplace.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-2xl text-xs focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-gray-400 font-medium"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 disabled:opacity-50 cursor-pointer"
              >
                <span>{isSubmitting ? 'Syncing Profile...' : 'Enter SyncMeet Workspace'}</span>
                <ArrowRight size={15} />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-left text-[11px] text-[#6B7280] space-y-1.5 relative z-10 border-t border-gray-50 pt-5">
          <p className="font-semibold text-gray-700">© 2026 SyncMeet, Inc. Built for modern high-performance teams.</p>
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <ShieldCheck size={13} className="text-[#10B981]" />
            <span>Encrypted signaling channel with multi-datacenter fallback.</span>
          </div>
        </div>
      </div>

      {/* Right Column: Premium Minimal Visual Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#F3F4F6] via-[#F9FAFB] to-[#F3F4F6] p-16 items-center justify-center relative overflow-hidden">
        
        {/* Gorgeous Subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] [background-size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"></div>
        
        {/* Soft background glow circles (No glowing neon, just soft subtle light blobs) */}
        <div className="absolute w-[450px] h-[450px] rounded-full bg-blue-500/5 blur-[120px] top-1/4 left-1/4 animate-pulse"></div>
        <div className="absolute w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[100px] bottom-1/4 right-1/4 animate-pulse"></div>

        {/* Interactive mock UI card */}
        <div className="relative w-full max-w-lg">
          
          <motion.div 
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-white border border-[#E5E7EB] rounded-[24px] p-6 flex flex-col justify-between relative shadow-xl shadow-gray-200/50"
          >
            {/* Top Bar of meet room mockup */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                </span>
                <span className="text-xs text-gray-500 font-mono font-semibold">sync-room-921</span>
              </div>
              <span className="text-[10px] text-[#2563EB] uppercase tracking-wider font-bold bg-blue-50 border border-blue-100 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse"></span>
                ACTIVE OFFICE
              </span>
            </div>

            {/* Simulated Grid of webcams - Soft Premium Light Theme style */}
            <div className="grid grid-cols-2 gap-4 my-6">
              
              {/* Card 1 */}
              <div className="aspect-[4/3] bg-[#F9FAFB] rounded-2xl relative overflow-hidden flex items-center justify-center border border-gray-100 group shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" 
                  alt="Aria"
                  className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"></div>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-bold text-gray-800 border border-white/20 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                  Aria Sterling (Host)
                </div>
                <div className="absolute top-3 right-3 w-6 h-6 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="aspect-[4/3] bg-[#F9FAFB] rounded-2xl relative overflow-hidden flex items-center justify-center border border-gray-100 group shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" 
                  alt="Marcus"
                  className="w-full h-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"></div>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-bold text-gray-800 border border-white/20 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  Marcus Vance
                </div>
              </div>

            </div>

            {/* Bottom Toolbar Mockup */}
            <div className="flex items-center justify-center gap-3 border-t border-gray-100 pt-4">
              <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 flex items-center justify-center text-xs text-gray-600 transition-all cursor-pointer">🎙️</div>
              <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 flex items-center justify-center text-xs text-gray-600 transition-all cursor-pointer">📷</div>
              <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs transition-all cursor-pointer shadow-md shadow-blue-500/10">🖥️</div>
            </div>

          </motion.div>

          {/* Aesthetic floating info card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -bottom-5 -right-5 px-4.5 py-3 rounded-2xl bg-white border border-[#E5E7EB] text-[11px] font-semibold text-gray-800 flex items-center gap-3 shadow-lg"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] flex items-center justify-center relative">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] absolute animate-ping opacity-60"></span>
            </span>
            <span className="font-mono text-[#6B7280]">Signal: <strong className="text-gray-900 font-semibold">14ms latency</strong></span>
          </motion.div>

        </div>
      </div>

    </div>
  );
};

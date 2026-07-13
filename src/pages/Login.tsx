import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from '../context/MeetingContext';
import { Mail, ArrowRight, Video, Sparkles } from 'lucide-react';
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
    <div id="login-screen" className="min-h-screen bg-[#0B1017] flex items-stretch overflow-hidden">
      
      {/* Left Column: Form Panel */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 md:p-16 z-10 bg-[#0B1017] border-r border-white/5">
        
        {/* Branding header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/25 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Video size={20} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-white">SyncMeet</h1>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Workspace Sync</span>
          </div>
        </div>

        {/* Central Auth Card */}
        <div className="my-auto max-w-md w-full space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white">
              Connect securely. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Sync instantly.
              </span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              SyncMeet brings high-fidelity audio, crystal clear video, and real-time synchronization together in one premium workspace.
            </p>
          </div>

          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#141C27]/80 hover:bg-[#141C27] border border-white/10 hover:border-white/20 rounded-xl text-sm font-semibold transition-all duration-200 shadow-xl group hover:scale-[1.01]"
            >
              <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.256-3.133C18.29 1.844 15.49 1 12.24 1c-6.077 0-11 4.923-11 11s4.923 11 11 11c6.34 0 10.55-4.462 10.55-10.74 0-.723-.075-1.275-.165-1.685H12.24z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative px-3 text-xs uppercase tracking-widest text-gray-500 bg-[#0B1017] font-mono">or</span>
            </div>

            {/* Email form login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Display Name (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-gray-400 font-mono">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-600">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@workplace.com"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-900/20 disabled:opacity-50 hover:scale-[1.01]"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Enter Workspace'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center md:text-left text-xs text-gray-500 space-y-1">
          <p>© 2026 SyncMeet Inc. All rights reserved.</p>
          <p className="font-mono">Secure TLS & AES-256 simulated signal encryption.</p>
        </div>
      </div>

      {/* Right Column: Premium Visual Panel */}
      <div className="hidden lg:flex flex-1 bg-radial from-[#121B2A] to-[#0B1017] p-16 items-center justify-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px] top-1/4 left-1/4 animate-pulse"></div>
        <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[100px] bottom-1/4 right-1/4 animate-pulse"></div>

        {/* Floating elements inside visual panel */}
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
          
          {/* Main Simulated Meet UI Graphic */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full aspect-[4/3] glass-premium rounded-3xl p-6 flex flex-col justify-between relative"
          >
            {/* Top Bar of meet room mockup */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                <span className="text-xs text-gray-400 font-mono ml-2">sync-room-session</span>
              </div>
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-mono bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} />
                LIVE PREVIEW
              </span>
            </div>

            {/* Simulated Grid of webcams */}
            <div className="grid grid-cols-2 gap-4 my-6 flex-1">
              {/* Box 1 */}
              <div className="glass rounded-2xl relative overflow-hidden flex items-center justify-center bg-cover bg-center group" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80')` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-medium border border-white/5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Alex Rivera
                </div>
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
                </div>
              </div>

              {/* Box 2 */}
              <div className="glass rounded-2xl relative overflow-hidden flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80')` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-medium border border-white/5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                  Sarah Connor
                </div>
              </div>
            </div>

            {/* Bottom Toolbar Mockup */}
            <div className="flex items-center justify-center gap-4 border-t border-white/5 pt-4">
              <span className="w-9 h-9 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center text-xs">🎙️</span>
              <span className="w-9 h-9 rounded-full bg-white/5 text-white border border-white/10 flex items-center justify-center text-xs">📷</span>
              <span className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs">🖥️</span>
            </div>
          </motion.div>

          {/* Aesthetic Floating Circles / Signals */}
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full border border-white/5 bg-gradient-to-tr from-indigo-500/10 to-transparent flex items-center justify-center text-indigo-400 font-mono text-[10px] backdrop-blur-sm animate-bounce">
            60 FPS
          </div>
          <div className="absolute -bottom-6 -left-6 px-4 py-2.5 rounded-2xl glass border border-blue-500/20 text-xs flex items-center gap-3 shadow-2xl animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span className="font-mono text-gray-300">Signal: Excellent (12ms)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

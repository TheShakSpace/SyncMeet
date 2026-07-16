import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, HelpCircle, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'motion/react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col justify-between p-6 overflow-hidden relative selection:bg-blue-500/10 selection:text-blue-400">
      {/* Decorative vector background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Header Logo */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between relative z-10 py-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Video size={16} />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight block">SyncMeet</span>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Lost Connection</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full text-center py-16 flex flex-col items-center justify-center relative z-10 my-auto space-y-8">
        
        {/* Animated Satellite / Connection illustration */}
        <div className="relative">
          <motion.div
            animate={{ 
              y: [0, -12, 0],
              rotate: [0, 4, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-48 h-48 rounded-full border border-slate-700 bg-slate-800/40 backdrop-blur-md flex items-center justify-center shadow-2xl relative"
          >
            <HelpCircle size={64} className="text-blue-500" />
            
            {/* Animated signal rings */}
            <span className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping opacity-40" style={{ animationDuration: '3s' }} />
            <span className="absolute -inset-4 rounded-full border border-indigo-500/10 animate-ping opacity-30" style={{ animationDuration: '4s' }} />
          </motion.div>
          
          {/* Status Label */}
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider shadow-md">
            SIGNAL: 404 NOT FOUND
          </span>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none">
            Lost in Communication Space
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-medium max-w-md mx-auto leading-relaxed">
            The workspace or huddle channel you are trying to sync does not exist, has been disbanded, or the address link has expired.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
          >
            <Home size={14} />
            <span>Workspace</span>
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto w-full text-center relative z-10 py-4 border-t border-slate-800/40">
        <p className="text-[10px] text-slate-500 font-mono">
          SyncMeet Safe Transit Protocol © 2026. If you believe this is an error, check room invitations.
        </p>
      </footer>
    </div>
  );
};

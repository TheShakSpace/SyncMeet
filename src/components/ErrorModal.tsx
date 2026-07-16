import React from 'react';
import { ShieldAlert, AlertTriangle, RefreshCw, X, WifiOff, HelpCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  code?: 'CAMERA_ERROR' | 'MIC_ERROR' | 'PERMISSION_DENIED' | 'MEETING_NOT_FOUND' | 'ROOM_FULL' | 'DISCONNECTED' | 'FIREBASE_ERROR' | 'UPLOAD_FAILED' | 'SCREEN_DENIED' | 'PEER_LOST' | 'RECONNECT_FAILED' | 'UNKNOWN';
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  title,
  message,
  code = 'UNKNOWN',
  onClose,
  onRetry
}) => {
  // Select color & icon based on code
  const getIconAndColor = () => {
    switch (code) {
      case 'PERMISSION_DENIED':
      case 'CAMERA_ERROR':
      case 'MIC_ERROR':
        return {
          icon: <Lock size={24} className="text-amber-500" />,
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          accentColor: 'bg-amber-500'
        };
      case 'DISCONNECTED':
      case 'RECONNECT_FAILED':
        return {
          icon: <WifiOff size={24} className="text-red-500 animate-pulse" />,
          bgColor: 'bg-red-500/10 border-red-500/20',
          accentColor: 'bg-red-500'
        };
      case 'MEETING_NOT_FOUND':
      case 'ROOM_FULL':
        return {
          icon: <HelpCircle size={24} className="text-blue-500" />,
          bgColor: 'bg-blue-500/10 border-blue-500/20',
          accentColor: 'bg-blue-500'
        };
      default:
        return {
          icon: <ShieldAlert size={24} className="text-red-500" />,
          bgColor: 'bg-red-500/10 border-red-500/20',
          accentColor: 'bg-red-500'
        };
    }
  };

  const { icon, bgColor, accentColor } = getIconAndColor();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 text-left"
          >
            {/* Corner Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Close error message"
            >
              <X size={16} />
            </button>

            {/* Title Block with Icon */}
            <div className="flex gap-4 items-start">
              <div className={`p-3 rounded-2xl ${bgColor} border shrink-0`}>
                {icon}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">System Error • {code}</span>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium mt-2">{message}</p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Dismiss Alert
              </button>
              
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`px-4.5 py-2.5 rounded-xl text-white ${accentColor} hover:brightness-95 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-slate-900/5 transition-all cursor-pointer`}
                >
                  <RefreshCw size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Retry Connection</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Video, 
  Download, 
  Trash2, 
  Clock, 
  HardDrive, 
  Calendar, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle,
  Play,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecordingMeta {
  duration: string;
  size: string;
  timestamp: string;
}

interface MeetingRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  confirmStartRecording: () => void;
  recordingUrl: string | null;
  recordingMeta: RecordingMeta | null;
  clearRecording: () => void;
  isRecordingActive: boolean;
  addNotification: (msg: string) => void;
}

export const MeetingRecorderModal: React.FC<MeetingRecorderModalProps> = ({
  isOpen,
  onClose,
  confirmStartRecording,
  recordingUrl,
  recordingMeta,
  clearRecording,
  isRecordingActive,
  addNotification
}) => {
  const [hasAgreedTerms, setHasAgreedTerms] = useState(true);

  if (!isOpen) return null;

  const handleStart = () => {
    confirmStartRecording();
    onClose();
  };

  const handleDownload = () => {
    if (!recordingUrl) return;
    const a = document.createElement('a');
    a.href = recordingUrl;
    // Format download name nicely
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `syncmeet-recording-${dateStr}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addNotification("Recording file downloaded successfully!");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-hidden select-none">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white rounded-[28px] border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col relative"
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Video size={18} className={isRecordingActive ? "animate-pulse" : ""} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {recordingUrl ? "Huddle Recording Processed" : "Initiate Meeting Recording"}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider font-extrabold">
                  {recordingUrl ? "ARCHIVE METADATA & PREVIEW" : "Fidelity WebRTC Recorder Setup"}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* MAIN FORM / ARTIFACT PREVIEW */}
          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5 select-text">
            {recordingUrl ? (
              // Case A: Recording Completed & Saved
              <div className="space-y-4">
                <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800">Recording compiled successfully!</h4>
                    <p className="text-[11px] text-emerald-700/80 leading-relaxed mt-1 font-medium">
                      All video feeds, audio mixdowns, and shared presenters were consolidated into a standard media container. You can watch the preview below or download it directly.
                    </p>
                  </div>
                </div>

                {/* Video Preview Player */}
                <div className="rounded-[20px] overflow-hidden border border-slate-200/80 bg-slate-950 aspect-video relative group shadow-inner">
                  <video 
                    src={recordingUrl} 
                    controls 
                    className="w-full h-full object-contain"
                    poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
                  />
                </div>

                {/* Metadata Cards Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col gap-1 items-center text-center">
                    <Clock size={14} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 font-mono">DURATION</span>
                    <span className="text-xs font-extrabold text-slate-700 font-mono">{recordingMeta?.duration || '00:00'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col gap-1 items-center text-center">
                    <HardDrive size={14} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 font-mono">FILE SIZE</span>
                    <span className="text-xs font-extrabold text-slate-700 font-mono">{recordingMeta?.size || '0 Bytes'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col gap-1 items-center text-center">
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-400 font-mono">DATE RECORDED</span>
                    <span className="text-[10px] font-extrabold text-slate-700 font-mono line-clamp-1">{recordingMeta?.timestamp?.split(',')[0] || 'Unknown'}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Media File</span>
                  </button>
                  <button
                    onClick={() => {
                      clearRecording();
                      addNotification("Local recording buffer cleared.");
                    }}
                    className="px-4 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    title="Clear Recording Buffer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              // Case B: Confirmation Setup Form before starting
              <div className="space-y-4">
                <div className="bg-blue-50/50 border border-blue-100 p-4.5 rounded-2xl flex items-start gap-3">
                  <Sparkles size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-800">Consolidated Workspace Recorder</h4>
                    <p className="text-[11px] text-blue-700/80 leading-relaxed mt-1 font-semibold">
                      This captures the active local camera stream, local microphone audio, any active screen sharing presentation track, and mixes them with all active remote participants' incoming audio streams into a single high-fidelity track.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700">What will be captured:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Video size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Camera / Webcam</p>
                        <p className="text-[9px] text-slate-400 font-mono">Active webcam feed</p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Monitor size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Screen Share</p>
                        <p className="text-[9px] text-slate-400 font-mono">Captured if active</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700/80 leading-relaxed font-semibold">
                    Ensure everyone has agreed to be recorded. Local audio mixdowns rely on active sound drivers. Standard regulatory guidelines require consent from all present huddle participants.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 px-1 py-1">
                  <input 
                    type="checkbox" 
                    id="recording-terms-agree" 
                    checked={hasAgreedTerms} 
                    onChange={(e) => setHasAgreedTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="recording-terms-agree" className="text-[11px] text-slate-500 font-bold cursor-pointer">
                    I confirm that I have requested consent from all active attendees.
                  </label>
                </div>

                <button
                  onClick={handleStart}
                  disabled={!hasAgreedTerms}
                  className={`w-full py-3 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                    hasAgreedTerms 
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/10 cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Play size={14} fill="currentColor" />
                  <span>Start Recording Conference</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
            <button 
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

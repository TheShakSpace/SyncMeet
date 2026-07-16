import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Download, 
  Sparkles, 
  CheckCircle, 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  CheckSquare, 
  Clock, 
  AlertCircle,
  FileText,
  HelpCircle,
  ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

interface TaskItem {
  task: string;
  owner: string;
  priority: string;
  deadline: string;
}

interface QuestionItem {
  question: string;
  askedBy: string;
}

interface AnalysisReport {
  overview: string;
  keyDiscussionPoints: string[];
  importantDecisions: string[];
  suggestedFollowup: string;
  actionItems: TaskItem[];
  pendingTasks: string[];
  chatAnalysis: {
    frequentlyDiscussedTopics: string[];
    importantKeywords: string[];
    sentiment: string;
    questionsAsked: QuestionItem[];
  };
}

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  participants: any[];
  chatMessages: any[];
  sharedFiles: any[];
  addNotification: (message: string) => void;
}

export const AiSummaryModal: React.FC<AiSummaryModalProps> = ({
  isOpen,
  onClose,
  roomId,
  participants,
  chatMessages,
  sharedFiles,
  addNotification
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks' | 'chat'>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Micro-loading stages
  const [loadingStage, setLoadingStage] = useState(0);
  const loadingMessages = [
    "Compiling chat logs and participants directory...",
    "Reconstruction huddle timeline and topics...",
    "Contacting SyncMeet Gemini Intelligence Engine...",
    "Extracting Smart Action Items & Priorities...",
    "Structuring sentiment metrics and keywords...",
    "Fidelity summary reports compiled successfully!"
  ];

  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setIsLoading(true);
    setError(null);
    setReport(null);
    setLoadingStage(0);

    // Simulated step loader transitions
    const stageInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < 4) return prev + 1;
        clearInterval(stageInterval);
        return prev;
      });
    }, 1200);

    // Call server endpoint
    const fetchAnalysis = async () => {
      try {
        const meetingContext = {
          roomId,
          participants: participants.map(p => ({ displayName: p.displayName, role: p.role || 'Participant' })),
          chatMessages: chatMessages.map(m => ({
            timestamp: m.timestamp,
            senderName: m.senderName,
            text: m.text
          })),
          sharedFiles: sharedFiles.map(f => ({
            name: f.name,
            uploader: f.uploader,
            type: f.type,
            size: f.size
          }))
        };

        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingContext })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to analyze huddle transcript.");
        }

        setLoadingStage(5);
        setTimeout(() => {
          setReport(data);
          setIsLoading(false);
        }, 600);
      } catch (err: any) {
        console.error("AI report fetch error:", err);
        setError(err.message || "An unexpected error occurred while analyzing the meeting.");
        setIsLoading(false);
      }
    };

    fetchAnalysis();

    return () => {
      clearInterval(stageInterval);
    };
  }, [isOpen, roomId, participants, chatMessages, sharedFiles]);

  if (!isOpen) return null;

  // Format Plaintext copy representation
  const getPlaintextSummary = (): string => {
    if (!report) return "";
    return `SYNCMEET EXECUTIVE AI MEETING SUMMARY
==========================================
Room ID: ${roomId}
Generated At: ${new Date().toLocaleString()}

1. MEETING OVERVIEW
-------------------
${report.overview}

2. KEY DISCUSSION POINTS
------------------------
${report.keyDiscussionPoints.map(p => `• ${p}`).join("\n")}

3. DECISIONS REACHED
--------------------
${report.importantDecisions.map(d => `✓ ${d}`).join("\n")}

4. SMART ACTION ITEMS
---------------------
${report.actionItems.map(item => `• TASK: ${item.task} | OWNER: ${item.owner} | PRIORITY: ${item.priority} | DEADLINE: ${item.deadline}`).join("\n")}

5. PENDING TASKS & QUESTIONS
-----------------------------
${report.pendingTasks.map(t => `• Pending: ${t}`).join("\n")}
Sentiment of Room: ${report.chatAnalysis.sentiment}

6. SUGGESTED FOLLOW-UP
-----------------------
${report.suggestedFollowup}`;
  };

  const handleCopy = () => {
    const text = getPlaintextSummary();
    navigator.clipboard.writeText(text);
    setCopied(true);
    addNotification("Report copied to clipboard as formatted text!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = getPlaintextSummary();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `syncmeet_huddle_summary_${roomId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification("Report downloaded as TXT successfully.");
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    try {
      const doc = new jsPDF();
      let cursorY = 20;

      // Header Banner
      doc.setFillColor(37, 99, 235); // Blue
      doc.rect(0, 0, 220, 15, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('SYNCMEET EXECUTIVE AI MEETING WORKSPACE INTELLIGENCE', 14, 10);

      // Metadata section
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(15);
      doc.text('Executive Meeting Briefing', 14, cursorY + 10);
      cursorY += 15;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Room ID: ${roomId}`, 14, cursorY);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 140, cursorY);
      cursorY += 8;

      doc.setDrawColor(226, 232, 240);
      doc.line(14, cursorY, 196, cursorY);
      cursorY += 10;

      // Wrapping text utility
      const addSection = (title: string, textOrList: string | string[], iconPrefix: string = '•') => {
        if (cursorY > 260) {
          doc.addPage();
          cursorY = 20;
        }

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(29, 78, 216); // blue-700
        doc.text(title.toUpperCase(), 14, cursorY);
        cursorY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85); // slate-700

        if (Array.isArray(textOrList)) {
          textOrList.forEach(item => {
            if (cursorY > 275) {
              doc.addPage();
              cursorY = 20;
            }
            const wrapped = doc.splitTextToSize(`${iconPrefix} ${item}`, 178);
            doc.text(wrapped, 14, cursorY);
            cursorY += wrapped.length * 5;
          });
        } else {
          const wrapped = doc.splitTextToSize(textOrList, 178);
          doc.text(wrapped, 14, cursorY);
          cursorY += wrapped.length * 5;
        }
        cursorY += 8;
      };

      // 1. Overview
      addSection('1. Meeting Overview', report.overview);

      // 2. Key discussion points
      addSection('2. Key Discussion Points', report.keyDiscussionPoints);

      // 3. Decisions
      addSection('3. Decisions & Consensus Reached', report.importantDecisions, '✓');

      // 4. Smart Action Items (formatted as lines for PDF)
      const formattedTasks = report.actionItems.map(
        t => `[Priority: ${t.priority}] ${t.task} - Assigned to: ${t.owner} (Deadline: ${t.deadline})`
      );
      addSection('4. Smart Action Items', formattedTasks, '▶');

      // 5. Chat metrics & follow-up
      const chatStats = [
        `Frequently Discussed Topics: ${report.chatAnalysis.frequentlyDiscussedTopics.join(", ")}`,
        `Important Keyword Tags: ${report.chatAnalysis.importantKeywords.join(", ")}`,
        `Huddle Communication Sentiment: ${report.chatAnalysis.sentiment}`
      ];
      addSection('5. Chat Transcript Insights', chatStats, '•');

      // 6. Follow-up
      addSection('6. Suggested Next Steps', report.suggestedFollowup);

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${i} of ${pageCount} | SyncMeet AI Analytics`, 14, 287);
        doc.text('Confidential Workspace Artifact', 145, 287);
      }

      doc.save(`syncmeet_executive_report_${roomId}.pdf`);
      addNotification("Report PDF downloaded successfully.");
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      addNotification("Could not compile executive PDF. Downloading TXT fallback.");
      handleDownloadTxt();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-hidden selection:bg-blue-500/15 selection:text-blue-600">
        
        {/* MODAL WRAPPER */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white rounded-[28px] border border-slate-200 shadow-2xl max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col relative"
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Workspace Summary & Analytical Insights</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ROOM ID: <span className="text-blue-600 font-bold font-mono">{roomId}</span></p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* LOADING STATE */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/20">
              <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                      <Sparkles size={20} className="animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-slate-700">Gemini Cognitive Intelligence Engine</h4>
                  <p className="text-xs text-slate-400 font-mono h-5 truncate font-semibold">
                    {loadingMessages[loadingStage]}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((loadingStage + 1) / 6) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center shadow-sm">
                <AlertCircle size={22} />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-slate-700">Intelligence Briefing Suspended</h4>
                <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed bg-red-50/50 p-3 border border-red-100/50 rounded-xl">
                  {error}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-slate-900/10 cursor-pointer"
              >
                Return to Workspace
              </button>
            </div>
          ) : report ? (
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              
              {/* TABS SELECTOR */}
              <div className="px-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
                <div className="flex gap-4">
                  {[
                    { id: 'summary' as const, label: 'Briefing Summary', icon: FileText },
                    { id: 'tasks' as const, label: 'Smart Deliverables', icon: CheckSquare },
                    { id: 'chat' as const, label: 'Sentiment & Chat', icon: MessageSquare }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isActive 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        <Icon size={13} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Top Action Controls */}
                <div className="flex items-center gap-2.5 py-2.5">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded-lg transition-all text-slate-600 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{copied ? "Copied!" : "Copy Clipboard"}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded-lg transition-all text-slate-600 cursor-pointer"
                  >
                    <Download size={11} />
                    <span>Download TXT</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-[10px] font-bold text-blue-600 rounded-lg transition-all cursor-pointer"
                  >
                    <Sparkles size={11} className="text-blue-600" />
                    <span>Download Executive PDF</span>
                  </button>
                </div>
              </div>

              {/* TAB CONTENTS */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0 select-text">
                <AnimatePresence mode="wait">
                  {activeTab === 'summary' && (
                    <motion.div 
                      key="summary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      {/* Overview section */}
                      <div className="bg-slate-50/50 p-5 rounded-[22px] border border-slate-100 shadow-inner">
                        <div className="flex items-center gap-2 mb-3">
                          <ThumbsUp size={14} className="text-blue-500" />
                          <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-mono">1. Huddle Executive Overview</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">{report.overview}</p>
                      </div>

                      {/* Discussion points & Decisions Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Discussion Points */}
                        <div className="bg-white p-5 rounded-[22px] border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-3.5">
                            <Clock size={14} className="text-blue-500" />
                            <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-mono">2. Key Discussions Raised</h4>
                          </div>
                          <ul className="space-y-3">
                            {report.keyDiscussionPoints.map((pt, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-semibold leading-relaxed">
                                <span className="w-4 h-4 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100 text-[9px] text-blue-500 font-bold font-mono mt-0.5">{idx + 1}</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                            {report.keyDiscussionPoints.length === 0 && (
                              <li className="text-xs text-slate-400 font-mono py-2">No key topics detected.</li>
                            )}
                          </ul>
                        </div>

                        {/* Decisions */}
                        <div className="bg-white p-5 rounded-[22px] border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-3.5">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-mono">3. Decisions Achieved</h4>
                          </div>
                          <ul className="space-y-3">
                            {report.importantDecisions.map((dec, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-semibold leading-relaxed">
                                <span className="w-4 h-4 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 border border-emerald-100 text-[9px] text-emerald-500 font-bold mt-0.5">✓</span>
                                <span>{dec}</span>
                              </li>
                            ))}
                            {report.importantDecisions.length === 0 && (
                              <li className="text-xs text-slate-400 font-mono py-2">No definitive consensus registered yet.</li>
                            )}
                          </ul>
                        </div>

                      </div>

                      {/* Suggested Follow-up */}
                      <div className="bg-gradient-to-tr from-blue-50/50 to-indigo-50/30 p-5 rounded-[22px] border border-blue-100/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar size={14} className="text-blue-500" />
                          <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider font-mono">4. Suggested Follow-Up Actions</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">{report.suggestedFollowup}</p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'tasks' && (
                    <motion.div 
                      key="tasks"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Smart Action Items Log</h4>
                          <p className="text-[10px] text-slate-400">Gemini automatically parses transcripts to assign owners, prioritize, and isolate timelines.</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-bold text-emerald-600 font-mono uppercase tracking-wider">
                          {report.actionItems.length} Smart Actions Extracted
                        </div>
                      </div>

                      {/* SMART TASK TABLE */}
                      <div className="border border-slate-200/60 rounded-[22px] overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Task Description</th>
                              <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono w-40">Owner</th>
                              <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono w-28">Priority</th>
                              <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono w-32">Deadline</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {report.actionItems.map((item, idx) => {
                              const isHigh = item.priority.toLowerCase() === 'high';
                              const isMedium = item.priority.toLowerCase() === 'medium';
                              return (
                                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-start gap-2.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                      <span className="text-xs font-semibold text-slate-700 leading-relaxed">{item.task}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-500 font-mono">
                                        {item.owner.slice(0, 2).toUpperCase()}
                                      </div>
                                      <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{item.owner}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono border uppercase ${
                                      isHigh 
                                        ? 'bg-red-50 border-red-100 text-red-500' 
                                        : isMedium 
                                          ? 'bg-amber-50 border-amber-100 text-amber-600' 
                                          : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}>
                                      {item.priority}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                                      <Clock size={11} className="text-slate-400 shrink-0" />
                                      <span className="truncate">{item.deadline}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {report.actionItems.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-400 font-mono">
                                  No huddle assignments extracted.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* PENDING / OTHER UNASSIGNED TASKS */}
                      <div className="bg-slate-50/50 p-5 rounded-[22px] border border-slate-100 shadow-inner">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle size={14} className="text-slate-500" />
                          <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-mono">Unassigned Parking Lot / Pending Ideas</h4>
                        </div>
                        <ul className="space-y-2.5">
                          {report.pendingTasks.map((t, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-500 font-semibold leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                          {report.pendingTasks.length === 0 && (
                            <li className="text-xs text-slate-400 font-mono">No parking-lot items registered.</li>
                          )}
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'chat' && (
                    <motion.div 
                      key="chat"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Topics */}
                        <div className="bg-white p-5 rounded-[22px] border border-slate-100 shadow-sm md:col-span-2">
                          <div className="flex items-center gap-2 mb-3.5">
                            <MessageSquare size={14} className="text-blue-500" />
                            <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-mono">Trending Topics & Conversations</h4>
                          </div>
                          <ul className="space-y-2.5">
                            {report.chatAnalysis.frequentlyDiscussedTopics.map((top, idx) => (
                              <li key={idx} className="flex gap-2.5 items-center text-xs text-slate-600 font-semibold">
                                <span className="w-5 h-5 bg-blue-50 rounded-lg border border-blue-100 text-[10px] font-bold text-blue-500 flex items-center justify-center shrink-0">#</span>
                                <span>{top}</span>
                              </li>
                            ))}
                            {report.chatAnalysis.frequentlyDiscussedTopics.length === 0 && (
                              <li className="text-xs text-slate-400 font-mono py-2">No prominent topics detected yet.</li>
                            )}
                          </ul>
                        </div>

                        {/* Sentiment */}
                        <div className="bg-slate-50 p-5 rounded-[22px] border border-slate-100 shadow-inner flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-3.5">
                              <TrendingUp size={14} className="text-blue-500" />
                              <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-mono">Communication Vibe</h4>
                            </div>
                            <p className="text-xs text-slate-400">Determined via semantic sentiment mapping of chats.</p>
                          </div>
                          <div className="space-y-2.5 mt-4">
                            <div className="text-2xl font-black text-blue-600 tracking-tight leading-none uppercase font-sans">
                              {report.chatAnalysis.sentiment}
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 w-[85%]" />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Keyword tags */}
                      <div className="bg-white p-5 rounded-[22px] border border-slate-100 shadow-sm">
                        <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-mono mb-3">Important Keywords Isolated</h4>
                        <div className="flex flex-wrap gap-2">
                          {report.chatAnalysis.importantKeywords.map((key, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/60 text-slate-600 font-bold font-mono text-[10px] rounded-lg border border-slate-200/50 transition-colors cursor-default"
                            >
                              {key}
                            </span>
                          ))}
                          {report.chatAnalysis.importantKeywords.length === 0 && (
                            <span className="text-xs text-slate-400 font-mono py-1">No keywords captured.</span>
                          )}
                        </div>
                      </div>

                      {/* Questions Raised */}
                      <div className="bg-white p-5 rounded-[22px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3.5">
                          <HelpCircle size={14} className="text-amber-500" />
                          <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-mono">Questions Exchanged & Unresolved</h4>
                        </div>
                        <div className="space-y-3">
                          {report.chatAnalysis.questionsAsked.map((qItem, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5">
                              <p className="text-xs text-slate-700 font-semibold leading-relaxed">"{qItem.question}"</p>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-[#6B7280] font-mono font-bold">Asked by:</span>
                                <span className="text-[9px] bg-blue-50 border border-blue-100 text-blue-600 px-1.5 py-0.2 rounded font-bold font-mono uppercase">{qItem.askedBy}</span>
                              </div>
                            </div>
                          ))}
                          {report.chatAnalysis.questionsAsked.length === 0 && (
                            <div className="text-xs text-slate-400 font-mono py-2">No explicit questions identified in huddle chat logs.</div>
                          )}
                        </div>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          ) : null}

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0 select-none">
            <button 
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Close Briefing Dashboard
            </button>
          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
};

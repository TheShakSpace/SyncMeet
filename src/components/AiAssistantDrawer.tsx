import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  RefreshCw, 
  Trash2, 
  ArrowRight, 
  User, 
  ChevronRight, 
  FileText, 
  Languages, 
  FileCheck, 
  Mail, 
  CheckSquare, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiAssistantDrawerProps {
  roomId: string;
  participants: any[];
  chatMessages: any[];
  sharedFiles: any[];
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  roomId,
  participants,
  chatMessages,
  sharedFiles
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I am your SyncMeet AI Copilot. I have complete visibility of this room's participants, shared items, and active huddle chat.\n\nHow can I streamline your workspace today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Quick prompt suggestions
  const suggestions = [
    { label: "Summarize Huddle", prompt: "Summarize all huddle chat messages exchanged so far.", icon: MessageSquare },
    { label: "Suggest Action Items", prompt: "Suggest a clear, bulleted list of action items and deliverables based on our huddle.", icon: CheckSquare },
    { label: "Draft Follow-up Email", prompt: "Draft a highly professional follow-up email summarizing our huddle findings.", icon: Mail },
    { label: "Explain Shared Files", prompt: "Explain what files have been shared in this meeting and what they are used for.", icon: FileText },
    { label: "Professional Rewrite", prompt: "Help me rewrite this statement to make it extremely clear, polished, and executive-ready: ", icon: FileCheck, fillInput: true },
    { label: "Translate To Spanish", prompt: "Translate this text to Spanish: ", icon: Languages, fillInput: true }
  ];

  const handleSendMessage = async (textToSend: string, isDirectSubmit: boolean = true) => {
    if (!textToSend.trim() || isLoading) return;

    // If it's a fill input command, just load it into the input box instead of submitting
    if (!isDirectSubmit) {
      setInputText(textToSend);
      return;
    }

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Map history for Gemini backend
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      // Gather current meeting context
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

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          chatHistory,
          meetingContext
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with AI endpoint.");
      }

      const assistantMsg: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.text || "I was unable to synthesize a proper response at this time.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      const errorMsg: AssistantMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **API Connection Interrupted**\n\n${error.message || "Please verify that the dev server is active and the GEMINI_API_KEY is configured."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Chat cleared. I am ready to assist you again with participants, documents, or general requests.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div id="ai-copilot-container" className="h-full flex flex-col justify-between bg-white text-gray-900 overflow-hidden font-sans">
      
      {/* 1. ASSISTANT TOP SUGGESTIONS / CHIPS */}
      <div className="border-b border-gray-100 bg-slate-50/40 p-3 shrink-0">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Sparkles size={11} className="text-blue-500" />
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">Suggested Copilot Skills</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
          {suggestions.map((sug, idx) => {
            const Icon = sug.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug.prompt, !sug.fillInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[10px] font-bold rounded-full transition-all shrink-0 cursor-pointer text-slate-700 shadow-sm"
              >
                <Icon size={10} className="text-blue-600" />
                <span>{sug.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CHAT BUBBLES WINDOW */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white select-text">
        {messages.map((msg) => {
          const isMe = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[90%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div className={`w-7.5 h-7.5 rounded-xl border flex items-center justify-center shrink-0 ${
                isMe ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gradient-to-tr from-blue-600 to-indigo-500 border-none text-white shadow-sm'
              }`}>
                {isMe ? <User size={13} /> : <Bot size={13} className="animate-pulse" />}
              </div>

              <div className="space-y-1 min-w-0">
                <div className={`flex items-center gap-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[9px] font-bold text-slate-500">{isMe ? 'You' : 'SyncMeet AI'}</span>
                  <span className="text-[8px] text-gray-400 font-mono font-bold">{msg.timestamp}</span>
                </div>

                <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed border relative shadow-sm whitespace-pre-line font-medium ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none border-blue-600/10' 
                    : 'bg-slate-50/80 text-slate-800 rounded-tl-none border-slate-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* LOADING INDICATOR */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-end animate-pulse">
            <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Bot size={13} className="animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[9px] text-slate-500 font-mono font-extrabold tracking-wider">AI IS THINKING...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT FORM */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2 shrink-0">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }} 
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI anything, translate, explain, summarize..."
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none rounded-xl text-xs placeholder:text-gray-400 transition-all text-gray-900 font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-2.5 rounded-xl text-white transition-all active:scale-95 cursor-pointer shadow-sm ${
              inputText.trim() && !isLoading 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/15' 
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Send size={14} />
          </button>
        </form>

        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1 text-[8.5px] text-slate-400 font-bold font-mono">
            <HelpCircle size={10} className="text-slate-400" />
            <span>Context synced with active room.</span>
          </div>

          <button 
            onClick={clearChat}
            className="flex items-center gap-1 text-[9px] text-red-500/75 hover:text-red-600 font-bold font-mono cursor-pointer transition-colors p-0.5"
            title="Clear Assistant Conversation"
          >
            <Trash2 size={10} />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

    </div>
  );
};

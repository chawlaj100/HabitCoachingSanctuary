import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, ChatMessage } from '../types';
import { MessageSquare, Send, Sparkles, AlertTriangle } from 'lucide-react';

interface CoachingChatProps {
  profile: UserProfile;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
}

const QUICK_SUGGESTIONS = [
  "I feel a strong urge right now",
  "I had a setback, need some encouragement",
  "Can we do a quick posture or physical reset?",
  "Tell me the neuroscience of how triggers work"
];

export default function CoachingChat({ 
  profile, 
  chatHistory, 
  onSendMessage,
  onClearHistory 
}: CoachingChatProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const textToSend = input.trim();
    setInput('');
    setLoading(true);

    try {
      await onSendMessage(textToSend);
    } catch (error) {
      console.error("Failed to send chat message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (text: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await onSendMessage(text);
    } catch (error) {
      console.error("Failed to send prompt suggestion:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-[650px] flex flex-col" id="coaching-chat-card">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            AI Adaptive Coach Chat
          </h3>
          <p className="text-xs text-slate-500">
            Speak with an AI coach trained on support, cognitive strategies, and neuroscience.
          </p>
        </div>

        <button
          onClick={onClearHistory}
          className="text-[10px] font-mono font-bold text-slate-400 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
          id="clear-chat-btn"
        >
          CLEAR CHAT
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-0">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">Your Habit Coach is online</p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                "Hello! I am here to help you navigate urges for <span className="font-semibold text-indigo-600">{profile.habitToBreak}</span>. Whenever you feel an urge, vent, seek distraction, or share a setback."
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              id={`chat-msg-${msg.id}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span
                  className={`text-[9px] font-mono block mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start" id="chat-loading-bubble">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-mono">Coach is composing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      {chatHistory.length === 0 && (
        <div className="space-y-2 py-3 border-t border-slate-100 flex-shrink-0">
          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">QUICK ANCHORS</span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                className="text-xs border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-left transition-all duration-150 focus:outline-none cursor-pointer"
                id={`sug-btn-${idx}`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-2.5 pt-4 border-t border-slate-100 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={`Talk about triggers, log logs, or ask for redirection techniques...`}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-150"
          id="chat-input"
          aria-label="Coaching chat message input"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4.5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-2xl transition-all duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 cursor-pointer"
          id="send-chat-btn"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

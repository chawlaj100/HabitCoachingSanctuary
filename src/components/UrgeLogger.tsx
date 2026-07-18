import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, UrgeLog } from '../types';
import { Activity, ShieldCheck, HeartCrack, ChevronRight, Zap } from 'lucide-react';

interface UrgeLoggerProps {
  profile: UserProfile;
  onLogUrge: (urge: Omit<UrgeLog, 'id'>) => Promise<UrgeLog>;
  onRequestDistraction: (triggerContext: string) => void;
}

export default function UrgeLogger({ profile, onLogUrge, onRequestDistraction }: UrgeLoggerProps) {
  const [intensity, setIntensity] = useState<number>(5);
  const [context, setContext] = useState('');
  const [status, setStatus] = useState<'resisted' | 'given_in'>('resisted');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);

    const triggerContext = context.trim() || "Unspecified trigger";
    
    try {
      const logged = await onLogUrge({
        timestamp: new Date().toISOString(),
        intensity,
        triggerContext,
        status,
        distractionOffered: status === 'resisted' ? 'Yes' : 'No'
      });

      if (status === 'resisted') {
        setSuccessMessage("Incredible job logging and holding space for this urge! Real growth happens in these seconds.");
        // Automatically offer distraction
        onRequestDistraction(triggerContext);
      } else {
        setSuccessMessage("Slip logged. No shame, no judgment—it is just data. Tomorrow we rewrite the response.");
      }

      // Reset
      setContext('');
      setIntensity(5);
    } catch (error) {
      console.error("Failed to log urge:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5" id="urge-logger-card">
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-indigo-600" />
          Urge Logger & Real-time Anchor
        </h3>
        <p className="text-xs text-slate-500">
          Feeling an urge? Externalize it immediately. Naming is the first step of breaking the habit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Intensity slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono font-bold text-slate-400">
            <label htmlFor="intensity-slider">URGE INTENSITY</label>
            <span className="font-bold text-indigo-600">{intensity}/10</span>
          </div>
          <input
            id="intensity-slider"
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-indigo-600 bg-slate-100 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
            <span>SOFT URGE</span>
            <span>INTENSE CRAVING</span>
          </div>
        </div>

        {/* Trigger Context input */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-400 block" htmlFor="trigger-context">
            TRIGGER CONTEXT / WHAT SPARKED IT?
          </label>
          <input
            id="trigger-context"
            type="text"
            required
            placeholder="e.g., bored at my desk, just finished dinner, notification beeped..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150"
          />
        </div>

        {/* Action Toggle (Resisted or Slip) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus('resisted')}
            className={`py-3.5 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none cursor-pointer ${
              status === 'resisted'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
            }`}
            id="status-resisted-btn"
          >
            <ShieldCheck className={`w-4 h-4 ${status === 'resisted' ? 'text-indigo-600' : 'text-slate-400'}`} />
            I AM RESISTING
          </button>

          <button
            type="button"
            onClick={() => setStatus('given_in')}
            className={`py-3.5 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none cursor-pointer ${
              status === 'given_in'
                ? 'bg-amber-50 border-amber-500 text-amber-800'
                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
            }`}
            id="status-given-in-btn"
          >
            <HeartCrack className={`w-4 h-4 ${status === 'given_in' ? 'text-amber-600' : 'text-slate-400'}`} />
            I SLIPPED
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-[0.98] cursor-pointer"
          id="submit-urge-btn"
        >
          {loading ? 'LOGGING...' : status === 'resisted' ? 'RESIST & START DISTRACTION' : 'RECORD SLIP DATA'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>

      {/* Immediate Crisis Trigger Button */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={() => onRequestDistraction(context.trim() || "sudden heavy urge")}
          className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer uppercase tracking-wider"
          id="quick-distract-btn"
        >
          <Zap className="w-4 h-4 fill-white" />
          URGENT: I NEED A DISTRACTION RIGHT NOW!
        </button>
      </div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border text-xs leading-relaxed ${
            status === 'resisted' 
              ? 'bg-indigo-50 border-indigo-100 text-indigo-800' 
              : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}
          id="success-message-banner"
        >
          {successMessage}
        </motion.div>
      )}
    </div>
  );
}

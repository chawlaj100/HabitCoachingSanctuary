import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, NudgeInsight } from '../types';
import { Sparkles, Brain, Compass, HelpCircle, RefreshCw } from 'lucide-react';

interface DailyNudgeProps {
  profile: UserProfile;
  streakCount: number;
  urgesCount: number;
}

export default function DailyNudge({ profile, streakCount, urgesCount }: DailyNudgeProps) {
  const [nudge, setNudge] = useState<NudgeInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNudge = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, streakCount, urgesCount })
      });
      const data = await response.json();
      setNudge({
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to fetch intelligent daily nudge:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNudge();
  }, [profile.habitToBreak]);

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'science':
        return {
          icon: <Brain className="w-5 h-5 text-indigo-600" />,
          bg: 'bg-indigo-50/30 border-indigo-100',
          badge: 'bg-indigo-100 text-indigo-800',
          label: 'NEUROSCIENCE'
        };
      case 'challenge':
        return {
          icon: <Compass className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50/50 border-emerald-100',
          badge: 'bg-emerald-100 text-emerald-800',
          label: 'MICRO CHALLENGE'
        };
      case 'checkin':
        return {
          icon: <HelpCircle className="w-5 h-5 text-slate-500" />,
          bg: 'bg-slate-50 border-slate-200',
          badge: 'bg-slate-200 text-slate-800',
          label: 'SELF COMPASSION'
        };
      case 'motivation':
      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
          bg: 'bg-indigo-50/50 border-indigo-100',
          badge: 'bg-indigo-100 text-indigo-600',
          label: 'INSIGHT'
        };
    }
  };

  const meta = getCategoryMeta(nudge?.category || 'motivation');

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm relative overflow-hidden" id="daily-nudge-card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Intelligent Daily Nudge
        </h3>
        <button
          onClick={fetchNudge}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-50 transition-all duration-150 rounded-lg hover:bg-slate-50 cursor-pointer"
          title="Regenerate daily nudge"
          id="regenerate-nudge-btn"
          aria-label="Refresh daily nudge"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse" aria-hidden="true">
          <div className="h-6 bg-slate-50 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-50 rounded-lg w-full" />
          <div className="h-4 bg-slate-50 rounded-lg w-5/6" />
        </div>
      ) : nudge ? (
        <motion.div
          key={nudge.timestamp}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`p-4 rounded-2xl border ${meta.bg} space-y-2.5`}
        >
          <div className="flex items-center gap-2">
            {meta.icon}
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold tracking-wider ${meta.badge}`}>
              {meta.label}
            </span>
          </div>
          <div>
            <h4 className="text-base font-sans font-semibold text-slate-800 tracking-tight">
              {nudge.title}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">
              {nudge.content}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="text-sm text-slate-400 text-center py-6">
          No daily nudge generated yet. Tap the refresh icon.
        </div>
      )}
    </div>
  );
}

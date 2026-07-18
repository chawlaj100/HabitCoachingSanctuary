import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, DistractionList, DistractionTask } from '../types';
import { ShieldAlert, CheckCircle2, Circle, Clock, Flame, RotateCcw, AlertCircle } from 'lucide-react';

interface DistractionHubProps {
  profile: UserProfile;
  activeTrigger: string | null;
  onClearTrigger: () => void;
  onLogSuccessfulResist: () => void;
}

export default function DistractionHub({ 
  profile, 
  activeTrigger, 
  onClearTrigger,
  onLogSuccessfulResist 
}: DistractionHubProps) {
  const [distractionList, setDistractionList] = useState<DistractionList | null>(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<DistractionTask[]>([]);
  const [completedAll, setCompletedAll] = useState(false);

  const fetchDistractions = async (trigger: string) => {
    setLoading(true);
    setCompletedAll(false);
    try {
      const response = await fetch('/api/gemini/distraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, trigger })
      });
      const data = await response.json();
      setDistractionList({
        theme: data.theme || "Hands-On Mindful Disruption",
        tasks: (data.tasks || []).map((t: any, idx: number) => ({
          id: t.id || `task_${idx}`,
          title: t.title || "Mindful Task",
          description: t.description || "Take a deep breath.",
          durationMinutes: t.durationMinutes || 3,
          completed: false
        })),
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to generate custom distraction list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTrigger) {
      fetchDistractions(activeTrigger);
    } else {
      // Load a general daily set at startup
      fetchDistractions("general boredom");
    }
  }, [activeTrigger, profile.distractionPreference]);

  useEffect(() => {
    if (distractionList) {
      setTasks(distractionList.tasks);
    }
  }, [distractionList]);

  const toggleTask = (taskId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updated);

    // Check if all are completed
    const allDone = updated.every(t => t.completed);
    if (allDone && !completedAll) {
      setCompletedAll(true);
      onLogSuccessfulResist();
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="distraction-hub-card">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            Distraction Challenge Hub
          </h3>
          <p className="text-xs text-slate-500">
            Tactile, positive alternatives tailored to break the urge cycle.
          </p>
        </div>

        {activeTrigger && (
          <span className="text-[10px] bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-bold border border-rose-100 flex items-center gap-1 animate-pulse uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            URGE TRIGGERED
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse py-4" aria-hidden="true">
          <div className="h-4 bg-slate-50 rounded w-1/3" />
          <div className="h-10 bg-slate-50 rounded-xl w-full" />
          <div className="h-10 bg-slate-50 rounded-xl w-full" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-wider block">CHALLENGE PACK Theme</span>
              <h4 className="text-base font-sans font-semibold text-slate-800 tracking-tight">{distractionList?.theme}</h4>
            </div>
            
            {activeTrigger && (
              <button
                onClick={onClearTrigger}
                className="text-xs font-mono font-bold text-slate-400 hover:text-slate-800 flex items-center gap-1 self-start sm:self-center cursor-pointer"
                id="reset-trigger-btn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET STATE
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono font-bold text-slate-400">
              <span>COMPLETION PROCESS</span>
              <span>{completedCount}/{tasks.length} COMPLETE</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Task list */}
          <div className="grid grid-cols-1 gap-3">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`w-full text-left p-4.5 rounded-2xl border text-sm transition-all duration-150 flex gap-3.5 items-start focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                  task.completed
                    ? 'bg-slate-50 border-slate-100 opacity-60'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/5'
                }`}
                id={`task-btn-${task.id}`}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </span>
                <div className="flex-1 space-y-1">
                  <span className={`font-semibold text-sm block ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {task.title}
                  </span>
                  <p className={`text-xs leading-relaxed ${task.completed ? 'text-slate-400' : 'text-slate-600'}`}>
                    {task.description}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-1.5 font-bold">
                    <Clock className="w-3 h-3" />
                    <span>{task.durationMinutes} MIN CHALLENGE</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Completed All Celebration Card */}
          {completedAll && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col items-center text-center space-y-3"
              id="celebration-panel"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Flame className="w-6 h-6 text-emerald-600 fill-emerald-100" />
              </div>
              <div>
                <h5 className="text-base font-sans font-bold text-emerald-950">URGE BREAKOUT SUCCESSFUL!</h5>
                <p className="text-xs text-emerald-800 max-w-sm mt-1 leading-relaxed">
                  You successfully redirected your neural loops. By keeping your hands busy for these crucial minutes, you avoided "{profile.habitToBreak}"! Keep this momentum!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-400 text-center py-8">
          Generating fresh redirection challenges...
        </div>
      )}
    </div>
  );
}

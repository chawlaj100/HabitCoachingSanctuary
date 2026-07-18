import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UrgeLog } from '../types';
import { Wind, Play, Square, Check, RefreshCw, Star, Sparkles } from 'lucide-react';

interface BreathingResetProps {
  profile: UserProfile;
  onLogResistedUrgeDirectly: (triggerContext: string) => Promise<void>;
}

type BreathingState = 'idle' | 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

export default function BreathingReset({ profile, onLogResistedUrgeDirectly }: BreathingResetProps) {
  const [breathingState, setBreathingState] = useState<BreathingState>('idle');
  const [cycleCount, setCycleCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [logging, setLogging] = useState(false);

  // Box Breathing cycle steps: Inhale (4s) -> Hold In (4s) -> Exhale (4s) -> Hold Out (4s)
  useEffect(() => {
    if (breathingState === 'idle') {
      setSecondsLeft(4);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition to next state
          setBreathingState((currState) => {
            switch (currState) {
              case 'inhale':
                return 'hold_in';
              case 'hold_in':
                return 'exhale';
              case 'exhale':
                return 'hold_out';
              case 'hold_out':
                // Completed one full cycle
                setCycleCount((c) => {
                  const nextCount = c + 1;
                  if (nextCount >= 3) {
                    setSessionCompleted(true);
                    return 3;
                  }
                  return nextCount;
                });
                return 'inhale';
              default:
                return 'idle';
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingState]);

  // If completed, automatically set to idle
  useEffect(() => {
    if (sessionCompleted) {
      setBreathingState('idle');
    }
  }, [sessionCompleted]);

  const handleStart = () => {
    setBreathingState('inhale');
    setCycleCount(0);
    setSecondsLeft(4);
    setSessionCompleted(false);
  };

  const handleStop = () => {
    setBreathingState('idle');
    setCycleCount(0);
    setSecondsLeft(4);
  };

  const handleLogReward = async () => {
    setLogging(true);
    try {
      await onLogResistedUrgeDirectly(`Completed 3-cycle Breathing Reset (Domain: ${profile.domain || 'general'})`);
      setSessionCompleted(false);
      setCycleCount(0);
    } catch (error) {
      console.error("Failed to log reward:", error);
    } finally {
      setLogging(false);
    }
  };

  const getStateDetails = () => {
    switch (breathingState) {
      case 'inhale':
        return {
          title: "Inhale Deeply",
          instruction: "Feel your chest expand and fill with oxygen.",
          color: "text-indigo-600 border-indigo-600",
          scale: 1.4,
          bgColor: "bg-indigo-50/40"
        };
      case 'hold_in':
        return {
          title: "Hold Your Breath",
          instruction: "Hold the stillness inside you.",
          color: "text-emerald-600 border-emerald-600",
          scale: 1.4,
          bgColor: "bg-emerald-50/40"
        };
      case 'exhale':
        return {
          title: "Exhale Slowly",
          instruction: "Let go of tension, stress, and urges.",
          color: "text-indigo-500 border-indigo-500",
          scale: 1.0,
          bgColor: "bg-indigo-50/10"
        };
      case 'hold_out':
        return {
          title: "Hold Empty",
          instruction: "Rest in the space between breaths.",
          color: "text-slate-500 border-slate-500",
          scale: 1.0,
          bgColor: "bg-slate-50"
        };
      case 'idle':
      default:
        return {
          title: "The Sanctuary Breathing Anchor",
          instruction: "Box breathing strengthens the prefrontal cortex, helping break automatic habit loops.",
          color: "text-slate-400 border-slate-200",
          scale: 1.0,
          bgColor: "bg-white"
        };
    }
  };

  const details = getStateDetails();

  const getDomainEncouragement = () => {
    switch (profile.domain) {
      case 'tech':
        return "Excellent compilation reset! You successfully cleared your mental cache and stayed offline.";
      case 'healthcare':
        return "Deep, grounding shift complete. You stabilized your neurological baseline beautifully.";
      case 'creative':
        return "An elegant brush stroke of mindfulness. You cleared your workspace canvas without digital noise.";
      case 'academia':
        return "Executive focus unlocked. You just re-trained your attention pathways for deeper study.";
      case 'corporate':
        return "High-value focus investment complete. You prioritized your cognitive energy over digital meetings.";
      case 'general':
      default:
        return "Urge deflected. You successfully holding space for clarity and took back control.";
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col items-center text-center relative overflow-hidden" id="breathing-reset-card">
      <div className="w-full text-left space-y-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-indigo-600" />
          Prefrontal Focus Breathing Anchor
        </h3>
        <p className="text-xs text-slate-500">
          When urge tension spikes, use this physical anchor to disrupt the automated neurological sequence.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!sessionCompleted ? (
          <motion.div 
            key="active" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-6 py-4 w-full"
          >
            {/* Main Visual Circle */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Outer Ripple Border */}
              <motion.div 
                animate={{
                  scale: breathingState !== 'idle' ? details.scale : 1.0,
                }}
                transition={{
                  duration: 4,
                  ease: "easeInOut"
                }}
                className={`absolute inset-0 rounded-full border-2 border-dashed transition-colors duration-500 ${details.color} ${details.bgColor}`}
              />

              {/* Inner Circle */}
              <motion.div 
                animate={{
                  scale: breathingState !== 'idle' ? details.scale - 0.1 : 0.9,
                }}
                transition={{
                  duration: 4,
                  ease: "easeInOut"
                }}
                className="w-36 h-36 rounded-full bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shadow-inner relative z-10"
              >
                {breathingState === 'idle' ? (
                  <Wind className="w-10 h-10 text-indigo-400" />
                ) : (
                  <div className="text-center space-y-1">
                    <span className="text-3xl font-sans font-bold text-slate-800 tracking-tight">{secondsLeft}</span>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block tracking-wider">Seconds</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Instruction Label */}
            <div className="space-y-1.5 max-w-sm px-4">
              <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block min-h-[16px]">
                {breathingState !== 'idle' ? breathingState.replace('_', ' ') : 'PREPARE STATE'}
              </span>
              <h4 className="text-lg font-sans font-semibold text-slate-800 tracking-tight transition-all duration-300">
                {details.title}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                {details.instruction}
              </p>
            </div>

            {/* Cycle Counters */}
            <div className="flex justify-center gap-2" id="breathing-cycle-indicators">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className={`w-10 h-2.5 rounded-full border transition-all duration-300 ${
                    cycleCount > i 
                      ? 'bg-indigo-600 border-indigo-600' 
                      : cycleCount === i && breathingState !== 'idle'
                        ? 'bg-indigo-50 border-indigo-400 animate-pulse'
                        : 'bg-slate-50 border-slate-200'
                  }`}
                  title={`Cycle ${i + 1}`}
                />
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-3 w-full max-w-xs">
              {breathingState === 'idle' ? (
                <button
                  onClick={handleStart}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold tracking-wider font-mono uppercase flex items-center justify-center gap-2 transition-all duration-150 shadow-sm cursor-pointer"
                  id="start-breathing-btn"
                >
                  <Play className="w-4 h-4 fill-white" />
                  START RESET (3 CYCLES)
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-2xl text-xs font-bold tracking-wider font-mono uppercase flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                  id="stop-breathing-btn"
                >
                  <Square className="w-4 h-4 fill-slate-600" />
                  STOP SESSION
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="completed" 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-3xl flex flex-col items-center space-y-4 w-full"
            id="breathing-success-panel"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-indigo-600 fill-indigo-200 animate-spin-slow" />
            </div>

            <div className="space-y-1 max-w-md">
              <h4 className="text-base font-sans font-bold text-indigo-950">RESET SESSION SUCCESSFULLY COMPLETE!</h4>
              <p className="text-xs text-indigo-800 leading-relaxed font-semibold">
                {getDomainEncouragement()}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
                By focusing your breathing for 3 complete cycles, you have effectively lowered your physiological stress response, disrupted the trigger cycle, and reasserted prefrontal command over automatic craving pathways.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5 w-full pt-2">
              <button
                onClick={handleLogReward}
                disabled={logging}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold tracking-wider font-mono uppercase flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer"
                id="claim-breath-log-btn"
              >
                <Check className="w-4 h-4" />
                {logging ? 'SAVING ANCHOR...' : 'LOG SUCCESSFUL DEFLECTION'}
              </button>
              <button
                onClick={handleStart}
                className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold tracking-wider font-mono uppercase flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer"
                id="reset-breath-btn"
              >
                <RefreshCw className="w-4 h-4" />
                BREATHE AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { Heart, Sparkles, Check, ArrowRight, BookOpen, Smile, Briefcase } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => Promise<void>;
}

const COMMON_HABITS = [
  "Doomscrolling / Social Media",
  "Excessive Screen Time",
  "Compulsive Snacking",
  "Nail Biting / Skin Picking",
  "Procrastinating / Task Avoidance",
  "Impulsive Online Shopping",
];

const COMMON_TRIGGERS = [
  "Boredom",
  "Stress or Work Anxiety",
  "Fatigue or Low Energy",
  "Loneliness / Seeking Connection",
  "Morning / Night Routine Habit",
  "Interrupted Concentration",
];

const COMMON_DOMAINS = [
  { id: 'tech', label: 'Technology & Engineering', desc: 'Software developers, designers, IT, or data analysts. Often triggered during compiling or debugging blocks.' },
  { id: 'healthcare', label: 'Healthcare & Science', desc: 'Doctors, nurses, lab techs, or researchers. Often triggered under high shift anxiety or fatigue.' },
  { id: 'creative', label: 'Creative Arts & Writing', desc: 'Writers, artists, designers, or creators. Often triggered during creative blocks or perfectionist stall-outs.' },
  { id: 'academia', label: 'Academia & Students', desc: 'Students, researchers, or teachers. Often triggered during study sessions or grading marathons.' },
  { id: 'corporate', label: 'Corporate & Management', desc: 'Business managers, marketers, or operational staff. Often triggered during tedious email flows or back-to-back syncs.' },
  { id: 'general', label: 'General / Daily Life', desc: 'General habit breaker focusing on everyday life, chore procrastination, or evening wind-downs.' }
];

const DISTRACTION_PREFERENCES = [
  { id: 'kinetic', label: 'Tactile & Kinetic', desc: 'Active body tasks, hand exercises, or dynamic object manipulation.' },
  { id: 'creative', label: 'Creative & Artistic', desc: 'Rapid sketching, scribbling, journal brainstorming, or folding.' },
  { id: 'mindful', label: 'Mindful & Grounding', desc: 'Breathing exercises, posture resets, or sensory observation prompts.' },
  { id: 'productive', label: 'Micro-Productivity', desc: 'Quick 3-minute decluttering, surface wiping, or item organization.' }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [habit, setHabit] = useState('');
  const [customHabit, setCustomHabit] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');
  const [domain, setDomain] = useState('general');
  const [wakeHour, setWakeHour] = useState('07:00');
  const [workHour, setWorkHour] = useState('09:00');
  const [sleepHour, setSleepHour] = useState('23:00');
  const [preference, setPreference] = useState('kinetic');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggleTrigger = (trig: string) => {
    if (triggers.includes(trig)) {
      setTriggers(triggers.filter(t => t !== trig));
    } else {
      setTriggers([...triggers, trig]);
    }
  };

  const handleAddCustomTrigger = () => {
    if (customTrigger.trim() && !triggers.includes(customTrigger.trim())) {
      setTriggers([...triggers, customTrigger.trim()]);
      setCustomTrigger('');
    }
  };

  const selectedHabit = habit === 'custom' ? customHabit : habit;

  const handleNext = async () => {
    if (step === 1 && !selectedHabit) return;
    if (step === 2 && triggers.length === 0) return;
    if (step < 5) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      setErrorMsg(null);
      try {
        await onComplete({
          habitToBreak: selectedHabit,
          triggers: triggers,
          wakeHour,
          workHour,
          sleepHour,
          distractionPreference: preference,
          domain: domain,
          createdAt: new Date().toISOString()
        });
      } catch (err: any) {
        console.error("Error saving onboarding profile: ", err);
        setErrorMsg(err?.message || "Failed to save profile. Please check your network or Firestore rules.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden"
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex justify-between items-center mb-6 text-xs text-slate-400 font-mono tracking-widest font-bold">
          <span>STEP {step} OF 5</span>
          <span>HABIT RE-ALIGNMENT</span>
        </div>

        {/* Step 1: Choose Habit */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-sans font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                <Heart className="w-6 h-6 text-indigo-600 fill-indigo-100" />
                What habit would you like to break?
              </h2>
              <p className="text-sm text-slate-500">
                Every positive rewrite starts with clarifying the focus. Choose one to begin.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[280px] overflow-y-auto overflow-x-hidden p-1">
              {COMMON_HABITS.map((item) => (
                <button
                  key={item}
                  onClick={() => { setHabit(item); setCustomHabit(''); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                    habit === item 
                      ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950 font-medium' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                  id={`habit-${item.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <span>{item}</span>
                  {habit === item && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}

              <button
                onClick={() => setHabit('custom')}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                  habit === 'custom' 
                    ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950 font-medium' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
                id="habit-custom"
              >
                <span>Write a custom habit...</span>
                {habit === 'custom' && <Check className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>

            {habit === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-1 px-1"
              >
                <input
                  type="text"
                  placeholder="e.g., Biting nails, eating sugar after dinner..."
                  value={customHabit}
                  onChange={(e) => setCustomHabit(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  id="custom-habit-input"
                  aria-label="Custom habit text input"
                />
              </motion.div>
            )}
          </div>
        )}

        {/* Step 2: Choose Triggers */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-sans font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Identify your common triggers
              </h2>
              <p className="text-sm text-slate-500">
                When does the urge to engage in <span className="font-semibold text-indigo-800">{selectedHabit}</span> peak? Select at least one.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto overflow-x-hidden p-1">
              {COMMON_TRIGGERS.map((item) => (
                <button
                  key={item}
                  onClick={() => handleToggleTrigger(item)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                    triggers.includes(item)
                      ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950 font-medium' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                  id={`trigger-${item.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <span>{item}</span>
                  {triggers.includes(item) && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>

            <div className="flex gap-2 p-1">
              <input
                type="text"
                placeholder="Add other custom trigger..."
                value={customTrigger}
                onChange={(e) => setCustomTrigger(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTrigger())}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                id="custom-trigger-input"
                aria-label="Custom trigger text input"
              />
              <button
                type="button"
                onClick={handleAddCustomTrigger}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-mono font-bold text-slate-600 rounded-xl border border-slate-200 cursor-pointer"
                id="add-trigger-btn"
              >
                ADD
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Professional Domain */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-sans font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-indigo-600" />
                Select your focus domain
              </h2>
              <p className="text-sm text-slate-500">
                Tailor distraction challenges, daily motivation, and AI coaching triggers to align with your career or lifestyle.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
              {COMMON_DOMAINS.map((dom) => (
                <button
                  key={dom.id}
                  onClick={() => setDomain(dom.id)}
                  className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all duration-150 flex flex-col gap-0.5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                    domain === dom.id
                      ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                  id={`domain-${dom.id}`}
                >
                  <span className="font-semibold text-sm flex items-center justify-between w-full">
                    {dom.label}
                    {domain === dom.id && <Check className="w-4 h-4 text-indigo-600" />}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed mt-0.5">{dom.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Define Daily Schedule */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-sans font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                Define your daily timeline
              </h2>
              <p className="text-sm text-slate-500">
                AI-generated support and reminders will adapt to coordinate with your active schedule.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 font-bold block" htmlFor="wake-hour">WAKE HOUR</label>
                  <input
                    type="time"
                    value={wakeHour}
                    onChange={(e) => setWakeHour(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    id="wake-hour"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 font-bold block" htmlFor="work-hour">WORK START</label>
                  <input
                    type="time"
                    value={workHour}
                    onChange={(e) => setWorkHour(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    id="work-hour"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 font-bold block" htmlFor="sleep-hour">SLEEP HOUR</label>
                  <input
                    type="time"
                    value={sleepHour}
                    onChange={(e) => setSleepHour(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    id="sleep-hour"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs text-slate-500 flex items-start gap-2.5">
                <Smile className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <p className="leading-relaxed">
                  Keeping a consistent diurnal routine is scientifically proven to strengthen the prefrontal cortex, which governs executive function and impulse regulation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Choose Distraction Style */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-sans font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                <Smile className="w-6 h-6 text-indigo-600" />
                Choose a distraction style
              </h2>
              <p className="text-sm text-slate-500">
                When urges hit, what style of active replacement task will best help redirect your hands and focus?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 p-1">
              {DISTRACTION_PREFERENCES.map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => setPreference(pref.id)}
                  className={`w-full text-left p-4 rounded-xl border text-sm transition-all duration-150 flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                    preference === pref.id
                      ? 'bg-indigo-50/50 border-indigo-500 text-indigo-950' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                  id={`pref-${pref.id}`}
                >
                  <span className="font-semibold text-sm flex items-center justify-between w-full">
                    {pref.label}
                    {preference === pref.id && <Check className="w-4 h-4 text-indigo-600" />}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed mt-0.5">{pref.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-800 text-xs leading-relaxed" id="onboarding-error-banner">
            {errorMsg}
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={submitting}
            className={`px-4 py-2 text-sm text-slate-400 font-mono font-bold hover:text-slate-700 focus:outline-none transition-all duration-150 cursor-pointer ${
              step === 1 ? 'opacity-0 pointer-events-none' : ''
            } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            id="onboarding-back-btn"
          >
            BACK
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={
              submitting ||
              (step === 1 && !selectedHabit) ||
              (step === 2 && triggers.length === 0)
            }
            className={`px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer ${
              (submitting || (step === 1 && !selectedHabit) || (step === 2 && triggers.length === 0)) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
            id="onboarding-next-btn"
          >
            <span>{submitting ? 'COMPLETING...' : step === 5 ? 'COMPLETE SETUP' : 'CONTINUE'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

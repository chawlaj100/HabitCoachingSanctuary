import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  subscribeToAuth, 
  signOutUser, 
  getUserProfile, 
  saveUserProfile, 
  logUrge, 
  subscribeToUrges, 
  saveChatMessage, 
  getChatHistory, 
  clearChatHistory,
  isFirebaseEnabled 
} from './lib/firebase';
import { UserProfile, UrgeLog, ChatMessage } from './types';
import Onboarding from './components/Onboarding';
import DailyNudge from './components/DailyNudge';
import UrgeLogger from './components/UrgeLogger';
import DistractionHub from './components/DistractionHub';
import CoachingChat from './components/CoachingChat';
import ProgressCharts from './components/ProgressCharts';
import BreathingReset from './components/BreathingReset';
import { 
  Sparkles, 
  LogOut, 
  BrainCircuit, 
  User, 
  Activity, 
  MessageSquare, 
  Shield, 
  Heart, 
  ListTodo, 
  Lock,
  Globe,
  WifiOff
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string | null; displayName: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [urges, setUrges] = useState<UrgeLog[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'distractions'>('dashboard');
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Local Guest Sign-In form state
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');

  // Subscribe to Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch profile, urges, and chat history when user changes
  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setUrges([]);
      setChatHistory([]);
      return;
    }

    setLoadingProfile(true);
    
    // Load profile
    getUserProfile(currentUser.uid).then((p) => {
      setProfile(p);
      setLoadingProfile(false);
    }).catch(err => {
      console.error("Error loading user profile: ", err);
      setLoadingProfile(false);
    });

    // Subscribe to urge logs
    const unsubscribeUrges = subscribeToUrges(currentUser.uid, (logs) => {
      setUrges(logs);
      
      // Calculate active streak based on resistance
      // For this algorithm, streak is the number of consecutive days with at least one 'resisted' urge and ZERO 'given_in' slips.
      // If there are no slips logged in the last 24 hours, streak increments by 1 for each day.
      // Let's compute a friendly realistic streak count based on the logs, and fallback to 1 if they have any logs, otherwise 0.
      if (logs.length === 0) {
        setStreakCount(0);
      } else {
        const slips = logs.filter(l => l.status === 'given_in');
        if (slips.length === 0) {
          // No slips! Streak is active. Let's base it on the number of resisted urges, maxed at a reasonable streak or days of usage.
          const uniqueDays = new Set(logs.map(l => l.timestamp.split('T')[0])).size;
          setStreakCount(uniqueDays || 1);
        } else {
          // If latest log is a slip, streak is 0. Otherwise count days since last slip.
          const latestLog = logs[0];
          if (latestLog.status === 'given_in') {
            setStreakCount(0);
          } else {
            // Count resisted logs after the latest slip
            const latestSlipTime = new Date(slips[0].timestamp).getTime();
            const logsSinceSlip = logs.filter(l => new Date(l.timestamp).getTime() > latestSlipTime);
            const uniqueDays = new Set(logsSinceSlip.map(l => l.timestamp.split('T')[0])).size;
            setStreakCount(uniqueDays || 1);
          }
        }
      }
    });

    // Load Chat history
    getChatHistory(currentUser.uid).then((history) => {
      setChatHistory(history);
    });

    return () => {
      if (unsubscribeUrges) unsubscribeUrges();
    };
  }, [currentUser]);

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    if (!currentUser) return;
    try {
      await saveUserProfile(currentUser.uid, newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error("Error saving onboarding profile: ", error);
    }
  };

  const handleLogUrge = async (urgeData: Omit<UrgeLog, 'id'>) => {
    if (!currentUser) throw new Error("No authenticated user");
    return await logUrge(currentUser.uid, urgeData);
  };

  const handleRequestDistraction = (triggerContext: string) => {
    setActiveTrigger(triggerContext);
    setActiveTab('distractions');
  };

  const handleLogSuccessfulResist = () => {
    // Increment streak visually in the session
    setStreakCount(prev => prev + 1);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;

    // 1. Create and save User message
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    await saveChatMessage(currentUser.uid, userMsg);

    // 2. Call server-side Express endpoint to query Gemini
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          profile
        })
      });
      
      const data = await response.json();
      
      // 3. Create and save AI message
      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, aiMsg]);
      await saveChatMessage(currentUser.uid, aiMsg);
    } catch (error) {
      console.error("Failed to fetch coaching chat response: ", error);
    }
  };

  const handleClearChatHistory = async () => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to clear your conversation history?")) {
      await clearChatHistory(currentUser.uid);
      setChatHistory([]);
    }
  };

  const handleLocalSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail) return;
    
    // Simulate auth login with client local storage
    const uid = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      uid,
      email: guestEmail,
      displayName: guestName
    };
    localStorage.setItem('habit_coach_mock_user', JSON.stringify(guestUser));
    setCurrentUser(guestUser);
  };

  const handleLogout = async () => {
    await signOutUser();
  };

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
        <span className="text-xs font-mono font-bold text-slate-400 mt-4 tracking-widest uppercase">COGNITIVE SECURE LOADING...</span>
      </div>
    );
  }

  // --- 1. Login / Welcome View ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between" id="welcome-screen">
        <header className="px-6 py-5 max-w-7xl mx-auto w-full flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight font-sans text-slate-800">Habit Coaching Sanctuary</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
            {isFirebaseEnabled ? (
              <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-wider text-[10px]">
                <Globe className="w-3.5 h-3.5" />
                ONLINE DB ENABLED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-wider text-[10px]">
                <WifiOff className="w-3.5 h-3.5" />
                OFFLINE LOCAL STORAGE
              </span>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto w-full px-4 py-16 flex-1 flex flex-col md:flex-row items-center justify-center gap-12">
          {/* Brand Introduction */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold block">
                INTELLIGENT HABIT REALIGNMENT
              </span>
              <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-slate-800 leading-none">
                Rewrite your automatic reactions.
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                Overcome screen-time, doomscrolling, and mindless distractions. Shift focus through responsive real-time challenges, AI prompts, and personal neuroscience tracking.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 text-sm text-left">
                <Heart className="w-5 h-5 text-indigo-600 fill-indigo-50 mt-0.5 flex-shrink-0" />
                <span><strong>Positive alternatives:</strong> Generates fun tactile and physical alternatives immediately to replace bad cravings.</span>
              </div>
              <div className="flex items-start gap-3.5 text-sm text-left">
                <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <span><strong>Coaching without judgment:</strong> Gemini coaching that adjusts dynamically, guiding you safely through slips and celebrating streaks.</span>
              </div>
            </div>
          </div>

          {/* Authentic login box */}
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-sans font-bold text-slate-800 tracking-tight">Create your sanctuary</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configure your personal setup</p>
            </div>

            <form onSubmit={handleLocalSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block" htmlFor="login-name">YOUR FIRST NAME</label>
                <input
                  id="login-name"
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block" htmlFor="login-email">EMAIL ADDRESS</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="e.g. alex@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold tracking-wider font-mono uppercase transition-all duration-150 shadow-sm cursor-pointer"
                id="guest-login-btn"
              >
                ENTER SECURE GUEST SANCTUARY
              </button>
            </form>
          </div>
        </main>

        <footer className="py-6 border-t border-slate-100 text-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
          © {new Date().getFullYear()} HABIT RE-ALIGNMENT SYSTEM • PRIVATE & SECURE DATA PLATFORM
        </footer>
      </div>
    );
  }

  // --- 2. Onboarding Flow ---
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // --- 3. Master Dashboard Shell ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col" id="dashboard-container">
      {/* Dynamic Alert Banner for Active Trigger redirection */}
      {activeTrigger && (
        <div className="bg-indigo-600 text-white text-xs px-4 py-2.5 font-mono flex justify-between items-center z-50 shadow-md">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 animate-pulse text-indigo-200" />
            URGENT REAL-TIME REDIRECTION IN PROGRESS: Triggered by "{activeTrigger}"
          </span>
          <button 
            onClick={() => { setActiveTrigger(null); setActiveTab('dashboard'); }}
            className="underline hover:text-indigo-100 font-bold cursor-pointer"
          >
            DISMISS ALERT
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white border-b border-slate-100 py-4.5 px-6 md:px-8 max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">RE-ALIGNMENT HUB</span>
            <h1 className="text-lg font-sans font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              Habit Coaching System
            </h1>
          </div>
        </div>

        {/* User profile & Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-slate-400" />
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold block text-slate-800">{currentUser.displayName || "Sanctuary User"}</span>
              <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase tracking-wider">HABIT: {profile.habitToBreak}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-150 cursor-pointer"
            title="Log out"
            id="header-logout-btn"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Tab Triggers */}
      <div className="bg-slate-50 py-3 border-b border-slate-100 max-w-7xl mx-auto w-full px-6 md:px-8 flex-shrink-0">
        <div className="flex border border-slate-100 rounded-2xl overflow-hidden bg-white max-w-md shadow-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 text-xs font-mono font-bold transition-all duration-150 focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id="tab-dashboard"
          >
            <Activity className="w-4 h-4" />
            DASHBOARD
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-xs font-mono font-bold transition-all duration-150 focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id="tab-chat"
          >
            <MessageSquare className="w-4 h-4" />
            COACH CHAT
          </button>

          <button
            onClick={() => setActiveTab('distractions')}
            className={`flex-1 py-3 text-xs font-mono font-bold transition-all duration-150 focus:outline-none flex items-center justify-center gap-1.5 relative cursor-pointer ${
              activeTab === 'distractions'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id="tab-distractions"
          >
            <ListTodo className="w-4 h-4" />
            DISTRACTIONS
            {activeTrigger && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Primary Dashboard Grid / View Coordination */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-8 py-8 min-h-0 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8" id="dashboard-home-view">
            {/* Top Stat Bento Grid */}
            <ProgressCharts streakCount={streakCount} urges={urges} />

            {/* Main Interactive Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Daily Nudge & Logger Column */}
              <div className="lg:col-span-5 space-y-6">
                <DailyNudge 
                  profile={profile} 
                  streakCount={streakCount} 
                  urgesCount={urges.length} 
                />
                
                <UrgeLogger 
                  profile={profile} 
                  onLogUrge={handleLogUrge} 
                  onRequestDistraction={handleRequestDistraction} 
                />

                <BreathingReset 
                  profile={profile} 
                  onLogResistedUrgeDirectly={async (context) => {
                    await handleLogUrge({
                      timestamp: new Date().toISOString(),
                      intensity: 3,
                      triggerContext: context,
                      status: 'resisted',
                      distractionOffered: 'Yes'
                    });
                  }}
                />
              </div>

              {/* Urge History Timeline */}
              <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    Anchor History Timeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your private timeline of awareness. Recognizing and logging urges weakens their automatic trigger strength.
                  </p>
                </div>

                {urges.length === 0 ? (
                  <div className="text-center py-16 text-sm text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
                    Your awareness record is blank.
                    <br />
                    Use the logger above when you feel an urge.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                    {urges.map((u) => (
                      <div 
                        key={u.id}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 text-xs transition-all duration-150 hover:bg-white hover:border-slate-200"
                        id={`urge-row-${u.id}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">"{u.triggerContext}"</span>
                            <span className="text-[10px] font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
                              INTENSITY {u.intensity}/10
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold font-mono block">
                            {new Date(u.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div>
                          {u.status === 'resisted' ? (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full uppercase tracking-wider font-mono">
                              RESISTED
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full uppercase tracking-wider font-mono">
                              SLIPPED
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div id="dashboard-chat-view" className="max-w-3xl mx-auto">
            <CoachingChat 
              profile={profile} 
              chatHistory={chatHistory} 
              onSendMessage={handleSendMessage} 
              onClearHistory={handleClearChatHistory} 
            />
          </div>
        )}

        {activeTab === 'distractions' && (
          <div id="dashboard-distractions-view" className="max-w-2xl mx-auto">
            <DistractionHub 
              profile={profile} 
              activeTrigger={activeTrigger} 
              onClearTrigger={() => setActiveTrigger(null)} 
              onLogSuccessfulResist={handleLogSuccessfulResist} 
            />
          </div>
        )}
      </main>

      <footer className="py-5 border-t border-slate-100 text-center text-[10px] font-mono font-bold text-slate-400 flex-shrink-0 uppercase tracking-widest">
        HABIT COACH RE-ALIGNMENT SUITE • DESIGNED TO BREAK SCREEN ADDICTIONS • STRICT DATA PRIVACY SECURED
      </footer>
    </div>
  );
}

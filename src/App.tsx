import { useState, useEffect } from 'react';
import { 
  subscribeToAuth, 
  signOutUser, 
  getUserProfile, 
  saveUserProfile, 
  logUrge, 
  subscribeToUrges, 
  saveChatMessage, 
  getChatHistory, 
  clearChatHistory
} from './lib/firebase';
import { UserProfile, UrgeLog, ChatMessage } from './types';
import { calculateStreak } from './lib/streak';
import Onboarding from './components/Onboarding';
import AuthScreen from './components/AuthScreen';
import DailyNudge from './components/DailyNudge';
import UrgeLogger from './components/UrgeLogger';
import DistractionHub from './components/DistractionHub';
import CoachingChat from './components/CoachingChat';
import ProgressCharts from './components/ProgressCharts';
import BreathingReset from './components/BreathingReset';
import { 
  LogOut, 
  BrainCircuit, 
  User, 
  Activity, 
  MessageSquare, 
  ListTodo
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
  const [, setLoadingProfile] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
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
      setDbError(null);
      return;
    }

    setLoadingProfile(true);
    setDbError(null);
    
    // Load profile
    getUserProfile(currentUser.uid).then((p) => {
      setProfile(p);
      setLoadingProfile(false);
    }).catch(err => {
      console.error("Error loading user profile: ", err);
      setLoadingProfile(false);
      setDbError(`Failed to load user profile: ${err.message || "Please check your network or Firestore rules."}`);
    });

    // Subscribe to urge logs
    const unsubscribeUrges = subscribeToUrges(currentUser.uid, (logs) => {
      setUrges(logs);
      setStreakCount(calculateStreak(logs));
    }, (err) => {
      console.error("Error subscribing to urges: ", err);
      setDbError(`Failed to subscribe to urge updates: ${err.message || "Please check your Firestore rules."}`);
    });

    // Load Chat history
    getChatHistory(currentUser.uid).then((history) => {
      setChatHistory(history);
    }).catch(err => {
      console.error("Error loading chat history: ", err);
      setDbError(`Failed to load chat history: ${err.message || "Please check your Firestore rules."}`);
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
    
    try {
      await saveChatMessage(currentUser.uid, userMsg);
    } catch (err: any) {
      console.error("Failed to save user chat message: ", err);
      const errAlertMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: `⚠️ Sync Warning: Unable to save message to the database. This can happen if Firebase rules or write permissions are not fully configured.\nError: ${err.message || err}`,
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errAlertMsg]);
      return;
    }

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
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // 3. Create and save AI message
      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: data.text || "I am reflecting on your response. Could you please share more?",
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, aiMsg]);
      try {
        await saveChatMessage(currentUser.uid, aiMsg);
      } catch (e) {
        console.warn("Failed to write AI chat message to cloud:", e);
      }
    } catch (error: any) {
      console.error("Failed to fetch coaching chat response: ", error);
      const aiErrorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'ai',
        text: `I had a brief connection interruption with my AI core. Take a slow, intentional breath, and try sending your message again in a few moments.\n(Error: ${error.message || error})`,
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, aiErrorMsg]);
    }
  };

  const handleClearChatHistory = async () => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to clear your conversation history?")) {
      await clearChatHistory(currentUser.uid);
      setChatHistory([]);
    }
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
      <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />
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
      {/* Global database connection or permission warning banner */}
      {dbError && (
        <div className="bg-rose-600 text-white text-xs px-4 py-2.5 font-mono flex justify-between items-center z-50 shadow-md">
          <span className="flex items-center gap-1.5">
            <span className="font-bold">⚠️ DATABASE CONNECTION WARNING:</span>
            {dbError}
          </span>
          <button 
            onClick={() => setDbError(null)}
            className="underline hover:text-rose-100 font-bold cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

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

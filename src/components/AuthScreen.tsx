import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  resetPassword 
} from '../lib/firebase';
import { 
  validateEmail, 
  checkPasswordStrength, 
  PasswordStrengthResult 
} from '../lib/validation';
import { 
  BrainCircuit, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Flame,
  MessageSquare,
  Wind,
  BarChart3
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

type AuthTab = 'signin' | 'signup' | 'forgot';

const features = [
  {
    title: "AI Coaching Chat",
    description: "Receive personalized, supportive guidance from your non-judgmental AI mindfulness coach whenever you need a real-time reset.",
    icon: MessageSquare,
    color: "text-emerald-500 bg-emerald-50 border-emerald-100",
  },
  {
    title: "Urge Logging & Anchoring",
    description: "Instantly log sudden behavioral urges and defuse them with clinically backed cognitive anchors and grounding exercises.",
    icon: Flame,
    color: "text-orange-500 bg-orange-50 border-orange-100",
  },
  {
    title: "Guided Breathing Reset",
    description: "Quiet your fight-or-flight response with responsive interactive breathing loops configured to calm your nervous system.",
    icon: Wind,
    color: "text-sky-500 bg-sky-50 border-sky-100",
  },
  {
    title: "Distraction Replacement Hub",
    description: "Replace mindless doomscrolling with rewarding micro-challenges, puzzles, and interactive healthy redirection triggers.",
    icon: BrainCircuit,
    color: "text-indigo-500 bg-indigo-50 border-indigo-100",
  },
  {
    title: "Neuroscience Progress Analytics",
    description: "Analyze your cognitive growth, trace trigger patterns, and track personal habit streak milestones with interactive charts.",
    icon: BarChart3,
    color: "text-violet-500 bg-violet-50 border-violet-100",
  }
];

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide effect (moves every 5 seconds)
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, []);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Live Validation
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult>({
    score: 0,
    feedback: 'Password is required.',
    isValid: false
  });

  // Keep validation state updated
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => {
      clearTimeout(timer);
    };
  }, [toast]);

  // Translate raw Firebase Auth codes to friendly, beautiful micro-copy
  const translateAuthError = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return "We couldn't find an account with that email. Would you like to sign up?";
      case 'auth/wrong-password':
        return "Incorrect password. Please try again, or use 'Forgot Password' to reset it.";
      case 'auth/email-already-in-use':
        return "An account with this email already exists. Try signing in instead.";
      case 'auth/weak-password':
        return "Your password is too weak. Please ensure it is at least 8 characters long.";
      case 'auth/invalid-credential':
        return "Invalid login credentials. Please verify your email and password.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/too-many-requests':
        return "Access has been temporarily blocked due to multiple failed attempts. Please try again later.";
      case 'auth/unauthorized-domain':
        return "This domain is not authorized in your Firebase console. Please add your App URL to 'Authorized domains' in your Firebase Auth settings.";
      case 'auth/popup-closed-by-user':
        return "The login popup was closed before completion. Please try again.";
      case 'auth/popup-blocked':
        return "The login popup was blocked. Please enable popups or try opening the app in a new tab.";
      case 'auth/operation-not-allowed':
      case 'auth/configuration-not-found':
        return "Google sign-in is not enabled in your Firebase project. Please go to the Firebase Console (Authentication > Sign-in method), click 'Add new provider', and enable 'Google'.";
      default:
        return `Authentication failed: ${code}. Please open the app in a new tab or check your console.`;
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setToast(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      setToast({
        message: translateAuthError(err?.code || 'auth/google-failed'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    // Initial validations
    if (!validateEmail(email)) {
      setToast({ message: "Please enter a valid email address.", type: 'error' });
      setEmailTouched(true);
      return;
    }

    if (activeTab === 'signup') {
      if (!name.trim()) {
        setToast({ message: "Please enter your name.", type: 'error' });
        setNameTouched(true);
        return;
      }
      if (!passwordStrength.isValid) {
        setToast({ message: "Password does not meet safety standards.", type: 'error' });
        setPasswordTouched(true);
        return;
      }
    } else if (activeTab === 'signin' && !password) {
      setToast({ message: "Password is required.", type: 'error' });
      setPasswordTouched(true);
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'signin') {
        const user = await signInWithEmail(email, password);
        if (user) {
          onAuthSuccess(user);
        }
      } else {
        const user = await signUpWithEmail(email, password, name);
        if (user) {
          onAuthSuccess(user);
          setToast({
            message: "Account created successfully! Welcome to your sanctuary.",
            type: 'success'
          });
        }
      }
    } catch (err: any) {
      console.error("Auth action failed:", err);
      setToast({
        message: translateAuthError(err?.code || err?.message),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!validateEmail(email)) {
      setToast({ message: "Please enter a valid email address to reset password.", type: 'error' });
      setEmailTouched(true);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setToast({
        message: "A secure password recovery link has been dispatched to your email address.",
        type: 'success'
      });
      setActiveTab('signin');
    } catch (err: any) {
      console.error("Password reset error:", err);
      setToast({
        message: translateAuthError(err?.code || err?.message),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const isEmailError = emailTouched && !validateEmail(email);
  const isPasswordError = activeTab === 'signup' && passwordTouched && !passwordStrength.isValid;
  const isNameError = activeTab === 'signup' && nameTouched && !name.trim();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between" id="auth-screen">
      {/* Upper Navigation / Status Info */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight font-sans text-slate-800">Habit Coaching Sanctuary</span>
        </div>
      </header>

      {/* Main Authentic Interactive Layout */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 md:py-16 flex-1 flex flex-col md:flex-row items-center justify-center gap-12">
        
        {/* Brand/Inspirational Info */}
        <div className="flex-1 space-y-6 text-center md:text-left flex flex-col justify-center">
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold block">
              INTELLIGENT HABIT REALIGNMENT
            </span>
            <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-slate-800 leading-none">
              Rewrite your automatic reactions.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto md:mx-0">
              Overcome screen-time, doomscrolling, and mindless distractions. Shift focus through responsive real-time challenges, AI prompts, and personal neuroscience tracking.
            </p>
          </div>

          {/* Feature Slider */}
          <div className="pt-2 hidden md:block max-w-md w-full mx-auto md:mx-0">
            <div className="relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm min-h-[140px] flex flex-col justify-between overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2.5 flex-1 flex flex-col justify-center"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${features[currentSlide].color}`}>
                      {(() => {
                        const IconComponent = features[currentSlide].icon;
                        return <IconComponent className="w-5 h-5" />;
                      })()}
                    </div>
                    <span className="font-sans font-bold text-sm text-slate-800">
                      {features[currentSlide].title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed text-left">
                    {features[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Slider Dots */}
              <div className="flex items-center gap-1.5 justify-center mt-3">
                {features.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlide === idx ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auth Interface Card */}
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6 relative overflow-hidden">
          
          {/* Animated Toasts */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-4 left-4 right-4 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs z-50 border shadow-sm ${
                  toast.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                    : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}
                role="alert"
                id="auth-toast"
              >
                {toast.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-sans">
                  {toast.message}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Header / Tabs */}
          {activeTab !== 'forgot' && (
            <div className="flex bg-slate-100 p-1 rounded-2xl" role="tablist">
              <button
                type="button"
                className={`flex-1 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'signin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
                role="tab"
                aria-selected={activeTab === 'signin'}
                id="signin-tab-button"
                onClick={() => {
                  setActiveTab('signin');
                  setToast(null);
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
                role="tab"
                aria-selected={activeTab === 'signup'}
                id="signup-tab-button"
                onClick={() => {
                  setActiveTab('signup');
                  setToast(null);
                }}
              >
                Sign Up
              </button>
            </div>
          )}

          {activeTab === 'forgot' && (
            <div className="space-y-1">
              <h2 className="text-lg font-sans font-bold text-slate-800 tracking-tight">Recover Password</h2>
              <p className="text-xs text-slate-400">Enter your email address and we will dispatch a recovery link.</p>
            </div>
          )}

          {/* Google SSO / One-Click Authentication */}
          {activeTab !== 'forgot' && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-2xl text-xs font-bold tracking-wide font-mono uppercase flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
                id="google-signin-btn"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">or email login</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>
            </div>
          )}

          {/* Custom Forms */}
          {activeTab !== 'forgot' ? (
            <form onSubmit={handleEmailAction} className="space-y-4" id="email-auth-form">
              {/* Full Name field (Sign Up Only) */}
              {activeTab === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 block" htmlFor="auth-name">
                    YOUR NAME
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      aria-invalid={isNameError}
                      placeholder="e.g. Alex Johnson"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameTouched) setNameTouched(false);
                      }}
                      onBlur={() => setNameTouched(true)}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        isNameError ? 'border-rose-300 ring-rose-100' : 'border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Email Address field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block" htmlFor="auth-email">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    aria-invalid={isEmailError}
                    placeholder="e.g. alex@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailTouched) setEmailTouched(false);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      isEmailError ? 'border-rose-300 ring-rose-100' : 'border-slate-200'
                    }`}
                  />
                </div>
                {isEmailError && (
                  <p className="text-[10px] text-rose-500 font-mono font-bold" id="email-error-text">
                    * Please enter a valid email.
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold text-slate-400 block" htmlFor="auth-password">
                    PASSWORD
                  </label>
                  {activeTab === 'signin' && (
                    <button
                      type="button"
                      className="text-[10px] font-mono font-bold text-indigo-500 hover:underline cursor-pointer"
                      id="forgot-password-link"
                      onClick={() => {
                        setActiveTab('forgot');
                        setToast(null);
                      }}
                    >
                      FORGOT PASSWORD?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    aria-invalid={isPasswordError}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordTouched) setPasswordTouched(false);
                    }}
                    onBlur={() => setPasswordTouched(true)}
                    className={`w-full pl-11 pr-12 py-3 bg-slate-50 border rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      isPasswordError ? 'border-rose-300 ring-rose-100' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-300 hover:text-slate-500 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    id="show-hide-password-btn"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter (Sign Up Only) */}
                {activeTab === 'signup' && password.length > 0 && (
                  <div className="space-y-1.5 pt-1" id="password-strength-indicator">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i < passwordStrength.score
                              ? passwordStrength.score <= 1
                                ? 'bg-rose-500'
                                : passwordStrength.score === 2
                                ? 'bg-amber-500'
                                : passwordStrength.score === 3
                                ? 'bg-yellow-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[10px] font-medium leading-none ${
                      passwordStrength.isValid ? 'text-slate-500' : 'text-rose-500 font-bold'
                    }`}>
                      {passwordStrength.feedback}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold tracking-wider font-mono uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                id="submit-auth-btn"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {activeTab === 'signin' ? 'Sign In' : 'Create Sanctuary'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Flow */
            <form onSubmit={handleForgotPassword} className="space-y-4" id="forgot-auth-form">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block" htmlFor="forgot-email">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="e.g. alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setToast(null);
                  }}
                  disabled={loading}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 rounded-2xl text-xs font-bold tracking-wide font-mono uppercase transition-all cursor-pointer"
                  id="cancel-forgot-btn"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold tracking-wide font-mono uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  id="submit-forgot-btn"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'RESET'}
                </button>
              </div>
            </form>
          )}

          {/* Inspirational footer tag */}
          <div className="pt-2 text-center">
            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-slate-300 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-slate-300" />
              Mindfulness-First Cognitive Anchoring
            </span>
          </div>

        </div>
      </main>

      {/* Corporate / System footer */}
      <footer className="py-6 border-t border-slate-100 text-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
        © {new Date().getFullYear()} HABIT RE-ALIGNMENT SYSTEM • PRIVATE & SECURE DATA PLATFORM
      </footer>
    </div>
  );
}

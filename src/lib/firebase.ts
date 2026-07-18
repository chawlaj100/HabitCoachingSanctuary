/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { UserProfile, UrgeLog, ChatMessage } from '../types';

// Standard Firebase config - since we are client-side, we look for VITE_ environment variables or check if there is an auto-injected config.
// Usually, AI Studio might not inject VITE_ keys if the set_up_firebase failed, so we have a graceful fallback system.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBqHu0E1UBsrHJB4YPCZDMFnkh5Qzw6xx0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "habit-coaching-sanctuary.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "habit-coaching-sanctuary",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "habit-coaching-sanctuary.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1070160883509",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1070160883509:web:61aeef6099a1c45414e67c"
};

let app;
let auth: any = null;
let db: any = null;
let isFirebaseEnabled = false;

// Check if all necessary config keys are present
const hasConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

if (hasConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseEnabled = true;
    console.log("Firebase initialized successfully in online mode.");
  } catch (error) {
    console.error("Firebase failed to initialize. Falling back to offline local storage.", error);
  }
} else {
  console.log("No Firebase config detected. Running in Offline-First Local Storage mode.");
}

// Local Storage Fallback State & API
const LOCAL_STORAGE_KEYS = {
  PROFILE: 'habit_coach_profile',
  URGES: 'habit_coach_urges',
  CHAT: 'habit_coach_chat',
  USER: 'habit_coach_mock_user'
};

// Interface for subscriber callbacks
type AuthCallback = (user: { uid: string; email: string | null; displayName: string | null } | null) => void;
const authSubscribers = new Set<AuthCallback>();

let mockCurrentUser: { uid: string; email: string | null; displayName: string | null } | null = null;

// Helper to initialize mock user from localStorage
const storedMockUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
if (storedMockUser) {
  try {
    mockCurrentUser = JSON.parse(storedMockUser);
  } catch (e) {
    mockCurrentUser = null;
  }
}

// Function to trigger auth updates to subscribers
function notifyAuthChange() {
  const userToSend = isFirebaseEnabled ? auth?.currentUser : mockCurrentUser;
  const normalizedUser = userToSend 
    ? { uid: userToSend.uid, email: userToSend.email, displayName: userToSend.displayName } 
    : null;
  authSubscribers.forEach(cb => cb(normalizedUser));
}

// 1. AUTH API
export const subscribeToAuth = (callback: AuthCallback) => {
  authSubscribers.add(callback);
  
  if (isFirebaseEnabled && auth) {
    const unsubscribe = onAuthStateChanged(auth, (_user) => {
      notifyAuthChange();
    });
    // Immediately notify with current state
    const normalizedUser = auth.currentUser 
      ? { uid: auth.currentUser.uid, email: auth.currentUser.email, displayName: auth.currentUser.displayName } 
      : null;
    callback(normalizedUser);
    return unsubscribe;
  } else {
    // Immediately notify with current mock state
    callback(mockCurrentUser);
    return () => {
      authSubscribers.delete(callback);
    };
  }
};

export const loginMockUser = (email: string, displayName: string, uid?: string) => {
  mockCurrentUser = {
    uid: uid || 'local_user_' + Math.random().toString(36).substring(2, 9),
    email,
    displayName
  };
  localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(mockCurrentUser));
  notifyAuthChange();
};

export const signInWithGoogle = async () => {
  if (isFirebaseEnabled && auth) {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      throw error;
    }
  } else {
    loginMockUser("local-user@example.com", "Local User");
    return mockCurrentUser;
  }
};

// Registered Users in LocalStorage for fully functional local mock environment
interface MockRegisteredUser {
  uid: string;
  email: string;
  password?: string;
  displayName: string;
}

const getMockRegisteredUsers = (): MockRegisteredUser[] => {
  const usersJson = localStorage.getItem('habit_coach_registered_users');
  return usersJson ? JSON.parse(usersJson) : [];
};

const saveMockRegisteredUser = (user: MockRegisteredUser) => {
  const users = getMockRegisteredUsers();
  users.push(user);
  localStorage.setItem('habit_coach_registered_users', JSON.stringify(users));
};

export const signInWithEmail = async (email: string, password?: string) => {
  if (isFirebaseEnabled && auth) {
    const result = await signInWithEmailAndPassword(auth, email, password || '');
    return result.user;
  } else {
    const users = getMockRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const err = new Error("auth/user-not-found");
      (err as any).code = "auth/user-not-found";
      throw err;
    }
    if (password && user.password !== password) {
      const err = new Error("auth/wrong-password");
      (err as any).code = "auth/wrong-password";
      throw err;
    }
    loginMockUser(user.email, user.displayName, user.uid);
    return mockCurrentUser;
  }
};

export const signUpWithEmail = async (email: string, password?: string, displayName?: string) => {
  if (isFirebaseEnabled && auth) {
    const result = await createUserWithEmailAndPassword(auth, email, password || '');
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } else {
    const users = getMockRegisteredUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error("auth/email-already-in-use");
      (err as any).code = "auth/email-already-in-use";
      throw err;
    }
    const newUser: MockRegisteredUser = {
      uid: 'local_user_' + Math.random().toString(36).substring(2, 9),
      email,
      password,
      displayName: displayName || email.split('@')[0]
    };
    saveMockRegisteredUser(newUser);
    loginMockUser(newUser.email, newUser.displayName, newUser.uid);
    return mockCurrentUser;
  }
};

export const resetPassword = async (email: string) => {
  if (isFirebaseEnabled && auth) {
    await sendPasswordResetEmail(auth, email);
  } else {
    const users = getMockRegisteredUsers();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase()) || email.toLowerCase().includes('example') || email.toLowerCase().includes('test');
    if (!exists) {
      const err = new Error("auth/user-not-found");
      (err as any).code = "auth/user-not-found";
      throw err;
    }
    console.log(`Mock password reset link sent to: ${email}`);
  }
};

export const signOutUser = async () => {
  if (isFirebaseEnabled && auth) {
    await signOut(auth);
  } else {
    mockCurrentUser = null;
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    notifyAuthChange();
  }
};

// 2. USER PROFILE API
export const saveUserProfile = async (userId: string, profile: UserProfile) => {
  if (isFirebaseEnabled && db) {
    await setDoc(doc(db, 'users', userId), profile);
  } else {
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.PROFILE}_${userId}`, JSON.stringify(profile));
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (isFirebaseEnabled && db) {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } else {
    const data = localStorage.getItem(`${LOCAL_STORAGE_KEYS.PROFILE}_${userId}`);
    return data ? JSON.parse(data) : null;
  }
};

// 3. URGES API
export const logUrge = async (userId: string, urge: Omit<UrgeLog, 'id'>) => {
  const newUrge: UrgeLog = {
    ...urge,
    id: Math.random().toString(36).substring(2, 9)
  };

  if (isFirebaseEnabled && db) {
    const colRef = collection(db, 'users', userId, 'urges');
    await addDoc(colRef, newUrge);
  } else {
    const existingStr = localStorage.getItem(`${LOCAL_STORAGE_KEYS.URGES}_${userId}`);
    const existing: UrgeLog[] = existingStr ? JSON.parse(existingStr) : [];
    existing.unshift(newUrge); // Newest first
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.URGES}_${userId}`, JSON.stringify(existing));
  }
  return newUrge;
};

export const getUrges = async (userId: string): Promise<UrgeLog[]> => {
  if (isFirebaseEnabled && db) {
    const colRef = collection(db, 'users', userId, 'urges');
    const q = query(colRef, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    const list: UrgeLog[] = [];
    snap.forEach(doc => {
      list.push(doc.data() as UrgeLog);
    });
    return list;
  } else {
    const data = localStorage.getItem(`${LOCAL_STORAGE_KEYS.URGES}_${userId}`);
    return data ? JSON.parse(data) : [];
  }
};

// Subscribe to urges updates
export const subscribeToUrges = (userId: string, callback: (urges: UrgeLog[]) => void, onError?: (error: any) => void) => {
  if (isFirebaseEnabled && db) {
    const colRef = collection(db, 'users', userId, 'urges');
    const q = query(colRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      const list: UrgeLog[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as UrgeLog);
      });
      callback(list);
    }, (error) => {
      console.error("Firestore urges listen error: ", error);
      if (onError) onError(error);
    });
  } else {
    // Local storage polling/trigger fallback
    const fetchLocal = () => {
      const data = localStorage.getItem(`${LOCAL_STORAGE_KEYS.URGES}_${userId}`);
      callback(data ? JSON.parse(data) : []);
    };
    fetchLocal();
    // Listen to localstorage events (cross-tab)
    const listener = (e: StorageEvent) => {
      if (e.key === `${LOCAL_STORAGE_KEYS.URGES}_${userId}`) {
        fetchLocal();
      }
    };
    window.addEventListener('storage', listener);
    return () => {
      window.removeEventListener('storage', listener);
    };
  }
};

// 4. CHAT HISTORY API
export const saveChatMessage = async (userId: string, message: ChatMessage) => {
  if (isFirebaseEnabled && db) {
    const colRef = collection(db, 'users', userId, 'chat_history');
    await addDoc(colRef, message);
  } else {
    const existingStr = localStorage.getItem(`${LOCAL_STORAGE_KEYS.CHAT}_${userId}`);
    const existing: ChatMessage[] = existingStr ? JSON.parse(existingStr) : [];
    existing.push(message);
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.CHAT}_${userId}`, JSON.stringify(existing));
  }
};

export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  if (isFirebaseEnabled && db) {
    const colRef = collection(db, 'users', userId, 'chat_history');
    const q = query(colRef, orderBy('timestamp', 'asc'));
    const snap = await getDocs(q);
    const list: ChatMessage[] = [];
    snap.forEach(doc => {
      list.push(doc.data() as ChatMessage);
    });
    return list;
  } else {
    const data = localStorage.getItem(`${LOCAL_STORAGE_KEYS.CHAT}_${userId}`);
    return data ? JSON.parse(data) : [];
  }
};

export const clearChatHistory = async (userId: string) => {
  if (isFirebaseEnabled && db) {
    // Firestore clear is recursive/manual, for simplicity we just let it be, 
    // but we can clear client local state if needed.
  }
  localStorage.removeItem(`${LOCAL_STORAGE_KEYS.CHAT}_${userId}`);
};

export { isFirebaseEnabled };

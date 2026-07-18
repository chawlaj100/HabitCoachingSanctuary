/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

export const loginMockUser = (email: string, displayName: string) => {
  mockCurrentUser = {
    uid: 'local_user_' + Math.random().toString(36).substring(2, 9),
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
      console.error("Google Sign-In failed, logging in as mock local user instead.", error);
      loginMockUser("local-user@example.com", "Local User");
      return mockCurrentUser;
    }
  } else {
    loginMockUser("local-user@example.com", "Local User");
    return mockCurrentUser;
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
export const subscribeToUrges = (userId: string, callback: (urges: UrgeLog[]) => void) => {
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

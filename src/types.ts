export interface UserProfile {
  habitToBreak: string;
  triggers: string[];
  wakeHour: string;
  workHour: string;
  sleepHour: string;
  distractionPreference: string;
  createdAt: string;
  domain?: string;
}

export interface UrgeLog {
  id: string;
  timestamp: string;
  intensity: number; // 1-10
  triggerContext: string;
  status: 'resisted' | 'given_in';
  distractionOffered: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface DistractionTask {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  completed: boolean;
}

export interface DistractionList {
  theme: string;
  tasks: DistractionTask[];
  generatedAt: string;
}

export interface NudgeInsight {
  title: string;
  content: string;
  category: 'motivation' | 'science' | 'challenge' | 'checkin';
  timestamp: string;
}

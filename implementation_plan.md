# Implementation Plan: Habit Coaching and Nudge Dashboard

This document details the architecture, design, and step-by-step implementation plan for the Gen AI-powered habit coaching application.

## 1. Product Vision & User Experience (UX)
The application is designed to be a supportive, high-contrast, beautiful, and frictionless coach to help users break negative habits (e.g., doomscrolling, compulsive snacking, gaming) and replace them with constructive positive behaviors.
- **Aesthetic**: Minimalist Warm Stone & Emerald slate canvas (`bg-[#faf9f6]` with deep `#1c1b19` text, soft sage green, and supportive warm copper highlights) to create a reassuring, calming, and premium aesthetic.
- **Supportive Mechanics**: Seamless Google Auth, an onboarding questionnaire to tailor coaching, a quick-action "I feel an urge" button that generates a physical/active distraction immediately, and an adaptive AI chat.

## 2. Technical Stack & Architecture
- **Frontend**: Single-Page App built with React, Vite, Tailwind CSS, and `motion` (framer-motion) for smooth layout and state transitions.
- **Backend**: Full-stack Node/Express server (`server.ts`) acting as a secure proxy to the Gemini API (`@google/genai` SDK) to prevent client-side API key exposure.
- **Database & Auth**: Firebase Firestore for persistent user state, chat logs, and urge tracking. Google Sign-In via Firebase Auth.
- **AI Core**: Gemini 3.5 Flash (`gemini-3.5-flash`) for responsive chat coaching, smart nudges, and interactive distraction lists.

## 3. Data Schema & Firebase Blueprint (`firebase-blueprint.json`)
We will store user information under three principal collection structures:
1. **`/users/{userId}`**: Stores user onboarding profiles.
   - `userId`: string (matching the Auth UID)
   - `habitToBreak`: string (e.g., "doomscrolling")
   - `triggers`: array of strings
   - `schedule`: object (wake, work, relax hours)
   - `distractionPreference`: string
   - `createdAt`: server timestamp
2. **`/users/{userId}/urges/{urgeId}`**: Urge log history.
   - `urgeId`: string
   - `intensity`: number (1-10)
   - `triggerContext`: string
   - `timestamp`: server timestamp
   - `status`: string ('resisted' | 'given_in')
   - `distractionOffered`: string
3. **`/users/{userId}/chat_history/{messageId}`**: Chat history with the adaptive coach.
   - `messageId`: string
   - `sender`: 'user' | 'ai'
   - `text`: string
   - `timestamp`: server timestamp

## 4. Execution Steps

### Step 1: PLAN (This Document) & Firebase Setup
- Present this detailed plan.
- Initialize the Firebase UI setup (`set_up_firebase`) and await user permission approval.

### Step 2: SCAFFOLD
- Build out the file system:
  - `firebase-blueprint.json` (specifying schema definitions)
  - `DRAFT_firestore.rules` and `firestore.rules`
  - `/src/types.ts` (TypeScript interfaces for profiles, urges, and messages)
  - `/src/lib/firebase.ts` (Firebase initialization and helper modules)
- Update `package.json` scripts to run a custom Express + Vite server (`server.ts`).
- Update `metadata.json` with descriptive name and server-side capability.

### Step 3: BUILD BACKEND (Express & Gemini API Proxy)
- Create `server.ts` with API endpoints:
  - `POST /api/gemini/nudge`: Generates personal insights and intelligent nudges.
  - `POST /api/gemini/distraction`: Generates immediate physical/active distractions.
  - `POST /api/gemini/chat`: Handles interactive chat with system prompts tailored to the user's habits.

### Step 4: BUILD UI (React Frontend)
- Create a modular, responsive dashboard:
  - **Onboarding Component**: A multi-step setup flow for new users.
  - **Dashboard Home**: Streak tracker, urge history chart, current daily nudge.
  - **Urge Logger Modal / Button**: Quick action to record urges and trigger distraction suggestions.
  - **Distraction Hub**: Active lists of generated alternative physical tasks.
  - **AI Coaching Chat**: Tab or panel to speak with the supportive coach.
  - **User Profile**: View habits, triggers, and schedule settings.

### Step 5: INTEGRATION & TESTING
- Connect Firebase Auth state to the dashboard.
- Link the dashboard panels to direct Firestore snapshot listeners.
- Call Express API routes for all AI features.
- Build/Lint verification (`npm run build` and `npm run lint`).

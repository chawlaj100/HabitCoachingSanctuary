# Habit Coaching and Nudge Dashboard

An intelligent, full-stack, AI-powered web application designed to help users break harmful habits (such as excessive screen time or doomscrolling) through supportive real-time micro-nudges, custom distraction packs, and adaptive cognitive coaching.

---

## 🎨 Visual Identity & Premium Aesthetic
The application features a minimalist **Warm Stone & Emerald** theme designed to feel reassuring, human, and modern.
- **Canvas (`bg-[#faf9f6]`)**: High-contrast, soft, off-white background designed to reduce visual strain.
- **Deep Slate Text (`text-[#1c1b19]`)**: Classic modern Swiss display typography pairing Inter and Space Grotesk.
- **Emerald Green Accents (`bg-emerald-700`)**: Symbolizes mental growth, clarity, and renewal.
- **Adaptive Visual Bento Panels**: Responsive dashboard modules that group insights, metrics, and logs cleanly.

---

## 🚀 Core Functional Modules (MVP Scope)

### 1. Onboarding & Habit Definition
A 4-step interactive wizard that guides users through clarifying their habits, checking key emotional/situational triggers, detailing wake/sleep hours, and picking a custom distraction preference (Tactile, Creative, Mindful, or Productive).

### 2. Intelligent Daily Nudge
Queries the Express backend securely to request a daily personalized coaching nudge based on current streak, trigger profiles, and recent urge events. Styled with custom category indicators (Science, Challenge, Motivation, Checkin).

### 3. Real-time Urge Anchor & Logger
Enables immediate emotional externalization. Users rate urge intensities (1-10) and detail triggering circumstances. It offers a quick, prominent "Urgent: I need a distraction!" trigger that overrides their environment and pivots to active challenges.

### 4. Interactive Distraction Challenge Hub
Generates a structured alternative micro-task list (such as a sensory grounding test, hand stretches, or kinetic drawing challenges) using Gemini 2.5 Flash to replace craving patterns. Displays responsive checklist progression bars and a celebration card when all challenges are checked.

### 5. AI Adaptive Coaching Chat
A context-rich chat interface. System prompts configure the Gemini model to respond as a warm, professional, and empathetic cognitive behavior coach. It adapts feedback—giving deep reassurance and scientific framing during setbacks, and vibrant celebration during resistance streaks.

### 6. Progress Analytics Bento
Displays:
- **Consecutive Streak**: Uses custom flame animations tracking active daily resistance.
- **Deflection Success Rate**: Percentage metrics summarizing resists versus slips.
- **Intensity Trend Line**: A beautiful, responsive SVG line chart visualizing craving peaks over time.

---

## 🛠️ Architecture & Security Hardening

- **Full-Stack Express + Vite Integration**: Front-end state communicates with `/api/*` endpoints in `server.ts`. This acts as a secure reverse proxy to hide your `GEMINI_API_KEY` from client-side browser exposure.
- **Official `@google/genai` Client**: Built on the modern Google Gen AI SDK for high-performance generative prompting.
- **Durable Dual-Mode Database**: Communicates directly with Firebase Firestore. If Firebase configuration keys are missing or credentials are sandboxed, the system **automatically degrades** to a flawless offline local storage mode, ensuring 100% instant usability in any workspace preview.
- **Granular Security Rules**: Custom `firestore.rules` protect user directories so authenticated accounts can only read/write their own records.

---

## 💻 Local Setup & Development

### 1. Requirements
Ensure Node.js (v18+) is installed.

### 2. Environment Variables
Create a `.env` file in the root with:
```env
GEMINI_API_KEY="YOUR_OFFICIAL_GEMINI_API_KEY"
```

### 3. Commands
- **Install dependencies**: `npm install`
- **Run in development**: `npm run dev` (starts full-stack on `http://localhost:3000`)
- **Lint TypeScript**: `npm run lint`
- **Compile Production Bundle**: `npm run build`
- **Start compiled server**: `npm run start`

---

## 🌐 Deploying & Exporting from AI Studio

### 1. Exporting to GitHub / ZIP
You can export this complete production-ready code directly:
- Click on the **Settings Gear** in the top right menu of Google AI Studio.
- Select **Export to GitHub** or **Download ZIP** to save the clean structure.

### 2. Deploying publicly
- **Google Cloud Run**: Click the **Deploy** button directly in the AI Studio header to host this application on a public URL managed securely in your GCP console.
- **Vercel / Render**: Set up a free Node/Express builder and push your exported GitHub repository.

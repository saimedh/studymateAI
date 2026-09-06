# studymateAI

StudyMate AI is an intelligent, multimodal study companion and workspace built with React, TypeScript, Tailwind CSS, Express, Google Gemini, and Firebase.

## Features

- **Multimodal AI Tutor**: Interactive Socratic tutor supporting text explanations, math formatting, and diagram analysis powered by Gemini 2.5 Flash.
- **Automated Content Synthesis**: Upload lecture notes, syllabi, or textbook materials to generate instant summaries, key concepts, and glossaries.
- **Adaptive Practice Quizzes & Flashcards**: Auto-generate multiple-choice, conceptual, and short-answer quizzes with spaced-repetition flashcards.
- **Exam Countdown & Study Planner**: Dynamic study scheduling tailored to upcoming test dates.
- **Firebase Authentication & Firestore Sync**: Cloud synchronization across devices with document-level security rules and guest-to-cloud transition.
- **Render & Cloud Run Ready**: Fully configured full-stack build with `render.yaml` and production container bundle scripts.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Node.js, Express, esbuild
- **AI Intelligence**: Google Gemini API (`@google/genai`)
- **Database & Auth**: Google Cloud Firestore & Firebase Auth

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your `GEMINI_API_KEY` in `.env`.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Bot,
  HelpCircle,
  Layers,
  Calendar,
  Flame,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  Zap,
  GraduationCap,
  ChevronDown,
  UploadCloud,
  FileText,
  Clock,
  LogIn,
  LogOut,
  Award,
  BarChart3,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { logoutUser } from '../../lib/firebase';
import { fireCelebration } from '../common/ConfettiCelebration';

interface LandingPageProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onEnterApp
}) => {
  const { user, profile } = useStudy();
  const [activeFeatureTab, setActiveFeatureTab] = useState<'tutor' | 'quiz' | 'summary' | 'streak'>('tutor');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const faqs = [
    {
      question: 'How does Google Authentication work with StudyMate AI?',
      answer:
        'StudyMate AI uses secure Google OAuth via Firebase. In one click, you can sign in with your personal Gmail or university Google Workspace account (.edu). We never ask for passwords, and your course materials, quizzes, and streak data are automatically synchronized to your isolated Firestore cloud profile.'
    },
    {
      question: 'Can I test out StudyMate AI without signing in?',
      answer:
        'Yes! You can jump straight in to create subjects, upload notes, and start live AI tutoring. Your data syncs locally in real-time and automatically persists in Firestore whenever you sign in with Google.'
    },
    {
      question: 'How does the adaptive learning loop detect weak topics?',
      answer:
        'When you take practice quizzes or complete evaluation exercises, StudyMate tracks your accuracy per topic tag. If your mastery falls below 70%, our agentic engine automatically generates focused remediation sessions, recommends targeted flashcards, and updates your 7-day study plan.'
    },
    {
      question: 'What types of study materials can I upload?',
      answer:
        'StudyMate supports PDF lecture slides, syllabus outlines, textbook excerpts, Word documents (.docx), and plain text notes. The AI automatically extracts key concepts, mathematical formulas, and common exam traps.'
    },
    {
      question: 'Is StudyMate AI free for students?',
      answer:
        'Yes, StudyMate AI is fully free for college students. You get unlimited access to the Socratic AI Tutor, diagnostic quizzes, study calendar planners, and spaced repetition flashcards.'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-950 selection:text-white flex flex-col">
      {/* 1. Global Navigation Bar with Glassmorphism */}
      <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-neutral-200/80 shadow-xs supports-[backdrop-filter]:bg-white/70 px-4 sm:px-6 lg:px-12 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onEnterApp}>
            <div className="w-9 h-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-neutral-950 tracking-tight text-base sm:text-lg">StudyMate</span>
                <span className="bg-neutral-100 text-neutral-900 border border-neutral-200 text-[11px] px-1.5 py-0.5 rounded font-bold">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-medium hidden sm:block">Agentic College Study Platform</p>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600">
            <a href="#features" className="hover:text-neutral-950 transition-colors">
              Features
            </a>
            <a href="#interactive-preview" className="hover:text-neutral-950 transition-colors">
              Live Preview
            </a>
            <a href="#how-it-works" className="hover:text-neutral-950 transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-neutral-950 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="nav-btn-open-dashboard"
                  onClick={onEnterApp}
                  className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-black active:bg-neutral-800 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  id="nav-btn-signout"
                  onClick={async () => {
                    await logoutUser();
                  }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  id="nav-btn-signin"
                  onClick={() => onOpenAuth('signin')}
                  className="hidden sm:flex min-h-[44px] items-center px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="nav-btn-signup"
                  onClick={() => onOpenAuth('signup')}
                  className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-black active:bg-neutral-800 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              id="landing-mobile-menu-toggle"
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
              aria-label={isMobileNavOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileNavOpen && (
          <div className="md:hidden pt-3 pb-3 border-t border-neutral-200/80 mt-3 space-y-1 animate-in fade-in duration-150">
            <a
              href="#features"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 hover:text-neutral-950 transition-colors"
            >
              Features
            </a>
            <a
              href="#interactive-preview"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 hover:text-neutral-950 transition-colors"
            >
              Live Preview
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 hover:text-neutral-950 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 hover:text-neutral-950 transition-colors"
            >
              FAQ
            </a>

            {!user && (
              <div className="pt-2 mt-2 border-t border-neutral-200/60 sm:hidden flex items-center gap-2 px-1">
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onOpenAuth('signin');
                  }}
                  className="flex-1 min-h-[44px] flex items-center justify-center py-2.5 px-3 text-center text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onOpenAuth('signup');
                  }}
                  className="flex-1 min-h-[44px] flex items-center justify-center py-2.5 px-3 text-center text-xs font-semibold text-white bg-neutral-950 hover:bg-black active:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-12 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-800 text-xs font-medium shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-neutral-950">New:</span>
            <span>Agentic Adaptive Learning Loop & Gemini AI Tutor</span>
          </motion.div>

          {/* Main Display Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-950 tracking-tight leading-[1.15]"
          >
            Master Complex College Courses with Your Personal AI Copilot
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed"
          >
            Transform raw lecture slides, textbooks, and syllabus notes into adaptive practice quizzes,
            active recall flashcards, and step-by-step Socratic AI tutoring tailored to your exact knowledge gaps.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <button
              id="hero-btn-google-signup"
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {/* Google G Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign Up with Google Free</span>
            </button>

            <button
              id="hero-btn-launch-realtime"
              onClick={onEnterApp}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-900 font-semibold text-sm shadow-2xs hover:shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Open Real-Time App</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </button>
          </motion.div>

          {/* Trust Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-neutral-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1-Click Google OAuth</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Firestore Real-Time Live Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Adaptive Remediation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Free for Students</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Product Showcase */}
      <section id="interactive-preview" className="px-4 sm:px-6 lg:px-12 py-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
            Interactive Product Preview
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-950">
            See the Autonomous Study Engine in Action
          </p>
        </div>

        {/* Interactive Tabs Container */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Tab Selector Buttons */}
          <div className="flex border-b border-neutral-200 overflow-x-auto bg-neutral-50/50 p-2 gap-2">
            {[
              { id: 'tutor', label: 'Socratic AI Tutor', icon: Bot },
              { id: 'quiz', label: 'Adaptive Quiz Engine', icon: HelpCircle },
              { id: 'summary', label: 'Smart Note Summarizer', icon: FileText },
              { id: 'streak', label: 'Streak Milestones & Confetti', icon: Flame }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`preview-tab-${tab.id}`}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-neutral-950' : 'text-neutral-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Preview */}
          <div className="p-6 sm:p-8">
            {activeFeatureTab === 'tutor' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="p-4 rounded-xl bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-medium">
                  <span className="font-bold text-neutral-700 block mb-1">Student Question:</span>
                  "Why do we need backpropagation when we could just estimate gradients with random perturbations?"
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 text-white text-xs sm:text-sm space-y-2 border border-neutral-900 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Socratic AI Tutor Guidance</span>
                  </div>
                  <p className="leading-relaxed text-neutral-200">
                    Think about the computational complexity. If your neural network has <strong>100 million weights</strong>,
                    how many forward passes would random perturbation require to compute every single derivative?
                  </p>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                    💡 <strong>Guiding Hint:</strong> Backpropagation uses the chain rule to calculate all gradients in a
                    single reverse sweep: <code>O(1)</code> passes instead of <code>O(W)</code> passes!
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-neutral-500">Supports simple, exam, and deep-dive pedagogical modes</span>
                  <button
                    onClick={onEnterApp}
                    className="text-xs font-bold text-neutral-950 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Launch AI Tutor in App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activeFeatureTab === 'quiz' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                    <span className="font-semibold text-neutral-900 uppercase">CS 229: Machine Learning</span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                      Difficulty: Medium
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-neutral-950">
                    Which activation function helps mitigate the vanishing gradient problem in deep networks?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 0, text: 'Sigmoid function', correct: false },
                    { id: 1, text: 'Rectified Linear Unit (ReLU)', correct: true },
                    { id: 2, text: 'Hyperbolic Tangent (Tanh)', correct: false },
                    { id: 3, text: 'Standard Linear Identity', correct: false }
                  ].map((opt) => {
                    const isSelected = quizAnswerSelected === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setQuizAnswerSelected(opt.id)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? opt.correct
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                              : 'bg-red-50 border-red-300 text-red-900'
                            : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt.text}</span>
                          {isSelected && (
                            opt.correct ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-xs font-bold text-red-600">Incorrect</span>
                            )
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {quizAnswerSelected !== null && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Explanation & Diagnostic Impact:</p>
                      <p className="mt-0.5 text-emerald-800">
                        ReLU has a constant derivative of 1 for positive inputs, preventing the gradient from decaying exponentially through multiple layers.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeFeatureTab === 'summary' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="p-4 rounded-xl bg-neutral-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-neutral-300" />
                    <div>
                      <h4 className="text-sm font-bold">Lecture 7: Backpropagation & Optimization.pdf</h4>
                      <p className="text-[11px] text-neutral-400">Extracted from 42 slide deck • 8 Key Concepts Identified</p>
                    </div>
                  </div>
                  <span className="text-xs bg-neutral-800 text-neutral-200 px-2.5 py-1 rounded-full border border-neutral-700">
                    High Yield
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Key Formula Extracted
                    </span>
                    <p className="text-xs font-mono font-bold text-neutral-900 bg-white p-2 rounded border border-neutral-200">
                      ∂L/∂w = (∂L/∂y) · (∂y/∂z) · (∂z/∂w)
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">Multi-variable chain rule gradient expansion</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                      Common Exam Pitfall
                    </span>
                    <p className="text-xs text-amber-900 font-medium">
                      Confusing the learning rate with momentum factor; setting momentum &gt; 1 leads to gradient divergence.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'streak' && (
              <div className="max-w-2xl mx-auto text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <Flame className="w-8 h-8 text-white fill-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-950">7-Day Study Streak Reached!</h3>
                  <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mt-1">
                    StudyMate AI rewards consistent daily focus with celebratory milestones and streak badges.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fireCelebration('streak_milestone')}
                    className="px-4 py-2 rounded-xl bg-neutral-950 text-white font-semibold text-xs hover:bg-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Trigger Celebration Confetti 🎉</span>
                  </button>
                  <button
                    onClick={onEnterApp}
                    className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 font-semibold text-xs hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    View Progress Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Core Features Bento Grid */}
      <section id="features" className="px-4 sm:px-6 lg:px-12 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
            Engineered For High-Stakes Exams
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-950">
            Everything College Students Need to Excel
          </p>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            Eliminate passive re-reading. StudyMate AI orchestrates an active cognitive loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-950">Socratic Multi-Turn AI Tutor</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Never get stuck on hard textbook questions. Our AI tutor uses pedagogical scaffolding to ask clarifying
              questions and guide you step-by-step toward the correct mental model.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-950">Adaptive Weak-Topic Loop</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Every quiz and answer evaluator identifies concepts below 70% mastery. The agent prioritizes those weak spots
              in Day 1 of your revised study plan.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-950">Multi-Format Note Ingestion</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Upload PDF slides, docx lecture summaries, and textbook chapters. StudyMate extracts definitions, mathematical
              formulas, and high-yield exam takeaways automatically.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-950">Spaced Repetition Flashcards</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Scientifically proven Leitner active recall with instant status tracking (Learning, Reviewing, Mastered).
              Flip cards, test retention, and review before exams.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-950">Rubric-Based Answer Evaluator</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Practice free-response and short-answer exam questions. The AI evaluates your answer against collegiate grading
              rubrics with actionable model improvements.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-950">1-Click Google Cloud Persistence</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Log in seamlessly with your Google or college account. Your profile, custom flashcards, and quiz archives are
              securely saved in Firebase Firestore.
            </p>
          </div>
        </div>
      </section>

      {/* 5. How It Works (3 Steps) */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-12 py-16 bg-white border-y border-neutral-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
              Three Simple Steps
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-neutral-950">
              How StudyMate Accelerates Your Exam Prep
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-neutral-950">Upload or Add Subjects</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Add your current courses (e.g., Artificial Intelligence, Organic Chemistry, Macroeconomics) and drop in
                lecture notes, slides, or syllabus topics.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-neutral-950">Practice with Adaptive Loop</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Take AI diagnostic quizzes and review flashcards. The engine identifies weak topics and prescribes focused
                Socratic AI remediation steps.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-neutral-950">Track Streaks & Ace Finals</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Celebrate daily streak milestones, watch your mastery percentage reach 100%, and review high-yield formula
                sheets right before your exam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="px-4 sm:px-6 lg:px-12 py-16 bg-white border-y border-neutral-200">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
              Got Questions?
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-neutral-950">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 overflow-hidden transition-all"
                >
                  <button
                    id={`faq-toggle-${i}`}
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-semibold text-neutral-900 hover:bg-neutral-100/70 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 shrink-0 ml-2 ${
                        isOpen ? 'rotate-180 text-neutral-950' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 leading-relaxed border-t border-neutral-200/60 bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. High-Impact Bottom Call To Action Banner */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-neutral-950 text-white p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-xl border border-neutral-900">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ready for Higher Grades?</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Start Studying Smarter with StudyMate AI
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Join thousands of students who traded all-night cram sessions for adaptive, cognitive AI mastery.
              Free, secure, and ready in 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="cta-btn-google-signup"
                onClick={() => onOpenAuth('signup')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-semibold text-xs sm:text-sm shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {/* Google G Logo */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Get Started with Google</span>
              </button>

              <button
                id="cta-btn-launch-realtime"
                onClick={onEnterApp}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold text-xs sm:text-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Real-Time Workspace</span>
                <ArrowRight className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="mt-auto bg-white border-t border-neutral-200 px-4 sm:px-6 lg:px-12 py-8 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-bold text-[10px]">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-neutral-900">StudyMate AI</span>
            <span>• Modern College Study Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onEnterApp} className="hover:text-neutral-900 transition-colors cursor-pointer">
              Launch App
            </button>
            <button onClick={() => onOpenAuth('signin')} className="hover:text-neutral-900 transition-colors cursor-pointer">
              Google Sign In
            </button>
            <button onClick={() => onOpenAuth('signup')} className="hover:text-neutral-900 transition-colors cursor-pointer">
              Google Sign Up
            </button>
          </div>

          <p className="text-[11px] text-neutral-400">
            © {new Date().getFullYear()} StudyMate AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

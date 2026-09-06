import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudy } from '../../context/StudyContext';
import {
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Clock,
  Award,
  Loader2,
  BookOpen,
  Send,
  Flame,
  AlertCircle,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerDailyStudyCelebration, triggerStreakRecordCelebration } from '../../utils/celebration';

interface SessionStep {
  stepNumber: number;
  explanation: string;
  question: string;
  options: string[];
  correctAnswer: string;
  feedback?: string;
  isCorrect?: boolean;
}

export const StudySessionView: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    weakTopics,
    updateProfile,
    profile,
    setActiveTab
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectWeak = weakTopics.filter(w => !selectedSubjectId || w.subjectId === selectedSubjectId);
  const targetTopic = subjectWeak[0]?.topic || currentSubject?.topics?.[0] || '';

  const [sessionTopic, setSessionTopic] = useState(targetTopic);

  React.useEffect(() => {
    if (targetTopic) {
      setSessionTopic(targetTopic);
    }
  }, [targetTopic]);
  const [isActive, setIsActive] = useState(false);
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const [currentStep, setCurrentStep] = useState<SessionStep | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<SessionStep[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecordBroken, setIsRecordBroken] = useState(false);
  const [isCelebrationGlowing, setIsCelebrationGlowing] = useState(false);

  // Timer
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.round((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, sessionStartTime]);

  const startSession = async () => {
    setIsActive(true);
    setSessionStartTime(Date.now());
    setCompletedSteps([]);
    setElapsedSeconds(0);
    await fetchNextStep(1, 'medium', undefined, undefined);
  };

  const fetchNextStep = async (
    stepNumber: number,
    difficulty: 'easy' | 'medium' | 'hard',
    previousAnswer?: string,
    wasCorrect?: boolean
  ) => {
    setIsLoadingStep(true);
    setSelectedAnswer('');
    setHasSubmittedAnswer(false);

    try {
      const resp = await fetch('/api/ai/study-session-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sessionTopic,
          stepNumber,
          difficulty,
          previousAnswer,
          wasCorrect
        })
      });

      if (!resp.ok) throw new Error('Failed to load session step');
      const data = await resp.json();
      setCurrentStep(data.step);
    } catch (err: any) {
      alert(err.message || 'Error fetching next step');
    } finally {
      setIsLoadingStep(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (!currentStep || !selectedAnswer) return;

    const isCorrect = selectedAnswer.trim().toLowerCase() === currentStep.correctAnswer.trim().toLowerCase() ||
      currentStep.correctAnswer.trim().toLowerCase().includes(selectedAnswer.trim().toLowerCase());

    const evaluatedStep: SessionStep = {
      ...currentStep,
      feedback: isCorrect
        ? `Spot on! ${currentStep.correctAnswer} is correct.`
        : `Not quite. The correct answer was "${currentStep.correctAnswer}". Notice how error deltas propagate backwards layer by layer.`,
      isCorrect
    };

    setCurrentStep(evaluatedStep);
    setHasSubmittedAnswer(true);
    setCompletedSteps(prev => [...prev, evaluatedStep]);

    if (isCorrect) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleProceedNext = () => {
    if (!currentStep) return;

    if (currentStep.stepNumber >= 3) {
      // Session finished!
      setIsActive(false);
      const minutesSpent = Math.max(5, Math.round(elapsedSeconds / 60));
      const currentStreak = profile.streakDays || 0;
      const currentLongest = profile.longestStreakDays || currentStreak;
      const nextStreak = currentStreak + 1;
      const brokeRecord = nextStreak > currentLongest;

      setIsRecordBroken(brokeRecord);
      setIsCelebrationGlowing(true);

      updateProfile({
        totalStudyMinutes: profile.totalStudyMinutes + minutesSpent,
        streakDays: nextStreak,
        longestStreakDays: Math.max(nextStreak, currentLongest),
        dailyGoalCompleted: true,
      });

      if (brokeRecord) {
        triggerStreakRecordCelebration();
      } else {
        triggerDailyStudyCelebration();
      }

      setTimeout(() => {
        setIsCelebrationGlowing(false);
      }, 5000);

      return;
    }

    // Determine adaptive difficulty
    const nextDiff = currentStep.isCorrect ? 'hard' : 'easy';
    fetchNextStep(currentStep.stepNumber + 1, nextDiff, selectedAnswer, currentStep.isCorrect);
  };

  // -------------------------------------------------------------
  // VIEW: SESSION SUMMARY COMPLETED
  // -------------------------------------------------------------
  if (!isActive && completedSteps.length > 0) {
    const totalAnswered = completedSteps.length;
    const correctCount = completedSteps.filter(s => s.isCorrect).length;
    const minutesSpent = Math.max(5, Math.round(elapsedSeconds / 60));

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
        <motion.div
          animate={
            isCelebrationGlowing
              ? {
                  boxShadow: [
                    '0 0 0 0 rgba(245, 158, 11, 0)',
                    '0 0 35px 6px rgba(245, 158, 11, 0.35)',
                    '0 0 20px 2px rgba(245, 158, 11, 0.2)',
                    '0 0 35px 6px rgba(245, 158, 11, 0.35)',
                    '0 0 10px 1px rgba(245, 158, 11, 0.1)',
                  ],
                  borderColor: ['#f59e0b', '#fbbf24', '#f59e0b'],
                }
              : {
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  borderColor: '#e5e5e5',
                }
          }
          transition={{ duration: 2.5, repeat: isCelebrationGlowing ? 1 : 0 }}
          className="relative p-8 rounded-xl bg-white border border-neutral-200 shadow-2xs text-center space-y-4 overflow-hidden"
        >
          {/* Subtle Celebration Ambient Halo */}
          {isCelebrationGlowing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.15, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-1 bg-gradient-to-b from-amber-400/15 via-transparent to-neutral-900/5 -z-10 pointer-events-none"
            />
          )}

          {/* Celebration Achievement Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-950 text-white text-xs font-bold border border-neutral-800 shadow-xs">
            {isRecordBroken ? (
              <>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>New Streak Record Broken: {profile.streakDays} Days!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Study Goal Met: +1 Day Streak!</span>
              </>
            )}
          </div>

          <motion.div
            animate={
              isCelebrationGlowing
                ? { scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }
                : { scale: 1 }
            }
            transition={{ duration: 0.8 }}
            className={`w-14 h-14 rounded-2xl border text-neutral-950 flex items-center justify-center mx-auto shadow-xs transition-colors duration-300 ${
              isCelebrationGlowing
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            <Award className="w-7 h-7" />
          </motion.div>

          <h2 className="text-2xl font-bold text-neutral-950">Study Session Complete!</h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto">
            Great work! You successfully completed your adaptive study loop on <strong>{sessionTopic}</strong>.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto py-3">
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
              <span className="text-xs text-neutral-500 block">Questions</span>
              <span className="text-lg font-bold text-neutral-950">{correctCount}/{totalAnswered}</span>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
              <span className="text-xs text-neutral-500 block">Time</span>
              <span className="text-lg font-bold text-neutral-950">{minutesSpent} mins</span>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
              <span className="text-xs text-neutral-500 block">Streak</span>
              <span className="text-lg font-bold text-neutral-950">{profile.streakDays}d 🔥</span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={startSession}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Another Topic</span>
            </button>

            <button
              onClick={() => {
                setIsCelebrationGlowing(true);
                if (isRecordBroken) triggerStreakRecordCelebration();
                else triggerDailyStudyCelebration();
                setTimeout(() => setIsCelebrationGlowing(false), 4500);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Replay Celebration</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-semibold text-xs sm:text-sm transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: ACTIVE SESSION
  // -------------------------------------------------------------
  if (isActive) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Session Status Bar */}
        <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-950 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                Adaptive Session: {sessionTopic}
              </span>
              <span className="text-sm font-bold text-neutral-950">
                Step {currentStep?.stepNumber || 1} of 3
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-mono font-bold border border-neutral-200">
            <Clock className="w-3.5 h-3.5 text-neutral-700" />
            <span>{Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Loading Step Card */}
        {isLoadingStep && (
          <div className="p-12 text-center rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-950 mx-auto" />
            <p className="text-sm font-bold text-neutral-950">Adapting curriculum to your responses...</p>
            <p className="text-xs text-neutral-500">Gemini is synthesizing the next conceptual explanation</p>
          </div>
        )}

        {/* Active Step Content */}
        {!isLoadingStep && currentStep && (
          <div className="p-6 sm:p-8 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-6">
            {/* 1. Concept Explanation */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-950 uppercase tracking-wider block">
                1. Micro-Concept Explanation
              </span>
              <p className="text-sm text-neutral-800 leading-relaxed font-medium">
                {currentStep.explanation}
              </p>
            </div>

            {/* 2. Interactive Check Question */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                2. Quick Recall Check
              </span>
              <h3 className="text-base font-bold text-neutral-950">
                {currentStep.question}
              </h3>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {currentStep.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedAnswer === opt;

                  return (
                    <button
                      key={idx}
                      disabled={hasSubmittedAnswer}
                      onClick={() => setSelectedAnswer(opt)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-neutral-950 bg-neutral-100 text-neutral-950 font-bold shadow-2xs'
                          : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-800'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-neutral-950 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}>
                        {letter}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Box if Answered */}
            {hasSubmittedAnswer && (
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 font-bold">
                  {currentStep.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-neutral-950" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-500" />
                  )}
                  <span className="text-neutral-950">{currentStep.isCorrect ? 'Correct!' : 'Needs Review'}</span>
                </div>
                <p className="leading-relaxed font-medium text-neutral-700">{currentStep.feedback}</p>
              </div>
            )}

            {/* Action Footer */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
              {!hasSubmittedAnswer ? (
                <button
                  disabled={!selectedAnswer}
                  onClick={handleAnswerSubmit}
                  className="px-6 py-2.5 rounded-xl bg-neutral-950 hover:bg-black disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  onClick={handleProceedNext}
                  className="px-6 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2"
                >
                  <span>{currentStep.stepNumber >= 3 ? 'Finish Session' : 'Continue Next Concept'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: PRE-SESSION LAUNCHER
  // -------------------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Adaptive Study Session</h1>
        <p className="text-sm text-neutral-500">
          An interactive tutor loop that explains concepts, tests comprehension, and adjusts difficulty on the fly
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-neutral-100 text-neutral-950 border border-neutral-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-950">Personalized Micro-Session</h3>
            <p className="text-xs text-neutral-500">Fast 10-15 minute focused learning loop</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Select Topic to Focus On
          </label>
          <select
            value={sessionTopic}
            onChange={(e) => setSessionTopic(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 bg-white font-medium text-neutral-900 focus:outline-hidden"
          >
            {currentSubject?.topics.map(t => (
              <option key={t} value={t}>
                {t} {targetTopic === t ? '(⭐ Weakest - Recommended)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-2">
          <p className="font-bold text-neutral-900">How the session works:</p>
          <ol className="list-decimal list-inside space-y-1 leading-relaxed">
            <li>Gemini breaks the concept down into bite-sized explanations.</li>
            <li>You answer a targeted verification question.</li>
            <li>The system dynamically adjusts subsequent difficulty based on your accuracy.</li>
            <li>Mastery score and study minutes are automatically logged to your profile.</li>
          </ol>
        </div>

        <button
          id="btn-start-interactive-session"
          onClick={startSession}
          className="w-full py-3.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch Adaptive Session</span>
        </button>
      </div>
    </div>
  );
};

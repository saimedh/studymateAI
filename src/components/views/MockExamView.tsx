import React, { useState, useEffect, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Flag,
  Coffee,
  Sparkles,
  HelpCircle,
  Volume2,
  VolumeX,
  Clock
} from 'lucide-react';

interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

export const MockExamView: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    materials,
    updateTopicMastery
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectMaterials = materials.filter(m => !selectedSubjectId || m.subjectId === selectedSubjectId);

  // View mode: 'exam' | 'pomodoro'
  const [activeSubTab, setActiveSubTab] = useState<'exam' | 'pomodoro'>('exam');

  // --- MOCK EXAM STATE ---
  const [examStatus, setExamStatus] = useState<'setup' | 'running' | 'completed'>('setup');
  const [examDurationMinutes, setExamDurationMinutes] = useState<number>(15);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'standard' | 'advanced'>('standard');
  const [isGeneratingExam, setIsGeneratingExam] = useState<boolean>(false);

  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(15 * 60);

  // --- POMODORO TIMER STATE ---
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Web Audio chime player
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime unsupported or blocked', e);
    }
  };

  // --- MOCK EXAM TIMER EFFECT ---
  useEffect(() => {
    let timer: any = null;
    if (examStatus === 'running') {
      timer = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examStatus]);

  // --- POMODORO TIMER EFFECT ---
  useEffect(() => {
    let timer: any = null;
    if (isPomodoroRunning) {
      timer = setInterval(() => {
        setPomodoroSeconds(prev => {
          if (prev <= 1) {
            playChime();
            if (pomodoroMode === 'focus') {
              setCompletedSessions(c => c + 1);
              setPomodoroMode('shortBreak');
              return 5 * 60;
            } else {
              setPomodoroMode('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPomodoroRunning, pomodoroMode, soundEnabled]);

  const handleStartExam = async () => {
    setIsGeneratingExam(true);
    try {
      const resp = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentSubject?.topics?.join(', ') || currentSubject?.name || 'College Academic Concepts',
          count: questionCount,
          materialText: subjectMaterials.map(m => m.extractedText).slice(0, 2).join('\n\n')
        })
      });

      if (!resp.ok) throw new Error('Exam generation failed');
      const data = await resp.json();

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const parsedQuestions: MockQuestion[] = data.questions.map((q: any, idx: number) => ({
          id: 'mq_' + idx,
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          explanation: q.explanation || 'Refer to subject lecture notes.',
          topic: currentSubject?.name || 'General'
        }));

        setQuestions(parsedQuestions);
        setSelectedAnswers({});
        setFlaggedQuestions({});
        setCurrentQIndex(0);
        setTimeRemainingSeconds(examDurationMinutes * 60);
        setExamStatus('running');
      }
    } catch (err: any) {
      console.error(err);
      alert('Unable to generate mock exam. Please verify connection and retry.');
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleSubmitExam = () => {
    setExamStatus('completed');
    // Compute score & update topics
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    if (currentSubject?.topics?.[0]) {
      const scoreRate = Math.round((correct / (questions.length || 1)) * 100);
      updateTopicMastery(currentSubject.topics[0], scoreRate);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Mock Exam stats
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter((q, idx) => selectedAnswers[idx] === q.correctAnswer).length;
  const finalPercentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* View Switcher: Mock Exam vs Pomodoro */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('exam')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'exam'
                ? 'bg-white text-neutral-950 shadow-2xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Timed Mock Exam
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('pomodoro')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'pomodoro'
                ? 'bg-white text-neutral-950 shadow-2xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-neutral-700" />
            <span>Pomodoro Focus Timer</span>
          </button>
        </div>

        <div className="text-xs text-neutral-500 font-medium px-3">
          Active Subject: <strong>{currentSubject?.name}</strong>
        </div>
      </div>

      {/* ==================== SUB-TAB 1: TIMED MOCK EXAM ==================== */}
      {activeSubTab === 'exam' && (
        <div className="space-y-6">
          {/* SETUP SCREEN */}
          {examStatus === 'setup' && (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-neutral-950 text-white shadow-xs">
                    <Timer className="w-4 h-4" />
                  </span>
                  <h2 className="text-xl font-bold text-neutral-950">Timed Mock Exam Mode</h2>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Simulate real testing conditions with strict countdowns, question flagging, and comprehensive AI rubric scoring.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">Exam Duration</label>
                  <select
                    value={examDurationMinutes}
                    onChange={(e) => setExamDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value={10}>10 Minutes (Sprint)</option>
                    <option value={15}>15 Minutes (Standard)</option>
                    <option value={30}>30 Minutes (Midterm)</option>
                    <option value={45}>45 Minutes (Full Exam)</option>
                  </select>
                </div>

                {/* Number of Questions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">Question Count</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>

                {/* Rigor */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">Exam Rigor</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="standard">Standard University Level</option>
                    <option value="advanced">Advanced (Exam-Traps Included)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Questions will be generated directly from your uploaded lecture slides and course syllabus.
                </span>

                <button
                  type="button"
                  onClick={handleStartExam}
                  disabled={isGeneratingExam}
                  className="px-6 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isGeneratingExam ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Generating Authentic Exam...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Mock Exam</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE EXAM ARENA */}
          {examStatus === 'running' && questions.length > 0 && (
            <div className="space-y-5">
              {/* Sticky Top Bar with Countdown & Submit */}
              <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-xl font-mono text-base font-black flex items-center gap-1.5 ${
                    timeRemainingSeconds < 120
                      ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                      : 'bg-neutral-950 text-white shadow-xs'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(timeRemainingSeconds)}</span>
                  </div>
                  <span className="text-xs text-neutral-500">
                    Question {currentQIndex + 1} of {questions.length} ({answeredCount}/{questions.length} answered)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFlaggedQuestions(f => ({ ...f, [currentQIndex]: !f[currentQIndex] }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                      flaggedQuestions[currentQIndex]
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQIndex] ? 'fill-current text-amber-600' : ''}`} />
                    <span>{flaggedQuestions[currentQIndex] ? 'Flagged' : 'Flag for Review'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    className="px-4 py-1.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Finish & Grade Exam
                  </button>
                </div>
              </div>

              {/* Question Navigator Pill Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                {questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isFlagged = flaggedQuestions[idx];
                  const isCurrent = currentQIndex === idx;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all relative ${
                        isCurrent
                          ? 'ring-2 ring-neutral-950 bg-neutral-950 text-white'
                          : isAnswered
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-50 text-neutral-400 border border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-1 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Box */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-6 sm:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Problem {currentQIndex + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-950 leading-snug">
                      {questions[currentQIndex].question}
                    </h3>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {questions[currentQIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQIndex] === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentQIndex]: optIdx }))}
                        className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                            : 'bg-neutral-50 hover:bg-neutral-100/80 border-neutral-200 text-neutral-800'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-white text-neutral-950' : 'bg-white border border-neutral-300 text-neutral-700'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Prev / Next controls */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                    className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentQIndex === questions.length - 1}
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMPLETED EXAM REPORT */}
          {examStatus === 'completed' && (
            <div className="space-y-6">
              {/* Score Header Card */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Exam Results & Rubric</span>
                  <h2 className="text-2xl font-black text-neutral-950">
                    Score: {finalPercentage}% ({correctCount}/{questions.length} Correct)
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {finalPercentage >= 80 ? 'Mastery demonstrated! Ready for official exam.' : finalPercentage >= 60 ? 'Good grasp. Review flagged traps below.' : 'Requires focused revision on foundational definitions.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExamStatus('setup')}
                    className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Take New Exam
                  </button>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900">Question-by-Question Rubric Breakdown</h3>
                {questions.map((q, idx) => {
                  const studentAnswer = selectedAnswers[idx];
                  const isCorrect = studentAnswer === q.correctAnswer;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border bg-white shadow-2xs space-y-3 ${
                        isCorrect ? 'border-emerald-200' : 'border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            isCorrect ? 'bg-emerald-600' : 'bg-red-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-neutral-950">{q.question}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                        }`}>
                          {isCorrect ? 'Correct (+1.0)' : 'Incorrect (0.0)'}
                        </span>
                      </div>

                      {/* Your Answer vs Correct Answer */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                          <span className="text-neutral-500 font-semibold block text-[10px]">Your Answer:</span>
                          <span className="font-bold text-neutral-900">
                            {studentAnswer !== undefined ? q.options[studentAnswer] : 'No answer submitted'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                          <span className="text-emerald-700 font-semibold block text-[10px]">Official Answer:</span>
                          <span className="font-bold text-emerald-950">{q.options[q.correctAnswer]}</span>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-600 leading-relaxed border border-neutral-100">
                        <strong className="text-neutral-900">Conceptual Intuition:</strong> {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 2: POMODORO FOCUS TIMER ==================== */}
      {activeSubTab === 'pomodoro' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-6 sm:p-10 max-w-xl mx-auto space-y-8 text-center">
          {/* Pomodoro Modes Bar */}
          <div className="flex items-center justify-center gap-1.5 bg-neutral-100 p-1.5 rounded-2xl max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => {
                setPomodoroMode('focus');
                setPomodoroSeconds(25 * 60);
                setIsPomodoroRunning(false);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pomodoroMode === 'focus'
                  ? 'bg-white text-neutral-950 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Focus (25m)
            </button>
            <button
              type="button"
              onClick={() => {
                setPomodoroMode('shortBreak');
                setPomodoroSeconds(5 * 60);
                setIsPomodoroRunning(false);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pomodoroMode === 'shortBreak'
                  ? 'bg-white text-neutral-950 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              type="button"
              onClick={() => {
                setPomodoroMode('longBreak');
                setPomodoroSeconds(15 * 60);
                setIsPomodoroRunning(false);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pomodoroMode === 'longBreak'
                  ? 'bg-white text-neutral-950 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Big Time Display */}
          <div className="space-y-2">
            <div className="text-7xl sm:text-8xl font-black text-neutral-950 font-mono tracking-tight">
              {formatTime(pomodoroSeconds)}
            </div>
            <p className="text-xs font-medium text-neutral-500">
              {pomodoroMode === 'focus' ? `Deep focus block for ${currentSubject?.name}` : 'Step away from screen & stretch!'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
              className={`px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isPomodoroRunning
                  ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                  : 'bg-neutral-950 text-white hover:bg-black'
              }`}
            >
              {isPomodoroRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isPomodoroRunning ? 'Pause Session' : 'Start Focus Session'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPomodoroRunning(false);
                setPomodoroSeconds(pomodoroMode === 'focus' ? 25 * 60 : pomodoroMode === 'shortBreak' ? 5 * 60 : 15 * 60);
              }}
              className="p-3.5 rounded-2xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3.5 rounded-2xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
              title={soundEnabled ? 'Chime sound enabled' : 'Muted'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-neutral-400" />}
            </button>
          </div>

          {/* Session Counter */}
          <div className="pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Completed Pomodoro Cycles:</span>
            <span className="font-bold text-neutral-950 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              🍅 {completedSessions} Completed
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Quiz, QuizQuestion, StudentQuizAnswer, QuizResult, DifficultyLevel, QuestionType } from '../../types';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Bot,
  Play,
  Award,
  AlertTriangle,
  Loader2,
  FileText,
  Clock,
  ChevronRight,
  TrendingDown,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuizView: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    materials,
    selectedMaterialForAction,
    submitQuizResult,
    setActiveTab,
    quizResults
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectMaterials = materials.filter(m => !selectedSubjectId || m.subjectId === selectedSubjectId);

  // Generator State
  const [topic, setTopic] = useState(currentSubject?.topics?.[0] || '');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(selectedMaterialForAction?.id || '');
  const [isShareCopied, setIsShareCopied] = useState<boolean>(false);

  const handleShareQuiz = (scoreText?: string) => {
    const text = `🎯 StudyMate AI Diagnostic Quiz Challenge\nSubject: ${currentSubject?.name || 'Academic Course'} (${topic || 'Foundations'})\n${scoreText ? `My Score: ${scoreText}\n` : ''}Challenge Code: SM-${Math.random().toString(36).substring(2, 7).toUpperCase()}\nTake the diagnostic quiz on StudyMate AI!`;
    navigator.clipboard.writeText(text);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2200);
  };

  // Keep topic synced when subject changes
  React.useEffect(() => {
    if (currentSubject?.topics && currentSubject.topics.length > 0) {
      setTopic(currentSubject.topics[0]);
    }
  }, [currentSubject]);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Active Quiz State (answers hidden until submission)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submission Results State
  const [submittedResult, setSubmittedResult] = useState<QuizResult | null>(null);

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      const groundedMaterial = materials.find(m => m.id === selectedMaterialId);

      const resp = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject?.name || 'Computer Science',
          topic,
          materialText: groundedMaterial?.extractedText || '',
          numQuestions,
          difficulty,
          questionType
        })
      });

      if (!resp.ok) throw new Error('Quiz generation failed');

      const data = await resp.json();
      const generatedQuestions: QuizQuestion[] = data.questions || [];

      if (generatedQuestions.length === 0) {
        throw new Error('No questions generated. Please try again.');
      }

      const newQuiz: Quiz = {
        id: 'quiz_' + Date.now(),
        subjectId: selectedSubjectId || 'subj_ai',
        topic,
        title: `${topic} ${difficulty.toUpperCase()} Quiz`,
        questions: generatedQuestions,
        difficulty,
        questionType,
        createdAt: new Date().toISOString()
      };

      setActiveQuiz(newQuiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setSubmittedResult(null);
      setQuizStartTime(Date.now());
    } catch (err: any) {
      alert(err.message || 'Error generating quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);

    try {
      const timeSpentSeconds = Math.max(15, Math.round((Date.now() - quizStartTime) / 1000));
      let correctCount = 0;
      const studentAnswers: StudentQuizAnswer[] = [];
      const failedTopicsSet = new Set<string>();

      activeQuiz.questions.forEach((q) => {
        const studentAns = (selectedAnswers[q.id] || '').trim();
        // Compare case-insensitively
        const isCorrect = studentAns.toLowerCase() === q.correctAnswer.toLowerCase() ||
          (studentAns && q.correctAnswer.toLowerCase().includes(studentAns.toLowerCase()) && studentAns.length > 3);

        if (isCorrect) {
          correctCount += 1;
        } else {
          failedTopicsSet.add(q.topic || activeQuiz.topic);
        }

        studentAnswers.push({
          questionId: q.id,
          questionText: q.question,
          studentAnswer: studentAns || '(Unanswered)',
          correctAnswer: q.correctAnswer,
          isCorrect,
          topic: q.topic || activeQuiz.topic,
          explanation: q.explanation
        });
      });

      const totalQuestions = activeQuiz.questions.length;
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      const weakTopicsArray = Array.from(failedTopicsSet);

      let recommendation = `Great work on ${activeQuiz.topic}! Continue solidifying advanced edge-cases.`;
      if (percentage < 70) {
        recommendation = `Review foundational gradient calculations and error delta derivation in ${activeQuiz.topic} before attempting another quiz.`;
      }

      // Submit to context to trigger adaptive learning engine
      const savedResult = await submitQuizResult({
        quizId: activeQuiz.id,
        subjectId: activeQuiz.subjectId,
        topic: activeQuiz.topic,
        score: correctCount,
        totalQuestions,
        percentage,
        answers: studentAnswers,
        weakTopics: weakTopicsArray.length > 0 ? weakTopicsArray : [activeQuiz.topic],
        recommendation,
        timeSpentSeconds
      });

      setSubmittedResult(savedResult);

      if (percentage >= 80) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: RESULTS VIEW (After submission)
  // -------------------------------------------------------------
  if (submittedResult) {
    const isPassing = submittedResult.percentage >= 70;

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Score Header Banner */}
        <div className="p-6 sm:p-8 rounded-2xl border border-neutral-200 bg-white text-center relative overflow-hidden shadow-2xs">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center font-bold text-xl shadow-xs mb-3 bg-neutral-100 text-neutral-950 border border-neutral-200">
            {isPassing ? (
              <Award className="w-7 h-7 text-neutral-950" />
            ) : (
              <TrendingDown className="w-7 h-7 text-neutral-950" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
            Score: {submittedResult.score}/{submittedResult.totalQuestions} ({submittedResult.percentage}%)
          </h2>

          <p className="text-sm font-medium mt-2 max-w-lg mx-auto text-neutral-600">
            {isPassing
              ? 'Excellent performance! You demonstrated strong conceptual understanding.'
              : 'Knowledge gap detected. Review the breakdown below and practice weak areas.'}
          </p>

          {/* Detected Weak Topics */}
          {submittedResult.weakTopics.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-900">
              <AlertTriangle className="w-4 h-4 text-neutral-700" />
              <span>Target Topic: <strong>{submittedResult.weakTopics.join(', ')}</strong></span>
            </div>
          )}

          {/* AI Recommendation Message */}
          <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-left max-w-xl mx-auto">
            <span className="text-[11px] font-bold text-neutral-950 uppercase tracking-wider block mb-1">
              AI Recommendation
            </span>
            <p className="text-xs text-neutral-700 leading-relaxed font-medium">
              "{submittedResult.recommendation}"
            </p>
          </div>

          {/* Post-Quiz Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedAnswers({});
                setSubmittedResult(null);
                setCurrentQuestionIndex(0);
                setQuizStartTime(Date.now());
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-neutral-600" />
              <span>Retry Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab('session')}
              className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Practice Weak Topics</span>
            </button>

            <button
              onClick={() => setActiveTab('tutor')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-neutral-700" />
              <span>Ask AI Tutor</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareQuiz(`${submittedResult.score}%`)}
              className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              title="Share challenge code with peers"
            >
              {isShareCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-neutral-700" />}
              <span>{isShareCopied ? 'Challenge Copied!' : 'Share Challenge'}</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-neutral-950">Detailed Answer Breakdown</h3>

          {submittedResult.answers.map((ans, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-neutral-200 bg-white shadow-2xs transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400">Q{idx + 1}.</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                    {ans.topic}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {ans.isCorrect ? (
                    <span className="flex items-center gap-1 text-neutral-950">
                      <CheckCircle2 className="w-4 h-4 text-neutral-950" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neutral-500">
                      <XCircle className="w-4 h-4 text-neutral-500" /> Incorrect
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-bold text-neutral-950 mb-3">{ans.questionText}</h4>

              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                  <span className="text-neutral-500 font-semibold block">Your Answer:</span>
                  <span className={ans.isCorrect ? 'text-neutral-950 font-bold' : 'text-neutral-700 font-medium'}>
                    {ans.studentAnswer}
                  </span>
                </div>

                {!ans.isCorrect && (
                  <div className="p-2.5 rounded-lg bg-neutral-100 border border-neutral-200">
                    <span className="text-neutral-600 font-semibold block">Correct Answer:</span>
                    <span className="text-neutral-950 font-bold">{ans.correctAnswer}</span>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-neutral-50 text-neutral-700 mt-2 leading-relaxed border border-neutral-100">
                  <strong className="text-neutral-950 block mb-0.5">Explanation:</strong>
                  {ans.explanation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE QUIZ TAKER (Answers hidden until submission)
  // -------------------------------------------------------------
  if (activeQuiz) {
    const totalQ = activeQuiz.questions.length;
    const currentQ = activeQuiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === totalQ - 1;

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Top Progress & Timer Bar */}
        <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              {activeQuiz.topic} Quiz ({activeQuiz.difficulty.toUpperCase()})
            </span>
            <span className="text-sm font-bold text-neutral-950">
              Question {currentQuestionIndex + 1} of {totalQ}
            </span>
          </div>

          <div className="w-36">
            <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-neutral-950 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQ) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="p-6 sm:p-8 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                  {currentQ.topic}
                </span>
                <span className="text-xs font-medium text-neutral-400 capitalize">
                  {currentQ.type.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-950 leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Options (MCQ / True False) or Text Input (Short Answer) */}
            {currentQ.options && currentQ.options.length > 0 ? (
              <div className="space-y-3">
                {currentQ.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected = selectedAnswers[currentQ.id] === opt;

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-neutral-950 bg-neutral-100 text-neutral-950 font-bold shadow-2xs'
                          : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-800'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-neutral-950 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}>
                        {letter}
                      </span>
                      <span className="flex-1 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Your Written Answer:</label>
                <textarea
                  rows={3}
                  value={selectedAnswers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Type your explanation or answer..."
                  className="w-full p-3 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
                />
              </div>
            )}

            {/* Question Navigation Footer */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 rounded-lg transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {!isLastQuestion ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="submit-quiz-btn"
                    disabled={isSubmitting}
                    onClick={handleSubmitQuiz}
                    className="px-6 py-2.5 rounded-xl bg-neutral-950 hover:bg-black disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{isSubmitting ? 'Evaluating...' : 'Submit Quiz'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: QUIZ GENERATOR FORM
  // -------------------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Adaptive Quiz Generator</h1>
        <p className="text-sm text-neutral-500">
          Generate rigorous exam-style questions grounded in your course materials
        </p>
      </div>

      {/* Generator Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-2xs space-y-5">
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Subject & Topic
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={currentSubject?.name || ''}
              placeholder="Select or add a subject"
              readOnly
              className="px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 font-semibold"
            />
            {currentSubject?.topics && currentSubject.topics.length > 0 ? (
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 bg-white font-medium text-neutral-900 focus:outline-hidden"
              >
                {currentSubject.topics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic name (e.g. Chapter 1)"
                className="px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 bg-white font-medium text-neutral-900 focus:outline-hidden"
              />
            )}
          </div>
        </div>

        {/* Source Material Grounding Selector */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Ground on Uploaded Study Material (Optional)
          </label>
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 bg-white text-neutral-800 focus:outline-hidden"
          >
            <option value="">General Academic Syllabus</option>
            {subjectMaterials.map((mat) => (
              <option key={mat.id} value={mat.id}>
                📄 {mat.originalName} ({mat.topicsCovered.join(', ')})
              </option>
            ))}
          </select>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Gemini creates questions targeting concepts in your uploaded document.
          </span>
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  difficulty === lvl
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Question Type */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Question Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'mcq', label: 'MCQ (A/B/C/D)' },
              { id: 'true_false', label: 'True / False' },
              { id: 'short_answer', label: 'Short Answer' },
              { id: 'mixed', label: 'Mixed Exam' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQuestionType(t.id as any)}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                  questionType === t.id
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Questions */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Number of Questions
          </label>
          <div className="flex gap-3">
            {[3, 5, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setNumQuestions(num)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  numQuestions === num
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {num} Questions
              </button>
            ))}
          </div>
        </div>

        {/* Generate CTA Button */}
        <div className="pt-4 border-t border-neutral-100">
          <button
            id="btn-generate-quiz-start"
            disabled={isGenerating}
            onClick={handleGenerateQuiz}
            className="w-full py-3 rounded-xl bg-neutral-950 hover:bg-black disabled:opacity-50 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
            <span>{isGenerating ? 'Gemini is generating quiz questions...' : 'Generate & Start Quiz'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

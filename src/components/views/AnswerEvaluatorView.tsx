import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { AnswerEvaluation } from '../../types';
import {
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Check,
  Copy
} from 'lucide-react';

export const AnswerEvaluatorView: React.FC = () => {
  const { subjects, selectedSubjectId } = useStudy();
  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const sampleQuestions = [
    {
      topic: 'Backpropagation',
      question: 'Explain how the backpropagation algorithm computes gradients in a multilayer neural network.',
      sampleInput: 'Backpropagation uses the chain rule to calculate error derivatives from the output layer backwards to adjust weights.'
    },
    {
      topic: 'Activation Functions',
      question: 'Why does the ReLU activation function mitigate the vanishing gradient problem compared to Sigmoid?',
      sampleInput: 'ReLU outputs x for positive values, so its derivative is 1 instead of shrinking to tiny fractions like Sigmoid.'
    },
    {
      topic: 'CNN',
      question: 'What is the specific purpose of max pooling layers in convolutional neural networks?',
      sampleInput: 'Max pooling downsamples the image feature maps to reduce parameters and make it translation invariant.'
    }
  ];

  const [questionText, setQuestionText] = useState(sampleQuestions[0].question);
  const [studentAnswerText, setStudentAnswerText] = useState(sampleQuestions[0].sampleInput);
  const [topic, setTopic] = useState(sampleQuestions[0].topic);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<AnswerEvaluation | null>(null);
  const [copiedModel, setCopiedModel] = useState(false);

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionText.trim() || !studentAnswerText.trim() || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const resp = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          studentAnswer: studentAnswerText,
          topic
        })
      });

      if (!resp.ok) throw new Error('Evaluation failed');
      const data = await resp.json();
      setEvaluationResult(data.evaluation);
    } catch (err: any) {
      alert(err.message || 'Failed to evaluate answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    return 'bg-neutral-100 text-neutral-950 border-neutral-200';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">AI Answer Evaluator</h1>
        <p className="text-sm text-neutral-500">
          Enter your free-form answer to an exam question and receive instant rubric grading & feedback
        </p>
      </div>

      {/* Preset Questions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-neutral-500">Try sample questions:</span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setTopic(q.topic);
              setQuestionText(q.question);
              setStudentAnswerText(q.sampleInput);
              setEvaluationResult(null);
            }}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors border border-neutral-200"
          >
            {q.topic}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleEvaluate} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Exam Question Prompt
          </label>
          <input
            type="text"
            required
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. Explain how backpropagation updates weights..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden font-medium text-neutral-950"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Your Written Answer
          </label>
          <textarea
            rows={4}
            required
            value={studentAnswerText}
            onChange={(e) => setStudentAnswerText(e.target.value)}
            placeholder="Type your complete answer here in your own words..."
            className="w-full p-3.5 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden text-neutral-900 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">
            Graded against academic rubrics by Gemini
          </span>

          <button
            id="btn-evaluate-answer"
            type="submit"
            disabled={isEvaluating || !studentAnswerText.trim()}
            className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-black disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs"
          >
            {isEvaluating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Award className="w-4 h-4" />
            )}
            <span>{isEvaluating ? 'Evaluating Answer...' : 'Evaluate Answer'}</span>
          </button>
        </div>
      </form>

      {/* Evaluation Results Card */}
      {evaluationResult && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
          {/* Score Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                Evaluation Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-neutral-950">{evaluationResult.score}</span>
                <span className="text-sm font-semibold text-neutral-400">/ 10</span>
              </div>
            </div>

            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${getScoreBadgeColor(evaluationResult.score)}`}>
              {evaluationResult.correctness.replace('_', ' ')}
            </span>
          </div>

          {/* Conceptual Assessment */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Conceptual Assessment
            </h4>
            <p className="text-sm text-neutral-800 leading-relaxed">{evaluationResult.conceptualUnderstanding}</p>
          </div>

          {/* What you did well & Missing points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* What you did well */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-neutral-950" />
                What You Did Well
              </h4>
              <ul className="space-y-1 text-xs text-neutral-700 list-disc list-inside leading-relaxed">
                {evaluationResult.whatYouDidWell.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Missing points */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-neutral-500" />
                Missing Points
              </h4>
              <ul className="space-y-1 text-xs text-neutral-700 list-disc list-inside leading-relaxed">
                {evaluationResult.missingPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improvement Suggestions */}
          {evaluationResult.improvementSuggestions?.length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="text-xs font-bold text-neutral-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-neutral-950" />
                How to Elevate to 10/10
              </h4>
              <ul className="space-y-1 text-xs text-neutral-700 list-disc list-inside leading-relaxed">
                {evaluationResult.improvementSuggestions.map((sug, i) => (
                  <li key={i}>{sug}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Model Answer */}
          <div className="p-5 rounded-xl bg-neutral-950 text-neutral-100 space-y-2 border border-neutral-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Full-Marks Model Answer
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(evaluationResult.modelAnswer);
                  setCopiedModel(true);
                  setTimeout(() => setCopiedModel(false), 2000);
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
              >
                {copiedModel ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedModel ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans whitespace-pre-wrap">
              {evaluationResult.modelAnswer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

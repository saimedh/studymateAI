import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { StudyPlan, StudyPlanDay, StudyPlanActivity } from '../../types';
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Layers,
  RotateCcw,
  Loader2,
  ArrowRight,
  TrendingUp,
  Target
} from 'lucide-react';

export const StudyPlanView: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    studyPlans,
    profile,
    updateProfile,
    toggleActivityCompletion,
    regenerateStudyPlan,
    weakTopics,
    setActiveTab
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const activePlan = (selectedSubjectId ? studyPlans[selectedSubjectId] : null) || Object.values(studyPlans)[0] || null;

  const [isGenerating, setIsGenerating] = useState(false);
  const [examDateInput, setExamDateInput] = useState(profile.examDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [dailyHours, setDailyHours] = useState(Math.round(profile.dailyStudyMinutes / 60) || 2);
  const [targetScore, setTargetScore] = useState(profile.targetScore || 'A (90%+)');

  const subjectWeak = weakTopics.filter(w => !selectedSubjectId || w.subjectId === selectedSubjectId);

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject) {
      alert('Please add or select a subject before generating a study plan.');
      return;
    }
    setIsGenerating(true);
    try {
      updateProfile({
        examDate: examDateInput,
        dailyStudyMinutes: dailyHours * 60,
        targetScore
      });

      await regenerateStudyPlan(selectedSubjectId || currentSubject.id);
    } catch (err: any) {
      alert(err.message || 'Error generating plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const getActivityIcon = (type: StudyPlanActivity['type']) => {
    switch (type) {
      case 'learning':
        return <BookOpen className="w-3.5 h-3.5 text-neutral-800" />;
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5 text-neutral-800" />;
      case 'practice':
        return <Layers className="w-3.5 h-3.5 text-neutral-800" />;
      case 'revision':
        return <RotateCcw className="w-3.5 h-3.5 text-neutral-800" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-neutral-800" />;
    }
  };

  // Calculate overall plan progress
  const totalActivities = activePlan?.days.reduce((acc, d) => acc + d.activities.length, 0) || 0;
  const completedActivities = activePlan?.days.reduce(
    (acc, d) => acc + d.activities.filter(a => a.completed).length,
    0
  ) || 0;
  const planProgressPct = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Adaptive Study Planner</h1>
          <p className="text-sm text-neutral-500">
            Day-by-day intelligent calendar that auto-adjusts when weaknesses are detected
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-neutral-950" />
          <span>Adaptive Loop Enabled</span>
        </div>
      </div>

      {/* Plan Parameters Card */}
      <form onSubmit={handleRegenerate} className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Target Exam Date
            </label>
            <input
              type="date"
              value={examDateInput}
              onChange={(e) => setExamDateInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Available Hours / Day
            </label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden bg-white text-neutral-900"
            >
              <option value={1}>1 Hour / Day</option>
              <option value={2}>2 Hours / Day</option>
              <option value={3}>3 Hours / Day</option>
              <option value={4}>4+ Hours / Day</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Target Grade / Goal
            </label>
            <input
              type="text"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              placeholder="e.g. A (90%+)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100">
          <div className="text-xs text-neutral-500">
            Subject: <strong className="text-neutral-900">{currentSubject?.name || 'All'}</strong>
            {subjectWeak.length > 0 && (
              <span className="ml-2 text-neutral-900 font-semibold">
                • {subjectWeak[0].topic} prioritized
              </span>
            )}
          </div>

          <button
            id="btn-regenerate-study-plan"
            type="submit"
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-black disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isGenerating ? 'Gemini is planning...' : 'Re-calculate Adaptive Plan'}</span>
          </button>
        </div>
      </form>

      {/* Progress Bar Header */}
      <div className="p-4 rounded-xl bg-white border border-neutral-200 flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Plan Completion</span>
          <span className="text-base font-bold text-neutral-950">
            {completedActivities} of {totalActivities} activities done ({planProgressPct}%)
          </span>
        </div>
        <div className="w-40">
          <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-neutral-950 rounded-full transition-all duration-300"
              style={{ width: `${planProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Day by Day Plan Schedule */}
      <div className="space-y-4">
        {!activePlan || !activePlan.days || activePlan.days.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
            <Calendar className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-base font-bold text-neutral-950">No study plan generated yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Set your target exam date and daily study hours above, then click &quot;Re-calculate Adaptive Plan&quot; to generate an intelligent day-by-day roadmap tailored to your schedule.
            </p>
          </div>
        ) : (
          activePlan.days.map((day) => {
          const isToday = day.dayNumber === 1;

          return (
            <div
              key={day.dayNumber}
              className={`rounded-xl border p-5 sm:p-6 transition-all ${
                isToday
                  ? 'bg-white border-neutral-950 shadow-xs'
                  : 'bg-white border-neutral-200 shadow-2xs'
              }`}
            >
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isToday ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    D{day.dayNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-950">{day.title}</h3>
                      {isToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-950 text-white uppercase">
                          Today's Focus
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">{day.topic}</p>
                  </div>
                </div>

                <span className="text-xs text-neutral-400 font-medium">{day.dateStr}</span>
              </div>

              {/* Day Activities List */}
              <div className="mt-4 space-y-2.5">
                {day.activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => toggleActivityCompletion(selectedSubjectId || 'subj_ai', day.dayNumber, activity.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      activity.completed
                        ? 'bg-neutral-50 border-neutral-200/60 opacity-60'
                        : 'bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        {activity.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-neutral-950" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-neutral-100">
                          {getActivityIcon(activity.type)}
                        </span>
                        <span className={`text-xs font-medium ${activity.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                          {activity.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-neutral-400">
                        {activity.durationMinutes} mins
                      </span>
                      {activity.type === 'quiz' && !activity.completed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('quiz');
                          }}
                          className="text-[11px] font-bold text-neutral-950 hover:underline"
                        >
                          Take Quiz →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};

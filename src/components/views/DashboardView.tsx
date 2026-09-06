import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { StreakCelebrationCard } from '../common/StreakCelebrationCard';
import { DailyGoalCard } from '../common/DailyGoalCard';
import { ConfettiCelebration, fireCelebration, CelebrationType } from '../common/ConfettiCelebration';
import {
  Flame,
  Clock,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Bot,
  HelpCircle,
  BookOpen,
  ArrowRight,
  FileText,
  Play,
  Calendar,
  Layers,
  ChevronRight,
  Zap,
  Target,
  Trophy
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    profile,
    subjects,
    selectedSubjectId,
    materials,
    quizResults,
    weakTopics,
    recommendations,
    studyPlans,
    celebrationEvent,
    clearCelebration,
    setActiveTab,
    setSelectedSubjectId,
    setSelectedMaterialForAction,
    dismissRecommendation
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectWeakTopics = weakTopics.filter(w => !selectedSubjectId || w.subjectId === selectedSubjectId);
  const primaryWeakTopic = subjectWeakTopics.find(w => w.masteryPercentage < 70) || weakTopics[0];

  // Calculate stats
  const totalQuizzes = quizResults.length;
  const avgQuizScore = totalQuizzes > 0
    ? Math.round(quizResults.reduce((acc, r) => acc + r.percentage, 0) / totalQuizzes)
    : 78;

  const masteredTopicsCount = weakTopics.filter(w => w.masteryPercentage >= 80).length;
  const weakTopicsCount = weakTopics.filter(w => w.masteryPercentage < 70).length;

  const currentPlan = studyPlans[selectedSubjectId] || studyPlans['subj_ai'];
  const todayPlanDay = currentPlan?.days[0];

  const [activeCelebration, setActiveCelebration] = useState<{
    active: boolean;
    type: CelebrationType;
    title: string;
    description: string;
    icon: 'flame' | 'trophy' | 'sparkles' | 'check' | 'star' | 'award';
  }>({
    active: false,
    type: 'streak_milestone',
    title: '',
    description: '',
    icon: 'flame',
  });

  const isCelebrationActive = !!(celebrationEvent?.active || activeCelebration.active);
  const celebrationType = celebrationEvent?.type || activeCelebration.type;
  const celebrationTitle = celebrationEvent?.title || activeCelebration.title;
  const celebrationDesc = celebrationEvent?.description || activeCelebration.description;
  const celebrationIcon = celebrationEvent?.icon || activeCelebration.icon;

  const handleCloseCelebration = () => {
    setActiveCelebration(prev => ({ ...prev, active: false }));
    clearCelebration();
  };

  const triggerMilestoneModal = (days: number) => {
    setActiveCelebration({
      active: true,
      type: 'streak_milestone',
      title: `${days}-Day Streak Milestone!`,
      description: `Incredible work! You've officially celebrated the ${days}-day study streak milestone.`,
      icon: 'trophy',
    });
  };

  const activeRec = recommendations.find(r => !r.dismissed) || {
    id: 'default_rec',
    title: `Remediation for ${primaryWeakTopic?.topic || 'Backpropagation'}`,
    description: `Your weakest topic is ${primaryWeakTopic?.topic || 'Backpropagation'}. Spend 30 minutes reviewing the chain rule and hidden layer deltas today.`,
    subjectId: selectedSubjectId,
    topic: primaryWeakTopic?.topic || 'Backpropagation',
    suggestedAction: 'study_session',
    estimatedMinutes: 30,
    date: new Date().toISOString()
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Global Dashboard Confetti Celebration Toast */}
      <ConfettiCelebration
        trigger={isCelebrationActive}
        type={celebrationType}
        title={celebrationTitle}
        description={celebrationDesc}
        icon={celebrationIcon}
        onClose={handleCloseCelebration}
      />

      {/* 1. Welcome & Primary Agent Recommendation Banner */}
      <div className="rounded-2xl bg-neutral-950 text-white p-6 sm:p-8 border border-neutral-900 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>AI Learning Companion Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {profile.name}
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {activeRec.description}
            </p>

            {/* AI Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                id="btn-start-study-session"
                onClick={() => setActiveTab('session')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-xs"
              >
                <Play className="w-4 h-4 fill-neutral-950" />
                <span>Start Study Session</span>
              </button>

              <button
                id="btn-ask-ai-tutor"
                onClick={() => setActiveTab('tutor')}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-white text-xs sm:text-sm font-semibold border border-neutral-800 transition-all flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-neutral-300" />
                <span>Ask AI Tutor</span>
              </button>

              <button
                id="btn-take-quiz"
                onClick={() => setActiveTab('quiz')}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-white text-xs sm:text-sm font-semibold border border-neutral-800 transition-all flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-neutral-300" />
                <span>Take Quiz</span>
              </button>
            </div>
          </div>

          {/* Quick Exam Countdown Box */}
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 min-w-[220px] text-center shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">Target Exam</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {profile.targetScore}
            </span>
            <div className="mt-2 text-xs text-neutral-400 flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-300" />
              <span>{profile.examDate ? `${Math.max(1, Math.ceil((new Date(profile.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days remaining` : '10 days remaining'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StreakCelebrationCard />

        <DailyGoalCard
          onGoalCompleted={() => {
            setActiveCelebration({
              active: true,
              type: 'daily_goal',
              title: 'Daily Study Goal Completed!',
              description: `Congratulations! You've achieved your target of ${profile.dailyStudyMinutes} minutes of focused learning.`,
              icon: 'check',
            });
          }}
        />

        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Quiz Average</span>
            <div className="p-2 rounded-lg bg-neutral-100 text-neutral-900">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-2">{avgQuizScore}%</p>
          <span className="text-xs text-neutral-500 font-medium mt-1 block">{totalQuizzes} quizzes completed</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Mastery Status</span>
            <div className="p-2 rounded-lg bg-neutral-100 text-neutral-900">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-neutral-950">{masteredTopicsCount}</span>
            <span className="text-xs text-neutral-400">mastered /</span>
            <span className="text-2xl font-bold text-neutral-600">{weakTopicsCount}</span>
            <span className="text-xs text-neutral-400">weak</span>
          </div>
          <span className="text-xs text-neutral-500 font-medium mt-1 block">Adaptive mastery curve</span>
        </div>
      </div>

      {/* 2b. Milestone Achievements & Celebration Ribbon */}
      <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider">
                Streak Milestones
              </h3>
              <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full border border-neutral-200">
                Active: {profile.streakDays || 0} Days
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Consistently hitting study goals unlocks celebratory milestones and badges.
            </p>
          </div>
        </div>

        {/* Milestone Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[3, 7, 14, 30, 50].map((days) => {
            const isReached = (profile.streakDays || 0) >= days;
            const isNext = !isReached && (profile.streakDays || 0) < days && (profile.streakDays || 0) >= days - 4;
            return (
              <button
                key={days}
                id={`btn-milestone-${days}`}
                onClick={() => triggerMilestoneModal(days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-98 ${
                  isReached
                    ? 'bg-neutral-950 text-white shadow-2xs hover:bg-black'
                    : isNext
                    ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-neutral-50 border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
                title={`Celebrate ${days}-day milestone`}
              >
                {isReached ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Award className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>{days}d {isReached ? 'Achieved' : isNext ? 'Target' : 'Milestone'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Continue Learning & Weak Topics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning Section */}
        <div className="lg:col-span-1 rounded-xl bg-white border border-neutral-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-950">Continue Learning</h2>
              <span className="text-[11px] font-semibold text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                Active Topic
              </span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-950 uppercase tracking-wider">
                  {currentSubject ? currentSubject.name : 'Artificial Intelligence'}
                </span>
                <span className="text-[11px] font-semibold text-neutral-700 bg-neutral-200/80 px-2 py-0.5 rounded">
                  Needs Review
                </span>
              </div>
              <h3 className="text-base font-bold text-neutral-950 mt-2">
                Topic: {primaryWeakTopic?.topic || 'Backpropagation'}
              </h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Multivariate calculus chain rule, gradient updates, and hidden layer delta calculations.
              </p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-600">Topic Mastery</span>
                  <span className="text-neutral-950">{primaryWeakTopic?.masteryPercentage || 50}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-neutral-950 rounded-full transition-all duration-500"
                    style={{ width: `${primaryWeakTopic?.masteryPercentage || 50}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            id="btn-continue-learning"
            onClick={() => setActiveTab('session')}
            className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Continue Topic</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Topics Needing Improvement / Weak Topics */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-neutral-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-950">Topics Needing Improvement</h2>
              <p className="text-xs text-neutral-500">Automatically detected from your quiz submissions</p>
            </div>
            <button
              onClick={() => setActiveTab('progress')}
              className="text-xs font-semibold text-neutral-900 hover:text-black flex items-center gap-1"
            >
              View Analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {subjectWeakTopics.slice(0, 3).map((item) => (
              <div
                key={item.topic}
                className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neutral-950" />
                    <span className="text-sm font-bold text-neutral-950">{item.topic}</span>
                    <span className="text-xs text-neutral-500 font-normal">({item.questionsFailed} missed out of {item.questionsAttempted})</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-200 text-neutral-800">
                    {item.masteryPercentage}% Mastery
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="w-full h-1.5 rounded-full bg-neutral-200 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-neutral-950"
                    style={{ width: `${item.masteryPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="truncate max-w-md">{item.recommendedAction}</span>
                  <button
                    onClick={() => {
                      setActiveTab('tutor');
                    }}
                    className="text-neutral-950 font-bold hover:underline shrink-0 ml-2"
                  >
                    Remediate →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Today's Study Plan & Recent Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Study Plan */}
        <div className="rounded-xl bg-white border border-neutral-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-900" />
              <h2 className="text-base font-bold text-neutral-950">Today's Study Plan</h2>
            </div>
            <button
              onClick={() => setActiveTab('plan')}
              className="text-xs font-semibold text-neutral-900 hover:text-black flex items-center gap-1"
            >
              Full Schedule <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayPlanDay ? (
            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-neutral-600 uppercase">Focus of the Day</span>
                  <p className="text-sm font-bold text-neutral-950">{todayPlanDay.title}</p>
                </div>
                <span className="text-xs bg-white text-neutral-900 font-semibold px-2.5 py-1 rounded-lg border border-neutral-200">
                  {todayPlanDay.topic}
                </span>
              </div>

              <div className="space-y-2">
                {todayPlanDay.activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${act.completed ? 'bg-neutral-950' : 'bg-neutral-300'}`} />
                      <span className={act.completed ? 'line-through text-neutral-400 font-medium' : 'text-neutral-800 font-medium'}>
                        {act.description}
                      </span>
                    </div>
                    <span className="text-neutral-500 font-semibold shrink-0 ml-2">{act.durationMinutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-6 text-center">No plan created yet for this subject.</p>
          )}
        </div>

        {/* Recent Study Materials with Actions */}
        <div className="rounded-xl bg-white border border-neutral-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-900" />
              <h2 className="text-base font-bold text-neutral-950">Recent Materials</h2>
            </div>
            <button
              onClick={() => setActiveTab('materials')}
              className="text-xs font-semibold text-neutral-900 hover:text-black flex items-center gap-1"
            >
              Upload / View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {materials.slice(0, 2).map((mat) => (
              <div
                key={mat.id}
                className="p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-400 transition-colors bg-white flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-neutral-100 text-neutral-900">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-950 truncate max-w-xs">{mat.originalName}</p>
                      <span className="text-[11px] text-neutral-500">
                        {new Date(mat.uploadDate).toLocaleDateString()} • {mat.fileType.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
                    Ready
                  </span>
                </div>

                {/* Quick actions for material */}
                <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMaterialForAction(mat);
                      setActiveTab('materials');
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                  >
                    Summarize
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMaterialForAction(mat);
                      setActiveTab('quiz');
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                  >
                    Generate Quiz
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMaterialForAction(mat);
                      setActiveTab('tutor');
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                  >
                    Ask Questions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Recent Quiz Results */}
      <div className="rounded-xl bg-white border border-neutral-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-neutral-900" />
            <h2 className="text-base font-bold text-neutral-950">Recent Quiz Results</h2>
          </div>
          <button
            onClick={() => setActiveTab('quiz')}
            className="text-xs font-semibold text-neutral-900 hover:text-black"
          >
            Take New Quiz →
          </button>
        </div>

        <div className="divide-y divide-neutral-100">
          {quizResults.slice(0, 3).map((res) => (
            <div key={res.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-neutral-950">{res.topic}</p>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                  <span>{new Date(res.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Weak topics: <strong className="text-neutral-950 font-semibold">{res.weakTopics.join(', ')}</strong></span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-neutral-950">
                  {res.score}/{res.totalQuestions} ({res.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  TrendingUp,
  Award,
  Clock,
  Flame,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export const ProgressView: React.FC = () => {
  const {
    profile,
    subjects,
    selectedSubjectId,
    weakTopics,
    quizResults,
    setActiveTab
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectWeakTopics = weakTopics.filter(w => !selectedSubjectId || w.subjectId === selectedSubjectId);

  // Prepare Quiz Score Trends data for Recharts
  const quizTrendData = quizResults.slice().reverse().map((q, idx) => ({
    name: `Quiz ${idx + 1}`,
    score: q.percentage,
    topic: q.topic,
    date: new Date(q.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }));

  // Topic Mastery Data
  const masteryData = subjectWeakTopics.map((item) => ({
    topic: item.topic,
    mastery: item.masteryPercentage,
    failed: item.questionsFailed,
    attempted: item.questionsAttempted
  }));

  const masteredTopics = subjectWeakTopics.filter(t => t.masteryPercentage >= 75);
  const weakTopicsList = subjectWeakTopics.filter(t => t.masteryPercentage < 70);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Learning Analytics & Mastery</h1>
        <p className="text-sm text-neutral-500">
          Continuous tracking of your knowledge retention, score velocity, and mastery milestones
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Streak</span>
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-950">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-2">{profile.streakDays} Days</p>
          <span className="text-xs text-neutral-500 font-medium mt-1 block">
            Best record: <strong>{profile.longestStreakDays || profile.streakDays} days</strong>
          </span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Time</span>
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-950">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-2">
            {Math.round(profile.totalStudyMinutes / 60)}h {profile.totalStudyMinutes % 60}m
          </p>
          <span className="text-xs text-neutral-500 font-medium mt-1 block">Active engagement</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Mastered Topics</span>
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-950">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-2">{masteredTopics.length}</p>
          <span className="text-xs text-neutral-500 font-medium mt-1 block">≥75% retention threshold</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Needs Attention</span>
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-950">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-950 mt-2">{weakTopicsList.length}</p>
          <span className="text-xs text-neutral-500 font-medium mt-1 block">Targeted by adaptive loop</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Score Velocity Chart */}
        <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-950">Quiz Score Trends</h2>
              <p className="text-xs text-neutral-500">Historical performance across practice assessments</p>
            </div>
            <span className="text-xs font-semibold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-md">
              Target: 90%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quizTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" stroke="#737373" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#171717"
                  strokeWidth={2.5}
                  dot={{ fill: '#171717', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Mastery Distribution Bar Chart */}
        <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-950">Topic Mastery Percentage</h2>
              <p className="text-xs text-neutral-500">Evaluated through quiz answers and study sessions</p>
            </div>
            <span className="text-xs text-neutral-400">Black ≥ 70%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={masteryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="topic" stroke="#737373" fontSize={10} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis domain={[0, 100]} stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
                  {masteryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.mastery >= 70 ? '#171717' : entry.mastery >= 55 ? '#737373' : '#a3a3a3'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Topics Detailed Mastery & Remediation List */}
      <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-neutral-950">Detailed Concept Breakdown</h2>
            <p className="text-xs text-neutral-500">Action items prioritized by your lowest retention scores</p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {subjectWeakTopics.map((topic) => {
            return (
              <div key={topic.topic} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-950">{topic.topic}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {topic.masteryPercentage}% Mastery
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 max-w-xl">
                    {topic.recommendedAction}
                  </p>
                  <span className="text-[11px] text-neutral-400 block">
                    Failed {topic.questionsFailed} of {topic.questionsAttempted} quiz questions
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('session')}
                    className="px-3.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Practice Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('tutor')}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition-colors"
                  >
                    Ask Tutor
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

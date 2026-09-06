import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Trophy, Sparkles, CheckCircle2, Cloud, RefreshCw, AlertCircle } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { STREAK_MILESTONES } from '../../lib/streakService';

interface StreakCelebrationCardProps {
  className?: string;
}

export const StreakCelebrationCard: React.FC<StreakCelebrationCardProps> = ({ className = '' }) => {
  const {
    profile,
    studyStreak,
    streakEvaluation,
    recordStudyActivity,
    triggerCelebration,
    user,
    isSyncing
  } = useStudy();

  const [isLogging, setIsLogging] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);

  const currentStreak = streakEvaluation.currentStreak;
  const longestStreak = streakEvaluation.longestStreak;
  const nextMilestone = streakEvaluation.nextMilestone;
  const daysToMilestone = streakEvaluation.daysToNextMilestone;

  const handleAdvanceStreak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLogging) return;

    setIsLogging(true);
    setIsGlowing(true);

    try {
      await recordStudyActivity(30, 'Daily Study Progress');
    } catch (err) {
      console.error('Failed to record study streak:', err);
    } finally {
      setIsLogging(false);
      setTimeout(() => {
        setIsGlowing(false);
      }, 4000);
    }
  };

  const handleTriggerMilestonePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGlowing(true);
    triggerCelebration({
      active: true,
      type: 'streak_milestone',
      title: `${nextMilestone}-Day Streak Milestone!`,
      description: `Targeting your next big milestone! Continue studying daily to reach ${nextMilestone} consecutive days in Firestore.`,
      icon: 'flame',
      streakCount: nextMilestone,
    });

    setTimeout(() => {
      setIsGlowing(false);
    }, 4500);
  };

  return (
    <motion.div
      id="dashboard-streak-counter-card"
      className={`relative p-5 rounded-xl bg-white border transition-colors duration-300 flex flex-col justify-between ${
        isGlowing ? 'border-amber-400 shadow-lg' : 'border-neutral-200 shadow-2xs'
      } ${className}`}
      animate={
        isGlowing
          ? {
              boxShadow: [
                '0 0 0 0 rgba(245, 158, 11, 0)',
                '0 0 25px 4px rgba(245, 158, 11, 0.45)',
                '0 0 15px 2px rgba(245, 158, 11, 0.25)',
                '0 0 25px 4px rgba(245, 158, 11, 0.45)',
                '0 0 10px 1px rgba(245, 158, 11, 0.15)',
              ],
              borderColor: ['#f59e0b', '#fbbf24', '#f59e0b'],
            }
          : {
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
              borderColor: '#e5e5e5',
            }
      }
      transition={{
        duration: isGlowing ? 2.5 : 0.3,
        repeat: isGlowing ? 1 : 0,
        ease: 'easeInOut',
      }}
    >
      {/* Subtle celebratory ambient glow aura */}
      {isGlowing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: [0.2, 0.6, 0.3], scale: [0.98, 1.02, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-400/20 via-neutral-900/10 to-amber-500/20 blur-xs -z-10 pointer-events-none"
        />
      )}

      <div>
        {/* Card Header with badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Study Streak
            </span>

            {streakEvaluation.isRecordPace && currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Trophy className="w-2.5 h-2.5 text-amber-600" />
                <span>Record</span>
              </span>
            )}

            {streakEvaluation.isStudiedToday ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                <span>Active Today</span>
              </span>
            ) : streakEvaluation.isStreakBroken ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                <span>Lapsed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                <span>Pending Today</span>
              </span>
            )}
          </div>

          {/* Flame Icon with celebratory pulse */}
          <motion.div
            animate={
              isGlowing || streakEvaluation.isStudiedToday
                ? { scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 1.5, repeat: isGlowing ? Infinity : 0, ease: 'easeInOut' }}
            className={`p-2 rounded-lg transition-colors duration-300 ${
              streakEvaluation.isStudiedToday || isGlowing
                ? 'bg-amber-100 text-amber-600 shadow-inner'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            <Flame className={`w-4 h-4 ${streakEvaluation.isStudiedToday || isGlowing ? 'fill-amber-500 text-amber-600' : ''}`} />
          </motion.div>
        </div>

        {/* Main Counter Display */}
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-neutral-950">
              {currentStreak} <span className="text-base font-normal text-neutral-500">Days</span>
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-neutral-500 font-medium block">
                Best: <strong>{longestStreak}d</strong>
              </span>
              <span className="text-[11px] text-neutral-400">•</span>
              <span className="text-[11px] text-neutral-600 font-medium">
                Next: <strong>{nextMilestone}d</strong> ({daysToMilestone}d away)
              </span>
            </div>
          </div>
        </div>

        {/* Firestore Sync Indicator */}
        <div className="mt-2 flex items-center gap-1 text-[10px] text-neutral-400">
          <Cloud className="w-3 h-3 text-neutral-400" />
          <span>
            {user ? (
              isSyncing ? 'Syncing to Firestore...' : 'Tracked in Firestore'
            ) : (
              'Local streak (Sign in to sync)'
            )}
          </span>
          {studyStreak.totalStudyDays ? (
            <span className="text-neutral-400 ml-auto">
              {studyStreak.totalStudyDays} days total
            </span>
          ) : null}
        </div>
      </div>

      {/* Interactive Milestone Advance / Celebration Actions */}
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
        <button
          id="btn-advance-streak"
          onClick={handleAdvanceStreak}
          disabled={isLogging}
          title="Record study activity in Firestore and celebrate streak progression"
          className="px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-black text-white text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50"
        >
          {isLogging ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>
            {streakEvaluation.isStudiedToday
              ? '+1 Study Session'
              : currentStreak + 1 === nextMilestone
              ? `Hit ${nextMilestone}d Milestone!`
              : currentStreak >= longestStreak
              ? '+1 Day (New Record)'
              : '+1 Day Streak'}
          </span>
        </button>

        <button
          id="btn-trigger-milestone-goal"
          onClick={handleTriggerMilestonePreview}
          title={`Celebrate ${nextMilestone}-day streak milestone`}
          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 text-[11px] font-medium transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline text-[10px]">{nextMilestone}d Goal</span>
        </button>
      </div>
    </motion.div>
  );
};

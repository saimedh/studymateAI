import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle2, Clock, Sparkles, Trophy } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { ConfettiCelebration, CelebrationType } from './ConfettiCelebration';

interface DailyGoalCardProps {
  className?: string;
  onGoalCompleted?: () => void;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  className = '',
  onGoalCompleted,
}) => {
  const { profile, updateProfile, recordStudyActivity } = useStudy();
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [isGlow, setIsGlow] = useState(false);

  const goalMinutes = profile.dailyStudyMinutes || 45;
  const isCompleted = !!profile.dailyGoalCompleted;
  // Compute progress: if completed 100%, otherwise compute based on session minutes
  const currentMinutes = isCompleted
    ? goalMinutes
    : Math.min(goalMinutes - 10, Math.max(15, (profile.totalStudyMinutes % goalMinutes) || 30));
  const progressPercent = Math.min(100, Math.round((currentMinutes / goalMinutes) * 100));

  const handleCompleteGoal = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const remainingMinutes = goalMinutes - currentMinutes > 0 ? goalMinutes - currentMinutes : 15;

    // Call streak and Firestore recorder
    await recordStudyActivity(remainingMinutes, 'Daily Goal Completion');

    setIsGlow(true);
    setCelebrationActive(true);
    onGoalCompleted?.();

    setTimeout(() => {
      setIsGlow(false);
      setCelebrationActive(false);
    }, 4500);
  };

  const handleReplayCelebration = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGlow(true);
    setCelebrationActive(true);
    setTimeout(() => {
      setIsGlow(false);
      setCelebrationActive(false);
    }, 4500);
  };

  return (
    <motion.div
      id="dashboard-daily-goal-card"
      animate={
        isGlow
          ? {
              boxShadow: [
                '0 0 0 0 rgba(245, 158, 11, 0)',
                '0 0 25px 3px rgba(245, 158, 11, 0.4)',
                '0 0 15px 2px rgba(245, 158, 11, 0.2)',
                '0 0 25px 3px rgba(245, 158, 11, 0.4)',
                '0 0 8px 1px rgba(245, 158, 11, 0.1)',
              ],
              borderColor: ['#f59e0b', '#fbbf24', '#f59e0b'],
            }
          : {
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
              borderColor: '#e5e5e5',
            }
      }
      transition={{ duration: 2.2, repeat: isGlow ? 1 : 0 }}
      className={`relative p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-between ${className}`}
    >
      {/* Reusable Confetti Celebration component */}
      <ConfettiCelebration
        trigger={celebrationActive}
        type="daily_goal"
        title="Daily Study Goal Completed!"
        description={`Outstanding! You've achieved your target of ${goalMinutes} minutes of focused learning for today.`}
        icon="check"
        onClose={() => setCelebrationActive(false)}
      />

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Daily Study Goal
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-900 text-white">
                <CheckCircle2 className="w-2.5 h-2.5 text-amber-400" />
                <span>Done</span>
              </span>
            )}
          </div>
          <div
            className={`p-2 rounded-lg transition-colors ${
              isCompleted
                ? 'bg-amber-100 text-amber-600'
                : 'bg-neutral-100 text-neutral-900'
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
        </div>

        {/* Progress Display */}
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl sm:text-3xl font-bold text-neutral-950">
            {isCompleted ? goalMinutes : currentMinutes}
            <span className="text-base font-normal text-neutral-500"> / {goalMinutes}m</span>
          </p>
          <span className="text-xs font-bold text-neutral-700">
            {isCompleted ? '100%' : `${progressPercent}%`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden mt-2.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: isCompleted ? '100%' : `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all ${
              isCompleted
                ? 'bg-neutral-950'
                : 'bg-neutral-800'
            }`}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
        {!isCompleted ? (
          <button
            id="btn-complete-daily-goal"
            onClick={handleCompleteGoal}
            className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-black text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-98"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Complete Daily Goal</span>
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-neutral-500 font-medium">
              Goal achieved today! 🔥
            </span>
            <button
              id="btn-replay-goal-celebration"
              onClick={handleReplayCelebration}
              title="Replay goal celebration"
              className="px-2 py-1 rounded-md border border-neutral-200 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 text-[11px] font-medium transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Celebrate</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

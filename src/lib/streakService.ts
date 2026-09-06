import { StudyStreak, StudentProfile, CelebrationEvent } from '../types';

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100];

/**
 * Format a Date object as YYYY-MM-DD in local time
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date string YYYY-MM-DD in local time
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}

/**
 * Difference in calendar days between two YYYY-MM-DD date strings
 */
export function getCalendarDaysDiff(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);
  const diffMs = date2.getTime() - date1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface StreakEvaluation {
  currentStreak: number;
  longestStreak: number;
  isStudiedToday: boolean;
  isActivePending: boolean; // Studied yesterday, waiting for today's study to advance streak
  isStreakBroken: boolean;
  daysToNextMilestone: number;
  nextMilestone: number;
  isRecordPace: boolean;
}

/**
 * Evaluate accurate streak count based on current date and last study date
 */
export function evaluateStreak(
  lastStudyDate: string | undefined,
  savedStreakDays: number,
  longestStreakDays?: number
): StreakEvaluation {
  const today = formatLocalDate();
  const longest = Math.max(savedStreakDays || 0, longestStreakDays || 0);

  if (!lastStudyDate) {
    const nextM = STREAK_MILESTONES.find(m => m > savedStreakDays) || savedStreakDays + 7;
    return {
      currentStreak: savedStreakDays,
      longestStreak: longest,
      isStudiedToday: false,
      isActivePending: true,
      isStreakBroken: false,
      daysToNextMilestone: Math.max(0, nextM - savedStreakDays),
      nextMilestone: nextM,
      isRecordPace: savedStreakDays >= longest && savedStreakDays > 0,
    };
  }

  const daysSinceLast = getCalendarDaysDiff(lastStudyDate, today);

  let currentStreak = savedStreakDays;
  let isStudiedToday = false;
  let isActivePending = false;
  let isStreakBroken = false;

  if (daysSinceLast === 0) {
    // Studied today! Streak is maintained and confirmed
    isStudiedToday = true;
    currentStreak = Math.max(1, savedStreakDays);
  } else if (daysSinceLast === 1) {
    // Studied yesterday! Streak is still intact, user has today to study and increment
    isActivePending = true;
    currentStreak = savedStreakDays;
  } else if (daysSinceLast > 1) {
    // Missed at least one calendar day (yesterday)
    isStreakBroken = true;
    currentStreak = 0; // Streak lapsed
  } else {
    // Future date or edge case
    isStudiedToday = true;
  }

  const nextMilestone = STREAK_MILESTONES.find(m => m > currentStreak) || currentStreak + 7;
  const daysToNextMilestone = Math.max(0, nextMilestone - currentStreak);

  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, longest),
    isStudiedToday,
    isActivePending,
    isStreakBroken,
    daysToNextMilestone,
    nextMilestone,
    isRecordPace: currentStreak >= longest && currentStreak > 0,
  };
}

export interface ActivityRecordResult {
  updatedStreak: StudyStreak;
  updatedProfile: Partial<StudentProfile>;
  celebration?: CelebrationEvent;
}

/**
 * Process a study event and return updated streak, updated profile, and any celebratory event
 */
export function recordStudySession(
  currentStreakData: StudyStreak,
  profile: StudentProfile,
  minutesAdded: number = 15,
  activityName: string = 'Study Activity'
): ActivityRecordResult {
  const today = formatLocalDate();
  const yesterday = getYesterdayDateString();

  const history = { ...(currentStreakData.history || {}) };
  const todayMinutesBefore = history[today] || 0;
  const todayMinutesAfter = todayMinutesBefore + minutesAdded;
  history[today] = todayMinutesAfter;

  const previousStreak = currentStreakData.currentStreak || 0;
  const previousLongest = Math.max(previousStreak, currentStreakData.longestStreak || 0, profile.longestStreakDays || 0);

  let newStreak = previousStreak;
  let totalStudyDays = currentStreakData.totalStudyDays || 1;
  const alreadyStudiedToday = currentStreakData.lastStudyDate === today;

  if (!alreadyStudiedToday) {
    if (currentStreakData.lastStudyDate === yesterday) {
      // Studied consecutive day!
      newStreak = previousStreak + 1;
      totalStudyDays += 1;
    } else if (!currentStreakData.lastStudyDate || previousStreak === 0) {
      // Starting or restarting streak
      newStreak = 1;
      totalStudyDays += 1;
    } else {
      // Broken streak restarted
      newStreak = 1;
      totalStudyDays += 1;
    }
  }

  const newLongest = Math.max(newStreak, previousLongest);
  const dailyGoalTarget = profile.dailyStudyMinutes || 45;
  const wasGoalAlreadyMet = profile.dailyGoalCompleted || todayMinutesBefore >= dailyGoalTarget;
  const isGoalMetNow = todayMinutesAfter >= dailyGoalTarget;

  // Check celebrations
  let celebration: CelebrationEvent | undefined;
  const isMilestone = STREAK_MILESTONES.includes(newStreak) && (!alreadyStudiedToday || currentStreakData.lastCelebratedMilestone !== newStreak);
  const isNewRecord = newStreak > previousLongest && !alreadyStudiedToday;
  const isNewDailyGoal = !wasGoalAlreadyMet && isGoalMetNow;

  let lastCelebratedMilestone = currentStreakData.lastCelebratedMilestone;

  if (isMilestone) {
    lastCelebratedMilestone = newStreak;
    celebration = {
      active: true,
      type: 'streak_milestone',
      title: `${newStreak}-Day Streak Milestone!`,
      description: `Spectacular dedication! You've achieved the ${newStreak}-day study streak milestone in Firestore.`,
      icon: 'flame',
      streakCount: newStreak,
    };
  } else if (isNewRecord) {
    celebration = {
      active: true,
      type: 'record_broken',
      title: `New Streak Personal Record: ${newStreak} Days!`,
      description: `You've officially surpassed your previous personal best. Keep the momentum going!`,
      icon: 'trophy',
      streakCount: newStreak,
    };
  } else if (isNewDailyGoal) {
    celebration = {
      active: true,
      type: 'daily_goal',
      title: `Daily Goal Achieved! (${todayMinutesAfter}/${dailyGoalTarget} mins)`,
      description: `Excellent focus! You hit your daily study goal and secured your ${newStreak}-day streak.`,
      icon: 'check',
      streakCount: newStreak,
    };
  } else if (!alreadyStudiedToday) {
    // Standard daily streak advance celebration
    celebration = {
      active: true,
      type: 'streak_milestone',
      title: `Streak Advanced: ${newStreak} Days!`,
      description: `Study session recorded for today. Streak safely maintained!`,
      icon: 'flame',
      streakCount: newStreak,
    };
  }

  const updatedStreak: StudyStreak = {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastStudyDate: today,
    totalStudyDays,
    history,
    lastCelebratedMilestone,
    updatedAt: new Date().toISOString(),
  };

  const updatedProfile: Partial<StudentProfile> = {
    streakDays: newStreak,
    longestStreakDays: newLongest,
    lastStudyDate: today,
    dailyGoalCompleted: isGoalMetNow,
    totalStudyMinutes: (profile.totalStudyMinutes || 0) + minutesAdded,
  };

  return {
    updatedStreak,
    updatedProfile,
    celebration,
  };
}

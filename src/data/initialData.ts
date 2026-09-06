import { Subject, StudyMaterial, Quiz, QuizResult, Flashcard, StudentProfile, StudyPlan, WeakTopic, AIRecommendation, StudyStreak } from '../types';

export const INITIAL_STUDY_STREAK: StudyStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: '',
  freezeDaysLeft: 1,
  totalStudyDays: 0,
  history: {},
  lastCelebratedMilestone: 0,
  updatedAt: new Date().toISOString(),
};

export const INITIAL_PROFILE: StudentProfile = {
  id: 'student_primary',
  name: 'Student',
  email: '',
  course: '',
  academicLevel: 'Undergraduate',
  learningGoal: '',
  dailyStudyMinutes: 30,
  examDate: '',
  targetScore: '90%',
  streakDays: 0,
  longestStreakDays: 0,
  lastStudyDate: '',
  dailyGoalCompleted: false,
  totalStudyMinutes: 0,
  createdAt: new Date().toISOString(),
};

export const INITIAL_SUBJECTS: Subject[] = [];

export const INITIAL_MATERIALS: StudyMaterial[] = [];

export const INITIAL_WEAK_TOPICS: WeakTopic[] = [];

export const INITIAL_QUIZZES: Quiz[] = [];

export const INITIAL_QUIZ_RESULTS: QuizResult[] = [];

export const INITIAL_FLASHCARDS: Flashcard[] = [];

export const INITIAL_STUDY_PLAN: StudyPlan | null = null;

export const INITIAL_RECOMMENDATIONS: AIRecommendation[] = [];

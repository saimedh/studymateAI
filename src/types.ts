export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  freezeDaysLeft?: number;
  totalStudyDays: number;
  history: Record<string, number>; // date "YYYY-MM-DD" -> minutes studied that day
  lastCelebratedMilestone?: number;
  updatedAt: string;
}

export interface CelebrationEvent {
  active: boolean;
  type: 'streak_milestone' | 'daily_goal' | 'record_broken' | 'quiz_mastery' | 'study_plan_completed';
  title: string;
  description: string;
  icon: 'flame' | 'trophy' | 'sparkles' | 'check' | 'star' | 'award';
  streakCount?: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  course: string;
  academicLevel: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate' | 'Undergraduate';
  learningGoal: string;
  dailyStudyMinutes: number;
  examDate?: string;
  targetScore: string;
  streakDays: number;
  longestStreakDays?: number;
  lastStudyDate?: string; // YYYY-MM-DD
  dailyGoalCompleted?: boolean;
  totalStudyMinutes: number;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  code?: string;
  color: string;
  iconName: string;
  topics: string[];
  createdAt: string;
}

export type MaterialType = 'pdf' | 'docx' | 'pptx' | 'txt' | 'image';

export interface SmartSummary {
  tldr: string;
  keyConcepts: { title: string; explanation: string }[];
  definitions: { term: string; definition: string }[];
  importantFormulas: { name: string; formula: string; explanation: string }[];
  importantExamples: { topic: string; example: string }[];
  examImportantPoints: string[];
  commonMistakes: { mistake: string; correction: string }[];
  summaryType: 'short' | 'detailed' | 'exam';
  generatedAt: string;
}

export interface StudyMaterial {
  id: string;
  subjectId: string;
  filename: string;
  originalName: string;
  fileType: MaterialType;
  fileSize: number;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
  extractedText: string;
  topicsCovered: string[];
  summary?: SmartSummary;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'mixed';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  options?: string[]; // for mcq / true_false
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: DifficultyLevel;
}

export interface Quiz {
  id: string;
  subjectId: string;
  topic: string;
  title: string;
  questions: QuizQuestion[];
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  createdAt: string;
}

export interface StudentQuizAnswer {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  topic: string;
  explanation: string;
  evaluationNotes?: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  subjectId: string;
  topic: string;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: StudentQuizAnswer[];
  weakTopics: string[];
  recommendation: string;
  timeSpentSeconds: number;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  topic: string;
  front: string;
  back: string;
  difficulty: DifficultyLevel;
  status: 'new' | 'learning' | 'mastered';
  lastReviewed?: string;
  reviewCount: number;
}

export interface StudyPlanActivity {
  id: string;
  type: 'learning' | 'quiz' | 'practice' | 'revision';
  durationMinutes: number;
  description: string;
  completed: boolean;
}

export interface StudyPlanDay {
  dayNumber: number;
  dateStr: string;
  title: string;
  topic: string;
  activities: StudyPlanActivity[];
  isCompleted: boolean;
}

export interface StudyPlan {
  id: string;
  subjectId: string;
  targetExamDate: string;
  dailyHours: number;
  currentLevel: string;
  targetScore: string;
  days: StudyPlanDay[];
  createdAt: string;
  updatedAt: string;
}

export interface WeakTopic {
  topic: string;
  subjectId: string;
  subjectName: string;
  masteryPercentage: number;
  questionsAttempted: number;
  questionsFailed: number;
  lastTested: string;
  recommendedAction: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  topic: string;
  suggestedAction: 'review' | 'quiz' | 'study_session' | 'flashcards';
  estimatedMinutes: number;
  date: string;
  dismissed?: boolean;
}

export interface AnswerEvaluation {
  score: number; // 0 to 10
  correctness: 'correct' | 'partially_correct' | 'incorrect';
  conceptualUnderstanding: string;
  whatYouDidWell: string[];
  missingPoints: string[];
  accuracyAnalysis: string;
  improvementSuggestions: string[];
  modelAnswer: string;
}

export interface StudySessionStep {
  stepNumber: number;
  totalSteps: number;
  conceptTitle: string;
  topic: string;
  explanation: string;
  keyTakeaway: string;
  question: string;
  sampleAnswerHint?: string;
  studentAnswer?: string;
  evaluation?: AnswerEvaluation;
  remediation?: {
    mistakeAnalysis: string;
    clearerExplanation: string;
    followUpQuestion: string;
    followUpAnswer?: string;
    followUpEvaluation?: AnswerEvaluation;
  };
  status: 'explaining' | 'question_ready' | 'evaluating' | 'remediating' | 'completed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mode?: 'simple' | 'exam' | 'deep' | 'revision' | 'feynman' | 'debate';
  sourceMaterialName?: string;
  suggestedFollowUps?: string[];
  canCreateFlashcard?: boolean;
  canQuizMe?: boolean;
  imageDataUrl?: string;
  imageAnalysis?: string;
  visionCategory?: 'diagram' | 'handwritten' | 'formula' | 'general';
}

export interface ChatThread {
  id: string;
  title: string;
  subjectId?: string;
  materialId?: string;
  mode: 'simple' | 'exam' | 'deep' | 'revision' | 'feynman' | 'debate';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface QuickRevisionData {
  subjectId: string;
  subjectName: string;
  generatedAt: string;
  estimatedMinutes: number;
  definitions: { term: string; meaning: string; context: string }[];
  formulas: { name: string; formula: string; notes: string }[];
  keyConcepts: { concept: string; breakdown: string; highYield: boolean }[];
  frequentlyConfused: { conceptA: string; conceptB: string; difference: string; tip: string }[];
  commonExamQuestions: { question: string; answerKey: string; weight: string }[];
  rapidQuiz: QuizQuestion[];
}

export interface CheatSheetData {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  title: string;
  keyFormulas: { name: string; formula: string; units: string; notes: string }[];
  coreConcepts: { title: string; summary: string; mnemonic?: string }[];
  examTraps: { trap: string; howToAvoid: string }[];
  decisionTree: { scenario: string; recommendedApproach: string }[];
  highYieldPoints: string[];
  generatedAt: string;
}

export interface KnowledgeNode {
  id: string;
  name: string;
  subjectId: string;
  masteryPercentage: number;
  prerequisites: string[]; // ids of prerequisite topics
  description: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  status: 'mastered' | 'developing' | 'needs_practice';
  estimatedHours: number;
}

export interface MockExamSession {
  id: string;
  quizId: string;
  subjectId: string;
  topic: string;
  timeLimitMinutes: number;
  startedAt: string;
  endedAt?: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  flaggedQuestionIds: string[];
  status: 'in_progress' | 'submitted' | 'timed_out';
  score?: number;
  percentage?: number;
  letterGrade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  remediationPlan?: string[];
}

export interface ExamPreparationPlan {
  subjectId: string;
  subjectName: string;
  daysUntilExam: number;
  examDate: string;
  targetScore: string;
  highPriorityTopics: { topic: string; weight: string; currentMastery: number; reason: string }[];
  dailyMilestones: { day: number; focus: string; hours: number; actionItems: string[] }[];
  mockExamSchedule: { day: number; title: string; questionCount: number; targetScore: string }[];
  revisionTips: string[];
}

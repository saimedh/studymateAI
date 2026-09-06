import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
  StudentProfile,
  Subject,
  StudyMaterial,
  Quiz,
  QuizResult,
  Flashcard,
  StudyPlan,
  WeakTopic,
  AIRecommendation,
  StudySessionStep,
  ChatThread,
  StudyStreak,
  CelebrationEvent
} from '../types';
import {
  INITIAL_PROFILE,
  INITIAL_SUBJECTS,
  INITIAL_MATERIALS,
  INITIAL_WEAK_TOPICS,
  INITIAL_QUIZ_RESULTS,
  INITIAL_FLASHCARDS,
  INITIAL_STUDY_PLAN,
  INITIAL_RECOMMENDATIONS,
  INITIAL_STUDY_STREAK
} from '../data/initialData';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { evaluateStreak, recordStudySession, StreakEvaluation } from '../lib/streakService';

interface StudyContextType {
  user: User | null;
  profile: StudentProfile;
  studyStreak: StudyStreak;
  streakEvaluation: StreakEvaluation;
  celebrationEvent: CelebrationEvent | null;
  subjects: Subject[];
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  materials: StudyMaterial[];
  quizzes: Quiz[];
  quizResults: QuizResult[];
  flashcards: Flashcard[];
  studyPlans: Record<string, StudyPlan>;
  weakTopics: WeakTopic[];
  recommendations: AIRecommendation[];
  chatThreads: ChatThread[];
  activeSession: {
    subjectId: string;
    topic: string;
    steps: StudySessionStep[];
    currentStepIndex: number;
  } | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSyncing: boolean;
  isRealtimeActive: boolean;
  lastRealtimeSync: Date | null;
  syncToFirestore: () => Promise<void>;
  
  // Actions
  recordStudyActivity: (minutesAdded?: number, activityName?: string) => Promise<{ newStreak: number; celebration?: CelebrationEvent }>;
  triggerCelebration: (event: CelebrationEvent) => void;
  clearCelebration: () => void;
  updateProfile: (profile: Partial<StudentProfile>) => void;
  addSubject: (data: Omit<Subject, 'id' | 'createdAt'>) => string;
  deleteSubject: (id: string) => void;
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'uploadDate'>) => string;
  deleteMaterial: (id: string) => void;
  updateMaterial: (material: StudyMaterial) => void;
  addQuiz: (quiz: Quiz) => void;
  submitQuizResult: (result: Omit<QuizResult, 'id' | 'date'>) => Promise<QuizResult>;
  addFlashcards: (cards: Omit<Flashcard, 'id'>[]) => void;
  updateFlashcardStatus: (id: string, status: Flashcard['status']) => void;
  deleteFlashcard: (id: string) => void;
  updateStudyPlan: (plan: StudyPlan) => void;
  togglePlanActivity: (subjectId: string, dayNumber: number, activityId: string) => void;
  dismissRecommendation: (id: string) => void;
  saveChatThread: (thread: ChatThread) => void;
  deleteChatThread: (threadId: string) => void;
  setActiveSession: React.Dispatch<React.SetStateAction<StudyContextType['activeSession']>>;
  resetToDemoData: () => void;
  resetAllData: () => void;
  selectedMaterialForAction: StudyMaterial | null;
  setSelectedMaterialForAction: (m: StudyMaterial | null) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const STORAGE_PREFIX = 'studymate_v2_';

// Purge any legacy v1 demo data from localStorage once
try {
  const legacyKeys = Object.keys(localStorage).filter(k => k.startsWith('studymate_v1_'));
  legacyKeys.forEach(k => localStorage.removeItem(k));
} catch (e) {
  // ignore
}

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [lastRealtimeSync, setLastRealtimeSync] = useState<Date | null>(new Date());
  const [selectedMaterialForAction, setSelectedMaterialForAction] = useState<StudyMaterial | null>(null);

  // Core State with localStorage lazy loading
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [materials, setMaterials] = useState<StudyMaterial[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'quizzes');
    return saved ? JSON.parse(saved) : [];
  });

  const [quizResults, setQuizResults] = useState<QuizResult[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'quiz_results');
    return saved ? JSON.parse(saved) : INITIAL_QUIZ_RESULTS;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'flashcards');
    return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
  });

  const [studyPlans, setStudyPlans] = useState<Record<string, StudyPlan>>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'study_plans');
    return saved ? JSON.parse(saved) : {};
  });

  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'weak_topics');
    return saved ? JSON.parse(saved) : INITIAL_WEAK_TOPICS;
  });

  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'recommendations');
    return saved ? JSON.parse(saved) : INITIAL_RECOMMENDATIONS;
  });

  const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'chat_threads');
    return saved ? JSON.parse(saved) : [];
  });

  const [studyStreak, setStudyStreak] = useState<StudyStreak>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'study_streak');
    return saved ? JSON.parse(saved) : INITIAL_STUDY_STREAK;
  });

  const [celebrationEvent, setCelebrationEvent] = useState<CelebrationEvent | null>(null);

  const [activeSession, setActiveSession] = useState<StudyContextType['activeSession']>(null);

  // Compute live streak evaluation (checking if consecutive days maintained or pending today's study)
  const streakEvaluation = evaluateStreak(
    profile.lastStudyDate || studyStreak.lastStudyDate,
    profile.streakDays,
    profile.longestStreakDays
  );

  // If streak lapsed due to missing calendar days, adjust state
  useEffect(() => {
    if (streakEvaluation.isStreakBroken && profile.streakDays > 0) {
      setProfile(prev => ({ ...prev, streakDays: 0 }));
      setStudyStreak(prev => ({ ...prev, currentStreak: 0 }));
    }
  }, [streakEvaluation.isStreakBroken, profile.streakDays]);

  // Keep selectedSubjectId synchronized with available subjects
  useEffect(() => {
    if (subjects.length > 0) {
      if (!selectedSubjectId || !subjects.some(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subjects[0].id);
      }
    } else {
      if (selectedSubjectId) {
        setSelectedSubjectId('');
      }
    }
  }, [subjects, selectedSubjectId]);

  const triggerCelebration = useCallback((event: CelebrationEvent) => {
    setCelebrationEvent(event);
  }, []);

  const clearCelebration = useCallback(() => {
    setCelebrationEvent(null);
  }, []);

  // Record study activity in Firestore and locally
  const recordStudyActivity = useCallback(async (
    minutesAdded: number = 15,
    activityName: string = 'Study Activity'
  ): Promise<{ newStreak: number; celebration?: CelebrationEvent }> => {
    const result = recordStudySession(studyStreak, profile, minutesAdded, activityName);

    setStudyStreak(result.updatedStreak);
    setProfile(prev => ({ ...prev, ...result.updatedProfile }));

    if (result.celebration) {
      setCelebrationEvent(result.celebration);
    }

    // Direct Firestore write if signed in
    if (user?.uid) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          studyStreak: result.updatedStreak,
          profile: {
            ...profile,
            ...result.updatedProfile
          },
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Direct Firestore streak sync notice:', err);
      }
    }

    return {
      newStreak: result.updatedStreak.currentStreak,
      celebration: result.celebration
    };
  }, [studyStreak, profile, user]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'profile', JSON.stringify(profile));
      localStorage.setItem(STORAGE_PREFIX + 'study_streak', JSON.stringify(studyStreak));
      localStorage.setItem(STORAGE_PREFIX + 'subjects', JSON.stringify(subjects));
      localStorage.setItem(STORAGE_PREFIX + 'materials', JSON.stringify(materials));
      localStorage.setItem(STORAGE_PREFIX + 'quizzes', JSON.stringify(quizzes));
      localStorage.setItem(STORAGE_PREFIX + 'quiz_results', JSON.stringify(quizResults));
      localStorage.setItem(STORAGE_PREFIX + 'flashcards', JSON.stringify(flashcards));
      localStorage.setItem(STORAGE_PREFIX + 'study_plans', JSON.stringify(studyPlans));
      localStorage.setItem(STORAGE_PREFIX + 'weak_topics', JSON.stringify(weakTopics));
      localStorage.setItem(STORAGE_PREFIX + 'recommendations', JSON.stringify(recommendations));
      localStorage.setItem(STORAGE_PREFIX + 'chat_threads', JSON.stringify(chatThreads));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [profile, studyStreak, subjects, materials, quizzes, quizResults, flashcards, studyPlans, weakTopics, recommendations, chatThreads]);

  // Auth Listener and Real-Time Firestore Synchronization
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous real-time snapshot listener if switching users
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (currentUser) {
        setUser(currentUser);
        setIsSyncing(true);
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Real-time Firestore document listener
        unsubscribeDoc = onSnapshot(
          userDocRef,
          { includeMetadataChanges: true },
          (snap) => {
            setIsSyncing(false);
            setIsRealtimeActive(true);
            setLastRealtimeSync(new Date());

            if (snap.exists()) {
              const data = snap.data();
              // Only hydrate from server if the update did not originate from local in-flight writes
              if (!snap.metadata.hasPendingWrites) {
                if (data.profile) setProfile(data.profile);
                if (data.studyStreak) setStudyStreak(data.studyStreak);
                if (Array.isArray(data.subjects)) setSubjects(data.subjects);
                if (Array.isArray(data.materials)) setMaterials(data.materials);
                if (Array.isArray(data.flashcards)) setFlashcards(data.flashcards);
                if (Array.isArray(data.quizzes)) setQuizzes(data.quizzes);
                if (Array.isArray(data.quizResults)) setQuizResults(data.quizResults);
                if (data.studyPlans) setStudyPlans(data.studyPlans);
                if (Array.isArray(data.weakTopics)) setWeakTopics(data.weakTopics);
                if (Array.isArray(data.recommendations)) setRecommendations(data.recommendations);
                if (Array.isArray(data.chatThreads)) setChatThreads(data.chatThreads);
              }
            } else {
              // First time user: initialize cloud document with starter course state
              setDoc(userDocRef, {
                profile: {
                  ...profile,
                  name: currentUser.displayName || profile.name,
                  email: currentUser.email || profile.email
                },
                studyStreak,
                subjects,
                materials,
                flashcards,
                quizzes,
                quizResults,
                studyPlans,
                weakTopics,
                recommendations,
                chatThreads,
                updatedAt: new Date().toISOString()
              }).catch((err) => {
                handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
              });
            }
          },
          (err) => {
            setIsSyncing(false);
            console.warn('Real-time Firestore sync error:', err);
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          }
        );
      } else {
        setUser(null);
        setIsSyncing(false);
        setIsRealtimeActive(true);
        setLastRealtimeSync(new Date());
      }
    });

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      unsubscribeAuth();
    };
  }, []);

  // Sync to user-isolated Firestore document
  const syncToFirestore = useCallback(async (currentUserId?: string) => {
    const uid = currentUserId || user?.uid;
    if (!uid) return;
    try {
      setIsSyncing(true);
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        profile,
        studyStreak,
        subjects,
        materials,
        flashcards,
        quizzes,
        quizResults,
        studyPlans,
        weakTopics,
        recommendations,
        chatThreads,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore sync notice:', e);
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}`);
    } finally {
      setIsSyncing(false);
    }
  }, [user, profile, studyStreak, subjects, materials, flashcards, quizzes, quizResults, studyPlans, weakTopics, recommendations, chatThreads]);

  // Debounced auto-sync to Firestore whenever state changes and user is signed in
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!user?.uid) return;

    const timer = setTimeout(() => {
      syncToFirestore(user.uid);
    }, 1500);

    return () => clearTimeout(timer);
  }, [user?.uid, profile, studyStreak, subjects, materials, flashcards, quizzes, quizResults, studyPlans, weakTopics, recommendations, chatThreads, syncToFirestore]);

  const saveChatThread = (thread: ChatThread) => {
    setChatThreads(prev => {
      const idx = prev.findIndex(t => t.id === thread.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = thread;
        return next;
      }
      return [thread, ...prev];
    });
  };

  const deleteChatThread = (threadId: string) => {
    setChatThreads(prev => prev.filter(t => t.id !== threadId));
  };

  const updateProfile = (updated: Partial<StudentProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updated };
      return next;
    });
  };

  const addSubject = (data: Omit<Subject, 'id' | 'createdAt'>): string => {
    const newId = 'subj_' + Date.now();
    const newSubject: Subject = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setSubjects(prev => [newSubject, ...prev]);
    setSelectedSubjectId(newId);
    return newId;
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setMaterials(prev => prev.filter(m => m.subjectId !== id));
    setFlashcards(prev => prev.filter(f => f.subjectId !== id));
    if (selectedSubjectId === id) {
      const remaining = subjects.filter(s => s.id !== id);
      setSelectedSubjectId(remaining[0]?.id || '');
    }
  };

  const addMaterial = (data: Omit<StudyMaterial, 'id' | 'uploadDate'>): string => {
    const newId = 'mat_' + Date.now();
    const newMaterial: StudyMaterial = {
      ...data,
      id: newId,
      uploadDate: new Date().toISOString()
    };
    setMaterials(prev => [newMaterial, ...prev]);
    return newId;
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const updateMaterial = (updated: StudyMaterial) => {
    setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const addQuiz = (quiz: Quiz) => {
    setQuizzes(prev => [quiz, ...prev]);
  };

  /**
   * ADAPTIVE LEARNING LOOP (AGENTIC SYSTEM)
   * When student submits quiz:
   * 1. Collect student performance
   * 2. Analyze quiz results and identify weak concepts
   * 3. Update mastery percentage for topics
   * 4. Synthesize personalized recommendation
   * 5. Adapt study plan prioritizing the detected weak topics
   */
  const submitQuizResult = async (resultData: Omit<QuizResult, 'id' | 'date'>): Promise<QuizResult> => {
    const newResultId = 'res_' + Date.now();
    const newResult: QuizResult = {
      ...resultData,
      id: newResultId,
      date: new Date().toISOString()
    };

    setQuizResults(prev => [newResult, ...prev]);

    // Update study time and streak
    setProfile(prev => ({
      ...prev,
      totalStudyMinutes: prev.totalStudyMinutes + Math.ceil(resultData.timeSpentSeconds / 60),
    }));

    // Detect weak topics based on answers
    const topicStats: Record<string, { total: number; failed: number }> = {};
    resultData.answers.forEach(a => {
      const t = a.topic || resultData.topic;
      if (!topicStats[t]) topicStats[t] = { total: 0, failed: 0 };
      topicStats[t].total += 1;
      if (!a.isCorrect) topicStats[t].failed += 1;
    });

    const subjectObj = subjects.find(s => s.id === resultData.subjectId);
    const subjectName = subjectObj?.name || 'Subject';

    setWeakTopics(prev => {
      const updated = [...prev];
      Object.entries(topicStats).forEach(([tName, stats]) => {
        const existingIdx = updated.findIndex(w => w.topic.toLowerCase() === tName.toLowerCase() && w.subjectId === resultData.subjectId);
        const masteryScore = Math.round(((stats.total - stats.failed) / stats.total) * 100);

        if (existingIdx >= 0) {
          const prevItem = updated[existingIdx];
          const newMastery = Math.round((prevItem.masteryPercentage + masteryScore) / 2);
          updated[existingIdx] = {
            ...prevItem,
            masteryPercentage: newMastery,
            questionsAttempted: prevItem.questionsAttempted + stats.total,
            questionsFailed: prevItem.questionsFailed + stats.failed,
            lastTested: new Date().toISOString(),
            recommendedAction: newMastery < 70 
              ? `Review core principles of ${tName} with AI Tutor before taking another quiz.`
              : `Solidifying knowledge in ${tName}. Keep practicing higher difficulty questions.`
          };
        } else {
          updated.push({
            topic: tName,
            subjectId: resultData.subjectId,
            subjectName: subjectName,
            masteryPercentage: masteryScore,
            questionsAttempted: stats.total,
            questionsFailed: stats.failed,
            lastTested: new Date().toISOString(),
            recommendedAction: masteryScore < 70
              ? `Identified as needing improvement. Spend 20 minutes with AI Tutor.`
              : `Keep practicing to reach full mastery.`
          });
        }
      });
      return updated;
    });

    // Create dynamic AI recommendation based on worst topic
    const failedAnswers = resultData.answers.filter(a => !a.isCorrect);
    const worstTopic = failedAnswers.length > 0 ? failedAnswers[0].topic : resultData.topic;

    if (resultData.percentage < 80) {
      const newRec: AIRecommendation = {
        id: 'rec_' + Date.now(),
        title: `Adaptive Action: Target ${worstTopic}`,
        description: `Your quiz score on "${resultData.topic}" was ${resultData.score}/${resultData.totalQuestions} (${resultData.percentage}%). We identified "${worstTopic}" as needing reinforcement.`,
        subjectId: resultData.subjectId,
        topic: worstTopic,
        suggestedAction: 'study_session',
        estimatedMinutes: 20,
        date: new Date().toISOString(),
        dismissed: false
      };
      setRecommendations(prev => [newRec, ...prev.filter(r => r.topic !== worstTopic)]);
    }

    // Adapt current Study Plan to shift the weak topic into Day 1
    if (failedAnswers.length > 0) {
      setStudyPlans(prev => {
        const currentPlan = prev[resultData.subjectId];
        if (!currentPlan) return prev;

        const updatedDays = [...currentPlan.days];
        if (updatedDays[0]) {
          updatedDays[0] = {
            ...updatedDays[0],
            title: `Adaptive Priority: ${worstTopic} Mastery`,
            topic: worstTopic,
            activities: [
              {
                id: 'adaptive_act_' + Date.now(),
                type: 'learning',
                durationMinutes: 25,
                description: `Review AI Tutor explanation and foundational notes for ${worstTopic}`,
                completed: false
              },
              {
                id: 'adaptive_quiz_' + Date.now(),
                type: 'quiz',
                durationMinutes: 15,
                description: `Practice 5 questions targeting ${worstTopic} mistakes`,
                completed: false
              },
              ...updatedDays[0].activities.slice(1)
            ]
          };
        }
        return {
          ...prev,
          [resultData.subjectId]: {
            ...currentPlan,
            updatedAt: new Date().toISOString(),
            days: updatedDays
          }
        };
      });
    }

    // Automatically record study activity in streak and Firestore
    await recordStudyActivity(20, `Quiz: ${resultData.topic}`);

    return newResult;
  };

  const addFlashcards = (newCards: Omit<Flashcard, 'id'>[]) => {
    const cardsWithIds: Flashcard[] = newCards.map((c, i) => ({
      ...c,
      id: 'fc_' + Date.now() + '_' + i
    }));
    setFlashcards(prev => [...cardsWithIds, ...prev]);
  };

  const updateFlashcardStatus = (id: string, status: Flashcard['status']) => {
    setFlashcards(prev => prev.map(fc => {
      if (fc.id === id) {
        return {
          ...fc,
          status,
          reviewCount: fc.reviewCount + 1,
          lastReviewed: new Date().toISOString()
        };
      }
      return fc;
    }));
  };

  const deleteFlashcard = (id: string) => {
    setFlashcards(prev => prev.filter(fc => fc.id !== id));
  };

  const updateStudyPlan = (plan: StudyPlan) => {
    setStudyPlans(prev => ({
      ...prev,
      [plan.subjectId]: plan
    }));
  };

  const togglePlanActivity = (subjectId: string, dayNumber: number, activityId: string) => {
    setStudyPlans(prev => {
      const plan = prev[subjectId];
      if (!plan) return prev;
      const days = plan.days.map(d => {
        if (d.dayNumber === dayNumber) {
          const acts = d.activities.map(a => a.id === activityId ? { ...a, completed: !a.completed } : a);
          const allDone = acts.every(a => a.completed);
          return { ...d, activities: acts, isCompleted: allDone };
        }
        return d;
      });
      return {
        ...prev,
        [subjectId]: { ...plan, days }
      };
    });
  };

  const dismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, dismissed: true } : r));
  };

  const resetAllData = () => {
    setProfile(INITIAL_PROFILE);
    setStudyStreak(INITIAL_STUDY_STREAK);
    setCelebrationEvent(null);
    setSubjects(INITIAL_SUBJECTS);
    setMaterials(INITIAL_MATERIALS);
    setQuizResults(INITIAL_QUIZ_RESULTS);
    setFlashcards(INITIAL_FLASHCARDS);
    setStudyPlans({});
    setWeakTopics(INITIAL_WEAK_TOPICS);
    setRecommendations(INITIAL_RECOMMENDATIONS);
    setSelectedSubjectId('');
    setActiveSession(null);
    try {
      localStorage.clear();
    } catch (e) {
      // ignore
    }
  };

  const resetToDemoData = resetAllData;

  return (
    <StudyContext.Provider
      value={{
        user,
        profile,
        studyStreak,
        streakEvaluation,
        celebrationEvent,
        triggerCelebration,
        clearCelebration,
        recordStudyActivity,
        subjects,
        selectedSubjectId,
        setSelectedSubjectId,
        materials,
        quizzes,
        quizResults,
        flashcards,
        studyPlans,
        weakTopics,
        recommendations,
        chatThreads,
        activeSession,
        activeTab,
        setActiveTab,
        isSyncing,
        isRealtimeActive,
        lastRealtimeSync,
        syncToFirestore,
        updateProfile,
        addSubject,
        deleteSubject,
        addMaterial,
        deleteMaterial,
        updateMaterial,
        addQuiz,
        submitQuizResult,
        addFlashcards,
        updateFlashcardStatus,
        deleteFlashcard,
        updateStudyPlan,
        togglePlanActivity,
        dismissRecommendation,
        saveChatThread,
        deleteChatThread,
        setActiveSession,
        resetToDemoData,
        resetAllData,
        selectedMaterialForAction,
        setSelectedMaterialForAction
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy must be used within a StudyProvider');
  return context;
};

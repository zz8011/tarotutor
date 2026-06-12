import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sanitizeAiText } from '../utils/aiText';
import { localDateString, localDateStringOffset } from '../utils/date';
import { achievementRules } from '../data/achievements';
import { showToast } from '../platform/feedback';
import type {
  UserProgress,
  LearningSession,
  ChatMessage,
  DiaryEntry,
  Achievement,
  CardSpread,
  StudyJournal,
  StudyRecord,
  StudyStage,
} from '../types';
import { appStorage } from '../platform/storage';


interface AppState {
  userName: string;
  setUserName: (name: string) => void;
  dailyStudyTarget: 3 | 5 | 7;
  setDailyStudyTarget: (target: 3 | 5 | 7) => void;

  progress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
  completeCard: (cardId: number) => void;
  addDiary: (diary: DiaryEntry) => void;
  unlockAchievement: (achievement: Achievement) => void;
  /** 记录一次有效学习行为：按本地日期更新连续打卡（同一天只计一次） */
  markStudyActivity: () => void;
  /** 评估成就规则表，解锁新达成的成就并弹出提示 */
  checkAchievements: () => void;

  currentSession: LearningSession | null;
  startSession: (cardId: number, mentorId: string) => void;
  updateCurrentSession: (updates: Partial<LearningSession>) => void;
  addMessage: (message: ChatMessage) => void;
  endSession: () => void;

  studyJournal: StudyJournal;
  setStudyJournal: (updates: Partial<StudyJournal>) => void;
  upsertStudyRecord: (cardId: number, updates: Partial<StudyRecord>) => void;
  clearStudyJournalActive: () => void;

  dailyCard: { cardId: number; date: string; orientation: 'upright' | 'reversed'; deck: 'eastern' | 'chinese-ink' } | null;
  drawDailyCard: () => Promise<{ cardId: number; date: string; orientation: 'upright' | 'reversed'; deck: 'eastern' | 'chinese-ink' }>;
  dailyGuidance: {
    cardId: number;
    date: string;
    orientation: 'upright' | 'reversed';
    deck: 'eastern' | 'chinese-ink';
    content: string;
  } | null;
  setDailyGuidance: (guidance: {
    cardId: number;
    date: string;
    orientation: 'upright' | 'reversed';
    deck: 'eastern' | 'chinese-ink';
    content: string;
  } | null) => void;

  personalityType: string | null;
  setPersonalityType: (type: string) => void;
  primaryMentor: string | null;
  setPrimaryMentor: (mentorId: string) => void;

  spreads: CardSpread[];
  addSpread: (spread: CardSpread) => void;

  currentView: string;
  setCurrentView: (view: string) => void;

  cardDeck: 'eastern' | 'chinese-ink';
  setCardDeck: (deck: 'eastern' | 'chinese-ink') => void;
}

const defaultProgress: UserProgress = {
  currentPhase: 'perception',
  learnedCards: [],
  diaryEntries: [],
  achievements: [],
  streak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  totalSessions: 0,
  personalityType: null,
  primaryMentor: null,
  secondaryMentors: [],
  startedAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
};

const defaultStudyJournal: StudyJournal = {
  activeCardId: null,
  activeStage: 'observe',
  activeOrientation: 'upright',
  activeReflection: '',
  activeSymbolObservation: '',
  activeScenarioAnswer: '',
  activeFollowUp: '',
  activeQuizQuestion: '',
  activeQuizOptions: [],
  activeQuizAnswer: '',
  activeQuizAnswers: {},
  activeQuizResult: null,
  activeMentorId: null,
  activeSummary: '',
  records: {},
  updatedAt: new Date().toISOString(),
};

function createDefaultStudyRecord(cardId: number, mentorId: string | null): StudyRecord {
  return {
    cardId,
    mentorId,
    stage: 'observe',
    orientation: 'upright',
    reflection: '',
    symbolObservation: '',
    scenarioAnswer: '',
    followUp: '',
    quizQuestion: '',
    quizOptions: [],
    quizAnswer: '',
    quizAnswers: {},
    quizResult: null,
    mastered: false,
    reviewCount: 0,
    lastStudiedAt: new Date().toISOString(),
    completedAt: null,
    nextReviewAt: null,
    updatedAt: new Date().toISOString(),
  };
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userName: '',
      setUserName: (name) => set({ userName: name }),
      dailyStudyTarget: 3,
      setDailyStudyTarget: (target) => set({ dailyStudyTarget: target }),

      progress: defaultProgress,
      updateProgress: (updates) =>
        set((state) => ({
          progress: { ...state.progress, ...updates, lastActiveAt: new Date().toISOString() },
        })),
      completeCard: (cardId: number) => {
        set((state) => ({
          progress: {
            ...state.progress,
            learnedCards: state.progress.learnedCards.includes(cardId)
              ? state.progress.learnedCards
              : [...state.progress.learnedCards, cardId],
            lastActiveAt: new Date().toISOString(),
          },
        }));
        // 学完一张牌算一次有效学习；markStudyActivity 内部会再触发成就检查
        get().markStudyActivity();
      },
      addDiary: (diary) => {
        set((state) => ({
          progress: {
            ...state.progress,
            diaryEntries: [diary, ...state.progress.diaryEntries],
            lastActiveAt: new Date().toISOString(),
          },
        }));
        get().checkAchievements();
      },
      unlockAchievement: (achievement) =>
        set((state) => ({
          progress: {
            ...state.progress,
            achievements: state.progress.achievements.some((a) => a.id === achievement.id)
              ? state.progress.achievements
              : [...state.progress.achievements, { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() }],
            lastActiveAt: new Date().toISOString(),
          },
        })),
      markStudyActivity: () => {
        const today = localDateString();
        const { lastStudyDate } = get().progress;

        // 同一天内的重复学习不重复计数
        if (lastStudyDate !== today) {
          const yesterday = localDateStringOffset(1);
          set((state) => {
            const streak = state.progress.lastStudyDate === yesterday ? state.progress.streak + 1 : 1;
            return {
              progress: {
                ...state.progress,
                streak,
                longestStreak: Math.max(streak, state.progress.longestStreak),
                lastStudyDate: today,
                lastActiveAt: new Date().toISOString(),
              },
            };
          });
        }
        get().checkAchievements();
      },
      checkAchievements: () => {
        const state = get();
        const context = { progress: state.progress, spreadsCount: state.spreads.length };
        const newlyUnlocked = achievementRules.filter(
          (rule) => !state.progress.achievements.some((a) => a.id === rule.id) && rule.check(context)
        );
        if (!newlyUnlocked.length) return;

        set((current) => ({
          progress: {
            ...current.progress,
            achievements: [
              ...current.progress.achievements,
              ...newlyUnlocked.map((rule) => ({
                id: rule.id,
                name: rule.name,
                description: rule.description,
                icon: rule.icon,
                unlocked: true,
                unlockedAt: new Date().toISOString(),
              })),
            ],
          },
        }));
        newlyUnlocked.forEach((rule) => showToast(`🏆 解锁成就：${rule.name}`));
      },

      currentSession: null,
      startSession: (cardId, mentorId) => {
        const session: LearningSession = {
          id: `session_${Date.now()}`,
          cardId,
          mentorId,
          messages: [],
          phase: 'perception',
          lessonStage: 'observe',
          orientation: 'upright',
          reflection: '',
          symbolObservation: '',
          scenarioAnswer: '',
          followUp: '',
          quizQuestion: '',
          quizOptions: [],
          quizAnswer: '',
          quizAnswers: {},
          quizResult: null,
          summary: '',
          userFeeling: null,
          knowledgeUnlocked: false,
          diary: null,
          startedAt: new Date().toISOString(),
          endedAt: null,
        };
        set({ currentSession: session });
      },
      updateCurrentSession: (updates) =>
        set((state) => ({
          currentSession: state.currentSession ? { ...state.currentSession, ...updates } : null,
        })),
      addMessage: (message) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, messages: [...state.currentSession.messages, message] }
            : null,
        })),
      endSession: () =>
        set((state) => ({
          currentSession: null,
          progress: {
            ...state.progress,
            totalSessions: state.progress.totalSessions + 1,
            lastActiveAt: new Date().toISOString(),
          },
        })),

      studyJournal: defaultStudyJournal,
      setStudyJournal: (updates) =>
        set((state) => ({
          studyJournal: {
            ...state.studyJournal,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        })),
      upsertStudyRecord: (cardId, updates) =>
        set((state) => {
          const existing = state.studyJournal.records[String(cardId)] || createDefaultStudyRecord(cardId, state.primaryMentor);
          const nextStage = (updates.stage ?? existing.stage) as StudyStage;
          const mastered = updates.mastered ?? existing.mastered;
          const reviewCount = updates.reviewCount ?? existing.reviewCount;
          const nextReviewAt =
            updates.nextReviewAt ??
            (mastered ? addDays(new Date(), reviewCount === 0 ? 1 : reviewCount === 1 ? 3 : reviewCount === 2 ? 7 : 14) : existing.nextReviewAt);

          const record: StudyRecord = {
            ...existing,
            ...updates,
            stage: nextStage,
            mastered,
            reviewCount,
            nextReviewAt,
            updatedAt: new Date().toISOString(),
          };

          return {
            studyJournal: {
              ...state.studyJournal,
              records: {
                ...state.studyJournal.records,
                [String(cardId)]: record,
              },
              updatedAt: new Date().toISOString(),
            },
          };
        }),
      clearStudyJournalActive: () =>
        set((state) => ({
          studyJournal: {
            ...state.studyJournal,
            activeCardId: null,
            activeStage: 'observe',
            activeOrientation: 'upright',
            activeReflection: '',
            activeSymbolObservation: '',
            activeScenarioAnswer: '',
            activeFollowUp: '',
            activeQuizQuestion: '',
            activeQuizOptions: [],
            activeQuizAnswer: '',
            activeQuizAnswers: {},
            activeQuizResult: null,
            activeMentorId: null,
            activeSummary: '',
            updatedAt: new Date().toISOString(),
          },
        })),

      dailyCard: null,
      dailyGuidance: null,
      drawDailyCard: async () => {
        const { getRandomCard } = await import('../data/tarotCards');
        const card = getRandomCard();
        const orientation = (Math.random() > 0.5 ? 'upright' : 'reversed') as 'upright' | 'reversed';
        const today = new Date().toISOString().split('T')[0];
        const dailyCard = { cardId: card.id, date: today, orientation, deck: get().cardDeck };
        set({
          dailyCard,
          dailyGuidance: null,
        });
        return dailyCard;
      },
      setDailyGuidance: (guidance) => set({ dailyGuidance: guidance }),

      personalityType: null,
      setPersonalityType: (type) => set({ personalityType: type }),
      primaryMentor: null,
      setPrimaryMentor: (mentorId) => set({ primaryMentor: mentorId }),

      spreads: [],
      addSpread: (spread) => {
        set((state) => ({ spreads: [spread, ...state.spreads] }));
        get().checkAchievements();
      },

      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),

      cardDeck: 'eastern' as 'eastern' | 'chinese-ink',
      setCardDeck: (deck) => {
        set({ cardDeck: deck });
      },
    }),
    {
      name: 'tarot-tutor-storage',
      version: 2, // schema 版本，变更时递增以触发迁移
      storage: appStorage,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        // 版本 0 -> 1: 添加 cardDeck 字段默认值
        if (version < 1) {
          if (!state.cardDeck) {
            state.cardDeck = 'eastern';
          }
        }
        // 版本 1 -> 2: progress 增加 lastStudyDate（连续打卡判定基准）
        if (version < 2) {
          const progress = state.progress as Record<string, unknown> | undefined;
          if (progress && progress.lastStudyDate === undefined) {
            progress.lastStudyDate = null;
          }
        }
        return persistedState as AppState;
      },
      partialize: (state) => ({
        userName: state.userName,
        dailyStudyTarget: state.dailyStudyTarget,
        progress: state.progress,
        dailyCard: state.dailyCard,
        dailyGuidance: state.dailyGuidance,
        currentSession: state.currentSession,
        studyJournal: state.studyJournal,
        personalityType: state.personalityType,
        primaryMentor: state.primaryMentor,
        spreads: state.spreads,
        cardDeck: state.cardDeck,
      }),
      onRehydrateStorage: () => (state) => {
        // 数据恢复后对 AI 内容进行重新净化
        if (state?.dailyGuidance?.content) {
          state.dailyGuidance.content = sanitizeAiText(state.dailyGuidance.content);
        }
        if (state?.currentSession?.messages) {
          state.currentSession.messages = state.currentSession.messages.map((msg) => ({
            ...msg,
            content: sanitizeAiText(msg.content),
          }));
        }
      },
    }
  )
);

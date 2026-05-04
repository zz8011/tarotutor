import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, LearningSession, ChatMessage, DiaryEntry, Achievement, CardSpread } from '../types';

interface AppState {
  userName: string;
  setUserName: (name: string) => void;

  progress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
  completeCard: (cardId: number) => void;
  addDiary: (diary: DiaryEntry) => void;
  unlockAchievement: (achievement: Achievement) => void;

  currentSession: LearningSession | null;
  startSession: (cardId: number, mentorId: string) => void;
  addMessage: (message: ChatMessage) => void;
  endSession: () => void;

  dailyCard: { cardId: number; date: string; orientation: string } | null;
  drawDailyCard: () => void;

  personalityType: string | null;
  setPersonalityType: (type: string) => void;
  primaryMentor: string | null;
  setPrimaryMentor: (mentorId: string) => void;

  spreads: CardSpread[];
  addSpread: (spread: CardSpread) => void;

  currentView: string;
  setCurrentView: (view: string) => void;
}

const defaultProgress: UserProgress = {
  currentPhase: 'perception',
  learnedCards: [],
  diaryEntries: [],
  achievements: [],
  streak: 0,
  longestStreak: 0,
  totalSessions: 0,
  personalityType: null,
  primaryMentor: null,
  secondaryMentors: [],
  startedAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userName: '',
      setUserName: (name) => set({ userName: name }),

      progress: defaultProgress,
      updateProgress: (updates) =>
        set((state) => ({
          progress: { ...state.progress, ...updates, lastActiveAt: new Date().toISOString() },
        })),
      completeCard: (cardId: number) =>
        set((state) => ({
          progress: {
            ...state.progress,
            learnedCards: state.progress.learnedCards.includes(cardId)
              ? state.progress.learnedCards
              : [...state.progress.learnedCards, cardId],
            lastActiveAt: new Date().toISOString(),
          },
        })),
      addDiary: (diary) =>
        set((state) => ({
          progress: {
            ...state.progress,
            diaryEntries: [diary, ...state.progress.diaryEntries],
            lastActiveAt: new Date().toISOString(),
          },
        })),
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

      currentSession: null,
      startSession: (cardId, mentorId) => {
        const session: LearningSession = {
          id: `session_${Date.now()}`,
          cardId,
          mentorId,
          messages: [],
          phase: 'perception',
          userFeeling: null,
          knowledgeUnlocked: false,
          diary: null,
          startedAt: new Date().toISOString(),
          endedAt: null,
        };
        set({ currentSession: session });
      },
      addMessage: (message) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, messages: [...state.currentSession.messages, message] }
            : null,
        })),
      endSession: () =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, endedAt: new Date().toISOString() }
            : null,
          progress: {
            ...state.progress,
            totalSessions: state.progress.totalSessions + 1,
            lastActiveAt: new Date().toISOString(),
          },
        })),

      dailyCard: null,
      drawDailyCard: async () => {
        const { getRandomCard } = await import('../data/tarotCards');
        const card = getRandomCard();
        const orientation = Math.random() > 0.5 ? 'upright' : 'reversed';
        const today = new Date().toISOString().split('T')[0];
        set({
          dailyCard: { cardId: card.id, date: today, orientation: orientation as 'upright' | 'reversed' },
        });
      },

      personalityType: null,
      setPersonalityType: (type) => set({ personalityType: type }),
      primaryMentor: null,
      setPrimaryMentor: (mentorId) => set({ primaryMentor: mentorId }),

      spreads: [],
      addSpread: (spread) => set((state) => ({ spreads: [spread, ...state.spreads] })),

      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),
    }),
    {
      name: 'tarot-tutor-storage',
      partialize: (state) => ({
        userName: state.userName,
        progress: state.progress,
        dailyCard: state.dailyCard,
        personalityType: state.personalityType,
        primaryMentor: state.primaryMentor,
        spreads: state.spreads,
      }),
    }
  )
);

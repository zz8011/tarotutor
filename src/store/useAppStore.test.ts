import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

function getState() {
  return useAppStore.getState();
}

function resetStore() {
  useAppStore.setState({
    userName: '',
    dailyStudyTarget: 3,
    progress: {
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
      startedAt: expect.any(String),
      lastActiveAt: expect.any(String),
    },
    currentSession: null,
    studyJournal: {
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
      updatedAt: expect.any(String),
    },
    dailyCard: null,
    dailyGuidance: null,
    personalityType: null,
    primaryMentor: null,
    spreads: [],
    currentView: 'home',
    cardDeck: 'eastern',
  });
}

describe('useAppStore 状态管理', () => {
  beforeEach(() => {
    resetStore();
  });

  it('初始状态正确', () => {
    const state = getState();
    expect(state.userName).toBe('');
    expect(state.dailyStudyTarget).toBe(3);
    expect(state.progress.learnedCards).toEqual([]);
    expect(state.progress.totalSessions).toBe(0);
    expect(state.currentSession).toBeNull();
    expect(state.currentView).toBe('home');
    expect(state.cardDeck).toBe('eastern');
  });

  it('completeCard 应更新进度并避免重复', () => {
    const { completeCard } = getState();
    completeCard(5);
    expect(getState().progress.learnedCards).toContain(5);

    completeCard(5);
    expect(getState().progress.learnedCards).toEqual([5]);

    completeCard(10);
    expect(getState().progress.learnedCards).toEqual([5, 10]);
  });

  it('startSession 应创建会话', () => {
    const { startSession } = getState();
    startSession(1, 'luna');
    const session = getState().currentSession;
    expect(session).not.toBeNull();
    expect(session!.cardId).toBe(1);
    expect(session!.mentorId).toBe('luna');
    expect(session!.messages).toEqual([]);
    expect(session!.endedAt).toBeNull();
  });

  it('endSession 应清空会话并增加 totalSessions', () => {
    const { startSession, endSession } = getState();
    startSession(1, 'luna');
    expect(getState().currentSession).not.toBeNull();

    endSession();
    expect(getState().currentSession).toBeNull();
    expect(getState().progress.totalSessions).toBe(1);
  });

  it('addMessage 应追加消息到当前会话', () => {
    const { startSession, addMessage } = getState();
    startSession(1, 'luna');
    const msg = {
      id: 'msg-1',
      role: 'user' as const,
      content: '你好',
      timestamp: new Date().toISOString(),
      phase: 'perception' as const,
    };
    addMessage(msg);
    expect(getState().currentSession!.messages).toHaveLength(1);
    expect(getState().currentSession!.messages[0].content).toBe('你好');
  });

  it('setUserName 应更新用户名', () => {
    getState().setUserName('小明');
    expect(getState().userName).toBe('小明');
  });

  it('setCurrentView 应更新当前视图', () => {
    getState().setCurrentView('learn');
    expect(getState().currentView).toBe('learn');
  });
});

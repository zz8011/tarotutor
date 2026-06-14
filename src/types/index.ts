// ============================================================
// AI Tarot Tutor — Complete Type Definitions
// ============================================================

// ---- String Literal Types (enums cause too many type issues) ----

type Arcana = 'major' | 'minor';
type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
type Element = 'fire' | 'water' | 'air' | 'earth';
type PersonalityDimension = 'intuitive_logical' | 'supportive_independent' | 'free_systematic' | 'lively_contemplative';
export type LearningPhase = 'perception' | 'understanding' | 'application' | 'mastery';
export type StudyStage = 'observe' | 'symbols' | 'teach' | 'scenario' | 'quiz' | 'mastered';
type MessageRole = 'user' | 'mentor' | 'system' | 'assistant';
/** 牌面方向：正位 / 逆位（全局唯一定义，组件请从这里导入） */
export type Orientation = 'upright' | 'reversed';
/** 测验答案表：question.id -> 用户选择 */
export type QuizAnswerMap = Record<string, string>;
/** 掌握测试结果（注意与性格测试的 QuizResult 接口区分） */
export type QuizOutcome = 'correct' | 'incorrect' | null;

// ---- Core Domain Types ------------------------------------

export interface TarotCard {
  id: number;
  name: string;
  chineseName: string;
  arcana: Arcana;
  suit: Suit | null;
  number: number;
  uprightMeaning: string;
  reversedMeaning: string;
  keywords: string[];
  element: Element;
  planet: string;
  description: string;
  imageSymbol: string;
  /** 牌面图片路径 */
  image: string;
  numerology: string;
}

export interface Mentor {
  id: string;
  name: string;
  chineseName: string;
  avatar: string;
  avatarImage?: string;
  personality: string;
  teachingStyle: string;
  specialties: string[];
  catchphrase: string;
  color: string;
  personalityType: string;
}

export interface MentorFull extends Mentor {
  title: string;
  styleTags: string[];
  suitableTraits: string[];
  greeting: string;
  sampleResponse: string;
  avatarEmoji: string;
  colorTheme: {
    primary: string;
    secondary: string;
    bg: string;
    text: string;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  dimension: PersonalityDimension;
  options: {
    text: string;
    value: string;
    score: Record<string, number>;
  }[];
}

export interface QuizResult {
  personalityType: string;
  description: string;
  recommendedMentors: string[];
  primaryMentorId: string;
  secondaryMentorIds: string[];
  matchReason: string;
  scores: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  phase: LearningPhase;
  cardId?: number;
  mentorId?: string;
}

export interface LearningSession {
  id: string;
  cardId: number;
  mentorId: string;
  messages: ChatMessage[];
  phase: LearningPhase;
  lessonStage?: StudyStage;
  orientation?: 'upright' | 'reversed';
  reflection?: string;
  symbolObservation?: string;
  scenarioAnswer?: string;
  followUp?: string;
  quizQuestion?: string;
  quizOptions?: string[];
  quizAnswer?: string;
  quizAnswers?: Record<string, string>;
  quizResult?: 'correct' | 'incorrect' | null;
  summary?: string;
  userFeeling: string | null;
  knowledgeUnlocked: boolean;
  diary: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface StudyRecord {
  cardId: number;
  mentorId: string | null;
  stage: StudyStage;
  orientation: 'upright' | 'reversed';
  reflection: string;
  symbolObservation?: string;
  scenarioAnswer?: string;
  followUp: string;
  quizQuestion: string;
  quizOptions: string[];
  quizAnswer: string;
  quizAnswers?: Record<string, string>;
  quizResult: 'correct' | 'incorrect' | null;
  mastered: boolean;
  reviewCount: number;
  lastStudiedAt: string;
  completedAt: string | null;
  nextReviewAt: string | null;
  updatedAt: string;
}

export interface StudyJournal {
  activeCardId: number | null;
  activeStage: StudyStage;
  activeOrientation: 'upright' | 'reversed';
  activeReflection: string;
  activeSymbolObservation?: string;
  activeScenarioAnswer?: string;
  activeFollowUp: string;
  activeQuizQuestion: string;
  activeQuizOptions: string[];
  activeQuizAnswer: string;
  activeQuizAnswers?: Record<string, string>;
  activeQuizResult: 'correct' | 'incorrect' | null;
  activeMentorId: string | null;
  activeSummary: string;
  records: Record<string, StudyRecord>;
  updatedAt: string;
}

export interface DiaryEntry {
  id: string;
  cardId: number;
  date: string;
  content: string;
  mood: string;
  tags: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface UserProgress {
  currentPhase: LearningPhase;
  learnedCards: number[];
  diaryEntries: DiaryEntry[];
  achievements: Achievement[];
  streak: number;
  longestStreak: number;
  /** 最近一次有效学习的本地日期（YYYY-MM-DD），用于连续打卡判定 */
  lastStudyDate: string | null;
  totalSessions: number;
  personalityType: string | null;
  primaryMentor: string | null;
  secondaryMentors: string[];
  startedAt: string;
  lastActiveAt: string;
}

interface SpreadPosition {
  position: number;
  name: string;
  meaning: string;
  cardId: number | null;
  orientation: 'upright' | 'reversed';
}

export interface SpreadTemplate {
  id: string;
  name: string;
  chineseName: string;
  cardCount: number;
  positions: {
    index: number;
    label: string;
    meaning: string;
  }[];
  description: string;
}

export interface CardSpread {
  id: string;
  templateId: string;
  spreadTypeId?: string;
  cardDeck?: 'eastern' | 'chinese-ink';
  date: string;
  question: string;
  positions: SpreadPosition[];
  cards?: SpreadCard[];
  interpretation: string;
}
export interface SpreadCard {
  cardId: number;
  position: number;
  positionIndex?: number;
  orientation: 'upright' | 'reversed';
}

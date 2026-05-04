// ============================================================
// AI Tarot Tutor — Complete Type Definitions
// ============================================================

// ---- String Literal Types (enums cause too many type issues) ----

export type Arcana = 'major' | 'minor';
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
export type Element = 'fire' | 'water' | 'air' | 'earth';
export type PersonalityDimension = 'intuitive_logical' | 'supportive_independent' | 'free_systematic' | 'lively_contemplative';
export type LearningPhase = 'perception' | 'understanding' | 'application' | 'mastery';
export type MessageRole = 'user' | 'mentor' | 'system' | 'assistant';

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
  /** 牌面图片路径 (相对于 public/cards/) */
  image: string;
  numerology: string;
}

export interface Mentor {
  id: string;
  name: string;
  chineseName: string;
  avatar: string;
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
  userFeeling: string | null;
  knowledgeUnlocked: boolean;
  diary: string | null;
  startedAt: string;
  endedAt: string | null;
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
  totalSessions: number;
  personalityType: string | null;
  primaryMentor: string | null;
  secondaryMentors: string[];
  startedAt: string;
  lastActiveAt: string;
}

export interface SpreadPosition {
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
  date: string;
  question: string;
  positions: SpreadPosition[];
  cards?: SpreadCard[];
  interpretation: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  phase: LearningPhase;
  cards: number[];
  estimatedMinutes: number;
  completed: boolean;
}

export interface SpreadCard {
  cardId: number;
  position: number;
  positionIndex?: number;
  orientation: 'upright' | 'reversed';
}

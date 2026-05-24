import type { ChatMessage, TarotCard, CardSpread } from '../../types';
import type { TarotDeck } from '../../data/tarotDeckGuides';

export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: 'primary' | 'fallback1' | 'fallback2';
}

export interface CloudProxyOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export type {
  ChatMessage,
  TarotCard,
  CardSpread,
  TarotDeck,
};

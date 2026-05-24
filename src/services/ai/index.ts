import type { TarotCard, CardSpread, ChatMessage } from '../../types';
import type { TarotDeck } from '../../data/tarotDeckGuides';
import {
  buildCardLearningPrompt,
  buildSpreadInterpretationPrompt,
  buildDailyCardPrompt,
  buildWelcomePrompt,
  buildSystemPrompt,
} from './prompts';
import { chatCompletion, streamChatCompletion } from './stream';

export * from './types';
export { CLOUD_FUNCTIONS, proxyBaseURL } from './config';
export { isWechat, callCloudProxy } from './client';
export {
  buildSystemPrompt,
  buildCardLearningPrompt,
  buildSpreadInterpretationPrompt,
  buildDailyCardPrompt,
  buildWelcomePrompt,
} from './prompts';
export { chatCompletion, streamChatCompletion, mockResponse } from './stream';

// ============================================================
// 便捷封装方法
// ============================================================

/**
 * 获取卡牌学习回复（非流式）
 */
export async function getCardLearningResponse(
  card: TarotCard,
  orientation: 'upright' | 'reversed',
  userMessage: string,
  chatHistory: ChatMessage[],
  mentorId?: string,
  cardDeck: TarotDeck = 'eastern'
): Promise<string> {
  const messages = buildCardLearningPrompt(card, orientation, userMessage, chatHistory, cardDeck);
  // 如果有导师，替换 system prompt（安全拼接，处理无双换行的情况）
  if (mentorId) {
    const systemPrompt = buildSystemPrompt(mentorId);
    const originalContent = messages[0].content;
    const parts = originalContent.split('\n\n');
    const restContent = parts.length > 1 ? parts.slice(1).join('\n\n') : originalContent;
    messages[0].content = systemPrompt + '\n\n' + restContent;
  }
  return chatCompletion(messages, { temperature: 0.8, maxTokens: 800 });
}

/**
 * 获取卡牌学习回复（流式）
 */
export async function* streamCardLearningResponse(
  card: TarotCard,
  orientation: 'upright' | 'reversed',
  userMessage: string,
  chatHistory: ChatMessage[],
  mentorId?: string,
  cardDeck: TarotDeck = 'eastern'
): AsyncGenerator<string, void, unknown> {
  const messages = buildCardLearningPrompt(card, orientation, userMessage, chatHistory, cardDeck);
  // 如果有导师，替换 system prompt（安全拼接，处理无双换行的情况）
  if (mentorId) {
    const systemPrompt = buildSystemPrompt(mentorId);
    const originalContent = messages[0].content;
    const parts = originalContent.split('\n\n');
    const restContent = parts.length > 1 ? parts.slice(1).join('\n\n') : originalContent;
    messages[0].content = systemPrompt + '\n\n' + restContent;
  }
  yield* streamChatCompletion(messages, { temperature: 0.8, maxTokens: 800 });
}

/**
 * 获取牌阵解读（非流式）
 */
export async function getSpreadInterpretation(
  spread: CardSpread,
  userQuestion: string,
  mentorId?: string,
  cardDeck: TarotDeck = spread.cardDeck || 'eastern'
): Promise<string> {
  const messages = buildSpreadInterpretationPrompt(spread, userQuestion, mentorId, cardDeck);
  return chatCompletion(messages, { temperature: 0.7, maxTokens: 1500 });
}

/**
 * 获取每日卡牌指引
 */
export async function getDailyCardGuidance(
  card: TarotCard,
  orientation: 'upright' | 'reversed',
  cardDeck: TarotDeck = 'eastern'
): Promise<string> {
  const messages = buildDailyCardPrompt(card, orientation, cardDeck);
  return chatCompletion(messages, { temperature: 0.9, maxTokens: 600 });
}

/**
 * 获取欢迎消息
 */
export async function getWelcomeMessage(
  personalityType: string,
  primaryMentorId: string,
  mentorName: string
): Promise<string> {
  const messages = buildWelcomePrompt(personalityType, primaryMentorId, mentorName);
  return chatCompletion(messages, { temperature: 0.9, maxTokens: 800 });
}

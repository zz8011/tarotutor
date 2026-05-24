import { mentors } from '../../data/mentors';
import { getCardById } from '../../data/tarotCards';
import { getTarotDeckGuide, type TarotDeck } from '../../data/tarotDeckGuides';
import type { ChatMessage, TarotCard, CardSpread } from '../../types';

// ============================================================
// Prompt 构建器 — 塔罗专用
// ============================================================

/**
 * 构建系统 Prompt — 根据导师风格定制
 */
export function buildSystemPrompt(mentorId?: string): string {
  const mentor = mentorId ? mentors.find((m) => m.id === mentorId) : undefined;

  const basePrompt = `你是一位资深的塔罗牌导师，精通韦特塔罗体系。你的职责是帮助用户学习和理解塔罗牌。

## 核心原则
1. 用温暖、启发性的语言引导学习者
2. 结合心理学、神话学和象征学知识
3. 鼓励用户联系自身经历，但不要做过度的心理诊断
4. 每次回复控制在 200-400 字，保持简洁有力
5. 使用 Markdown 格式，适当分段

## 回复结构
- 先给出核心观点（1-2句话）
- 展开解释象征意义
- 联系用户的情境给出建议
- 以启发性问题结尾`;

  if (mentor) {
    return `${basePrompt}

## 你的导师风格：${mentor.name}
${mentor.personality || ''}

### 教学特点
${mentor.teachingStyle || '温和引导，循序渐进'}

### 语言风格
${mentor.personality || '温暖、富有洞察力'}
`;
  }

  return basePrompt;
}

/**
 * 构建牌组上下文
 */
export function buildDeckPromptContext(deck: TarotDeck): string {
  const guide = getTarotDeckGuide(deck);
  return [
    `当前牌组：${guide.label} (${deck})`,
    `牌组视觉风格：${guide.visualGuide}`,
    `解读约束：${guide.interpretationRule}`,
    '硬性规则：只把当前牌面里能确认的元素说成事实；如果通用牌义或另一套牌的细节和当前画面冲突，优先按当前牌组和用户观察来讲。',
    '学习优先级：用户对牌面的观察 > 当前牌组视觉语言 > 通用牌义。',
  ].join('\n');
}

export function buildCardVisualContext(card: TarotCard): string {
  return [
    `通用图像参考（仅作辅助，不可与当前牌组冲突时硬套）：${card.description}`,
    `图像符号：${card.imageSymbol}`,
  ].join('\n');
}

/**
 * 构建卡牌学习对话 Prompt
 */
export function buildCardLearningPrompt(
  card: TarotCard,
  orientation: 'upright' | 'reversed',
  userMessage: string,
  chatHistory: ChatMessage[],
  cardDeck: TarotDeck = 'eastern'
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const systemPrompt = buildSystemPrompt();
  const deckContext = buildDeckPromptContext(cardDeck);

  const cardContext = [
    `当前学习的卡牌：${card.name} / ${card.chineseName}（编号 ${card.id}）`,
    `牌组：${cardDeck}`,
    `元素：${card.element || '无'}`,
    `关键词：${card.keywords?.join('、') || '暂无'}`,
    buildCardVisualContext(card),
    orientation === 'upright'
      ? `正位含义：${card.uprightMeaning}`
      : `逆位含义：${card.reversedMeaning}`,
    `行星关联：${card.planet || '暂无'}`,
    `数秘学：${card.numerology || '暂无'}`,
    '学习规则：',
    '1. 先回应用户刚刚看到的牌面元素，再给标准讲解。',
    '2. 用户观察到的细节优先级最高，不要推翻用户的观察。',
    '3. 不要把未确认的细节说成事实，也不要把另一套牌的风格硬套到这张牌上。',
    '4. 讲解时先说"你看到了什么"，再说"它通常意味着什么"，最后做总结。',
  ].join('\n');

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: `${systemPrompt}\n\n${deckContext}\n\n${cardContext}` },
  ];

  // 添加历史对话（最多保留最近 10 条）
  const recentHistory = chatHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  // 添加当前用户消息
  messages.push({ role: 'user', content: userMessage });

  return messages;
}

/**
 * 构建牌阵解读 Prompt
 */
export function buildSpreadInterpretationPrompt(
  spread: CardSpread,
  userQuestion: string,
  mentorId?: string,
  cardDeck: TarotDeck = spread.cardDeck || 'eastern'
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const systemPrompt = buildSystemPrompt(mentorId);
  const deckContext = buildDeckPromptContext(cardDeck);

  let cardsContext = '';
  for (const position of spread.positions) {
    if (position.cardId != null) {
      const card = getCardById(position.cardId);
      if (card) {
        cardsContext += [
          `- ${position.name}（${position.meaning}）`,
          `  牌名：${card.name} / ${card.chineseName}`,
          `  位置：${position.orientation === 'upright' ? '正位' : '逆位'}`,
          `  关键词：${card.keywords?.join('、') || '暂无'}`,
          `  ${buildCardVisualContext(card)}`,
          `  ${position.orientation === 'upright' ? `正位含义：${card.uprightMeaning}` : `逆位含义：${card.reversedMeaning}`}`,
        ].join('\n') + '\n';
      }
    }
  }

  const userPrompt = [
    '我进行了一次牌阵占卜。',
    `我的问题：${userQuestion || '没有特定问题，想要一般指引'}`,
    `当前牌组：${cardDeck}`,
    '',
    '牌阵结果：',
    cardsContext.trim(),
    '',
    '请为我解读这个牌阵，要求如下：',
    '1. 先说明每张牌在自己位置上的含义。',
    '2. 结合当前牌组的视觉风格来组织语言，但不要强行编造未确认的细节。',
    '3. 讲清楚牌与牌之间的关系、故事线和变化方向。',
    '4. 给出具体、可执行的建议。',
    '5. 保持温暖、清晰、有层次的语气。',
    '6. 最后用一句简洁有力的话总结核心启示。',
    '输出格式要求：',
    '- 使用 Markdown 小标题组织内容，例如：# 核心启示、# 牌位解读、# 关联故事线、# 行动建议、# 一句话总结。',
    '- 每个小标题下写 1-2 个自然段。',
    '- 段落之间必须空一行。',
    '- 不要把所有内容写成一整段。',
  ].join('\n');

  return [
    { role: 'system', content: `${systemPrompt}\n\n${deckContext}` },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * 构建每日卡牌解读 Prompt
 */
export function buildDailyCardPrompt(
  card: TarotCard,
  orientation: 'upright' | 'reversed',
  cardDeck: TarotDeck = 'eastern'
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const systemPrompt = buildSystemPrompt();
  const deckContext = buildDeckPromptContext(cardDeck);

  const userPrompt = [
    `今日抽到的卡牌：${card.name} / ${card.chineseName}`,
    `牌组：${cardDeck}`,
    `位置：${orientation === 'upright' ? '正位' : '逆位'}`,
    buildCardVisualContext(card),
    '请提供：',
    '1. 今日能量概述',
    '2. 具体指引和建议',
    '3. 一个今天可以实践的小行动',
    '4. 一句温暖的结尾',
    '请保持分段清晰，不要把所有内容写成一整段。',
  ].join('\n');

  return [
    { role: 'system', content: `${systemPrompt}\n\n${deckContext}` },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * 构建性格测试后的欢迎消息 Prompt
 */
export function buildWelcomePrompt(
  personalityType: string,
  primaryMentorId: string,
  mentorName: string
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const systemPrompt = buildSystemPrompt(primaryMentorId);

  const userPrompt = `我是新用户，刚刚完成了性格测试。
测试结果显示我是「${personalityType}」类型。
我的专属导师是「${mentorName}」。

请为我：
1. 简单解释这个性格类型的含义
2. 介绍我的专属导师的教学风格
3. 给出今日学习塔罗的一个小建议
4. 用热情温暖的语气欢迎我`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

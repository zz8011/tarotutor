import type { ChatMessage, TarotCard, CardSpread } from '../types';
import { mentors } from '../data/mentors';
import { getCardById } from '../data/tarotCards';

// ============================================================
// AI 服务配置 — 读取 Hermes 配置的模型
// ============================================================

// 可用的模型配置（与 Hermes config.yaml 对应）
const AI_CONFIG = {
  // 主模型：DeepSeek（用户配置，可用）
  primary: {
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
  // 备用1：GLM-5.1（Z.AI）
  fallback1: {
    baseURL: 'https://api.z.ai/api/paas/v4',
    model: 'glm-5.1',
    apiKeyEnv: 'GLM_API_KEY',
  },
  // 备用2：Kimi k2.6（Coding Agent 专用，普通 API 不可用）
  fallback2: {
    baseURL: 'https://api.kimi.com/coding/v1',
    model: 'kimi-k2.6',
    apiKeyEnv: 'KIMI_API_KEY',
  },
};

// 从环境变量读取 API Key
// Vite: 以 VITE_ 开头的变量可在前端访问
// 生产环境建议通过后端代理，避免前端暴露 Key
function getApiKey(config: typeof AI_CONFIG.primary): string {
  // 优先读取 Vite 环境变量 (VITE_XXX)
  const viteKey = import.meta.env[`VITE_${config.apiKeyEnv}`];
  if (viteKey) return viteKey as string;

  // 兼容旧版 window.__HERMES_ENV__ 注入
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__HERMES_ENV__) {
    const env = (window as unknown as Record<string, unknown>).__HERMES_ENV__ as Record<string, string>;
    return env?.[config.apiKeyEnv] || '';
  }

  return '';
}

interface ChatCompletionRequest {
  model: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  error?: {
    message: string;
    code: string;
  };
}

// ============================================================
// 核心 AI 调用方法
// ============================================================

/**
 * 发送聊天补全请求到 AI 模型
 * 支持自动 fallback 到备用模型
 */
export async function chatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    model?: 'primary' | 'fallback1' | 'fallback2';
  } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 2048, stream = false, model = 'primary' } = options;
  const config = AI_CONFIG[model];
  const apiKey = getApiKey(config);

  // 如果没有 API Key，返回模拟响应（开发模式）
  if (!apiKey) {
    console.warn('[AI Service] 未配置 API Key，使用模拟响应');
    return mockResponse(messages);
  }

  const requestBody: ChatCompletionRequest = {
    model: config.model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream,
  };

  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // 如果是主模型失败，尝试 fallback
      if (model === 'primary') {
        console.warn(`[AI Service] 主模型失败 (${response.status})，尝试 fallback1`);
        return chatCompletion(messages, { ...options, model: 'fallback1' });
      } else if (model === 'fallback1') {
        console.warn(`[AI Service] fallback1 失败，尝试 fallback2`);
        return chatCompletion(messages, { ...options, model: 'fallback2' });
      }
      throw new Error(`AI 请求失败: ${response.status} ${response.statusText}`);
    }

    const data: ChatCompletionResponse = await response.json();

    if (data.error) {
      throw new Error(`AI 错误: ${data.error.message}`);
    }

    return data.choices[0]?.message?.content || '';
  } catch (error) {
    // 网络错误时也尝试 fallback
    if (model === 'primary') {
      console.warn('[AI Service] 主模型网络错误，尝试 fallback1');
      return chatCompletion(messages, { ...options, model: 'fallback1' });
    } else if (model === 'fallback1') {
      console.warn('[AI Service] fallback1 网络错误，尝试 fallback2');
      return chatCompletion(messages, { ...options, model: 'fallback2' });
    }
    throw error;
  }
}

/**
 * 流式聊天补全（用于实时显示 AI 回复）
 */
export async function* streamChatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: 'primary' | 'fallback1' | 'fallback2';
  } = {}
): AsyncGenerator<string, void, unknown> {
  const { temperature = 0.7, maxTokens = 2048, model = 'primary' } = options;
  const config = AI_CONFIG[model];
  const apiKey = getApiKey(config);

  if (!apiKey) {
    console.warn('[AI Service] 未配置 API Key，使用模拟流式响应');
    const mockText = mockResponse(messages);
    // 模拟流式输出
    const chunks = mockText.split(/(?<=。)|(?<=！)|(?<=？)|(?<=\n)/);
    for (const chunk of chunks) {
      if (chunk) {
        yield chunk;
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    return;
  }

  const requestBody: ChatCompletionRequest = {
    model: config.model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok || !response.body) {
      throw new Error(`流式请求失败: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // 忽略解析错误的行
          }
        }
      }
    }
  } catch (error) {
    console.error('[AI Service] 流式请求错误:', error);
    throw error;
  }
}

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
 * 构建卡牌学习对话 Prompt
 */
export function buildCardLearningPrompt(
  card: TarotCard,
  orientation: 'upright' | 'reversed',
  userMessage: string,
  chatHistory: ChatMessage[]
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const systemPrompt = buildSystemPrompt();

  const cardContext = `当前学习的卡牌：${card.name}（${card.chineseName}）
编号：${card.id}
元素：${card.element || '无'}
关键词：${card.keywords?.join('、') || '暂无'}

${orientation === 'upright' ? '正位含义：' : '逆位含义：'}
${orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning}

行星关联：${card.planet || '暂无'}
数字学：${card.numerology || '暂无'}
`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: `${systemPrompt}\n\n${cardContext}` },
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
  mentorId?: string
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const systemPrompt = buildSystemPrompt(mentorId);

  let cardsContext = '';
  for (const position of spread.positions) {
    if (position.cardId != null) {
      const card = getCardById(position.cardId);
      if (card) {
        cardsContext += `\n【${position.name}】${position.meaning}
卡牌：${card.name}（${position.orientation === 'upright' ? '正位' : '逆位'}）
关键词：${card.keywords?.join('、') || '暂无'}
`;
      }
    }
  }

  const userPrompt = `我进行了牌阵占卜。

我的问题：${userQuestion || '没有特定问题，寻求 general guidance'}

牌阵结果：${cardsContext}

请为我解读这个牌阵：
1. 每张牌在其位置上的含义
2. 牌与牌之间的关联和故事线
3. 综合建议和行动指引
4. 保持温暖鼓励的语气，不要太宿命论`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * 构建每日卡牌解读 Prompt
 */
export function buildDailyCardPrompt(
  card: TarotCard,
  orientation: 'upright' | 'reversed'
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const systemPrompt = buildSystemPrompt();

  const userPrompt = `今日抽到的卡牌是：${card.name}（${orientation === 'upright' ? '正位' : '逆位'}）

请为我提供：
1. 今日能量概述（50字以内）
2. 具体指引和建议
3. 一个今日可以实践的小行动
4. 以温暖的祝福结尾`;

  return [
    { role: 'system', content: systemPrompt },
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

// ============================================================
// 模拟响应（开发/无网络时使用）
// ============================================================

function mockResponse(messages: { role: string; content: string }[]): string {
  const lastMessage = messages[messages.length - 1]?.content || '';

  if (lastMessage.includes('今日抽到')) {
    return `✨ 今天的能量非常特别！

这张牌出现在你的今日指引中，意味着宇宙正在向你传递一个重要的信息。它提醒你关注当下的内在状态，倾听直觉的声音。

**今日建议**：花 10 分钟静坐，回想最近让你感到兴奋或不安的事情，这张牌的能量会帮助你找到答案。

**小行动**：今天遇到选择时，先深呼吸三次，再做决定。

愿你拥有充满觉察的一天 🌙`;
  }

  if (lastMessage.includes('牌阵')) {
    return `🔮 这个牌阵为你揭示了一个有趣的故事：

第一张牌代表你当前的状态，显示你正处于一个转变的节点。第二张牌揭示了潜在的挑战，但这正是成长的机会。第三张牌指向未来的可能性，只要你保持开放的心态。

**牌阵之间的关联**：从过去到现在的能量流动非常清晰，建议你专注于当下的行动，而不是过度担忧结果。

**综合建议**：信任自己的直觉，你已经有答案了。今天适合做一些创造性的活动，让能量自然流动。

记住，塔罗是指引而非预言，你始终拥有选择的自由 ✨`;
  }

  if (lastMessage.includes('学习')) {
    return `🌟 这是一个很好的学习时刻！

这张牌的核心信息是关于**内在平衡**。当你在学习塔罗时，不仅要记住牌意，更要感受牌面传递的能量。

**深入理解**：注意观察牌中的色彩、人物姿态和符号细节。每个元素都在讲述一个故事。

**实践建议**：今天试着用这张牌为一位朋友做简单的单牌解读，实践是最好的老师。

你最近有遇到什么让你联想到这张牌的事情吗？ 🤔`;
  }

  return `🌙 我感受到了你的能量。

这是一个值得深入探索的话题。塔罗牌不仅仅是符号和意义的组合，更是你内在智慧的镜子。

**核心洞察**：你当前所处的阶段，正是这张牌能量最强的时候。它邀请你以新的视角看待眼前的情境。

**下一步**：试着把这张牌放在床头，睡前回想它的意象，看看梦境会带给你什么启示。

有什么特别想深入探讨的吗？ ✨`;
}

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
  mentorId?: string
): Promise<string> {
  const messages = buildCardLearningPrompt(card, orientation, userMessage, chatHistory);
  // 如果有导师，替换 system prompt
  if (mentorId) {
    messages[0].content = buildSystemPrompt(mentorId) + '\n\n' + messages[0].content.split('\n\n')[1];
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
  mentorId?: string
): AsyncGenerator<string, void, unknown> {
  const messages = buildCardLearningPrompt(card, orientation, userMessage, chatHistory);
  if (mentorId) {
    messages[0].content = buildSystemPrompt(mentorId) + '\n\n' + messages[0].content.split('\n\n')[1];
  }
  yield* streamChatCompletion(messages, { temperature: 0.8, maxTokens: 800 });
}

/**
 * 获取牌阵解读（非流式）
 */
export async function getSpreadInterpretation(
  spread: CardSpread,
  userQuestion: string,
  mentorId?: string
): Promise<string> {
  const messages = buildSpreadInterpretationPrompt(spread, userQuestion, mentorId);
  return chatCompletion(messages, { temperature: 0.7, maxTokens: 1500 });
}

/**
 * 获取每日卡牌指引
 */
export async function getDailyCardGuidance(
  card: TarotCard,
  orientation: 'upright' | 'reversed'
): Promise<string> {
  const messages = buildDailyCardPrompt(card, orientation);
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

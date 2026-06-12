import { sanitizeAiText } from '../../utils/aiText';
import { isWechat, callCloudProxy } from './client';
import { proxyBaseURL } from './config';
import type { AiMessage } from './types';

// ============================================================
// 模拟响应（开发/无网络时使用）
// ============================================================

export function mockResponse(messages: { role: string; content: string }[]): string {
  const lastMessage = messages[messages.length - 1]?.content || '';

  if (lastMessage.includes('今日抽到')) {
    return `今天的能量非常特别。

这张牌出现在你的今日指引中，意味着宇宙正在向你传递一个重要的信息。它提醒你关注当下的内在状态，倾听直觉的声音。

今日建议：花 10 分钟静坐，回想最近让你感到兴奋或不安的事情，这张牌的能量会帮助你找到答案。

小行动：今天遇到选择时，先深呼吸三次，再做决定。

愿你拥有充满觉察的一天。`;
  }

  if (lastMessage.includes('牌阵')) {
    return `这个牌阵为你揭示了一个有趣的故事：

第一张牌代表你当前的状态，显示你正处于一个转变的节点。第二张牌揭示了潜在的挑战，但这正是成长的机会。第三张牌指向未来的可能性，只要你保持开放的心态。

牌阵之间的关联：从过去到现在的能量流动非常清晰，建议你专注于当下的行动，而不是过度担忧结果。

综合建议：信任自己的直觉，你已经有答案了。今天适合做一些创造性的活动，让能量自然流动。

记住，塔罗是指引而非预言，你始终拥有选择的自由。`;
  }

  if (lastMessage.includes('学习')) {
    return `这是一个很好的学习时刻。

这张牌的核心信息是关于内在平衡。当你在学习塔罗时，不仅要记住牌意，更要感受牌面传递的能量。

深入理解：注意观察牌中的色彩、人物姿态和符号细节。每个元素都在讲述一个故事。

实践建议：今天试着用这张牌为一位朋友做简单的单牌解读，实践是最好的老师。

你最近有遇到什么让你联想到这张牌的事情吗？`;
  }

  return `我感受到了你的能量。

这是一个值得深入探索的话题。塔罗牌不仅仅是符号和意义的组合，更是你内在智慧的镜子。

核心洞察：你当前所处的阶段，正是这张牌能量最强的时候。它邀请你以新的视角看待眼前的情境。

下一步：试着把这张牌放在床头，睡前回想它的意象，看看梦境会带给你什么启示。

有什么特别想深入探讨的吗？`;
}

// ============================================================
// 核心 AI 调用方法
// ============================================================

/**
 * 发送聊天补全请求到 AI 模型
 * 强制通过云函数/代理调用，客户端不再直连任何 AI 服务商
 */
/**
 * 无代理时的策略：
 * - 开发/测试环境：降级到 mockResponse，保证本地无 Key 也能跑通完整流程
 * - 生产环境：抛错，避免静默使用假数据掩盖配置问题
 */
function resolveNoProxyFallback(messages: AiMessage[]): string {
  if (import.meta.env.DEV) {
    console.warn('[AI Service] 未配置 API 代理地址，开发环境降级为 mock 响应。设置 VITE_API_PROXY_URL 可连接真实模型。');
    return sanitizeAiText(mockResponse(messages));
  }
  throw new Error(
    '[AI Service] 未配置 API 代理地址。请在 .env.local 中设置 VITE_API_PROXY_URL，或确保在微信小程序环境中运行。'
  );
}

export async function chatCompletion(
  messages: AiMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    model?: 'primary' | 'fallback1' | 'fallback2';
  } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 2048 } = options;

  if (!isWechat && !proxyBaseURL) {
    return resolveNoProxyFallback(messages);
  }

  return callCloudProxy('tarot-chat', messages, { temperature, maxTokens });
}

/**
 * 流式聊天补全（用于实时显示 AI 回复）
 * 强制通过云函数/代理调用，客户端不再直连任何 AI 服务商
 */
export async function* streamChatCompletion(
  messages: AiMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: 'primary' | 'fallback1' | 'fallback2';
  } = {}
): AsyncGenerator<string, void, unknown> {
  const { temperature = 0.7, maxTokens = 2048 } = options;

  // 当前云函数代理暂不支持流式，退化为非流式后分段 yield
  const fullText =
    !isWechat && !proxyBaseURL
      ? resolveNoProxyFallback(messages)
      : await callCloudProxy('tarot-chat', messages, { temperature, maxTokens });
  const chunks = fullText.split(/(?<=。)|(?<=！)|(?<=？)|(?<=\n)/);
  for (const chunk of chunks) {
    if (chunk) {
      yield sanitizeAiText(chunk);
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

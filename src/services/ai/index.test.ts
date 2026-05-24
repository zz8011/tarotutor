import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildSystemPrompt,
  mockResponse,
  chatCompletion,
  streamChatCompletion,
  getCardLearningResponse,
  getSpreadInterpretation,
  getDailyCardGuidance,
  getWelcomeMessage,
} from './index';
import * as clientModule from './client';
import * as configModule from './config';

// 提供一个最小化的 TarotCard 用于测试
const dummyCard = {
  id: 0,
  name: 'The Fool',
  chineseName: '愚者',
  arcana: 'major' as const,
  suit: null,
  number: 0,
  uprightMeaning: '新的开始、冒险、天真与信任。',
  reversedMeaning: '冲动、鲁莽、缺乏计划。',
  keywords: ['新开始', '冒险', '自由'],
  element: 'air' as const,
  planet: '天王星',
  description: '悬崖边的年轻人，背着小包，望向天空。',
  imageSymbol: '🃏',
  image: '/cards/00-the-fool.png',
  numerology: '0代表无限可能',
};

describe('buildSystemPrompt', () => {
  it('不传 mentorId 时应返回非空字符串', () => {
    const prompt = buildSystemPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain('塔罗牌导师');
  });

  it('传有效 mentorId 时应包含导师名称', () => {
    const prompt = buildSystemPrompt('luna');
    expect(prompt).toContain('星澜');
  });
});

describe('mockResponse', () => {
  it('应返回字符串', () => {
    const res = mockResponse([{ role: 'user', content: 'hello' }]);
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('包含"今日抽到"时应返回每日卡牌风格文本', () => {
    const res = mockResponse([{ role: 'user', content: '今日抽到' }]);
    expect(res).toContain('今天的能量');
  });

  it('包含"牌阵"时应返回牌阵风格文本', () => {
    const res = mockResponse([{ role: 'user', content: '牌阵' }]);
    expect(res).toContain('牌阵');
  });

  it('包含"学习"时应返回学习风格文本', () => {
    const res = mockResponse([{ role: 'user', content: '学习' }]);
    expect(res).toContain('学习');
  });
});

describe('chatCompletion', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isWechat', 'get').mockReturnValue(false);
    vi.spyOn(configModule, 'proxyBaseURL', 'get').mockReturnValue('');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('未配置代理时应回退到 mockResponse', async () => {
    const res = await chatCompletion([{ role: 'user', content: 'test' }]);
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });
});

describe('streamChatCompletion', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isWechat', 'get').mockReturnValue(false);
    vi.spyOn(configModule, 'proxyBaseURL', 'get').mockReturnValue('');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('未配置代理时应分段 yield mock 文本', async () => {
    const chunks: string[] = [];
    for await (const chunk of streamChatCompletion([{ role: 'user', content: 'test' }])) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('').length).toBeGreaterThan(0);
  });
});

describe('便捷封装方法（mock 不调用真实 API）', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isWechat', 'get').mockReturnValue(false);
    vi.spyOn(configModule, 'proxyBaseURL', 'get').mockReturnValue('');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getCardLearningResponse 返回非空字符串', async () => {
    const res = await getCardLearningResponse(
      dummyCard,
      'upright',
      '这张牌什么意思？',
      [],
      'luna',
      'eastern'
    );
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('getSpreadInterpretation 返回非空字符串', async () => {
    const spread = {
      id: 'spread-1',
      templateId: 'three-card',
      date: new Date().toISOString(),
      question: '我的事业如何？',
      positions: [
        { position: 0, name: '过去', meaning: '过去的影响', cardId: 0, orientation: 'upright' as const },
        { position: 1, name: '现在', meaning: '当前状况', cardId: 1, orientation: 'reversed' as const },
        { position: 2, name: '未来', meaning: '未来趋势', cardId: null, orientation: 'upright' as const },
      ],
      interpretation: '',
    };
    const res = await getSpreadInterpretation(spread, '我的事业如何？', 'luna', 'eastern');
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('getDailyCardGuidance 返回非空字符串', async () => {
    const res = await getDailyCardGuidance(dummyCard, 'upright', 'eastern');
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('getWelcomeMessage 返回非空字符串', async () => {
    const res = await getWelcomeMessage('intuitive', 'luna', '星澜');
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });
});

describe('错误处理', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('callCloudProxy 在开发环境无代理时应抛出错误', async () => {
    vi.spyOn(clientModule, 'isWechat', 'get').mockReturnValue(false);
    vi.spyOn(configModule, 'proxyBaseURL', 'get').mockReturnValue('');

    const { callCloudProxy } = await import('./client');
    await expect(callCloudProxy('tarot-chat', [{ role: 'user', content: 'test' }])).rejects.toThrow(
      '未配置 API 代理地址'
    );
  });
});

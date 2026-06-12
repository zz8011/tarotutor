// ============================================================
// AI Tarot Tutor — Personality Quiz Questions & Mentor Matching
// ============================================================

import type { QuizQuestion, QuizResult } from '../types';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: '当你第一次看到一张塔罗牌时，你更倾向于……',
    dimension: 'intuitive_logical',
    options: [
      {
        text: '闭上眼睛感受它带来的情绪和画面，让直觉自由流动',
        value: 'intuitive',
        score: { intuitive: 2, free: 1 },
      },
      {
        text: '仔细观察牌面上的符号、数字和颜色，尝试分析它们的含义',
        value: 'logical',
        score: { logical: 2, systematic: 1 },
      },
    ],
  },
  {
    id: 'q2',
    question: '在学习新知识时，你更喜欢……',
    dimension: 'supportive_independent',
    options: [
      {
        text: '有人陪伴引导，可以随时提问和讨论',
        value: 'supportive',
        score: { supportive: 2, intuitive: 1 },
      },
      {
        text: '独自探索，按自己的节奏理解',
        value: 'independent',
        score: { independent: 2, logical: 1 },
      },
    ],
  },
  {
    id: 'q3',
    question: '面对一个复杂的问题，你通常……',
    dimension: 'free_systematic',
    options: [
      {
        text: '先发散思考，从多个角度自由联想',
        value: 'free',
        score: { free: 2, intuitive: 1 },
      },
      {
        text: '先建立框架，逐步拆解分析',
        value: 'systematic',
        score: { systematic: 2, logical: 1 },
      },
    ],
  },
  {
    id: 'q4',
    question: '你理想的塔罗学习氛围是……',
    dimension: 'lively_contemplative',
    options: [
      {
        text: '轻松活泼，充满互动和分享',
        value: 'lively',
        score: { lively: 2, supportive: 1 },
      },
      {
        text: '安静深沉，专注内省和感悟',
        value: 'contemplative',
        score: { contemplative: 2, independent: 1 },
      },
    ],
  },
  {
    id: 'q5',
    question: '当你遇到困难时，你更希望导师……',
    dimension: 'supportive_independent',
    options: [
      {
        text: '温柔鼓励，给你情感支持',
        value: 'supportive',
        score: { supportive: 2, contemplative: 1 },
      },
      {
        text: '直接指出问题，给你明确方向',
        value: 'independent',
        score: { independent: 2, lively: 1 },
      },
    ],
  },
  {
    id: 'q6',
    question: '你更相信……',
    dimension: 'intuitive_logical',
    options: [
      {
        text: '内心的感觉和第一印象',
        value: 'intuitive',
        score: { intuitive: 2, contemplative: 1 },
      },
      {
        text: '理性的分析和证据',
        value: 'logical',
        score: { logical: 2, systematic: 1 },
      },
    ],
  },
  {
    id: 'q7',
    question: '你学习塔罗的主要目的是……',
    dimension: 'free_systematic',
    options: [
      {
        text: '探索自我，获得心灵成长',
        value: 'free',
        score: { free: 2, contemplative: 1 },
      },
      {
        text: '掌握技能，能够为他人解读',
        value: 'systematic',
        score: { systematic: 2, lively: 1 },
      },
    ],
  },
  {
    id: 'q8',
    question: '描述一张牌时，你更习惯……',
    dimension: 'lively_contemplative',
    options: [
      {
        text: '用生动的故事和比喻',
        value: 'lively',
        score: { lively: 2, intuitive: 1 },
      },
      {
        text: '用精准的定义和结构',
        value: 'contemplative',
        score: { contemplative: 2, logical: 1 },
      },
    ],
  },
];

// ---- Mentor Matching Logic ---------------------------------

export function getRecommendedMentors(inputScores: Record<string, number>): QuizResult {
  const scores = { ...inputScores };

  const dims = {
    intuitive_logical: scores.intuitive - scores.logical,
    supportive_independent: scores.supportive - scores.independent,
    free_systematic: scores.free - scores.systematic,
    lively_contemplative: scores.lively - scores.contemplative,
  };

  const type = [
    dims.intuitive_logical > 0 ? '直觉型' : '逻辑型',
    dims.supportive_independent > 0 ? '支持型' : '独立型',
    dims.free_systematic > 0 ? '自由型' : '系统型',
    dims.lively_contemplative > 0 ? '活泼型' : '沉思型',
  ].join('·');

  const mentorMap: Record<string, string[]> = {
    '直觉型·支持型·自由型·活泼型': ['luna', 'aira'],
    '直觉型·支持型·自由型·沉思型': ['luna', 'aira'],
    '直觉型·支持型·系统型·活泼型': ['aira', 'luna'],
    '直觉型·支持型·系统型·沉思型': ['aira', 'luna'],
    '直觉型·独立型·自由型·活泼型': ['luna', 'mia'],
    '直觉型·独立型·自由型·沉思型': ['luna', 'mia'],
    '直觉型·独立型·系统型·活泼型': ['mia', 'luna'],
    '直觉型·独立型·系统型·沉思型': ['mia', 'luna'],
    '逻辑型·支持型·自由型·活泼型': ['ray', 'sam'],
    '逻辑型·支持型·自由型·沉思型': ['ray', 'sam'],
    '逻辑型·支持型·系统型·活泼型': ['ray', 'karl'],
    '逻辑型·支持型·系统型·沉思型': ['ray', 'karl'],
    '逻辑型·独立型·自由型·活泼型': ['karl', 'mia'],
    '逻辑型·独立型·自由型·沉思型': ['karl', 'mia'],
    '逻辑型·独立型·系统型·活泼型': ['karl', 'ray'],
    '逻辑型·独立型·系统型·沉思型': ['karl', 'ray'],
  };

  const recommended = mentorMap[type] || ['luna', 'ray'];

  return {
    personalityType: type,
    description: `你是${type}的学习者。${getDescription(type)}`,
    recommendedMentors: recommended,
    primaryMentorId: recommended[0] || '',
    secondaryMentorIds: recommended.slice(1),
    matchReason: `你是${type}的学习者。${getDescription(type)}`,
    scores,
  };
}

function getDescription(type: string): string {
  const descs: Record<string, string> = {
    '直觉型': '你拥有敏锐的直觉力，善于捕捉牌面传递的微妙信息。',
    '逻辑型': '你擅长结构化思考，喜欢通过系统分析理解塔罗符号。',
    '支持型': '你在温暖的陪伴中成长，需要导师的鼓励和引导。',
    '独立型': '你享受自主探索的过程，喜欢按自己的节奏学习。',
    '自由型': '你抗拒束缚，喜欢灵活多变的学习方式。',
    '系统型': '你追求条理清晰，喜欢循序渐进的知识体系。',
    '活泼型': '你在互动和分享中汲取能量，学习过程充满乐趣。',
    '沉思型': '你在安静的内省中获得洞见，享受深度思考。',
  };
  return descs[type.split('·')[0]] || '';
}


// ---- Helper Functions ---------------------------------------

export function calculateScores(answers: number[]): Record<string, number> {
  const scores: Record<string, number> = {
    intuitive: 0, logical: 0, supportive: 0, independent: 0,
    free: 0, systematic: 0, lively: 0, contemplative: 0,
  };
  
  for (let i = 0; i < quizQuestions.length; i++) {
    const selectedIndex = answers[i];
    if (selectedIndex < 0 || selectedIndex >= quizQuestions[i].options.length) continue;
    
    const option = quizQuestions[i].options[selectedIndex];
    for (const [trait, score] of Object.entries(option.score)) {
      scores[trait] = (scores[trait] || 0) + score;
    }
  }
  
  return scores;
}

export function buildPersonalityType(scores: Record<string, number>): string {
  const dimensions = [
    { a: 'intuitive', b: 'logical', key: 'I' },
    { a: 'supportive', b: 'independent', key: 'S' },
    { a: 'free', b: 'systematic', key: 'F' },
    { a: 'lively', b: 'contemplative', key: 'L' },
  ];
  
  let type = '';
  for (const dim of dimensions) {
    type += (scores[dim.a] || 0) >= (scores[dim.b] || 0) ? dim.a[0].toUpperCase() : dim.b[0].toUpperCase();
  }
  
  return type;
}

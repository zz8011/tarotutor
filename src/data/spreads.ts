// ============================================================
// AI Tarot Tutor — Spread Type Definitions & Data
// ============================================================

import type { SpreadTemplate } from '../types';

// ---- Spread Data --------------------------------------------

export const spreads: SpreadTemplate[] = [
  // 1. 单张牌 (Single Card)
  {
    id: 'single',
    name: 'Single Card',
    chineseName: '单张牌',
    cardCount: 1,
    positions: [
      {
        index: 0,
        label: '当日启示',
        meaning: '今日的核心主题或需要关注的能量',
      },
    ],
    description:
      '最简洁的牌阵，抽取一张牌作为每日灵感或对某个问题的快速回应。适合初学者练习直觉，也适合每日冥想时使用。',
  },

  // 2. 三张牌阵 (Three Card: Past-Present-Future)
  {
    id: 'three_card',
    name: 'Three Card Spread',
    chineseName: '三张牌阵',
    cardCount: 3,
    positions: [
      {
        index: 0,
        label: '过去',
        meaning: '影响当前情况的过去因素与经历',
      },
      {
        index: 1,
        label: '现在',
        meaning: '当前的状态、挑战与正在发生的事情',
      },
      {
        index: 2,
        label: '未来',
        meaning: '基于当前趋势可能发展的方向',
      },
    ],
    description:
      '经典的三张牌阵，通过过去、现在、未来三个维度揭示事情的发展脉络。简单易学但变化丰富，是最常用的牌阵之一。',
  },

  // 3. 关系之镜 (Relationship Mirror)
  {
    id: 'relationship_mirror',
    name: 'Relationship Mirror',
    chineseName: '关系之镜',
    cardCount: 5,
    positions: [
      {
        index: 0,
        label: '你的现状',
        meaning: '你在关系中的真实状态与感受',
      },
      {
        index: 1,
        label: '对方的现状',
        meaning: '对方在关系中的真实状态与感受',
      },
      {
        index: 2,
        label: '关系基础',
        meaning: '你们之间关系的核心纽带与共同基础',
      },
      {
        index: 3,
        label: '潜在挑战',
        meaning: '关系中隐藏的问题或需要面对的障碍',
      },
      {
        index: 4,
        label: '发展方向',
        meaning: '这段关系可能的未来走向与建议',
      },
    ],
    description:
      '专门用于探索人际关系（爱情、友情、亲情等）的五张牌阵。从双方各自的状态出发，揭示关系的深层连接与潜在挑战，帮助你更清晰地理解彼此。',
  },

  // 4. 凯尔特十字 (Celtic Cross)
  {
    id: 'celtic_cross',
    name: 'Celtic Cross',
    chineseName: '凯尔特十字',
    cardCount: 10,
    positions: [
      {
        index: 0,
        label: '当前状况',
        meaning: '你现在所处的核心情境与主要关注点',
      },
      {
        index: 1,
        label: '挑战或阻碍',
        meaning: '横跨在你面前的障碍或对抗力量',
      },
      {
        index: 2,
        label: '潜意识基础',
        meaning: '隐藏在表面之下的深层原因与潜在影响',
      },
      {
        index: 3,
        label: '近期过去',
        meaning: '刚刚发生过且仍在影响现在的事件',
      },
      {
        index: 4,
        label: '可能性/最佳结果',
        meaning: '如果顺应当前能量可能实现的最好结果',
      },
      {
        index: 5,
        label: '近期未来',
        meaning: '即将到来的事件或短期内的变化',
      },
      {
        index: 6,
        label: '你的态度',
        meaning: '你对自己和当前情况的真实想法与态度',
      },
      {
        index: 7,
        label: '外部影响',
        meaning: '周围环境或他人对你的影响',
      },
      {
        index: 8,
        label: '希望与恐惧',
        meaning: '你内心深处的期望以及令你担忧的事物',
      },
      {
        index: 9,
        label: '最终结果',
        meaning: '综合所有因素后的最终结局',
      },
    ],
    description:
      '塔罗牌中最经典、最全面的牌阵之一。十张牌从多个维度深度剖析问题：涵盖当前状况、阻碍、潜意识、过去与未来、内在态度、外部环境、希望与恐惧，以及最终结果。适合面对复杂问题或需要深入指引时使用。',
  },

  // 5. 马蹄形牌阵 (Horseshoe)
  {
    id: 'horseshoe',
    name: 'Horseshoe Spread',
    chineseName: '马蹄形牌阵',
    cardCount: 7,
    positions: [
      {
        index: 0,
        label: '过去',
        meaning: '影响当前局面的过去事件与经历',
      },
      {
        index: 1,
        label: '现在',
        meaning: '目前的状态与核心议题',
      },
      {
        index: 2,
        label: '隐藏因素',
        meaning: '你可能没有意识到的影响因素',
      },
      {
        index: 3,
        label: '障碍',
        meaning: '阻止你前进的阻力与困难',
      },
      {
        index: 4,
        label: '外部影响',
        meaning: '来自周围环境或他人的影响',
      },
      {
        index: 5,
        label: '建议',
        meaning: '塔罗牌给你的最佳行动建议',
      },
      {
        index: 6,
        label: '可能结果',
        meaning: '根据当前趋势预测的最终结果',
      },
    ],
    description:
      '七张牌组成的马蹄形牌阵，是三张牌阵与凯尔特十字之间的理想过渡。涵盖过去、现在、隐藏因素、障碍、外部影响、建议和结果七个方面，既有深度又不会过于复杂，适合中等难度的问题分析。',
  },
];

// ---- Helper Functions ----------------------------------------

/**
 * Find a spread by its unique id.
 */
export function getSpreadById(id: string): SpreadTemplate | undefined {
  return spreads.find((s) => s.id === id);
}

/**
 * Find a spread by its Chinese name.
 */
export function getSpreadByChineseName(chineseName: string): SpreadTemplate | undefined {
  return spreads.find((s) => s.chineseName === chineseName);
}

/**
 * Get all spreads that use exactly `count` cards.
 */
export function getSpreadsByCardCount(count: number): SpreadTemplate[] {
  return spreads.filter((s) => s.cardCount === count);
}

/**
 * Get all spread ids.
 */
export function getAllSpreadIds(): string[] {
  return spreads.map((s) => s.id);
}

/**
 * Get the total number of available spreads.
 */
export function getSpreadCount(): number {
  return spreads.length;
}

// ============================================================
// 成就规则表（声明式定义）
// 每条规则由纯函数 check 判定是否满足；
// store.checkAchievements 在关键动作后批量评估并解锁。
// ============================================================

import type { UserProgress } from '../types';

export interface AchievementContext {
  progress: UserProgress;
  /** 已保存的牌阵占卜次数 */
  spreadsCount: number;
}

export interface AchievementRule {
  id: string;
  name: string;
  description: string;
  /** 图标键，由 UI 层映射到具体图标组件 */
  icon: string;
  check: (ctx: AchievementContext) => boolean;
}

/** 大阿尔卡纳卡牌 ID 范围为 0-21 */
const MAJOR_ARCANA_COUNT = 22;
const TOTAL_CARDS = 78;

export const achievementRules: AchievementRule[] = [
  {
    id: 'first-card',
    name: '初识塔罗',
    description: '完成第一张牌的学习',
    icon: 'sparkles',
    check: ({ progress }) => progress.learnedCards.length >= 1,
  },
  {
    id: 'ten-cards',
    name: '渐入佳境',
    description: '学会 10 张塔罗牌',
    icon: 'book-open',
    check: ({ progress }) => progress.learnedCards.length >= 10,
  },
  {
    id: 'major-arcana',
    name: '大阿尔卡纳行者',
    description: '学完全部 22 张大阿尔卡纳',
    icon: 'crown',
    check: ({ progress }) => progress.learnedCards.filter((id) => id < MAJOR_ARCANA_COUNT).length >= MAJOR_ARCANA_COUNT,
  },
  {
    id: 'all-cards',
    name: '牌库大师',
    description: '学完全部 78 张塔罗牌',
    icon: 'trophy',
    check: ({ progress }) => progress.learnedCards.length >= TOTAL_CARDS,
  },
  {
    id: 'streak-7',
    name: '七日之约',
    description: '连续学习 7 天',
    icon: 'flame',
    check: ({ progress }) => progress.streak >= 7 || progress.longestStreak >= 7,
  },
  {
    id: 'streak-30',
    name: '月相圆满',
    description: '连续学习 30 天',
    icon: 'moon-star',
    check: ({ progress }) => progress.streak >= 30 || progress.longestStreak >= 30,
  },
  {
    id: 'first-diary',
    name: '日记初心',
    description: '写下第一篇学习日记',
    icon: 'pen-line',
    check: ({ progress }) => progress.diaryEntries.length >= 1,
  },
  {
    id: 'first-spread',
    name: '占卜启程',
    description: '完成第一次牌阵占卜',
    icon: 'star',
    check: ({ spreadsCount }) => spreadsCount >= 1,
  },
];

export function getAchievementRuleById(id: string): AchievementRule | undefined {
  return achievementRules.find((rule) => rule.id === id);
}

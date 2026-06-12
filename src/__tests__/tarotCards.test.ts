import { describe, it, expect } from 'vitest';
import {
  tarotCards,
  majorArcana,
  minorArcana,
  getCardById,
  getCardsBySuit,
  getRandomCard,
} from '../data/tarotCards';

describe('tarotCards 数据', () => {
  it('应有 78 张牌', () => {
    expect(tarotCards).toHaveLength(78);
  });

  it('大阿尔卡那 22 张', () => {
    expect(majorArcana).toHaveLength(22);
    expect(majorArcana.every(c => c.arcana === 'major')).toBe(true);
  });

  it('小阿尔卡那 56 张', () => {
    expect(minorArcana).toHaveLength(56);
    expect(minorArcana.every(c => c.arcana === 'minor')).toBe(true);
  });

  it('每个花色 14 张', () => {
    const suits = ['wands', 'cups', 'swords', 'pentacles'] as const;
    for (const suit of suits) {
      expect(getCardsBySuit(suit)).toHaveLength(14);
    }
  });

  it('每张牌都有必填字段', () => {
    for (const card of tarotCards) {
      expect(card.id).toBeTypeOf('number');
      expect(card.name).toBeTruthy();
      expect(card.chineseName).toBeTruthy();
      expect(card.arcana).toMatch(/^(major|minor)$/);
      expect(card.uprightMeaning).toBeTruthy();
      expect(card.reversedMeaning).toBeTruthy();
      expect(Array.isArray(card.keywords)).toBe(true);
      expect(card.keywords.length).toBeGreaterThan(0);
      expect(card.element).toBeTruthy();
      expect(card.imageSymbol).toBeTruthy();
    }
  });

  it('大阿尔卡那 id 连续 0-21', () => {
    const ids = majorArcana.map(c => c.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 22 }, (_, i) => i));
  });

  it('大阿尔卡那 suit 为 null', () => {
    for (const card of majorArcana) {
      expect(card.suit).toBeNull();
    }
  });

  it('小阿尔卡那 suit 不为 null', () => {
    for (const card of minorArcana) {
      expect(card.suit).not.toBeNull();
    }
  });
});

describe('getCardById', () => {
  it('通过有效 id 找到牌', () => {
    const fool = getCardById(0);
    expect(fool).toBeDefined();
    expect(fool!.chineseName).toBe('愚者');
  });

  it('通过 id=21 找到世界', () => {
    const world = getCardById(21);
    expect(world).toBeDefined();
    expect(world!.chineseName).toBe('世界');
  });

  it('无效 id 返回 undefined', () => {
    expect(getCardById(-1)).toBeUndefined();
    expect(getCardById(999)).toBeUndefined();
  });
});

describe('getRandomCard', () => {
  it('返回有效的牌', () => {
    const card = getRandomCard();
    expect(card).toBeDefined();
    expect(tarotCards).toContain(card);
  });
});

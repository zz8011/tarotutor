import { describe, it, expect } from 'vitest';
import {
  mentors,
  getMentorById,
  getMentorsByTrait,
  getDefaultMentor,
} from '../data/mentors';

describe('mentors 数据', () => {
  it('应有 6 位导师', () => {
    expect(mentors).toHaveLength(6);
  });

  it('每位导师都有必填字段', () => {
    for (const m of mentors) {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.chineseName).toBeTruthy();
      expect(m.avatar).toBeTruthy();
      expect(m.personality).toBeTruthy();
      expect(m.teachingStyle).toBeTruthy();
      expect(Array.isArray(m.specialties)).toBe(true);
      expect(m.catchphrase).toBeTruthy();
      expect(m.color).toBeTruthy();
      expect(m.personalityType).toBeTruthy();
      // MentorFull 专属字段
      expect(m.title).toBeTruthy();
      expect(Array.isArray(m.styleTags)).toBe(true);
      expect(Array.isArray(m.suitableTraits)).toBe(true);
      expect(m.greeting).toBeTruthy();
      expect(m.sampleResponse).toBeTruthy();
      expect(m.avatarEmoji).toBeTruthy();
      expect(m.colorTheme).toBeDefined();
      expect(m.colorTheme.primary).toBeTruthy();
      expect(m.colorTheme.secondary).toBeTruthy();
      expect(m.colorTheme.bg).toBeTruthy();
      expect(m.colorTheme.text).toBeTruthy();
    }
  });

  it('所有导师 id 唯一', () => {
    const ids = mentors.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('包含预期的 6 位导师', () => {
    const ids = mentors.map(m => m.id);
    expect(ids).toContain('luna');
    expect(ids).toContain('sol');
    expect(ids).toContain('mira');
    expect(ids).toContain('orion');
    expect(ids).toContain('seren');
    expect(ids).toContain('kai');
  });
});

describe('getMentorById', () => {
  it('通过 id 找到导师', () => {
    const luna = getMentorById('luna');
    expect(luna).toBeDefined();
    expect(luna!.chineseName).toContain('星澜');
  });

  it('无效 id 返回 undefined', () => {
    expect(getMentorById('nonexistent')).toBeUndefined();
    expect(getMentorById('')).toBeUndefined();
  });
});

describe('getDefaultMentor', () => {
  it('默认导师是 Luna', () => {
    const defaultMentor = getDefaultMentor();
    expect(defaultMentor.id).toBe('luna');
  });
});

describe('getMentorsByTrait', () => {
  it('通过特征找到匹配的导师', () => {
    const results = getMentorsByTrait('intuitive');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(m => m.suitableTraits.includes('intuitive'))).toBe(true);
  });

  it('无匹配特征返回空数组', () => {
    const results = getMentorsByTrait('完全不存在的特征xyz');
    expect(results).toHaveLength(0);
  });
});

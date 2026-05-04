import { describe, it, expect } from 'vitest';
import {
  quizQuestions,
  calculateScores,
  getRecommendedMentors,
  buildPersonalityType,
} from '../data/quizQuestions';

describe('quizQuestions 数据', () => {
  it('应有 8 道题', () => {
    expect(quizQuestions).toHaveLength(8);
  });

  it('每道题结构完整', () => {
    for (const q of quizQuestions) {
      expect(q.id).toBeTruthy();
      expect(q.question).toBeTruthy();
      expect(q.dimension).toMatch(
        /^(intuitive_logical|supportive_independent|free_systematic|lively_contemplative)$/
      );
      expect(q.options).toHaveLength(2);
      for (const opt of q.options) {
        expect(opt.text).toBeTruthy();
        expect(opt.value).toBeTruthy();
        expect(opt.score).toBeTypeOf('object');
      }
    }
  });

  it('题目 id 唯一', () => {
    const ids = quizQuestions.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('覆盖 4 个维度', () => {
    const dims = new Set(quizQuestions.map(q => q.dimension));
    expect(dims.size).toBe(4);
  });
});

describe('calculateScores', () => {
  it('返回正确的分数结构', () => {
    // 选所有第 0 个选项
    const scores = calculateScores([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(scores).toBeTypeOf('object');
    // 应该有 4 个维度的分数
    const keys = Object.keys(scores);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('不同选择产生不同分数', () => {
    const scoresA = calculateScores([0, 0, 0, 0, 0, 0, 0, 0]);
    const scoresB = calculateScores([3, 3, 3, 3, 3, 3, 3, 3]);
    expect(scoresA).not.toEqual(scoresB);
  });
});

describe('getRecommendedMentors', () => {
  it('返回完整结果', () => {
    const scores = calculateScores([0, 1, 2, 3, 0, 1, 2, 3]);
    const result = getRecommendedMentors(scores);

    expect(result.primaryMentorId).toBeTruthy();
    expect(Array.isArray(result.secondaryMentorIds)).toBe(true);
    expect(result.matchReason).toBeTruthy();
    expect(result.scores).toBeTypeOf('object');
  });

  it('primaryMentorId 是有效导师', () => {
    const validIds = ['luna', 'sol', 'mira', 'orion', 'seren', 'kai'];
    const scores = calculateScores([0, 0, 0, 0, 0, 0, 0, 0]);
    const result = getRecommendedMentors(scores);
    expect(validIds).toContain(result.primaryMentorId);
  });
});

describe('buildPersonalityType', () => {
  it('返回非空字符串', () => {
    const scores = calculateScores([0, 1, 2, 3, 0, 1, 2, 3]);
    const type = buildPersonalityType(scores);
    expect(type).toBeTruthy();
    expect(type.length).toBeGreaterThan(0);
  });
});

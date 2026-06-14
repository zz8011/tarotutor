import type { FastifyInstance } from 'fastify';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';

type Authed = { userId: string };

export async function recordRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // 全部学习记录（间隔重复）
  app.get('/records', async (req) => {
    const userId = (req as unknown as Authed).userId;
    return { records: await query('SELECT * FROM study_records WHERE user_id=$1', [userId]) };
  });

  // 待复习（next_review_at <= today）
  app.get('/records/due', async (req) => {
    const userId = (req as unknown as Authed).userId;
    return { records: await query(
      'SELECT * FROM study_records WHERE user_id=$1 AND next_review_at IS NOT NULL AND next_review_at <= now() ORDER BY next_review_at',
      [userId]
    )};
  });

  // upsert 一张牌的学习记录
  app.put('/records/:cardId', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const cardId = Number((req.params as { cardId: string }).cardId);
    const b = req.body as Record<string, unknown>;
    await query(
      `INSERT INTO study_records(user_id, card_id, mentor_id, stage, orientation, reflection,
         symbol_observation, scenario_answer, follow_up, quiz_question, quiz_options,
         quiz_answer, quiz_answers, quiz_result, mastered, review_count, last_studied_at,
         completed_at, next_review_at, updated_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now(),$17,$18,now())
       ON CONFLICT (user_id, card_id) DO UPDATE SET
         mentor_id=EXCLUDED.mentor_id, stage=EXCLUDED.stage, orientation=EXCLUDED.orientation,
         reflection=EXCLUDED.reflection, symbol_observation=EXCLUDED.symbol_observation,
         scenario_answer=EXCLUDED.scenario_answer, follow_up=EXCLUDED.follow_up,
         quiz_question=EXCLUDED.quiz_question, quiz_options=EXCLUDED.quiz_options,
         quiz_answer=EXCLUDED.quiz_answer, quiz_answers=EXCLUDED.quiz_answers,
         quiz_result=EXCLUDED.quiz_result, mastered=EXCLUDED.mastered,
         review_count=EXCLUDED.review_count, last_studied_at=now(),
         completed_at=EXCLUDED.completed_at, next_review_at=EXCLUDED.next_review_at,
         updated_at=now()`,
      [userId, cardId, b.mentorId ?? null, b.stage ?? 'observe', b.orientation ?? 'upright',
       b.reflection ?? '', b.symbolObservation ?? '', b.scenarioAnswer ?? '', b.followUp ?? '',
       b.quizQuestion ?? '', JSON.stringify(b.quizOptions ?? []),
       b.quizAnswer ?? '', JSON.stringify(b.quizAnswers ?? {}),
       JSON.stringify(b.quizResult ?? null), b.mastered ?? false, b.reviewCount ?? 0,
       b.completedAt ?? null, b.nextReviewAt ?? null]
    );
    return { ok: true };
  });
}

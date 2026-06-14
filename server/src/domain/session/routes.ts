import type { FastifyInstance } from 'fastify';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';

type Authed = { userId: string };

const PATCH_FIELDS: Record<string, string> = {
  phase: 'phase', lessonStage: 'lesson_stage', orientation: 'orientation',
  reflection: 'reflection', symbolObservation: 'symbol_observation',
  scenarioAnswer: 'scenario_answer', followUp: 'follow_up',
  quizQuestion: 'quiz_question', quizOptions: 'quiz_options',
  quizAnswer: 'quiz_answer', quizAnswers: 'quiz_answers',
  quizResult: 'quiz_result', summary: 'summary',
  userFeeling: 'user_feeling', knowledgeUnlocked: 'knowledge_unlocked',
};

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/sessions', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const b = req.body as { id: string; cardId: number; mentorId?: string; orientation?: string };
    await query(
      `INSERT INTO study_sessions(id, user_id, card_id, mentor_id, orientation)
       VALUES($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
      [b.id, userId, b.cardId, b.mentorId ?? null, b.orientation ?? 'upright']
    );
    return { id: b.id };
  });

  app.get('/sessions/current', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const rows = await query(
      `SELECT * FROM study_sessions WHERE user_id=$1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1`, [userId]);
    return { session: rows[0] ?? null };
  });

  app.patch('/sessions/:id', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [camel, snake] of Object.entries(PATCH_FIELDS)) {
      if (camel in body) { vals.push(body[camel]); sets.push(`${snake}=$${vals.length}`); }
    }
    if (sets.length === 0) return { updated: false };
    vals.push(id, userId);
    await query(`UPDATE study_sessions SET ${sets.join(', ')} WHERE id=$${vals.length - 1} AND user_id=$${vals.length}`, vals);
    return { updated: true };
  });

  app.post('/sessions/:id/messages', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const { id } = req.params as { id: string };
    const b = req.body as { id: string; role: string; content: string; phase?: string };
    const own = await query('SELECT 1 FROM study_sessions WHERE id=$1 AND user_id=$2', [id, userId]);
    if (own.length === 0) return { error: '会话不存在' };
    await query(
      `INSERT INTO session_messages(id, session_id, role, content, phase) VALUES($1,$2,$3,$4,$5)`,
      [b.id, id, b.role, b.content, b.phase ?? null]);
    return { ok: true };
  });

  app.post('/sessions/:id/end', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const { id } = req.params as { id: string };
    await query(`UPDATE study_sessions SET ended_at=now() WHERE id=$1 AND user_id=$2`, [id, userId]);
    return { ok: true };
  });
}

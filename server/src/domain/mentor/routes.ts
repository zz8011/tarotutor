import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';
import { embed, toPgVector } from '../../infra/embedding.js';
type Authed = { userId: string };

const writeSchema = z.object({
  mentorId: z.string().min(1).max(64),
  text: z.string().min(1).max(5000),
  sessionId: z.string().max(128).optional(),
});

function parseLimit(v: unknown, def = 5, max = 20): number {
  // 防 NaN：parseInt + fallback，再 clamp
  const n = parseInt(String(v ?? def), 10);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}

export async function mentorRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/mentor/memory', async (req, reply) => {
    const userId = (req as unknown as Authed).userId;
    const parsed = writeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: '参数无效' });
    const { mentorId, text, sessionId } = parsed.data;

    // 跨租户防护：若带 sessionId，必须属于当前用户
    if (sessionId) {
      const own = await query('SELECT 1 FROM study_sessions WHERE id=$1 AND user_id=$2', [sessionId, userId]);
      if (own.length === 0) return reply.code(400).send({ error: 'invalid sessionId' });
    }

    const vec = await embed(text);
    const rows = await query(
      `INSERT INTO mentor_memory(user_id, mentor_id, memory_text, embedding, session_id)
       VALUES($1,$2,$3,$4,$5) RETURNING id`,
      [userId, mentorId, text, toPgVector(vec), sessionId ?? null]
    );
    return reply.code(201).send({ ok: true, id: (rows[0] as { id: string }).id });
  });

  app.get('/mentor/memory/search', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const q = req.query as { mentorId?: string; text?: string; limit?: string };
    if (!q.mentorId || !q.text) return { memories: [] };
    const limit = parseLimit(q.limit);
    const vec = toPgVector(await embed(q.text));
    const memories = await query(
      `SELECT id, memory_text, created_at, embedding <=> $1 AS distance
       FROM mentor_memory WHERE user_id=$2 AND mentor_id=$3
       ORDER BY embedding <=> $1 LIMIT $4`,
      [vec, userId, q.mentorId, limit]
    );
    return { memories };
  });

  app.get('/mentor/memory', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const q = req.query as { mentorId?: string; limit?: string };
    const limit = parseLimit(q.limit, 50, 200);
    if (q.mentorId) {
      return { memories: await query('SELECT id, memory_text, session_id, created_at FROM mentor_memory WHERE user_id=$1 AND mentor_id=$2 ORDER BY created_at DESC LIMIT $3', [userId, q.mentorId, limit]) };
    }
    return { memories: await query('SELECT id, mentor_id, memory_text, session_id, created_at FROM mentor_memory WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2', [userId, limit]) };
  });
}

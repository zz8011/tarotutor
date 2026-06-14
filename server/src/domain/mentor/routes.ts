import type { FastifyInstance } from 'fastify';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';
import { embed, toPgVector } from '../../infra/embedding.js';
type Authed = { userId: string };

export async function mentorRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // 写入一条导师记忆（自动向量化）
  app.post('/mentor/memory', async (req, reply) => {
    const userId = (req as unknown as Authed).userId;
    const b = req.body as { mentorId: string; text: string; sessionId?: string };
    if (!b.mentorId || !b.text) return reply.code(400).send({ error: 'mentorId 和 text 必填' });
    const vec = await embed(b.text);
    const rows = await query(
      `INSERT INTO mentor_memory(user_id, mentor_id, memory_text, embedding, session_id)
       VALUES($1,$2,$3,$4,$5) RETURNING id, created_at`,
      [userId, b.mentorId, b.text, toPgVector(vec), b.sessionId ?? null]
    );
    return reply.code(201).send({ ok: true, id: (rows[0] as { id: string }).id });
  });

  // 检索与查询语义相关的导师记忆（cosine，注入 prompt 用）
  app.get('/mentor/memory/search', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const q = req.query as { mentorId: string; text: string; limit?: string };
    if (!q.mentorId || !q.text) return { memories: [] };
    const vec = toPgVector(await embed(q.text));
    const limit = Math.min(Number(q.limit ?? 5), 20);
    const memories = await query(
      `SELECT id, memory_text, created_at, embedding <=> $1 AS distance
       FROM mentor_memory WHERE user_id=$2 AND mentor_id=$3
       ORDER BY embedding <=> $1 LIMIT $4`,
      [vec, userId, q.mentorId, limit]
    );
    return { memories };
  });

  // 列出某导师全部记忆（按时间）
  app.get('/mentor/memory', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const q = req.query as { mentorId?: string; limit?: string };
    const limit = Math.min(Number(q.limit ?? 50), 200);
    if (q.mentorId) {
      return { memories: await query('SELECT id, memory_text, session_id, created_at FROM mentor_memory WHERE user_id=$1 AND mentor_id=$2 ORDER BY created_at DESC LIMIT $3', [userId, q.mentorId, limit]) };
    }
    return { memories: await query('SELECT id, mentor_id, memory_text, session_id, created_at FROM mentor_memory WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2', [userId, limit]) };
  });
}

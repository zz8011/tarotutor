import type { FastifyInstance } from 'fastify';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';

type Authed = { userId: string };

export async function diaryRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/diary', async (req) => {
    const userId = (req as unknown as Authed).userId;
    return { entries: await query('SELECT * FROM diary_entries WHERE user_id=$1 ORDER BY created_at DESC', [userId]) };
  });

  app.post('/diary', async (req, reply) => {
    const userId = (req as unknown as Authed).userId;
    const b = req.body as { id: string; cardId?: number; content: string; mood?: string; tags?: unknown[] };
    await query(
      `INSERT INTO diary_entries(id, user_id, card_id, content, mood, tags) VALUES($1,$2,$3,$4,$5,$6)`,
      [b.id, userId, b.cardId ?? null, b.content, b.mood ?? null, JSON.stringify(b.tags ?? [])]
    );
    return reply.code(201).send({ ok: true });
  });

  app.delete('/diary/:id', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const { id } = req.params as { id: string };
    await query('DELETE FROM diary_entries WHERE id=$1 AND user_id=$2', [id, userId]);
    return { ok: true };
  });
}

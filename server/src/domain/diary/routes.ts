import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';
type Authed = { userId: string };

const createSchema = z.object({
  id: z.string().min(1).max(128),
  cardId: z.number().int().nonnegative().optional(),
  content: z.string().min(1).max(10000),
  mood: z.string().max(50).optional(),
  tags: z.array(z.string().max(40)).max(50).optional(),
});

export async function diaryRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/diary', async (req) => {
    const userId = (req as unknown as Authed).userId;
    return { entries: await query('SELECT * FROM diary_entries WHERE user_id=$1 ORDER BY created_at DESC', [userId]) };
  });

  app.post('/diary', async (req, reply) => {
    const userId = (req as unknown as Authed).userId;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: '参数无效', detail: parsed.error.flatten() });
    const b = parsed.data;
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

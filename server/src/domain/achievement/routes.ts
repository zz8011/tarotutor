import type { FastifyInstance } from 'fastify';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';

type Authed = { userId: string };

export async function achievementRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/achievements', async (req) => {
    const userId = (req as unknown as Authed).userId;
    return { achievements: await query('SELECT * FROM user_achievements WHERE user_id=$1 ORDER BY unlocked_at DESC', [userId]) };
  });

  app.post('/achievements', async (req, reply) => {
    const userId = (req as unknown as Authed).userId;
    const b = req.body as { achievementId: string; name?: string; description?: string; icon?: string };
    await query(
      `INSERT INTO user_achievements(user_id, achievement_id, name, description, icon) VALUES($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, achievement_id) DO NOTHING`,
      [userId, b.achievementId, b.name ?? null, b.description ?? null, b.icon ?? null]
    );
    return reply.code(201).send({ ok: true });
  });
}

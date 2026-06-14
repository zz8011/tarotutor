import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';
type Authed = { userId: string };

const patchSchema = z.object({
  current_phase: z.string().max(40).optional(),
  learned_cards: z.array(z.number().int()).optional(),
  streak: z.number().int().nonnegative().optional(),
  longest_streak: z.number().int().nonnegative().optional(),
  total_sessions: z.number().int().nonnegative().optional(),
  last_study_date: z.string().optional(),
});

export async function progressRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // 取当前用户进度
  app.get('/progress', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const rows = await query('SELECT * FROM study_progress WHERE user_id=$1', [userId]);
    return { progress: rows[0] ?? null };
  });

  // upsert 进度（首次写时 INSERT）
  app.patch('/progress', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return { error: '参数无效' };
    const d = parsed.data;
    const sets = Object.entries(d).map(([k], i) => `${k}=$${i + 1}`);
    const vals = Object.values(d);
    if (sets.length === 0) return { updated: false };
    vals.push(userId);
    await query(
      `INSERT INTO study_progress(user_id, ${Object.keys(d).join(', ')})
       VALUES($${vals.length}, ${Object.keys(d).map((_, i) => '$' + (i + 1)).join(', ')})
       ON CONFLICT (user_id) DO UPDATE SET ${sets.map((s, i) => s.replace('$' + (i + 1), '$' + (i + 1))).join(', ')}, last_active_at=now()`,
      vals
    );
    return { updated: true };
  });
}

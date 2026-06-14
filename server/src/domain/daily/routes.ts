import type { FastifyInstance } from 'fastify';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';
type Authed = { userId: string };

export async function dailyRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // 取某日（默认今天）
  app.get('/daily', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const q = req.query as { date?: string };
    const date = q.date ?? new Date().toISOString().slice(0, 10);
    const rows = await query('SELECT * FROM daily_cards WHERE user_id=$1 AND date=$2', [userId, date]);
    return { daily: rows[0] ?? null };
  });

  // upsert 每日牌 + 指引
  app.post('/daily', async (req) => {
    const userId = (req as unknown as Authed).userId;
    const b = req.body as { date: string; cardId: number; orientation?: string; deck?: string; guidance?: string };
    await query(
      `INSERT INTO daily_cards(user_id, date, card_id, orientation, deck, guidance)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id, date) DO UPDATE SET
         card_id=EXCLUDED.card_id, orientation=EXCLUDED.orientation, deck=EXCLUDED.deck, guidance=COALESCE(EXCLUDED.guidance, daily_cards.guidance)`,
      [userId, b.date, b.cardId, b.orientation ?? null, b.deck ?? null, b.guidance ?? null]
    );
    return { ok: true };
  });
}

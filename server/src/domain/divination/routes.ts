import type { FastifyInstance } from 'fastify';
import { query } from '../../infra/db.js';
import { requireAuth } from '../../infra/auth.js';
type Authed = { userId: string };

export async function divinationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.get('/divinations', async (req) => {
    const userId = (req as unknown as Authed).userId;
    return { spreads: await query('SELECT * FROM divinations WHERE user_id=$1 ORDER BY created_at DESC', [userId]) };
  });
  app.post('/divinations', async (req, reply) => {
    const userId = (req as unknown as Authed).userId;
    const b = req.body as { id: string; spreadType?: string; templateId?: string; cards?: unknown;
      positions?: unknown; question?: string; interpretation?: string; cardDeck?: string; date?: string };
    await query(
      `INSERT INTO divinations(id, user_id, spread_type, template_id, cards, positions, question, interpretation, card_deck, date)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [b.id, userId, b.spreadType ?? null, b.templateId ?? null, JSON.stringify(b.cards ?? []),
       JSON.stringify(b.positions ?? null), b.question ?? null, b.interpretation ?? null, b.cardDeck ?? null, b.date ?? null]
    );
    return reply.code(201).send({ ok: true });
  });
}

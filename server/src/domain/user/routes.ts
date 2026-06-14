import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, withTransaction } from '../../infra/db.js';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../../infra/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function userRoutes(app: FastifyInstance): Promise<void> {
  // 注册
  app.post('/auth/register', async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: '参数无效', detail: parsed.error.flatten() });
    const { email, password, nickname } = parsed.data;
    const hash = await hashPassword(password);
    try {
      const rows = await withTransaction(async (tx) => {
        const u = await tx.query(
          'INSERT INTO users(email, password_hash, nickname) VALUES($1,$2,$3) RETURNING id, email, nickname',
          [email, hash, nickname ?? null]
        );
        await tx.query('INSERT INTO study_progress(user_id) VALUES($1)', [u.rows[0].id]);
        return u.rows[0];
      });
      const token = await signToken(rows.id);
      return reply.code(201).send({ token, user: { id: rows.id, email: rows.email, nickname: rows.nickname } });
    } catch (err) {
      if (String(err).includes('unique')) return reply.code(409).send({ error: '邮箱已注册' });
      throw err;
    }
  });

  // 登录
  app.post('/auth/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: '参数无效' });
    const { email, password } = parsed.data;
    const rows = await query('SELECT id, email, nickname, password_hash FROM users WHERE email=$1', [email]);
    if (rows.length === 0) return reply.code(401).send({ error: '邮箱或密码错误' });
    const u = rows[0] as { id: string; email: string; nickname: string | null; password_hash: string };
    if (!(await verifyPassword(password, u.password_hash))) {
      return reply.code(401).send({ error: '邮箱或密码错误' });
    }
    const token = await signToken(u.id);
    return reply.send({ token, user: { id: u.id, email: u.email, nickname: u.nickname } });
  });

  // 当前用户（需登录）
  app.get('/auth/me', { preHandler: requireAuth }, async (req) => {
    const userId = (req as unknown as { userId: string }).userId;
    const rows = await query('SELECT id, email, nickname, daily_study_target, card_deck, personality_type, primary_mentor FROM users WHERE id=$1', [userId]);
    if (rows.length === 0) return { error: '用户不存在' };
    return { user: rows[0] };
  });

  // 健康检查（不需登录）
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));
}

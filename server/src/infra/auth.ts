import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { FastifyRequest, FastifyReply } from 'fastify';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-insecure-change-me');
const TOKEN_TTL = '30d';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

// Fastify 中间件：从 Authorization: Bearer <token> 解析 userId
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    reply.code(401).send({ error: '未登录' });
    return;
  }
  const token = header.slice('Bearer '.length);
  const payload = await verifyToken(token);
  if (!payload) {
    reply.code(401).send({ error: 'token 无效或过期' });
    return;
  }
  (req as FastifyRequest & { userId: string }).userId = payload.sub;
}

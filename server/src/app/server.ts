import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { userRoutes } from '../domain/user/routes.js';
import { runMigrations } from '../infra/migrate.js';

const app = Fastify({ logger: true });

await app.register(helmet);
await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  credentials: true,
});

await app.register(userRoutes);

// 启动时跑 migration
try {
  await runMigrations();
} catch (err) {
  app.log.error({ err }, 'migration 失败');
  process.exit(1);
}

const port = Number(process.env.PORT ?? 8787);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`tarot-tutor server on :${port}`);
}).catch(err => { app.log.error(err); process.exit(1); });

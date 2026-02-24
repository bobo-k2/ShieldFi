import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fstatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { APP } from './config.js';
import { env } from './env.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { walletRoutes } from './routes/wallets.js';
import { approvalRoutes } from './routes/approvals.js';
import { alertRoutes } from './routes/alerts.js';
import { webhookRoutes } from './routes/webhooks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: env.JWT_SECRET });
await app.register(fstatic, {
  root: join(__dirname, '..', 'public'),
  prefix: '/',
});

await app.register(healthRoutes);
await app.register(authRoutes);
await app.register(walletRoutes);
await app.register(approvalRoutes);
await app.register(alertRoutes);
await app.register(webhookRoutes);

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`${APP.name} v${APP.version} listening on ${address}`);
});

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
import { approvalRoutes, approvalPublicRoutes } from './routes/approvals.js';
import { alertRoutes } from './routes/alerts.js';
import { webhookRoutes } from './routes/webhooks.js';
import { monitorRoutes } from './routes/monitor.js';
import { monitorManager } from './services/monitorManager.js';
import { startTelegramBot } from './services/telegramBot.js';
import { transactionRoutes } from './routes/transactions.js';
import { riskAnalysisRoutes } from './routes/risk-analysis.js';
import { subscriptionRoutes } from './routes/subscription.js';
import { rpcProxyRoutes } from './routes/rpc-proxy.js';

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
await app.register(approvalPublicRoutes);
await app.register(approvalRoutes);
await app.register(alertRoutes);
await app.register(webhookRoutes);
await app.register(monitorRoutes);
await app.register(transactionRoutes);
await app.register(riskAnalysisRoutes);
await app.register(subscriptionRoutes);
await app.register(rpcProxyRoutes);

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`${APP.name} v${APP.version} listening on ${address}`);

  // Start polling monitor
  monitorManager.start(120000); // 2 minutes — reduced from 30s to avoid Helius rate limits
  // Start Telegram bot for /start link commands
  startTelegramBot();
});

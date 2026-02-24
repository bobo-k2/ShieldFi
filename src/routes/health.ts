import { FastifyInstance } from 'fastify';
import { APP } from '../config.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/api/health', async () => ({
    status: 'ok',
    app: APP.name,
    version: APP.version,
    timestamp: new Date().toISOString(),
  }));
}

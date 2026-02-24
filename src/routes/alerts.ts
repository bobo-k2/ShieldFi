import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export async function alertRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth);

  app.get('/api/alerts', async (request) => {
    const { sub } = request.user as { sub: string };
    return prisma.alert.findMany({
      where: { userId: sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  app.patch<{ Params: { id: string } }>('/api/alerts/:id/read', async (request) => {
    const { id } = request.params;
    return prisma.alert.update({ where: { id }, data: { read: true } });
  });
}

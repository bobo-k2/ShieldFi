import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export async function walletRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth);

  app.get('/api/wallets', async (request) => {
    const { sub } = request.user as { sub: string };
    return prisma.wallet.findMany({ where: { userId: sub } });
  });

  app.post<{ Body: { address: string; label?: string } }>('/api/wallets', async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { address, label } = request.body;
    if (!address) return reply.status(400).send({ error: 'address required' });

    const wallet = await prisma.wallet.create({
      data: { userId: sub, address, label },
    });
    return reply.status(201).send(wallet);
  });

  app.delete<{ Params: { id: string } }>('/api/wallets/:id', async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params;
    await prisma.wallet.deleteMany({ where: { id, userId: sub } });
    return reply.status(204).send();
  });
}

import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { scanWalletApprovals } from '../services/scanner.js';

export async function walletRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth);

  app.get('/api/wallets', async (request) => {
    const { sub } = request.user as { sub: string };
    return prisma.wallet.findMany({ where: { userId: sub } });
  });

  app.post<{ Body: { address: string; label?: string } }>('/api/wallets', async (request, reply) => {
    try {
      const { sub } = request.user as { sub: string };
      const { address, label } = request.body;
      if (!address) return reply.status(400).send({ error: 'address required' });

      // Check if wallet already exists for this user
      const existing = await prisma.wallet.findUnique({ where: { address } });
      if (existing) {
        return reply.status(200).send(existing);
      }

      const wallet = await prisma.wallet.create({
        data: { userId: sub, address, label },
      });

      // Auto-trigger scan for newly added wallet
      scanWalletApprovals(address).catch((e) => app.log.error(e, 'Auto-scan failed'));

      return reply.status(201).send(wallet);
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to add wallet' });
    }
  });

  app.delete<{ Params: { id: string } }>('/api/wallets/:id', async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params;
    await prisma.wallet.deleteMany({ where: { id, userId: sub } });
    return reply.status(204).send();
  });
}

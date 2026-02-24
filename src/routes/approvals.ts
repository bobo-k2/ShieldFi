import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { scanWalletApprovals } from '../services/scanner.js';

export async function approvalRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth);

  app.get('/api/approvals', async (request) => {
    const { sub } = request.user as { sub: string };
    const wallets = await prisma.wallet.findMany({ where: { userId: sub }, select: { id: true } });
    const walletIds = wallets.map((w) => w.id);
    return prisma.approval.findMany({
      where: { walletId: { in: walletIds } },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/api/approvals/scan', async (request) => {
    const { wallet } = request.user as { sub: string; wallet: string };
    const results = await scanWalletApprovals(wallet);
    return { scanned: true, found: results.length };
  });

  app.post<{ Params: { id: string } }>('/api/approvals/:id/revoke', async (request, reply) => {
    const { id } = request.params;
    const approval = await prisma.approval.findUnique({ where: { id } });
    if (!approval) return reply.status(404).send({ error: 'Not found' });

    // Return the info needed for the frontend to build a revoke TX
    return {
      tokenMint: approval.tokenMint,
      spender: approval.spender,
      walletId: approval.walletId,
      message: 'Use this info to build a revoke transaction client-side',
    };
  });
}

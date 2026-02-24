import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

export async function monitorRoutes(app: FastifyInstance) {
  // Add wallet to monitoring
  app.post<{ Body: { address: string; label?: string } }>('/api/monitor/add', async (request, reply) => {
    try {
      const { address, label } = request.body || {};
      if (!address || typeof address !== 'string' || address.length < 32) {
        return reply.status(400).send({ error: 'Valid Solana address required' });
      }

      const wallet = await prisma.monitoredWallet.upsert({
        where: { address },
        update: { isActive: true, label: label || undefined },
        create: { address, label: label || null },
      });

      return { success: true, wallet };
    } catch (e: any) {
      app.log.error(e);
      return reply.status(500).send({ error: 'Failed to add wallet: ' + e.message });
    }
  });

  // Remove wallet from monitoring
  app.delete<{ Params: { address: string } }>('/api/monitor/:address', async (request, reply) => {
    try {
      const { address } = request.params;
      await prisma.monitoredWallet.updateMany({
        where: { address },
        data: { isActive: false },
      });
      return { success: true };
    } catch (e: any) {
      app.log.error(e);
      return reply.status(500).send({ error: 'Failed to remove wallet: ' + e.message });
    }
  });

  // List monitored wallets
  app.get('/api/monitor', async () => {
    const wallets = await prisma.monitoredWallet.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return { wallets };
  });

  // Get alerts for a wallet
  app.get<{ Params: { address: string } }>('/api/monitor/:address/alerts', async (request, reply) => {
    try {
      const { address } = request.params;
      const wallet = await prisma.monitoredWallet.findUnique({ where: { address } });
      if (!wallet) return reply.status(404).send({ error: 'Wallet not monitored' });

      const alerts = await prisma.monitorAlert.findMany({
        where: { monitoredWalletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return { alerts };
    } catch (e: any) {
      app.log.error(e);
      return reply.status(500).send({ error: 'Failed to fetch alerts: ' + e.message });
    }
  });

  // Check monitoring status for a specific address
  app.get<{ Params: { address: string } }>('/api/monitor/:address/status', async (request) => {
    const { address } = request.params;
    const wallet = await prisma.monitoredWallet.findUnique({ where: { address } });
    return {
      isMonitored: wallet?.isActive ?? false,
      lastCheckedAt: wallet?.lastCheckedAt ?? null,
    };
  });
}

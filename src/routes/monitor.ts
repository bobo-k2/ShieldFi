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
      telegramLinked: !!wallet?.telegramChatId,
      linkCode: wallet?.linkCode ?? null,
    };
  });

  // Generate a Telegram link code for a monitored wallet
  app.post<{ Body: { address: string } }>('/api/monitor/telegram/link', async (request, reply) => {
    try {
      const { address } = request.body || {};
      if (!address) return reply.status(400).send({ error: 'address required' });

      const wallet = await prisma.monitoredWallet.findUnique({ where: { address } });
      if (!wallet || !wallet.isActive) {
        return reply.status(404).send({ error: 'Wallet not monitored. Start monitoring first.' });
      }

      if (wallet.telegramChatId) {
        return { alreadyLinked: true, telegramLinked: true };
      }

      // Generate or reuse link code
      let linkCode = wallet.linkCode;
      if (!linkCode) {
        linkCode = 'LINK_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        await prisma.monitoredWallet.update({
          where: { id: wallet.id },
          data: { linkCode },
        });
      }

      // Bot username from token (we'll need to fetch it once)
      const botUsername = await getBotUsername();
      const deepLink = `https://t.me/${botUsername}?start=${linkCode}`;

      return { linkCode, deepLink, telegramLinked: false };
    } catch (e: any) {
      app.log.error(e);
      return reply.status(500).send({ error: 'Failed to generate link: ' + e.message });
    }
  });

  // Unlink Telegram from a monitored wallet
  app.post<{ Body: { address: string } }>('/api/monitor/telegram/unlink', async (request, reply) => {
    try {
      const { address } = request.body || {};
      if (!address) return reply.status(400).send({ error: 'address required' });

      await prisma.monitoredWallet.updateMany({
        where: { address },
        data: { telegramChatId: null, linkCode: null },
      });
      return { success: true };
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });
}

// Cache bot username
let cachedBotUsername: string | null = null;
async function getBotUsername(): Promise<string> {
  if (cachedBotUsername) return cachedBotUsername;
  try {
    const { env } = await import('../env.js');
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
    const data = await res.json() as any;
    cachedBotUsername = data?.result?.username || 'ShieldFiBot';
  } catch {
    cachedBotUsername = 'ShieldFiBot';
  }
  return cachedBotUsername!;
}

import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { sendAlert } from '../services/telegram.js';
import type { HeliusWebhookEvent } from '../types.js';

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/api/webhooks/helius', async (request, reply) => {
    const events = request.body as HeliusWebhookEvent[];

    for (const event of Array.isArray(events) ? events : [events]) {
      app.log.info({ type: event.type, sig: event.signature }, 'Helius webhook event');

      // Check if any monitored wallet is involved
      const accounts = event.accountData?.map((a) => a.account) || [];
      const wallets = await prisma.wallet.findMany({
        where: { address: { in: accounts } },
        include: { user: true },
      });

      for (const wallet of wallets) {
        const alert = await prisma.alert.create({
          data: {
            userId: wallet.userId,
            walletId: wallet.id,
            type: event.type,
            severity: 'MEDIUM',
            title: `Activity detected: ${event.type}`,
            message: `Transaction ${event.signature} involves your wallet ${wallet.address}`,
            metadata: JSON.stringify(event),
          },
        });

        await sendAlert(`🚨 ShieldFi Alert\n${alert.title}\n${alert.message}`);
      }
    }

    return { received: true };
  });
}

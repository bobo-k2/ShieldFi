import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { sendTelegramAlert, sendAlert } from '../services/telegram.js';
import { analyzeTransaction } from '../services/monitor.js';
import type { HeliusEnhancedTx } from '../services/monitor.js';

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/api/webhooks/helius', async (request, reply) => {
    const events = request.body as HeliusEnhancedTx[];
    const txList = Array.isArray(events) ? events : [events];

    app.log.info(`Helius webhook: ${txList.length} event(s)`);

    for (const tx of txList) {
      try {
        app.log.info({ type: tx.type, sig: tx.signature }, 'Helius webhook event');

        // Check all involved addresses against monitored wallets
        const involvedAddresses = new Set<string>();
        for (const nt of tx.nativeTransfers || []) {
          involvedAddresses.add(nt.fromUserAccount);
          involvedAddresses.add(nt.toUserAccount);
        }
        for (const tt of tx.tokenTransfers || []) {
          if (tt.fromUserAccount) involvedAddresses.add(tt.fromUserAccount);
          if (tt.toUserAccount) involvedAddresses.add(tt.toUserAccount);
        }

        const monitoredWallets = await prisma.monitoredWallet.findMany({
          where: { address: { in: [...involvedAddresses] }, isActive: true },
        });

        for (const wallet of monitoredWallets) {
          const alerts = analyzeTransaction(tx, wallet.address);
          for (const alert of alerts) {
            await prisma.monitorAlert.create({
              data: {
                monitoredWalletId: wallet.id,
                type: alert.type,
                severity: alert.severity,
                title: alert.title,
                message: alert.message,
                txSignature: alert.txSignature,
              },
            });

            await sendTelegramAlert({
              type: alert.type,
              severity: alert.severity,
              title: alert.title,
              message: alert.message,
              walletAddress: alert.walletAddress,
              txSignature: alert.txSignature,
            });
          }

          // Update last signature
          await prisma.monitoredWallet.update({
            where: { id: wallet.id },
            data: { lastSignature: tx.signature, lastCheckedAt: new Date() },
          });
        }

        // Also check legacy wallet table for backward compat
        const legacyWallets = await prisma.wallet.findMany({
          where: { address: { in: [...involvedAddresses] } },
          include: { user: true },
        });

        for (const wallet of legacyWallets) {
          await prisma.alert.create({
            data: {
              userId: wallet.userId,
              walletId: wallet.id,
              type: tx.type || 'UNKNOWN',
              severity: 'MEDIUM',
              title: `Activity detected: ${tx.type}`,
              message: tx.description || `Transaction ${tx.signature} involves your wallet`,
              metadata: JSON.stringify(tx),
            },
          });
          await sendAlert(`🚨 ShieldFi Alert\nActivity detected: ${tx.type}\nWallet: ${wallet.address}\nTX: https://solscan.io/tx/${tx.signature}`);
        }
      } catch (e) {
        app.log.error(e, 'Webhook processing error');
      }
    }

    return { received: true };
  });
}

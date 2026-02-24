import { prisma } from '../db.js';
import { fetchRecentTransactions, analyzeTransaction, detectRapidTransactions } from './monitor.js';
import { sendTelegramAlert } from './telegram.js';
import type { MonitorAlert } from './monitor.js';

class MonitorManager {
  private interval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  start(intervalMs = 30000) {
    if (this.interval) return;
    console.log(`[MonitorManager] Starting polling every ${intervalMs / 1000}s`);
    this.interval = setInterval(() => this.poll(), intervalMs);
    // Run first check after 5s delay (let server finish startup)
    setTimeout(() => this.poll(), 5000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[MonitorManager] Stopped');
    }
  }

  private async poll() {
    if (this.running) return; // Skip if previous poll still running
    this.running = true;
    try {
      const wallets = await prisma.monitoredWallet.findMany({ where: { isActive: true } });
      if (wallets.length === 0) {
        this.running = false;
        return;
      }

      for (const wallet of wallets) {
        try {
          await this.checkWallet(wallet.address, wallet.id, wallet.lastSignature);
        } catch (e) {
          console.error(`[MonitorManager] Error checking ${wallet.address}:`, e);
        }
      }
    } catch (e) {
      console.error('[MonitorManager] Poll error:', e);
    } finally {
      this.running = false;
    }
  }

  async checkWallet(address: string, walletId: string, lastSignature: string | null): Promise<MonitorAlert[]> {
    const txs = await fetchRecentTransactions(address, 10);
    if (txs.length === 0) return [];

    // Filter to only new transactions
    let newTxs = txs;
    if (lastSignature) {
      const idx = txs.findIndex(tx => tx.signature === lastSignature);
      if (idx >= 0) {
        newTxs = txs.slice(0, idx);
      }
      // If lastSignature not found in results, process all (might have scrolled past)
    }

    if (newTxs.length === 0) {
      // Update lastCheckedAt even if no new txs
      await prisma.monitoredWallet.update({
        where: { id: walletId },
        data: { lastCheckedAt: new Date() },
      });
      return [];
    }

    console.log(`[MonitorManager] ${address.slice(0, 8)}...: ${newTxs.length} new transaction(s)`);

    const allAlerts: MonitorAlert[] = [];

    // Analyze each transaction
    for (const tx of newTxs) {
      const alerts = analyzeTransaction(tx, address);
      allAlerts.push(...alerts);
    }

    // Check for rapid transactions
    const rapidAlert = detectRapidTransactions(newTxs, address);
    if (rapidAlert) allAlerts.push(rapidAlert);

    // Store alerts in DB and send notifications
    for (const alert of allAlerts) {
      try {
        await prisma.monitorAlert.create({
          data: {
            monitoredWalletId: walletId,
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
      } catch (e) {
        console.error('[MonitorManager] Failed to store/send alert:', e);
      }
    }

    // Update last signature and checked time
    await prisma.monitoredWallet.update({
      where: { id: walletId },
      data: {
        lastSignature: txs[0].signature, // Most recent tx
        lastCheckedAt: new Date(),
      },
    });

    return allAlerts;
  }
}

export const monitorManager = new MonitorManager();

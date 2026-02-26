import { prisma } from '../db.js';
import { env } from '../env.js';
import { fetchRecentTransactions, analyzeTransaction, detectRapidTransactions } from './monitor.js';
import { sendTelegramAlert } from './telegram.js';
import { resolveTokenNames } from './scanner.js';
import type { MonitorAlert } from './monitor.js';

const HELIUS_WEBHOOK_API = 'https://api.helius.xyz/v0/webhooks';

class MonitorManager {
  private interval: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private webhookId: string | null = null;
  private pollingWallets = new Set<string>(); // wallets that failed webhook registration

  start(intervalMs = 120000) {
    if (this.interval) return;
    console.log(`[MonitorManager] Starting with webhook mode (polling fallback at ${intervalMs / 1000}s)`);
    this.interval = setInterval(() => this.pollFallbackWallets(), intervalMs);
    // Initialize webhook on startup
    setTimeout(() => this.initWebhook(), 5000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[MonitorManager] Stopped');
    }
  }

  private async initWebhook() {
    if (!env.HELIUS_API_KEY || !env.WEBHOOK_URL) {
      console.log('[MonitorManager] No WEBHOOK_URL configured, using polling for all wallets');
      // Fall back to polling all active wallets
      const wallets = await prisma.monitoredWallet.findMany({ where: { isActive: true } });
      for (const w of wallets) this.pollingWallets.add(w.address);
      return;
    }

    try {
      const wallets = await prisma.monitoredWallet.findMany({ where: { isActive: true } });
      const addresses = wallets.map(w => w.address);
      if (addresses.length === 0) return;

      // Check if we already have a webhook
      const existing = await this.findExistingWebhook();
      if (existing) {
        this.webhookId = existing.webhookID;
        // Update addresses
        await this.updateWebhookAddresses(addresses);
        console.log(`[MonitorManager] Updated existing webhook ${this.webhookId} with ${addresses.length} addresses`);
      } else {
        await this.createWebhook(addresses);
      }
    } catch (e) {
      console.error('[MonitorManager] Webhook init failed, falling back to polling:', e);
      const wallets = await prisma.monitoredWallet.findMany({ where: { isActive: true } });
      for (const w of wallets) this.pollingWallets.add(w.address);
    }
  }

  private async findExistingWebhook(): Promise<any | null> {
    try {
      const res = await fetch(`${HELIUS_WEBHOOK_API}?api-key=${env.HELIUS_API_KEY}`);
      if (!res.ok) return null;
      const webhooks = await res.json() as any[];
      return webhooks.find((w: any) => w.webhookURL === env.WEBHOOK_URL) || null;
    } catch {
      return null;
    }
  }

  private async createWebhook(addresses: string[]) {
    const res = await fetch(`${HELIUS_WEBHOOK_API}?api-key=${env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookURL: env.WEBHOOK_URL,
        transactionTypes: ['Any'],
        accountAddresses: addresses,
        webhookType: 'enhanced',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Webhook creation failed: ${res.status} ${text}`);
    }
    const data = await res.json() as any;
    this.webhookId = data.webhookID;
    console.log(`[MonitorManager] Created webhook ${this.webhookId} for ${addresses.length} addresses`);
  }

  private async updateWebhookAddresses(addresses: string[]) {
    if (!this.webhookId) return;
    const res = await fetch(`${HELIUS_WEBHOOK_API}/${this.webhookId}?api-key=${env.HELIUS_API_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookURL: env.WEBHOOK_URL,
        transactionTypes: ['Any'],
        accountAddresses: addresses,
        webhookType: 'enhanced',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[MonitorManager] Webhook update failed: ${res.status} ${text}`);
    }
  }

  async addWallet(address: string) {
    if (!env.WEBHOOK_URL || !env.HELIUS_API_KEY || !this.webhookId) {
      // No webhook available, add to polling
      this.pollingWallets.add(address);
      console.log(`[MonitorManager] Added ${address.slice(0, 8)}... to polling fallback`);
      return;
    }

    try {
      // Get current addresses and add new one
      const wallets = await prisma.monitoredWallet.findMany({ where: { isActive: true } });
      const addresses = [...new Set([...wallets.map(w => w.address), address])];
      await this.updateWebhookAddresses(addresses);
      this.pollingWallets.delete(address);
      console.log(`[MonitorManager] Added ${address.slice(0, 8)}... to webhook`);
    } catch (e) {
      console.error(`[MonitorManager] Failed to add ${address} to webhook, using polling:`, e);
      this.pollingWallets.add(address);
    }
  }

  async removeWallet(address: string) {
    this.pollingWallets.delete(address);
    if (!this.webhookId || !env.HELIUS_API_KEY) return;

    try {
      const wallets = await prisma.monitoredWallet.findMany({ where: { isActive: true } });
      const addresses = wallets.map(w => w.address).filter(a => a !== address);
      if (addresses.length > 0) {
        await this.updateWebhookAddresses(addresses);
      }
      console.log(`[MonitorManager] Removed ${address.slice(0, 8)}... from webhook`);
    } catch (e) {
      console.error(`[MonitorManager] Failed to remove ${address} from webhook:`, e);
    }
  }

  /** Poll only wallets that failed webhook registration */
  private async pollFallbackWallets() {
    if (this.running) return;
    this.running = true;
    try {
      if (this.pollingWallets.size === 0) {
        // If no webhook configured, poll all active wallets
        if (!this.webhookId) {
          const wallets = await prisma.monitoredWallet.findMany({ where: { isActive: true } });
          for (const wallet of wallets) {
            try {
              await this.checkWallet(wallet.address, wallet.id, wallet.lastSignature);
            } catch (e) {
              console.error(`[MonitorManager] Error checking ${wallet.address}:`, e);
            }
          }
        }
        return;
      }

      const wallets = await prisma.monitoredWallet.findMany({
        where: { isActive: true, address: { in: [...this.pollingWallets] } },
      });

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
    }

    if (newTxs.length === 0) {
      await prisma.monitoredWallet.update({
        where: { id: walletId },
        data: { lastCheckedAt: new Date() },
      });
      return [];
    }

    console.log(`[MonitorManager] ${address.slice(0, 8)}...: ${newTxs.length} new transaction(s)`);

    const allAlerts: MonitorAlert[] = [];

    const allMints = newTxs.flatMap(tx => (tx.tokenTransfers || []).map(t => t.mint)).filter(Boolean);
    const tokenNames = allMints.length > 0 ? await resolveTokenNames([...new Set(allMints)]) : new Map<string, string>();

    for (const tx of newTxs) {
      const alerts = await analyzeTransaction(tx, address, tokenNames);
      allAlerts.push(...alerts);
    }

    const rapidAlert = detectRapidTransactions(newTxs, address);
    if (rapidAlert) allAlerts.push(rapidAlert);

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

        const monWallet = await prisma.monitoredWallet.findUnique({ where: { id: walletId } });
        const chatId = monWallet?.telegramChatId || undefined;
        await sendTelegramAlert({
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          walletAddress: alert.walletAddress,
          txSignature: alert.txSignature,
        }, chatId);
      } catch (e) {
        console.error('[MonitorManager] Failed to store/send alert:', e);
      }
    }

    await prisma.monitoredWallet.update({
      where: { id: walletId },
      data: {
        lastSignature: txs[0].signature,
        lastCheckedAt: new Date(),
      },
    });

    return allAlerts;
  }
}

export const monitorManager = new MonitorManager();

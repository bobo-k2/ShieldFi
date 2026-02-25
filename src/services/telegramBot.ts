/**
 * Telegram Bot polling handler for /start commands
 * Links user's Telegram chat ID to their monitored wallet via a link code
 */

import { prisma } from '../db.js';
import { env } from '../env.js';

const POLL_INTERVAL = 3000; // 3 seconds
let lastUpdateId = 0;
let polling = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function sendMessage(chatId: string, text: string): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error('[TelegramBot] Failed to send message:', e);
  }
}

async function handleUpdate(update: any): Promise<void> {
  const msg = update.message;
  if (!msg?.text) return;

  const chatId = String(msg.chat.id);
  const text = msg.text.trim();

  // /start with link code: /start LINK_abc123
  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    
    if (parts.length >= 2 && parts[1].startsWith('LINK_')) {
      const linkCode = parts[1];
      
      // Find the monitored wallet with this link code
      const wallet = await prisma.monitoredWallet.findUnique({ where: { linkCode } });
      
      if (!wallet) {
        await sendMessage(chatId, '❌ Invalid or expired link code. Please try again from the ShieldFi dashboard.');
        return;
      }
      
      if (wallet.telegramChatId) {
        await sendMessage(chatId, `✅ This wallet is already linked to Telegram alerts.\n\n🏦 Wallet: <code>${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}</code>`);
        return;
      }
      
      // Link the chat ID
      await prisma.monitoredWallet.update({
        where: { id: wallet.id },
        data: { telegramChatId: chatId, linkCode: null },
      });
      
      const shortAddr = wallet.address.slice(0, 4) + '...' + wallet.address.slice(-4);
      await sendMessage(chatId, 
        `🛡️ <b>ShieldFi Alerts Connected!</b>\n\n` +
        `✅ You'll now receive real-time alerts for:\n` +
        `🏦 Wallet: <code>${shortAddr}</code>\n\n` +
        `Alert types:\n` +
        `🚨 Large outflows\n` +
        `⚠️ New token approvals\n` +
        `🔔 Suspicious activity\n` +
        `📥 New tokens received\n\n` +
        `To stop alerts, use the ShieldFi dashboard.`
      );
      
      console.log(`[TelegramBot] Linked chat ${chatId} to wallet ${shortAddr}`);
      return;
    }
    
    // Plain /start without code
    await sendMessage(chatId,
      `🛡️ <b>Welcome to ShieldFi!</b>\n\n` +
      `I'll send you real-time alerts when something happens with your monitored Solana wallets.\n\n` +
      `<b>To connect:</b>\n` +
      `1. Go to the ShieldFi dashboard\n` +
      `2. Scan a wallet address\n` +
      `3. Click "🔔 Start Monitoring"\n` +
      `4. Click "Connect Telegram"\n\n` +
      `That will link your alerts to this chat.`
    );
    return;
  }

  // /status
  if (text === '/status') {
    const wallets = await prisma.monitoredWallet.findMany({
      where: { telegramChatId: chatId, isActive: true },
    });
    
    if (wallets.length === 0) {
      await sendMessage(chatId, '📭 No wallets linked to this chat yet.\n\nConnect via the ShieldFi dashboard.');
      return;
    }
    
    let msg = `🛡️ <b>Your Monitored Wallets</b>\n\n`;
    for (const w of wallets) {
      const short = w.address.slice(0, 4) + '...' + w.address.slice(-4);
      const lastCheck = w.lastCheckedAt ? new Date(w.lastCheckedAt).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'Never';
      msg += `🏦 <code>${short}</code> — Last check: ${lastCheck}\n`;
    }
    await sendMessage(chatId, msg);
    return;
  }

  // /stop
  if (text === '/stop') {
    const result = await prisma.monitoredWallet.updateMany({
      where: { telegramChatId: chatId },
      data: { telegramChatId: null },
    });
    
    if (result.count > 0) {
      await sendMessage(chatId, `✅ Unlinked ${result.count} wallet(s). You won't receive alerts here anymore.`);
    } else {
      await sendMessage(chatId, '📭 No wallets were linked to this chat.');
    }
    return;
  }

  // Unknown
  await sendMessage(chatId,
    `🛡️ <b>ShieldFi Bot</b>\n\n` +
    `Commands:\n` +
    `/start — Get started\n` +
    `/status — View monitored wallets\n` +
    `/stop — Unlink all wallets`
  );
}

async function pollUpdates(): Promise<void> {
  if (polling || !env.TELEGRAM_BOT_TOKEN) return;
  polling = true;
  
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=1&limit=10`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (!res.ok) { polling = false; return; }
    
    const data = await res.json() as any;
    const updates = data.result || [];
    
    for (const update of updates) {
      lastUpdateId = update.update_id;
      try {
        await handleUpdate(update);
      } catch (e) {
        console.error('[TelegramBot] Error handling update:', e);
      }
    }
  } catch {
    // Timeout or network error — silent
  } finally {
    polling = false;
  }
}

export function startTelegramBot(): void {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log('[TelegramBot] No bot token configured, skipping');
    return;
  }
  
  console.log('[TelegramBot] Starting bot polling');
  pollTimer = setInterval(pollUpdates, POLL_INTERVAL);
  // Initial poll after 2s
  setTimeout(pollUpdates, 2000);
}

export function stopTelegramBot(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

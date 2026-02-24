import { env } from '../env.js';

export interface AlertPayload {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  walletAddress: string;
  txSignature?: string;
}

function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function severityEmoji(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return '🚨';
    case 'WARNING': return '⚠️';
    case 'INFO': return 'ℹ️';
    default: return '🔔';
  }
}

export function formatAlertMessage(alert: AlertPayload): string {
  const emoji = severityEmoji(alert.severity);
  const shortWallet = alert.walletAddress.slice(0, 4) + '\\.\\.\\.' + alert.walletAddress.slice(-4);
  const time = escapeMarkdownV2(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');

  let msg = `${emoji} *${escapeMarkdownV2(alert.severity)}: ${escapeMarkdownV2(alert.title)}*\n\n`;
  msg += `🏦 Wallet: \`${escapeMarkdownV2(alert.walletAddress)}\`\n`;
  msg += `${escapeMarkdownV2(alert.message)}\n\n`;
  msg += `⏰ ${time}`;

  if (alert.txSignature) {
    msg += `\n🔗 [View on Solscan](https://solscan.io/tx/${alert.txSignature})`;
  }

  return msg;
}

export async function sendTelegramAlert(alert: AlertPayload, chatId?: string): Promise<boolean> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || env.TELEGRAM_CHAT_ID;

  const formatted = formatAlertMessage(alert);

  if (!token || !chat) {
    console.log('[ShieldFi Alert - Console Fallback]');
    console.log(`  ${severityEmoji(alert.severity)} ${alert.severity}: ${alert.title}`);
    console.log(`  Wallet: ${alert.walletAddress}`);
    console.log(`  ${alert.message}`);
    if (alert.txSignature) console.log(`  TX: https://solscan.io/tx/${alert.txSignature}`);
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: formatted,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Telegram API error:', err);
      // Fallback: try without markdown
      const plainText = `${severityEmoji(alert.severity)} ${alert.severity}: ${alert.title}\n\nWallet: ${alert.walletAddress}\n${alert.message}${alert.txSignature ? `\n\nhttps://solscan.io/tx/${alert.txSignature}` : ''}`;
      const res2 = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: plainText }),
      });
      return res2.ok;
    }
    return true;
  } catch (e) {
    console.error('Telegram send failed:', e);
    return false;
  }
}

// Keep backward compat
export async function sendAlert(message: string, chatId?: string): Promise<boolean> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || env.TELEGRAM_CHAT_ID;
  if (!token || !chat) { console.log('[Telegram fallback]', message); return false; }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: message, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch { return false; }
}

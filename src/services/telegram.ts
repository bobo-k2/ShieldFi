import { env } from '../env.js';

export async function sendAlert(message: string, chatId?: string): Promise<boolean> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || env.TELEGRAM_CHAT_ID;

  if (!token || !chat) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: message, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

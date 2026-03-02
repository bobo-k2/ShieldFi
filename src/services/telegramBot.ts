import TelegramBot from 'node-telegram-bot-api';
import { PublicKey } from '@solana/web3.js';
import { APP } from '../config';
import { prisma } from '../db.js';
const APP_NAME = APP.name;

let bot: TelegramBot | null = null;

function isValidSolanaAddress(addr: string): boolean {
  try {
    new PublicKey(addr);
    return addr.length >= 32 && addr.length <= 44;
  } catch {
    return false;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function riskEmoji(level: string): string {
  const map: Record<string, string> = {
    'SAFE': '🟢', 'LOW': '🟡', 'MEDIUM': '🟠', 'HIGH': '🔴', 'CRITICAL': '⛔'
  };
  return map[level?.toUpperCase()] || '⚪';
}

function classEmoji(cls: string): string {
  const map: Record<string, string> = {
    'verified': '✅', 'unknown': '❓', 'suspicious': '⚠️'
  };
  return map[cls?.toLowerCase()] || '❓';
}

export function startTelegramBot() {
  const baseUrl = `http://127.0.0.1:${process.env.PORT || 3001}`;
  startPublicBot(baseUrl);
}

function startPublicBot(baseUrl: string) {
  const token = process.env.TELEGRAM_PUBLIC_BOT_TOKEN;
  if (!token) {
    console.log('[TG-Bot] No TELEGRAM_PUBLIC_BOT_TOKEN, skipping public bot');
    return;
  }

  bot = new TelegramBot(token, { polling: true });
  console.log(`[TG-Bot] ${APP_NAME} public bot started`);

  // /start (with optional deep link parameter for Telegram linking)
  bot.onText(/\/start\s*(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const param = match?.[1]?.trim();

    // Handle deep link for wallet monitoring
    if (param && param.startsWith('LINK_')) {
      try {
        const wallet = await prisma.monitoredWallet.findFirst({
          where: { linkCode: param, isActive: true },
        });

        if (wallet) {
          await prisma.monitoredWallet.update({
            where: { id: wallet.id },
            data: { telegramChatId: String(chatId), linkCode: null },
          });
          bot!.sendMessage(chatId,
            `✅ <b>Telegram linked!</b>\n\n` +
            `Wallet: <code>${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}</code>\n\n` +
            `You'll now receive real-time alerts here when we detect:\n` +
            `• Suspicious incoming tokens\n` +
            `• Risky token approvals\n` +
            `• Unusual transaction activity\n\n` +
            `🔗 <a href="https://shieldfi.app/dashboard.html?address=${wallet.address}">View dashboard</a>`,
            { parse_mode: 'HTML', disable_web_page_preview: true }
          );
          return;
        } else {
          bot!.sendMessage(chatId,
            `❌ Link code expired or invalid. Please try "Connect Telegram" again from the dashboard.`,
          );
          return;
        }
      } catch (err: any) {
        console.error('[TG-Bot] Link error:', err.message);
        bot!.sendMessage(chatId, `❌ Something went wrong linking your wallet. Please try again.`);
        return;
      }
    }

    // Default welcome
    bot!.sendMessage(chatId, 
      `🛡️ <b>Welcome to ${APP_NAME}!</b>\n\n` +
      `I'm your Solana wallet security guardian.\n\n` +
      `<b>Commands:</b>\n` +
      `/scan &lt;address&gt; — Full wallet security scan\n` +
      `/risk &lt;token_mint&gt; — Check a specific token\n` +
      `/help — Show this message\n\n` +
      `Or just paste any Solana address and I'll scan it!\n\n` +
      `🔗 <a href="https://shieldfi.app">shieldfi.app</a>`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );
  });

  // /help
  bot.onText(/\/help/, (msg) => {
    bot!.sendMessage(msg.chat.id,
      `🛡️ <b>${APP_NAME} Bot Commands</b>\n\n` +
      `/scan &lt;address&gt; — Full wallet security scan\n` +
      `  • Token balances & classification\n` +
      `  • Risk scoring\n` +
      `  • Suspicious token detection\n` +
      `  • Fake token flagging\n\n` +
      `/risk &lt;token_mint&gt; — Token risk analysis\n` +
      `  • Mint/freeze authority checks\n` +
      `  • Impersonation detection\n` +
      `  • Contract risk score\n\n` +
      `Or just paste a Solana address directly!\n\n` +
      `🔗 <a href="https://shieldfi.app">Full dashboard at shieldfi.app</a>`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );
  });

  // /scan <address>
  bot.onText(/\/scan\s+(\S+)/, async (msg, match) => {
    if (!match) return;
    const chatId = msg.chat.id;
    const address = match[1];

    if (!isValidSolanaAddress(address)) {
      bot!.sendMessage(chatId, '❌ Invalid Solana address. Please check and try again.');
      return;
    }

    await doScan(chatId, address, baseUrl);
  });

  // /risk <mint>
  bot.onText(/\/risk\s+(\S+)/, async (msg, match) => {
    if (!match) return;
    const chatId = msg.chat.id;
    const mint = match[1];

    if (!isValidSolanaAddress(mint)) {
      bot!.sendMessage(chatId, '❌ Invalid token mint address.');
      return;
    }

    await doTokenRisk(chatId, mint, baseUrl);
  });

  // Plain address (no command)
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const text = msg.text.trim();
    if (isValidSolanaAddress(text)) {
      await doScan(msg.chat.id, text, baseUrl);
    }
  });
}

async function doScan(chatId: number, address: string, baseUrl: string) {
  const waiting = await bot!.sendMessage(chatId, '🔍 Scanning wallet...');

  try {
    // Fetch both endpoints in parallel
    const [balRes, riskRes] = await Promise.all([
      fetch(`${baseUrl}/api/approvals/lookup?address=${address}`),
      fetch(`${baseUrl}/api/risk/wallet?address=${address}`)
    ]);

    const balData = balRes.ok ? await balRes.json() as any : null;
    const riskData = riskRes.ok ? await riskRes.json() as any : null;

    const balances = balData?.balances || [];
    const riskLevel = riskData?.level || 'UNKNOWN';
    const riskScore = riskData?.overallScore;
    const tokenReports = riskData?.tokenReports || [];

    // Calculate totals from balances
    const solToken = balances.find((b: any) => b.mint === 'native' || b.symbol === 'SOL');
    const solBalance = solToken?.balance || 0;
    const totalValueUsd = balances.reduce((sum: number, b: any) => sum + (b.usdValue || 0), 0);
    const nonSolTokens = balances.filter((b: any) => b.mint !== 'native');

    // Classify from balances status field
    const verified = nonSolTokens.filter((t: any) => t.status === 'verified');
    const unknown = nonSolTokens.filter((t: any) => t.status === 'unknown');
    const suspicious = nonSolTokens.filter((t: any) => t.status === 'suspicious');

    // Find high-risk tokens from risk analysis
    const highRisk = tokenReports.filter((t: any) => t.level === 'HIGH' || t.level === 'CRITICAL');

    let msg = `🛡️ <b>${APP_NAME} Wallet Scan</b>\n\n`;
    msg += `📍 <code>${address.slice(0, 6)}...${address.slice(-4)}</code>\n`;
    msg += `${riskEmoji(riskLevel)} <b>Risk Level: ${riskLevel}</b>`;
    if (riskScore !== undefined) msg += ` (${riskScore}/100)`;
    msg += `\n`;
    msg += `💰 Total Value: $${totalValueUsd.toFixed(2)}\n`;
    msg += `◎ SOL: ${Number(solBalance).toFixed(4)}\n\n`;

    msg += `📊 <b>Tokens:</b> ${nonSolTokens.length} total\n`;
    if (verified.length) msg += `  ✅ Verified: ${verified.length}\n`;
    if (unknown.length) msg += `  ❓ Unknown: ${unknown.length}\n`;
    if (suspicious.length) msg += `  ⚠️ Suspicious: ${suspicious.length}\n`;

    if (highRisk.length > 0) {
      msg += `\n🚨 <b>High-Risk Tokens:</b>\n`;
      for (const t of highRisk.slice(0, 5)) {
        const topFlag = t.flags?.find((f: any) => f.severity === 'danger') || t.flags?.[0];
        const flagText = topFlag?.signal || topFlag?.category || '';
        msg += `  • ${escapeHtml(t.symbol || 'Unknown')} — ${escapeHtml(flagText)}\n`;
      }
      if (highRisk.length > 5) msg += `  ... and ${highRisk.length - 5} more\n`;
    } else if (suspicious.length > 0) {
      msg += `\n⚠️ <b>Suspicious Tokens:</b>\n`;
      for (const t of suspicious.slice(0, 5)) {
        msg += `  • ${escapeHtml(t.symbol || t.name || 'Unknown')}`;
        if (t.usdValue) msg += ` ($${t.usdValue.toFixed(2)})`;
        msg += `\n`;
      }
      if (suspicious.length > 5) msg += `  ... and ${suspicious.length - 5} more\n`;
    }

    msg += `\n🔗 <a href="https://shieldfi.app/dashboard.html?address=${address}">Full scan on shieldfi.app</a>`;

    await bot!.editMessageText(msg, {
      chat_id: chatId,
      message_id: waiting.message_id,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

  } catch (err: any) {
    await bot!.editMessageText(
      `❌ Scan failed: ${err.message || 'Unknown error'}\n\nTry the web app: https://shieldfi.app`,
      { chat_id: chatId, message_id: waiting.message_id, disable_web_page_preview: true }
    );
  }
}

async function doTokenRisk(chatId: number, mint: string, baseUrl: string) {
  const waiting = await bot!.sendMessage(chatId, '🔍 Analyzing token...');

  try {
    const res = await fetch(`${baseUrl}/api/risk/token/${mint}`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json() as any;

    let msg = `🛡️ <b>${APP_NAME} Token Analysis</b>\n\n`;
    msg += `📍 <code>${mint.slice(0, 6)}...${mint.slice(-4)}</code>\n`;
    
    if (data.name) msg += `📛 ${escapeHtml(data.name)}`;
    if (data.symbol) msg += ` (${escapeHtml(data.symbol)})`;
    msg += `\n`;

    const level = data.level || data.riskLevel || 'UNKNOWN';
    const score = data.overallScore ?? data.riskScore;
    msg += `${riskEmoji(level)} <b>Risk: ${level}</b>\n`;
    if (score !== undefined) msg += `📊 Score: ${score}/100\n\n`;

    if (data.flags && data.flags.length) {
      msg += `<b>⚠️ Risk Factors:</b>\n`;
      for (const f of data.flags.slice(0, 8)) {
        msg += `  • ${escapeHtml(typeof f === 'string' ? f : (f.description || f.type || JSON.stringify(f)))}\n`;
      }
    }

    if (data.metadata?.isFake) {
      msg += `\n🚨 <b>FAKE TOKEN</b> — impersonating ${escapeHtml(data.metadata.impersonating || 'a verified token')}\n`;
    }

    msg += `\n🔗 <a href="https://solscan.io/token/${mint}">View on Solscan</a>`;

    await bot!.editMessageText(msg, {
      chat_id: chatId,
      message_id: waiting.message_id,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

  } catch (err: any) {
    await bot!.editMessageText(
      `❌ Analysis failed: ${err.message || 'Unknown error'}`,
      { chat_id: chatId, message_id: waiting.message_id }
    );
  }
}

export function stopPublicBot() {
  if (bot) {
    bot.stopPolling();
    bot = null;
  }
}

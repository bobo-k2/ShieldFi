import { prisma } from '../db.js';

const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export async function checkSubscriptionExpiry() {
  try {
    await sendPreExpiryNotifications();
    await updateExpiredStatuses();
  } catch (err) {
    console.error('[SubExpiry] Error during expiry check:', err);
  }
}

async function sendPreExpiryNotifications() {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * ONE_DAY_MS);
  const oneDayFromNow = new Date(now.getTime() + ONE_DAY_MS);

  // Find active subscriptions expiring within 3 days
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: 'active',
      expiresAt: { lte: threeDaysFromNow },
    },
  });

  for (const sub of expiringSoon) {
    const msUntilExpiry = sub.expiresAt.getTime() - now.getTime();

    if (msUntilExpiry <= ONE_DAY_MS && msUntilExpiry > 0) {
      // Expires within 1 day
      await sendNotificationIfNew(sub, '1day', `Your ${sub.plan} plan expires tomorrow!`);
    } else if (msUntilExpiry <= 3 * ONE_DAY_MS && msUntilExpiry > ONE_DAY_MS) {
      // Expires within 3 days
      await sendNotificationIfNew(sub, '3day', `Your ${sub.plan} plan expires in 3 days. Renew to keep access.`);
    }
  }

  // Grace period subscriptions - notify 1 day before grace ends
  const graceEnding = await prisma.subscription.findMany({
    where: { status: 'grace' },
  });

  for (const sub of graceEnding) {
    const graceEndTime = sub.expiresAt.getTime() + GRACE_PERIOD_MS;
    const msUntilGraceEnd = graceEndTime - now.getTime();

    if (msUntilGraceEnd <= ONE_DAY_MS && msUntilGraceEnd > 0) {
      await sendNotificationIfNew(sub, 'grace_ending', `Your grace period ends tomorrow. Renew now to avoid losing access.`);
    }
  }
}

async function updateExpiredStatuses() {
  const now = new Date();

  // Active subscriptions that have passed expiresAt -> grace
  const newlyExpired = await prisma.subscription.findMany({
    where: {
      status: 'active',
      expiresAt: { lte: now },
    },
  });

  for (const sub of newlyExpired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'grace' },
    });
    await sendNotificationIfNew(sub, 'expired', `Your ${sub.plan} plan has expired. You have 3 days of grace access.`);
    console.log(`[SubExpiry] ${sub.walletAddress} moved to grace period`);
  }

  // Grace subscriptions past the 3-day grace period -> expired
  const graceExpired = await prisma.subscription.findMany({
    where: { status: 'grace' },
  });

  for (const sub of graceExpired) {
    const graceEnd = new Date(sub.expiresAt.getTime() + GRACE_PERIOD_MS);
    if (now >= graceEnd) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      });
      console.log(`[SubExpiry] ${sub.walletAddress} expired (grace period over)`);
    }
  }
}

async function sendNotificationIfNew(
  sub: { id: string; walletAddress: string; lastNotificationType: string | null },
  notificationType: string,
  message: string
) {
  // Dedup: don't send the same notification type twice
  if (sub.lastNotificationType === notificationType) return;

  // Find linked Telegram chat
  const monitoredWallet = await prisma.monitoredWallet.findUnique({
    where: { address: sub.walletAddress },
  });

  if (monitoredWallet?.telegramChatId) {
    try {
      await sendTelegramMessage(monitoredWallet.telegramChatId, `🛡️ ${message}`);
    } catch (err) {
      console.error(`[SubExpiry] Failed to send Telegram notification to ${sub.walletAddress}:`, err);
    }
  }

  // Update notification tracking
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      lastNotifiedAt: new Date(),
      lastNotificationType: notificationType,
    },
  });
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_PUBLIC_BOT_TOKEN;
  if (!token) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

export function startExpiryChecker() {
  console.log('[SubExpiry] Starting subscription expiry checker (every 1 hour)');
  // Run immediately on startup
  checkSubscriptionExpiry();
  // Then every hour
  intervalHandle = setInterval(checkSubscriptionExpiry, CHECK_INTERVAL_MS);
}

export function stopExpiryChecker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

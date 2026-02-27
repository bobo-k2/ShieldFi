import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

const VALID_TYPES = ['scan', 'connect', 'lookup', 'page_view'];
const RATE_LIMIT_MS = 10_000;
const recentEvents = new Map<string, number>(); // key: ip:type -> timestamp

// Cleanup old entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of recentEvents) {
    if (now - v > RATE_LIMIT_MS * 2) recentEvents.delete(k);
  }
}, 60_000);

let statsCache: { data: any; ts: number } | null = null;

export async function analyticsRoutes(app: FastifyInstance) {
  app.post('/api/events', async (req, reply) => {
    const { type, address } = req.body as any;
    if (!type || !VALID_TYPES.includes(type)) {
      return reply.status(400).send({ error: 'Invalid event type' });
    }

    const ip = req.ip;
    const key = `${ip}:${type}`;
    const now = Date.now();
    const last = recentEvents.get(key);
    if (last && now - last < RATE_LIMIT_MS) {
      return reply.status(429).send({ error: 'Rate limited' });
    }
    recentEvents.set(key, now);

    await prisma.event.create({
      data: { type, address: address || null, ip },
    });

    // Invalidate stats cache on scan events so counter updates immediately
    if (type === 'scan' || type === 'lookup') statsCache = null;

    return { ok: true };
  });

  app.get('/api/stats', async (_req, reply) => {
    const now = Date.now();
    if (statsCache && now - statsCache.ts < 60_000) {
      return statsCache.data;
    }

    const twentyFourHoursAgo = new Date(now - 86_400_000);

    const scanTypes = { type: { in: ['scan', 'lookup'] } };
    const [totalScans, totalWallets, scanLast24h] = await Promise.all([
      prisma.event.count({ where: scanTypes }),
      prisma.event.groupBy({ by: ['address'], where: { ...scanTypes, address: { not: null } } }).then(r => r.length),
      prisma.event.count({ where: { ...scanTypes, createdAt: { gte: twentyFourHoursAgo } } }),
    ]);

    const data = { totalScans, totalWallets, scanLast24h };
    statsCache = { data, ts: now };
    return data;
  });
}

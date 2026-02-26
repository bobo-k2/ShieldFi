import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db.js';

const PLAN_RANK: Record<string, number> = { free: 0, guardian: 1, sentinel: 2 };
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export async function getPlan(walletAddress: string): Promise<'free' | 'guardian' | 'sentinel'> {
  const sub = await prisma.subscription.findUnique({ where: { walletAddress } });
  if (!sub) return 'free';

  const now = new Date();
  if (sub.status === 'active' && sub.expiresAt > now) {
    return sub.plan as 'guardian' | 'sentinel';
  }

  // Grace period
  if (sub.expiresAt <= now && (now.getTime() - sub.expiresAt.getTime()) < GRACE_PERIOD_MS) {
    return sub.plan as 'guardian' | 'sentinel';
  }

  return 'free';
}

export function requirePlan(minPlan: 'guardian' | 'sentinel') {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    let wallet: string | undefined;

    // Try JWT first
    try {
      const decoded = await request.jwtVerify<{ wallet: string }>();
      wallet = decoded.wallet;
    } catch {
      // Try query param
      wallet = (request.query as any)?.wallet;
    }

    if (!wallet) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const plan = await getPlan(wallet);
    if (PLAN_RANK[plan] < PLAN_RANK[minPlan]) {
      return reply.status(403).send({
        error: 'Upgrade required',
        currentPlan: plan,
        requiredPlan: minPlan,
        upgradeUrl: '/pricing.html',
      });
    }
  };
}

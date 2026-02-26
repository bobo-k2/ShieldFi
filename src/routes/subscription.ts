import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { getPlan } from '../middleware/planCheck.js';

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

const PLANS = {
  guardian: {
    name: 'Guardian',
    priceSol: 0.04,
    priceUsdc: 7,
    features: ['Real-time monitoring (3 wallets)', 'Telegram & Discord alerts', 'Transaction history', 'Portfolio risk dashboard', 'Priority scanning'],
  },
  sentinel: {
    name: 'Sentinel',
    priceSol: 0.11,
    priceUsdc: 19,
    features: ['Everything in Guardian', 'Up to 10 monitored wallets', 'Weekly AI threat briefings', 'One-click approval revocation', 'API access', 'Early access to new features'],
  },
};

export async function subscriptionRoutes(app: FastifyInstance) {
  // GET /api/subscription/plans
  app.get('/api/subscription/plans', async () => {
    return {
      plans: {
        free: {
          name: 'Free',
          price: 0,
          features: ['Scan any wallet (unlimited)', 'Basic risk score & classification', 'AI contract analysis', 'No account needed'],
        },
        ...PLANS,
      },
      treasury: env.SHIELD_TREASURY,
      usdcMint: USDC_MINT,
    };
  });

  // GET /api/subscription/status
  app.get<{ Querystring: { wallet: string } }>('/api/subscription/status', async (request, reply) => {
    const { wallet } = request.query;
    if (!wallet) return reply.status(400).send({ error: 'wallet query param required' });

    const plan = await getPlan(wallet);
    const sub = await prisma.subscription.findUnique({ where: { walletAddress: wallet } });

    return {
      plan,
      subscription: sub ? {
        plan: sub.plan,
        status: sub.status,
        expiresAt: sub.expiresAt,
        startsAt: sub.startsAt,
      } : null,
    };
  });

  // POST /api/subscription/verify
  app.post<{ Body: { walletAddress: string; txSignature: string; plan: string } }>(
    '/api/subscription/verify',
    async (request, reply) => {
      const { walletAddress, txSignature, plan } = request.body;

      if (!walletAddress || !txSignature || !plan) {
        return reply.status(400).send({ error: 'walletAddress, txSignature, plan required' });
      }
      if (plan !== 'guardian' && plan !== 'sentinel') {
        return reply.status(400).send({ error: 'Invalid plan. Must be guardian or sentinel' });
      }
      if (!env.SHIELD_TREASURY) {
        return reply.status(500).send({ error: 'Treasury wallet not configured' });
      }

      // Check if TX already used
      const existing = await prisma.subscription.findFirst({ where: { txSignature } });
      if (existing) {
        return reply.status(400).send({ error: 'Transaction already used' });
      }

      // Verify on-chain
      try {
        const txData = await fetchTransaction(txSignature);
        if (!txData) {
          return reply.status(400).send({ error: 'Transaction not found' });
        }

        const verification = verifyPayment(txData, plan, walletAddress);
        if (!verification.valid) {
          return reply.status(400).send({ error: verification.reason });
        }

        // Create/update subscription
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const sub = await prisma.subscription.upsert({
          where: { walletAddress },
          update: {
            plan,
            status: 'active',
            txSignature,
            paymentMint: verification.mint,
            amountPaid: verification.amount,
            startsAt: new Date(),
            expiresAt,
          },
          create: {
            walletAddress,
            plan,
            status: 'active',
            txSignature,
            paymentMint: verification.mint,
            amountPaid: verification.amount,
            expiresAt,
          },
        });

        return { success: true, subscription: { plan: sub.plan, expiresAt: sub.expiresAt } };
      } catch (err: any) {
        app.log.error(err, 'Subscription verification failed');
        return reply.status(500).send({ error: 'Verification failed: ' + (err.message || 'unknown') });
      }
    }
  );
}

async function fetchTransaction(signature: string): Promise<any> {
  const response = await fetch(env.SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
    }),
  });
  const json = await response.json() as any;
  return json.result;
}

function verifyPayment(txData: any, plan: string, walletAddress: string): { valid: boolean; reason?: string; mint?: string; amount?: number } {
  const planConfig = PLANS[plan as keyof typeof PLANS];
  const treasury = env.SHIELD_TREASURY.toLowerCase();

  // Check TX was successful
  if (txData.meta?.err) {
    return { valid: false, reason: 'Transaction failed on-chain' };
  }

  const instructions = txData.transaction?.message?.instructions || [];

  // Check for SOL transfer (system program transfer)
  for (const ix of instructions) {
    if (ix.program === 'system' && ix.parsed?.type === 'transfer') {
      const info = ix.parsed.info;
      if (info.destination?.toLowerCase() === treasury && info.source?.toLowerCase() === walletAddress.toLowerCase()) {
        const solAmount = info.lamports / 1e9;
        if (solAmount >= planConfig.priceSol * 0.98) { // 2% tolerance
          return { valid: true, mint: SOL_MINT, amount: solAmount };
        }
        return { valid: false, reason: `Insufficient SOL amount. Expected ${planConfig.priceSol}, got ${solAmount}` };
      }
    }
  }

  // Check for USDC transfer (SPL token transfer)
  for (const ix of instructions) {
    if (ix.program === 'spl-token' && (ix.parsed?.type === 'transfer' || ix.parsed?.type === 'transferChecked')) {
      const info = ix.parsed.info;
      const amount = parseFloat(info.amount || info.tokenAmount?.uiAmountString || '0');
      const uiAmount = info.tokenAmount?.uiAmount ?? amount / 1e6;

      // For transferChecked, verify mint is USDC
      if (info.mint && info.mint !== USDC_MINT) continue;

      if (uiAmount >= planConfig.priceUsdc * 0.98) {
        return { valid: true, mint: USDC_MINT, amount: uiAmount };
      }
    }
  }

  return { valid: false, reason: 'No valid payment found to treasury wallet' };
}

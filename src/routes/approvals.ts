import { FastifyInstance } from 'fastify';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createRevokeInstruction, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { requireAuth } from '../middleware/auth.js';
import { scanWalletApprovals, lookupWalletApprovals } from '../services/scanner.js';

// Public routes — no auth
export async function approvalPublicRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { address: string } }>('/api/approvals/lookup', async (request, reply) => {
    try {
      const { address } = request.query;
      if (!address) return reply.status(400).send({ error: 'address query param required' });
      
      try { new PublicKey(address); } catch { return reply.status(400).send({ error: 'Invalid Solana address' }); }

      const results = await lookupWalletApprovals(address);
      return { address, approvals: results.approvals, balances: results.balances, walletScore: results.walletScore };
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Lookup failed: ' + err.message });
    }
  });
}

// Protected routes — auth required
export async function approvalRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireAuth);

  app.get('/api/approvals', async (request) => {
    try {
      const { sub } = request.user as { sub: string };
      const wallets = await prisma.wallet.findMany({ where: { userId: sub }, select: { id: true } });
      const walletIds = wallets.map((w) => w.id);
      const approvals = await prisma.approval.findMany({
        where: { walletId: { in: walletIds } },
        orderBy: { createdAt: 'desc' },
      });

      // Get latest risk score
      const riskScores = await prisma.riskScore.findMany({
        where: { walletId: { in: walletIds } },
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      });
      const walletScore = riskScores[0]?.score ?? 0;

      return { approvals, walletScore };
    } catch (err: any) {
      app.log.error(err);
      return { approvals: [], walletScore: 0 };
    }
  });

  app.post('/api/approvals/scan', async (request, reply) => {
    try {
      const { sub, wallet } = request.user as { sub: string; wallet: string };
      // Scan all wallets for this user
      const wallets = await prisma.wallet.findMany({ where: { userId: sub } });
      let allApprovals: any[] = [];
      let walletScore = 0;
      for (const w of wallets) {
        const results = await scanWalletApprovals(w.address);
        allApprovals.push(...results.approvals);
        walletScore = Math.max(walletScore, results.walletScore);
      }

      return { scanned: true, approvals: allApprovals, walletScore };
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Scan failed: ' + err.message });
    }
  });

  app.post<{ Params: { id: string } }>('/api/approvals/:id/revoke', async (request, reply) => {
    try {
      const { id } = request.params;
      const approval = await prisma.approval.findUnique({
        where: { id },
        include: { wallet: true },
      });
      if (!approval) return reply.status(404).send({ error: 'Not found' });

      const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
      const ownerPubkey = new PublicKey(approval.wallet.address);
      const mintPubkey = new PublicKey(approval.tokenMint);

      // Get the token account address
      const tokenAccount = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);

      const tx = new Transaction();
      tx.add(createRevokeInstruction(tokenAccount, ownerPubkey, [], TOKEN_PROGRAM_ID));

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = ownerPubkey;

      const serialized = tx.serialize({ requireAllSignatures: false }).toString('base64');

      return { transaction: serialized, approvalId: id };
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to build revoke transaction: ' + err.message });
    }
  });
}

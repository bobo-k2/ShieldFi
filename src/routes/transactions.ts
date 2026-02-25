import { FastifyInstance } from 'fastify';
import { PublicKey } from '@solana/web3.js';
import { env } from '../env.js';

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/api/transactions/:address', async (request, reply) => {
    const { address } = request.params as { address: string };
    const { limit: rawLimit } = request.query as { limit?: string };
    const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 50);

    // Validate address
    try { new PublicKey(address); } catch { return reply.status(400).send({ error: 'Invalid Solana address' }); }

    if (!env.HELIUS_API_KEY) {
      return reply.status(500).send({ error: 'Helius API key not configured' });
    }

    try {
      const url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(address)}/transactions?api-key=${env.HELIUS_API_KEY}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        return reply.status(res.status).send({ error: `Helius API error: ${text}` });
      }
      const transactions = await res.json();
      return { transactions };
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || 'Failed to fetch transactions' });
    }
  });
}

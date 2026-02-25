import { FastifyInstance } from 'fastify';
import { PublicKey } from '@solana/web3.js';
import { analyzeTokenRisk, analyzeWalletRisk } from '../services/contractRisk.js';
import { lookupWalletApprovals } from '../services/scanner.js';

export async function riskAnalysisRoutes(app: FastifyInstance) {
  // Analyze a single token
  app.get<{ Params: { mint: string } }>('/api/risk/token/:mint', async (request, reply) => {
    try {
      const { mint } = request.params;
      try { new PublicKey(mint); } catch { return reply.status(400).send({ error: 'Invalid mint address' }); }
      const report = await analyzeTokenRisk(mint);
      return report;
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Analysis failed: ' + err.message });
    }
  });

  // Full wallet risk analysis
  app.get<{ Querystring: { address: string } }>('/api/risk/wallet', async (request, reply) => {
    try {
      const { address } = request.query;
      if (!address) return reply.status(400).send({ error: 'address query param required' });
      try { new PublicKey(address); } catch { return reply.status(400).send({ error: 'Invalid Solana address' }); }

      // First get wallet data
      const walletData = await lookupWalletApprovals(address);

      // Then run deep risk analysis
      const analysis = await analyzeWalletRisk(
        address,
        walletData.balances,
        walletData.approvals,
      );

      return {
        address,
        ...analysis,
      };
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Analysis failed: ' + err.message });
    }
  });
}

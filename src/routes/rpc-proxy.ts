import { FastifyInstance } from 'fastify';
import { env } from '../env.js';

export async function rpcProxyRoutes(app: FastifyInstance) {
  // Proxy JSON-RPC requests to Helius (hides API key from frontend)
  app.post('/api/rpc', async (request, reply) => {
    try {
      const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return reply.status(502).send({ error: 'RPC proxy error: ' + e.message });
    }
  });
}

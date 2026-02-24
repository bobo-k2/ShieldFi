import { FastifyInstance } from 'fastify';
import { randomBytes } from 'crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { prisma } from '../db.js';
import type { AuthNonceRequest, AuthVerifyRequest } from '../types.js';

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: AuthNonceRequest }>('/api/auth/nonce', async (request, reply) => {
    const { wallet } = request.body;
    if (!wallet) return reply.status(400).send({ error: 'wallet required' });

    const nonce = randomBytes(32).toString('hex');

    await prisma.user.upsert({
      where: { primaryWallet: wallet },
      update: { nonce },
      create: { primaryWallet: wallet, nonce, wallets: { create: { address: wallet } } },
    });

    return { nonce };
  });

  app.post<{ Body: AuthVerifyRequest }>('/api/auth/verify', async (request, reply) => {
    const { wallet, signature, nonce } = request.body;
    if (!wallet || !signature || !nonce) {
      return reply.status(400).send({ error: 'wallet, signature, nonce required' });
    }

    const user = await prisma.user.findUnique({ where: { primaryWallet: wallet } });
    if (!user || user.nonce !== nonce) {
      return reply.status(401).send({ error: 'Invalid nonce' });
    }

    // Verify signature
    const message = new TextEncoder().encode(
      `Sign this message to authenticate with ShieldFi.\n\nNonce: ${nonce}`
    );
    const sig = bs58.decode(signature);
    const pubkey = bs58.decode(wallet);
    const valid = nacl.sign.detached.verify(message, sig, pubkey);

    if (!valid) {
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    // Clear nonce
    await prisma.user.update({ where: { id: user.id }, data: { nonce: null } });

    const token = app.jwt.sign({ sub: user.id, wallet });
    return { token };
  });
}

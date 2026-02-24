import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { scoreApproval } from './risk.js';

const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

async function fetchTokenMetadata(mint: string): Promise<{ symbol?: string; icon?: string }> {
  if (!env.HELIUS_API_KEY) return {};
  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAsset',
        params: { id: mint },
      }),
    });
    const json = await res.json() as any;
    const content = json?.result?.content;
    const symbol = content?.metadata?.symbol || json?.result?.token_info?.symbol;
    const icon = content?.links?.image || content?.files?.[0]?.uri;
    return { symbol: symbol || undefined, icon: icon || undefined };
  } catch {
    return {};
  }
}

async function scanTokenProgram(
  connection: Connection,
  owner: PublicKey,
  programId: PublicKey,
  walletId: string,
) {
  const tokenAccounts = await connection.getTokenAccountsByOwner(owner, { programId });
  const approvals = [];

  for (const { account } of tokenAccounts.value) {
    const data = AccountLayout.decode(account.data);
    if (data.delegateOption === 0) continue;

    const mint = new PublicKey(data.mint).toBase58();
    const spender = new PublicKey(data.delegate).toBase58();
    const delegatedAmount = data.delegatedAmount.toString();
    const balance = data.amount.toString();
    const isUnlimited = BigInt(delegatedAmount) >= BigInt('18446744073709551615');

    const risk = scoreApproval({ amount: delegatedAmount, balance, isUnlimited, grantedAt: null });
    const meta = await fetchTokenMetadata(mint);

    const approval = await prisma.approval.upsert({
      where: { walletId_tokenMint_spender: { walletId, tokenMint: mint, spender } },
      update: {
        amount: delegatedAmount,
        isUnlimited,
        riskLevel: risk.level,
        riskFlags: JSON.stringify(risk.flags),
        tokenSymbol: meta.symbol || undefined,
        tokenIcon: meta.icon || undefined,
        lastScanned: new Date(),
      },
      create: {
        walletId,
        tokenMint: mint,
        spender,
        amount: delegatedAmount,
        isUnlimited,
        riskLevel: risk.level,
        riskFlags: JSON.stringify(risk.flags),
        tokenSymbol: meta.symbol || null,
        tokenIcon: meta.icon || null,
      },
    });
    approvals.push(approval);
  }

  return approvals;
}

export async function scanWalletApprovals(walletAddress: string) {
  const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
  const owner = new PublicKey(walletAddress);

  const wallet = await prisma.wallet.findUnique({ where: { address: walletAddress } });
  if (!wallet) return [];

  // Remove stale approvals before re-scan
  const spl = await scanTokenProgram(connection, owner, TOKEN_PROGRAM_ID, wallet.id);
  const t22 = await scanTokenProgram(connection, owner, TOKEN_2022_PROGRAM_ID, wallet.id);

  const allApprovals = [...spl, ...t22];

  // Store wallet risk score
  if (allApprovals.length > 0) {
    const { scoreWallet } = await import('./risk.js');
    const risks = allApprovals.map((a) => ({
      level: a.riskLevel as any,
      score: a.riskLevel === 'CRITICAL' ? 90 : a.riskLevel === 'HIGH' ? 75 : a.riskLevel === 'MEDIUM' ? 50 : 25,
      flags: JSON.parse(a.riskFlags),
    }));
    const walletRisk = scoreWallet(risks);
    await prisma.riskScore.create({
      data: { walletId: wallet.id, score: walletRisk.score, breakdown: JSON.stringify(walletRisk) },
    });
  } else {
    await prisma.riskScore.create({
      data: { walletId: wallet.id, score: 0, breakdown: JSON.stringify({ level: 'LOW', score: 0, flags: ['No approvals'] }) },
    });
  }

  return allApprovals;
}

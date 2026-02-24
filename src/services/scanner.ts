import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { scoreApproval } from './risk.js';

export async function scanWalletApprovals(walletAddress: string) {
  const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
  const owner = new PublicKey(walletAddress);

  const wallet = await prisma.wallet.findUnique({ where: { address: walletAddress } });
  if (!wallet) return [];

  // Fetch all token accounts for this wallet
  const tokenAccounts = await connection.getTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const approvals = [];

  for (const { pubkey, account } of tokenAccounts.value) {
    const data = AccountLayout.decode(account.data);
    const delegateOption = data.delegateOption;

    if (delegateOption === 0) continue; // No delegate

    const delegate = new PublicKey(data.delegate);
    const delegatedAmount = data.delegatedAmount.toString();
    const amount = data.amount.toString();
    const mint = new PublicKey(data.mint).toBase58();
    const spender = delegate.toBase58();
    const isUnlimited = BigInt(delegatedAmount) >= BigInt('18446744073709551615'); // u64 max

    const risk = scoreApproval({
      amount: delegatedAmount,
      balance: amount,
      isUnlimited,
      grantedAt: null,
    });

    const approval = await prisma.approval.upsert({
      where: {
        walletId_tokenMint_spender: {
          walletId: wallet.id,
          tokenMint: mint,
          spender,
        },
      },
      update: {
        amount: delegatedAmount,
        isUnlimited,
        riskLevel: risk.level,
        riskFlags: JSON.stringify(risk.flags),
        lastScanned: new Date(),
      },
      create: {
        walletId: wallet.id,
        tokenMint: mint,
        spender,
        amount: delegatedAmount,
        isUnlimited,
        riskLevel: risk.level,
        riskFlags: JSON.stringify(risk.flags),
      },
    });

    approvals.push(approval);
  }

  return approvals;
}

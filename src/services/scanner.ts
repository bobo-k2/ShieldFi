import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { scoreApproval } from './risk.js';

const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

interface TokenMeta {
  symbol?: string;
  icon?: string;
  decimals: number;
  priceUsd?: number;
}

// In-memory metadata cache (survives across requests, cleared on restart)
const metaCache = new Map<string, TokenMeta>();

async function fetchTokenMetadataBatch(mints: string[]): Promise<Map<string, TokenMeta>> {
  const results = new Map<string, TokenMeta>();
  const uncached = mints.filter(m => {
    if (metaCache.has(m)) { results.set(m, metaCache.get(m)!); return false; }
    return true;
  });

  if (!uncached.length || !env.HELIUS_API_KEY) return results;

  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAssetBatch',
        params: { ids: uncached },
      }),
    });
    const json = await res.json() as any;
    const assets = json?.result || [];
    for (const asset of assets) {
      const id = asset?.id;
      if (!id) continue;
      const content = asset?.content;
      const tokenInfo = asset?.token_info || {};
      const symbol = content?.metadata?.symbol || tokenInfo?.symbol;
      const icon = content?.links?.image || content?.files?.[0]?.uri;
      const decimals = tokenInfo?.decimals ?? 0;
      const priceUsd = tokenInfo?.price_info?.price_per_token;
      const meta: TokenMeta = { symbol: symbol || undefined, icon: icon || undefined, decimals, priceUsd };
      metaCache.set(id, meta);
      results.set(id, meta);
    }
  } catch {
    // Silently fail
  }

  for (const m of uncached) {
    if (!results.has(m)) {
      const empty: TokenMeta = { decimals: 0 };
      metaCache.set(m, empty);
      results.set(m, empty);
    }
  }

  // Fallback: fetch prices from Jupiter for tokens missing price
  const needPrice = [...results.entries()].filter(([_, m]) => m.priceUsd == null).map(([id]) => id);
  if (needPrice.length > 0) {
    try {
      const ids = needPrice.join(',');
      const res = await fetch(`https://api.jup.ag/price/v2?ids=${ids}`);
      const json = await res.json() as any;
      const prices = json?.data || {};
      for (const mint of needPrice) {
        const price = prices[mint]?.price;
        if (price != null) {
          const existing = results.get(mint)!;
          existing.priceUsd = parseFloat(price);
          results.set(mint, existing);
          metaCache.set(mint, existing);
        }
      }
    } catch {
      // Jupiter API failed — no prices, that's ok
    }
  }

  return results;
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
    const metaMap = await fetchTokenMetadataBatch([mint]);
    const meta = metaMap.get(mint) || { decimals: 0 };

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

// Public lookup — no DB, returns raw results
export async function lookupWalletApprovals(walletAddress: string) {
  const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
  const owner = new PublicKey(walletAddress);

  // Step 1: Collect all token accounts (one RPC call per program)
  const rawApprovals: { mint: string; spender: string; delegatedAmount: string; balance: string; isUnlimited: boolean }[] = [];
  const rawBalances: { mint: string; balance: string }[] = [];

  for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    const tokenAccounts = await connection.getTokenAccountsByOwner(owner, { programId });
    for (const { account } of tokenAccounts.value) {
      const data = AccountLayout.decode(account.data);
      const mint = new PublicKey(data.mint).toBase58();
      const balance = data.amount.toString();

      if (BigInt(balance) > 0n) {
        rawBalances.push({ mint, balance });
      }

      if (data.delegateOption === 1) {
        rawApprovals.push({
          mint,
          spender: new PublicKey(data.delegate).toBase58(),
          delegatedAmount: data.delegatedAmount.toString(),
          balance,
          isUnlimited: BigInt(data.delegatedAmount.toString()) >= BigInt('18446744073709551615'),
        });
      }
    }
  }

  // Step 2: Batch-fetch metadata for ALL unique mints in ONE call
  const allMints = [...new Set([...rawApprovals.map(a => a.mint), ...rawBalances.map(b => b.mint)])];
  const metaMap = await fetchTokenMetadataBatch(allMints);

  // Step 3: Build results with metadata
  const approvals = rawApprovals.map(a => {
    const risk = scoreApproval({ amount: a.delegatedAmount, balance: a.balance, isUnlimited: a.isUnlimited, grantedAt: null });
    const meta = metaMap.get(a.mint) || { decimals: 0 };
    return {
      tokenMint: a.mint,
      tokenSymbol: (meta as TokenMeta).symbol || null,
      tokenIcon: (meta as TokenMeta).icon || null,
      spender: a.spender,
      amount: a.delegatedAmount,
      balance: a.balance,
      isUnlimited: a.isUnlimited,
      riskLevel: risk.level,
      riskFlags: risk.flags,
      riskScore: risk.score,
    };
  });

  // Step 2b: Fetch SOL native balance
  const solLamports = await connection.getBalance(owner);
  const solBalance = solLamports / 1e9;
  let solPrice: number | null = null;
  try {
    const res = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
    const json = await res.json() as any;
    solPrice = parseFloat(json?.data?.['So11111111111111111111111111111111111111112']?.price) || null;
  } catch {}

  // Known token names that scammers impersonate
  const IMPERSONATED_NAMES = new Set(['SOL', 'ETH', 'BTC', 'USDC', 'USDT', 'BONK', 'JUP', 'WIF', 'PYTH', 'JTO', 'RNDR', 'HNT']);
  // Real mint addresses for common tokens
  const REAL_MINTS = new Set([
    'So11111111111111111111111111111111111111112',  // wSOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  ]);

  const solEntry = {
    mint: 'native' as const,
    symbol: 'SOL',
    icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    rawBalance: solLamports.toString(),
    balance: solBalance,
    decimals: 9,
    usdValue: solPrice ? solBalance * solPrice : null,
    status: 'verified' as const,
    flags: [] as string[],
  };

  const balances = [solEntry, ...rawBalances.map(b => {
    const meta = metaMap.get(b.mint) || { decimals: 0 };
    const rawBal = BigInt(b.balance);
    const decimals = meta.decimals || 0;
    const humanBalance = Number(rawBal) / Math.pow(10, decimals);
    const usdValue = meta.priceUsd ? humanBalance * meta.priceUsd : null;
    const symbol = meta.symbol || b.mint.slice(0, 6);

    // Classify token
    let status: 'verified' | 'unknown' | 'suspicious' = 'unknown';
    const flags: string[] = [];

    if (usdValue != null && usdValue > 0) {
      status = 'verified';
    } else {
      // Suspicious signals
      if (decimals === 0 && humanBalance < 1000) flags.push('Zero decimals');
      if (IMPERSONATED_NAMES.has(symbol.toUpperCase()) && !REAL_MINTS.has(b.mint)) {
        flags.push('Impersonates known token');
        status = 'suspicious';
      }
      if (symbol.includes('$') || symbol.includes('Ƨ') || symbol.includes('Ɐ') || /[^\x20-\x7E]/.test(symbol)) {
        flags.push('Unusual characters in name');
        status = 'suspicious';
      }
      if (flags.length >= 2) status = 'suspicious';
    }

    return {
      mint: b.mint,
      symbol,
      icon: meta.icon || null,
      rawBalance: b.balance,
      balance: humanBalance,
      decimals,
      usdValue,
      status,
      flags,
    };
  }).sort((a, b) => {
    // Sort: verified first (by USD), then unknown, then suspicious
    const order = { verified: 0, unknown: 1, suspicious: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return (b.usdValue || 0) - (a.usdValue || 0);
  })];

  const { scoreWallet } = await import('./risk.js');
  const walletScore = approvals.length > 0
    ? scoreWallet(approvals.map(a => ({ level: a.riskLevel, score: a.riskScore, flags: a.riskFlags }))).score
    : 0;

  return { approvals, balances, walletScore };
}

export async function scanWalletApprovals(walletAddress: string) {
  const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
  const owner = new PublicKey(walletAddress);

  const wallet = await prisma.wallet.findUnique({ where: { address: walletAddress } });
  if (!wallet) return { approvals: [], walletScore: 0 };

  const spl = await scanTokenProgram(connection, owner, TOKEN_PROGRAM_ID, wallet.id);
  const t22 = await scanTokenProgram(connection, owner, TOKEN_2022_PROGRAM_ID, wallet.id);

  const allApprovals = [...spl, ...t22];

  // Store wallet risk score
  const { scoreWallet } = await import('./risk.js');
  let walletScore = 0;
  if (allApprovals.length > 0) {
    const risks = allApprovals.map((a) => ({
      level: a.riskLevel as any,
      score: a.riskLevel === 'CRITICAL' ? 90 : a.riskLevel === 'HIGH' ? 75 : a.riskLevel === 'MEDIUM' ? 50 : 25,
      flags: JSON.parse(a.riskFlags),
    }));
    const walletRisk = scoreWallet(risks);
    walletScore = walletRisk.score;
    await prisma.riskScore.create({
      data: { walletId: wallet.id, score: walletRisk.score, breakdown: JSON.stringify(walletRisk) },
    });
  } else {
    await prisma.riskScore.create({
      data: { walletId: wallet.id, score: 0, breakdown: JSON.stringify({ level: 'LOW', score: 0, flags: ['No approvals'] }) },
    });
  }

  return { approvals: allApprovals, walletScore };
}

// Resolve mint addresses to token names (for use by monitor)
export async function resolveTokenNames(mints: string[]): Promise<Map<string, string>> {
  const metaMap = await fetchTokenMetadataBatch(mints);
  const names = new Map<string, string>();
  for (const [mint, meta] of metaMap) {
    names.set(mint, meta.symbol || mint.slice(0, 6) + '...');
  }
  return names;
}

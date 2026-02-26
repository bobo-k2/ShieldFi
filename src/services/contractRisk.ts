/**
 * Phase 3: AI-powered contract/token risk scoring
 * 
 * Analyzes tokens and programs for risk signals using on-chain data.
 * Combines heuristic checks with Helius DAS metadata for comprehensive scoring.
 */

import { env } from '../env.js';
import { rateLimiter } from './rateLimiter.js';

export interface TokenRiskReport {
  mint: string;
  symbol: string | null;
  overallScore: number;        // 0-100 (0=safe, 100=dangerous)
  level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: RiskFlag[];
  metadata: TokenMetadata | null;
}

interface RiskFlag {
  category: string;
  signal: string;
  severity: 'info' | 'warning' | 'danger';
  score: number;  // contribution to overall score
}

interface TokenMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
  supply?: number;
  holders?: number;
  freezeAuthority?: string | null;
  mintAuthority?: string | null;
  updateAuthority?: string | null;
  mutable?: boolean;
  programOwner?: string;
  tokenStandard?: string;
  description?: string;
  createdAt?: string;
}

// Known safe programs
const KNOWN_PROGRAMS = new Set([
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',   // SPL Token
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',   // Token-2022
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',   // Associated Token
  '11111111111111111111111111111111',                  // System Program
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',   // Jupiter v6
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',    // Orca Whirlpool
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',  // Raydium AMM
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',  // Raydium CLMM
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',    // Serum/OpenBook
  'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',  // Orca legacy
]);

// Known verified mints
const VERIFIED_MINTS = new Set([
  'So11111111111111111111111111111111111111112',       // wSOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',  // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',  // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',   // JUP
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',  // WIF
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',  // PYTH
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',   // JTO
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',   // RNDR
  'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',   // HNT
]);

// Names commonly impersonated
const IMPERSONATED_NAMES = ['SOL', 'USDC', 'USDT', 'ETH', 'BTC', 'BONK', 'JUP', 'WIF', 'PYTH', 'JTO', 'RNDR', 'HNT'];

/**
 * Analyze a token's risk using Helius DAS metadata
 */
export async function analyzeTokenRisk(mint: string): Promise<TokenRiskReport> {
  const flags: RiskFlag[] = [];
  let metadata: TokenMetadata | null = null;

  // Quick check for verified tokens
  if (VERIFIED_MINTS.has(mint)) {
    return {
      mint,
      symbol: null,
      overallScore: 0,
      level: 'SAFE',
      flags: [{ category: 'verification', signal: 'Known verified token', severity: 'info', score: 0 }],
      metadata: null,
    };
  }

  // Fetch full asset data from Helius DAS
  try {
    await rateLimiter.acquire();
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAsset',
        params: { id: mint, displayOptions: { showFungible: true } },
      }),
    });
    const json = await res.json() as any;
    const asset = json?.result;

    if (asset) {
      const content = asset.content || {};
      const tokenInfo = asset.token_info || {};
      const authorities = asset.authorities || [];
      const ownership = asset.ownership || {};

      metadata = {
        name: content?.metadata?.name,
        symbol: content?.metadata?.symbol || tokenInfo?.symbol,
        decimals: tokenInfo?.decimals,
        supply: tokenInfo?.supply ? Number(tokenInfo.supply) : undefined,
        freezeAuthority: asset.freeze_authority || tokenInfo?.freeze_authority || null,
        mintAuthority: asset.mint_authority || tokenInfo?.mint_authority || null,
        updateAuthority: authorities[0]?.address || null,
        mutable: asset.mutable ?? content?.mutable ?? true,
        programOwner: ownership?.owner,
        tokenStandard: asset.interface || asset.token_standard,
        description: content?.metadata?.description,
      };

      // === AUTHORITY CHECKS ===

      // Mint authority still active = can mint more tokens
      if (metadata.mintAuthority) {
        flags.push({
          category: 'authority',
          signal: 'Mint authority active — creator can mint unlimited tokens',
          severity: 'warning',
          score: 20,
        });
      }

      // Freeze authority = can freeze your tokens
      if (metadata.freezeAuthority) {
        flags.push({
          category: 'authority',
          signal: 'Freeze authority active — tokens can be frozen in your wallet',
          severity: 'warning',
          score: 15,
        });
      }

      // Mutable metadata = can change token name/symbol/image
      if (metadata.mutable) {
        flags.push({
          category: 'authority',
          signal: 'Metadata is mutable — token info can be changed',
          severity: 'info',
          score: 5,
        });
      }

      // === NAME/SYMBOL CHECKS ===
      const symbol = metadata.symbol?.toUpperCase() || '';
      const name = metadata.name || '';

      // Impersonation check
      if (IMPERSONATED_NAMES.includes(symbol) && !VERIFIED_MINTS.has(mint)) {
        flags.push({
          category: 'identity',
          signal: `Impersonates known token "${symbol}"`,
          severity: 'danger',
          score: 35,
        });
      }

      // Unicode tricks in name
      if (/[^\x20-\x7E]/.test(name) || /[^\x20-\x7E]/.test(symbol)) {
        flags.push({
          category: 'identity',
          signal: 'Contains non-ASCII characters (potential visual spoofing)',
          severity: 'danger',
          score: 25,
        });
      }

      // Empty or suspicious metadata
      if (!name && !symbol) {
        flags.push({
          category: 'identity',
          signal: 'No name or symbol in metadata',
          severity: 'warning',
          score: 15,
        });
      }

      // Very short description or no description (legit tokens usually have one)
      if (!metadata.description) {
        flags.push({
          category: 'identity',
          signal: 'No description in metadata',
          severity: 'info',
          score: 5,
        });
      }

      // === SUPPLY CHECKS ===
      if (metadata.supply != null && metadata.decimals != null) {
        const humanSupply = metadata.supply / Math.pow(10, metadata.decimals);

        // Absurdly large supply (quadrillions+)
        if (humanSupply > 1e15) {
          flags.push({
            category: 'supply',
            signal: 'Extremely large token supply (>1 quadrillion)',
            severity: 'warning',
            score: 10,
          });
        }

        // Zero decimals (common in spam/scam tokens)
        if (metadata.decimals === 0) {
          flags.push({
            category: 'supply',
            signal: 'Zero decimal places (common in spam tokens)',
            severity: 'warning',
            score: 10,
          });
        }
      }

      // === PRICE CHECK ===
      const priceUsd = tokenInfo?.price_info?.price_per_token;
      if (priceUsd == null || priceUsd === 0) {
        flags.push({
          category: 'market',
          signal: 'No market price found — likely illiquid or worthless',
          severity: 'warning',
          score: 10,
        });
      }

      // Return with symbol from metadata (prefix fakes)
      const isFake = IMPERSONATED_NAMES.includes(symbol) && !VERIFIED_MINTS.has(mint);
      const displaySymbol = isFake ? `⚠ FAKE ${metadata.symbol}` : (metadata.symbol || null);
      const overallScore = Math.min(flags.reduce((s, f) => s + f.score, 0), 100);
      return {
        mint,
        symbol: displaySymbol,
        overallScore,
        level: scoreToLevel(overallScore),
        flags,
        metadata,
      };
    }
  } catch (err) {
    flags.push({
      category: 'analysis',
      signal: 'Failed to fetch token metadata',
      severity: 'warning',
      score: 15,
    });
  }

  // No data available
  flags.push({
    category: 'analysis',
    signal: 'Token not found in Helius DAS — may be very new or invalid',
    severity: 'warning',
    score: 20,
  });

  const overallScore = Math.min(flags.reduce((s, f) => s + f.score, 0), 100);
  return {
    mint,
    symbol: null,
    overallScore,
    level: scoreToLevel(overallScore),
    flags,
    metadata,
  };
}

/**
 * Analyze a spender/program address for risk signals
 */
export async function analyzeSpenderRisk(programAddress: string): Promise<{
  isKnown: boolean;
  label: string | null;
  riskScore: number;
  flags: RiskFlag[];
}> {
  const flags: RiskFlag[] = [];

  if (KNOWN_PROGRAMS.has(programAddress)) {
    return { isKnown: true, label: 'Known DeFi program', riskScore: 0, flags: [] };
  }

  // Check if it's a program account via Helius
  try {
    await rateLimiter.acquire();
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAccountInfo',
        params: [programAddress, { encoding: 'jsonParsed' }],
      }),
    });
    const json = await res.json() as any;
    const account = json?.result?.value;

    if (!account) {
      flags.push({
        category: 'spender',
        signal: 'Spender account does not exist on-chain',
        severity: 'danger',
        score: 30,
      });
    } else if (account.executable) {
      flags.push({
        category: 'spender',
        signal: 'Spender is an executable program (unverified)',
        severity: 'warning',
        score: 10,
      });
    } else {
      flags.push({
        category: 'spender',
        signal: 'Spender is a regular wallet (not a program)',
        severity: 'warning',
        score: 15,
      });
    }
  } catch {
    flags.push({
      category: 'spender',
      signal: 'Could not verify spender account',
      severity: 'warning',
      score: 10,
    });
  }

  const riskScore = Math.min(flags.reduce((s, f) => s + f.score, 0), 100);
  return { isKnown: false, label: null, riskScore, flags };
}

/**
 * Full wallet risk analysis — analyzes all tokens + approvals
 */
export async function analyzeWalletRisk(walletAddress: string, balances: any[], approvals: any[]): Promise<{
  overallScore: number;
  level: string;
  tokenReports: TokenRiskReport[];
  approvalRisks: any[];
  summary: string;
}> {
  // Analyze each non-verified token
  const tokenReports: TokenRiskReport[] = [];
  // Prioritize suspicious tokens first, then unknown
  const nonVerified = balances.filter(b => b.status !== 'verified' && b.mint !== 'native');
  const suspicious = nonVerified.filter(b => b.status === 'suspicious');
  const unknown = nonVerified.filter(b => b.status !== 'suspicious');
  const mintsToAnalyze = [...suspicious, ...unknown].slice(0, 20); // Cap at 20 to avoid rate limits

  for (const b of mintsToAnalyze) {
    const report = await analyzeTokenRisk(b.mint);
    report.symbol = report.symbol || b.symbol;
    tokenReports.push(report);
  }

  // Analyze spenders
  const approvalRisks = [];
  const uniqueSpenders = [...new Set(approvals.map((a: any) => a.spender))];
  for (const spender of uniqueSpenders.slice(0, 10)) {
    const risk = await analyzeSpenderRisk(spender);
    approvalRisks.push({ spender, ...risk });
  }

  // Calculate overall score
  const tokenRiskAvg = tokenReports.length > 0
    ? tokenReports.reduce((s, r) => s + r.overallScore, 0) / tokenReports.length
    : 0;
  const approvalRiskAvg = approvalRisks.length > 0
    ? approvalRisks.reduce((s, r) => s + r.riskScore, 0) / approvalRisks.length
    : 0;

  const dangerousTokens = tokenReports.filter(r => r.level === 'HIGH' || r.level === 'CRITICAL').length;
  const suspiciousTokens = balances.filter((b: any) => b.status === 'suspicious').length;

  const overallScore = Math.min(Math.round(
    tokenRiskAvg * 0.4 +
    approvalRiskAvg * 0.4 +
    dangerousTokens * 5 +
    suspiciousTokens * 3
  ), 100);

  const level = scoreToLevel(overallScore);

  // Generate summary with token names
  const tokenLink = (r: TokenRiskReport) => `<a href="https://solscan.io/token/${r.mint}" target="_blank" style="color:#7b61ff;text-decoration:none">${r.symbol || r.mint.slice(0, 8) + '…'}</a>`;

  const parts: string[] = [];
  const highRiskTokens = tokenReports.filter(r => r.level === 'HIGH' || r.level === 'CRITICAL');
  if (highRiskTokens.length > 0) parts.push(`${highRiskTokens.length} high-risk token${highRiskTokens.length > 1 ? 's' : ''}: ${highRiskTokens.map(tokenLink).join(', ')}`);
  if (suspiciousTokens > 0) parts.push(`${suspiciousTokens} suspicious token${suspiciousTokens > 1 ? 's' : ''} (likely spam)`);
  if (approvals.length > 0) parts.push(`${approvals.length} active approval${approvals.length > 1 ? 's' : ''}`);
  const mintAuthList = tokenReports.filter(r => r.metadata?.mintAuthority);
  if (mintAuthList.length > 0) parts.push(`${mintAuthList.length} token${mintAuthList.length > 1 ? 's' : ''} with active mint authority: ${mintAuthList.map(tokenLink).join(', ')}`);
  const freezeList = tokenReports.filter(r => r.metadata?.freezeAuthority);
  if (freezeList.length > 0) parts.push(`${freezeList.length} token${freezeList.length > 1 ? 's' : ''} with freeze authority: ${freezeList.map(tokenLink).join(', ')}`);

  const summary = parts.length > 0
    ? parts.map(p => `<div style="margin-bottom:6px">• ${p}</div>`).join('')
    : 'No significant risks detected.';

  return { overallScore, level, tokenReports, approvalRisks, summary };
}

function scoreToLevel(score: number): TokenRiskReport['level'] {
  if (score <= 5) return 'SAFE';
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MEDIUM';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

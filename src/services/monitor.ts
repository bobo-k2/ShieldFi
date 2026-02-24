import { env } from '../env.js';

export interface HeliusEnhancedTx {
  signature: string;
  type: string;
  source: string;
  timestamp: number;
  fee: number;
  feePayer: string;
  description: string;
  tokenTransfers: Array<{
    mint: string;
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    tokenStandard?: string;
  }>;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  accountData: Array<any>;
}

export type AlertType =
  | 'large_outflow'
  | 'new_approval'
  | 'suspicious_contract'
  | 'rapid_transactions'
  | 'token_drain'
  | 'new_token_received'
  | 'approval_revoked';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface MonitorAlert {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  txSignature: string;
  walletAddress: string;
}

export async function fetchRecentTransactions(address: string, limit = 10): Promise<HeliusEnhancedTx[]> {
  const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${env.HELIUS_API_KEY}&limit=${limit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Helius API error for ${address}: ${res.status}`);
      return [];
    }
    return await res.json() as HeliusEnhancedTx[];
  } catch (e) {
    console.error(`Failed to fetch transactions for ${address}:`, e);
    return [];
  }
}

export function analyzeTransaction(tx: HeliusEnhancedTx, walletAddress: string): MonitorAlert[] {
  const alerts: MonitorAlert[] = [];
  const addr = walletAddress;
  const shortAddr = addr.slice(0, 4) + '...' + addr.slice(-4);

  // Check native (SOL) outflows
  for (const nt of tx.nativeTransfers || []) {
    if (nt.fromUserAccount === addr && nt.amount > 0) {
      const solAmount = nt.amount / 1e9;
      if (solAmount > 1) {
        const shortTo = nt.toUserAccount.slice(0, 4) + '...' + nt.toUserAccount.slice(-4);
        alerts.push({
          type: 'large_outflow',
          severity: solAmount > 10 ? 'CRITICAL' : 'WARNING',
          title: 'Large SOL Outflow',
          message: `${solAmount.toFixed(4)} SOL sent to ${shortTo}`,
          txSignature: tx.signature,
          walletAddress: addr,
        });
      }
    }
  }

  // Check token transfers
  for (const tt of tx.tokenTransfers || []) {
    if (tt.fromUserAccount === addr && tt.tokenAmount > 0) {
      const shortTo = (tt.toUserAccount || 'unknown').slice(0, 4) + '...' + (tt.toUserAccount || 'unknown').slice(-4);
      // Any token outflow > 0 is notable; large amounts are critical
      if (tt.tokenAmount > 100) {
        alerts.push({
          type: 'large_outflow',
          severity: 'WARNING',
          title: 'Token Outflow Detected',
          message: `${tt.tokenAmount.toLocaleString()} tokens (${tt.mint.slice(0, 8)}...) sent to ${shortTo}`,
          txSignature: tx.signature,
          walletAddress: addr,
        });
      }
    }

    // New token received (potential airdrop)
    if (tt.toUserAccount === addr && tt.fromUserAccount !== addr) {
      // Only flag if it looks unsolicited (not a swap return)
      if (tx.type !== 'SWAP') {
        alerts.push({
          type: 'new_token_received',
          severity: 'INFO',
          title: 'New Token Received',
          message: `Received ${tt.tokenAmount.toLocaleString()} tokens (${tt.mint.slice(0, 8)}...)`,
          txSignature: tx.signature,
          walletAddress: addr,
        });
      }
    }
  }

  // Check for approvals
  if (tx.type === 'APPROVE_CHECKED' || tx.type === 'APPROVE') {
    alerts.push({
      type: 'new_approval',
      severity: 'WARNING',
      title: 'New Token Approval',
      message: tx.description || 'A new token approval was granted',
      txSignature: tx.signature,
      walletAddress: addr,
    });
  }

  // Check for revokes (good news)
  if (tx.type === 'REVOKE') {
    alerts.push({
      type: 'approval_revoked',
      severity: 'INFO',
      title: 'Approval Revoked ✅',
      message: tx.description || 'A token approval was revoked',
      txSignature: tx.signature,
      walletAddress: addr,
    });
  }

  return alerts;
}

export function detectRapidTransactions(txs: HeliusEnhancedTx[], walletAddress: string): MonitorAlert | null {
  // Check if there are 3+ transactions within 60 seconds
  if (txs.length < 3) return null;

  const timestamps = txs
    .filter(tx => {
      const involved = [
        ...(tx.nativeTransfers || []).map(n => [n.fromUserAccount, n.toUserAccount]).flat(),
        ...(tx.tokenTransfers || []).map(t => [t.fromUserAccount, t.toUserAccount]).flat(),
      ];
      return involved.includes(walletAddress);
    })
    .map(tx => tx.timestamp)
    .sort((a, b) => b - a);

  if (timestamps.length >= 3) {
    const span = timestamps[0] - timestamps[2];
    if (span <= 60) {
      return {
        type: 'rapid_transactions',
        severity: 'CRITICAL',
        title: 'Rapid Transaction Activity',
        message: `${timestamps.length} transactions in ${span} seconds — possible wallet drain`,
        txSignature: txs[0].signature,
        walletAddress,
      };
    }
  }

  return null;
}

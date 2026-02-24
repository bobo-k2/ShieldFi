import type { RiskResult } from '../types.js';

interface ApprovalInput {
  amount: string;
  balance: string;
  isUnlimited: boolean;
  grantedAt: Date | null;
}

export function scoreApproval(input: ApprovalInput): RiskResult {
  let score = 25; // Any active delegation = LOW minimum
  const flags: string[] = [];

  if (input.isUnlimited) {
    score = 75;
    flags.push('Unlimited approval');
  } else if (input.balance && input.balance !== '0') {
    const ratio = Number(BigInt(input.amount)) / Number(BigInt(input.balance));
    if (ratio > 0.8) {
      score = Math.max(score, 50);
      flags.push('Approved >80% of balance');
    }
  }

  if (input.grantedAt) {
    const ageDays = (Date.now() - input.grantedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 90 && input.isUnlimited) {
      score = 90;
      flags.push('Old unlimited approval (>90 days)');
    }
  }

  let level: RiskResult['level'];
  if (score >= 80) level = 'CRITICAL';
  else if (score >= 60) level = 'HIGH';
  else if (score >= 40) level = 'MEDIUM';
  else level = 'LOW';

  if (flags.length === 0) flags.push('Active delegation');
  return { level, score, flags };
}

export function scoreWallet(approvals: RiskResult[]): RiskResult {
  if (approvals.length === 0) return { level: 'LOW', score: 0, flags: ['No approvals'] };

  const avg = approvals.reduce((s, a) => s + a.score, 0) / approvals.length;
  const countPenalty = Math.min(approvals.length * 3, 20);
  const score = Math.min(Math.round(avg + countPenalty), 100);

  let level: RiskResult['level'];
  if (score >= 80) level = 'CRITICAL';
  else if (score >= 60) level = 'HIGH';
  else if (score >= 40) level = 'MEDIUM';
  else level = 'LOW';

  const flags = [`${approvals.length} active approval${approvals.length > 1 ? 's' : ''}`];
  return { level, score, flags };
}

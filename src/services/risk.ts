import type { RiskResult } from '../types.js';

interface ApprovalInput {
  amount: string;
  balance: string;
  isUnlimited: boolean;
  grantedAt: Date | null;
}

export function scoreApproval(input: ApprovalInput): RiskResult {
  let score = 20;
  const flags: string[] = [];

  if (input.isUnlimited) {
    score = 70;
    flags.push('Unlimited approval');
  }

  if (input.balance && input.balance !== '0') {
    const ratio = Number(BigInt(input.amount)) / Number(BigInt(input.balance));
    if (ratio > 0.8) {
      score = Math.max(score, 50);
      flags.push('Approved >80% of balance');
    }
  }

  if (input.grantedAt) {
    const ageMs = Date.now() - input.grantedAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays > 90 && input.isUnlimited) {
      score = 90;
      flags.push('Old unlimited approval (>90 days)');
    } else if (ageDays < 30) {
      score = Math.max(score, 40);
      flags.push('Recent approval (<30 days)');
    }
  }

  let level: RiskResult['level'];
  if (score >= 80) level = 'CRITICAL';
  else if (score >= 60) level = 'HIGH';
  else if (score >= 40) level = 'MEDIUM';
  else level = 'LOW';

  if (flags.length === 0) flags.push('No issues detected');

  return { level, score, flags };
}

export function scoreWallet(approvals: RiskResult[]): RiskResult {
  if (approvals.length === 0) return { level: 'LOW', score: 0, flags: ['No approvals'] };

  const worst = approvals.reduce((a, b) => (a.score > b.score ? a : b));
  const countPenalty = Math.min(approvals.length * 2, 20);
  const score = Math.min(worst.score + countPenalty, 100);

  let level: RiskResult['level'];
  if (score >= 80) level = 'CRITICAL';
  else if (score >= 60) level = 'HIGH';
  else if (score >= 40) level = 'MEDIUM';
  else level = 'LOW';

  const flags = [`${approvals.length} active approvals`, ...worst.flags];
  return { level, score, flags };
}

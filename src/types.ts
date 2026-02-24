export interface AuthNonceRequest {
  wallet: string;
}

export interface AuthVerifyRequest {
  wallet: string;
  signature: string;
  nonce: string;
}

export interface JwtPayload {
  sub: string;
  wallet: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskResult {
  level: RiskLevel;
  score: number;
  flags: string[];
}

export interface ApprovalInfo {
  tokenMint: string;
  tokenSymbol?: string;
  spender: string;
  amount: string;
  isUnlimited: boolean;
  balance: string;
}

export interface HeliusWebhookEvent {
  type: string;
  timestamp: number;
  signature: string;
  accountData?: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      mint: string;
      rawTokenAmount: { tokenAmount: string; decimals: number };
      userAccount: string;
    }>;
  }>;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
}

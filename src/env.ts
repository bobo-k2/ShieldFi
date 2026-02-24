import 'dotenv/config';

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
  HELIUS_WEBHOOK_SECRET: process.env.HELIUS_WEBHOOK_SECRET || '',
} as const;

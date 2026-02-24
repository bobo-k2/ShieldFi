# ShieldFi

AI-powered Solana wallet security guardian. Scan token approvals, score risks, revoke threats.

## Quick Start

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev
```

Server runs on http://localhost:3001

## API Endpoints

- `GET /api/health` — Health check
- `POST /api/auth/nonce` — Request auth nonce
- `POST /api/auth/verify` — Verify wallet signature
- `GET /api/wallets` — List wallets (auth required)
- `POST /api/wallets` — Add wallet
- `GET /api/approvals` — List approvals
- `POST /api/approvals/scan` — Trigger scan
- `POST /api/approvals/:id/revoke` — Get revoke info
- `GET /api/alerts` — List alerts
- `POST /api/webhooks/helius` — Helius webhook receiver

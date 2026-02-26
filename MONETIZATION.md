# ShieldFi Monetization Plan

## Tiers

### Free (no auth)
- Scan any wallet (unlimited)
- Basic risk score + token classification
- AI contract analysis
- One-time use, no account needed

### Guardian — $7/mo (SOL/USDC)
- Everything free, plus:
- Real-time monitoring (up to 3 wallets)
- Telegram/Discord alerts
- Transaction history
- Portfolio risk dashboard
- Priority scanning (no queue)

### Sentinel — $19/mo (SOL/USDC)
- Everything Guardian, plus:
- Up to 10 monitored wallets
- AI threat briefings (weekly digest)
- Approval revocation one-click
- API access (for devs/bots)
- Early access to new features

## Auth
- Wallet-first: Connect Phantom → sign message → account created
- Wallet address = user ID
- Optional email for alerts/recovery

## Payments
- On-chain SOL or USDC to ShieldFi treasury wallet
- Backend verifies TX on-chain
- 30-day subscription cycle
- 3-day grace period before cutting access

## Build Phases
- Phase A: Subscription infrastructure (DB, payments, middleware, pricing page)
- Phase B: Gate features (monitor limits, priority queue, TX history auth)
- Phase C: New features (portfolio dashboard, weekly digest, revocation UI, API keys, Discord)

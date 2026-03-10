# ShieldFi Promotion Execution Plan — March 10, 2026

## 🚨 CRITICAL BLOCKERS

### Blocker 1: Twitter API Broken (since March 3)
- `.env` only has `X_API_KEY` and `X_API_SECRET`
- **Missing:** Bearer Token, Access Token, Access Token Secret
- Tweet creation returns 403, search returns 401
- Only 1 tweet ever posted (March 5 — Solv Protocol exploit)
- **FIX:** Bobo must go to developer.x.com → regenerate ALL 5 credentials → update `.env`
- May need Basic tier ($100/mo) if free tier lost write access

### Blocker 2: Reddit 30-Day Wait
- Account created ~March 4 with shieldfi@proton.me
- **Unlocks ~April 4** — all Reddit content prepped and ready to post

### Blocker 3: Reddit Ads Flopped
- 8,787 impressions, 30 clicks, €4.59 spent — ZERO conversions
- Don't spend more until organic presence is established

---

## Current Stats (March 10)
- **80 total scans, 9 unique wallets, 0 real paying users**
- Twitter: 1 tweet ever posted, API broken
- Reddit: account exists, can't post yet
- Discord: server exists, 2 visitors total, no activity
- Blog: none
- Community: none

---

## IMMEDIATE ACTIONS (This Week)

### 1. Fix Twitter API Keys ⚡ [BOBO — 10 minutes]
Without this, all Twitter marketing is dead.
1. Go to developer.x.com
2. Regenerate ALL credentials
3. Ensure "Read and Write" permissions
4. Update `/Users/bobo/.openclaw/workspace/shieldfi/.env`:
   ```
   X_API_KEY=...
   X_API_SECRET=...
   X_BEARER_TOKEN=...
   X_ACCESS_TOKEN=...
   X_ACCESS_TOKEN_SECRET=...
   ```
5. Test: `openclaw cron run 6caef391-7d87-453c-9a2d-10b74eb56f6a`

### 2. Post Launch Thread [Day Twitter is Fixed]
Thread is already drafted in `marketing/launch-thread.md`.
Post manually first, then enable cron.

### 3. Join Solana Discords [BOBO — 30 min/day]
Be helpful, not promotional. Answer security questions.
- Phantom Discord
- Jupiter Discord  
- Helius Discord
- MonkeDAO Discord

### 4. Send Partnership DMs [BOBO — 3 this week]
See partnership templates in `marketing/growth-strategy-30day.md`.
Top targets:
- **Maestro Bot** (@maestaborative on Twitter, maestrobots.com) — they have "Anti-Rug" feature, complementary
- **GMGN.AI** (gmgn.ai, has cooperation API docs) — integrates security checks, direct competitor opportunity
- **RugCheck** — complementary positioning: "RugCheck your tokens, ShieldFi your wallet"

---

## CONTENT BANK (Ready to Post)

### Twitter Content Queue
See: `marketing/twitter-content-queue.md`

### Reddit Posts (Ready for April 4+)
See: `marketing/reddit-posts-draft.md`

---

## CHANNEL STRATEGY (Revised)

| Channel | Status | Priority | Action |
|---------|--------|----------|--------|
| **Twitter/X** | BROKEN | #1 | Fix API keys, then daily posts |
| **Telegram groups** | Not started | #2 | Join Solana groups, be helpful |
| **Discord ecosystem** | Not started | #3 | Bobo joins 4 servers this week |
| **Partnerships** | Not started | #4 | 3 DMs this week |
| **Product Hunt** | Prepping | #5 | Launch March 18-19 (Tue/Wed) |
| **Reddit** | Waiting | #6 | Unlocks April 4 — content ready |
| **Blog/SEO** | Not started | #7 | First post this week |

---

## TELEGRAM BOT PARTNERSHIP STRATEGY

### Why This Is The Highest-ROI Play
Solana Telegram trading bots have **millions of users**. If we get ShieldFi integrated as a security check before trades, that's instant distribution at scale.

### Top Targets

#### Tier 1 — Most Likely to Partner
| Bot | Users | Security Features | Partnership Angle |
|-----|-------|-------------------|-------------------|
| **Maestro** | Large | Has "Anti-Rug" feature | Complement their anti-rug with wallet-level scans |
| **GMGN.AI** | Large | Token security checks, insider analysis | Has cooperation API — integrate ShieldFi risk scores |
| **BONKbot** | Large (beginner-focused) | Basic safety | Add security layer for their less-experienced users |

#### Tier 2 — Worth Approaching
| Bot | Notes |
|-----|-------|
| **Trojan** | Copy trading focus, wallet monitoring overlap |
| **Axiom Trade** | Web terminal, has unofficial API SDKs appearing |
| **BullX Neo** | Multi-platform, might want security differentiator |

### Integration Pitch
```
Subject: Free security API for [Bot Name] users

Hey team,

I built ShieldFi — a free Solana wallet security scanner with AI-powered 
risk analysis, fake token detection, and approval monitoring.

I noticed [Bot Name] users are actively trading Solana tokens and could 
benefit from a quick security check before executing trades. 

I'd love to explore integrating ShieldFi's risk scoring into your platform:
- Token risk scores via our API (/api/risk/token/:mint)
- Wallet health checks (/api/risk/wallet?address=)
- Zero cost — API is free

This could be a "security check" feature that differentiates [Bot Name] 
from competitors. Happy to jump on a call.

Live demo: https://shieldfi.app
API: https://shieldfi.app/api/risk/token/{any_mint_address}

— Bobo
```

### What We Need First (before partnerships)
1. **Public API documentation page** on shieldfi.app
2. **Rate limiting verified** (currently 8 req/s — fine for most integrations)
3. **Uptime guarantee** — 99%+ with health monitoring (already have this via cron)

---

## PRODUCT HUNT LAUNCH PLAN

### Target: Tuesday March 18 or Wednesday March 19

### Pre-Launch (March 10-17)
- [ ] Create Product Hunt maker account (Bobo)
- [ ] Upload logo (shield icon — need 512x512)
- [ ] Take 3-4 high-quality screenshots of scan results
- [ ] Record 30-second demo video (paste wallet → see results)
- [ ] Write description (draft in `marketing/product-hunt.md`)
- [ ] Find a hunter OR self-hunt
- [ ] Prep social posts for launch day
- [ ] Email waitlist (if any)

### Launch Day
- Post at 00:00 UTC (1:00 AM CET)
- Respond to EVERY comment within 2 hours
- Share on: Twitter (if fixed), Discord, Telegram groups
- Ask friends/contacts to upvote (3-5 people minimum)

### Post-Launch
- Continue engaging for 48 hours
- Share results/ranking
- Use any press/mentions for social proof on shieldfi.app

### Assets Needed
1. **Tagline:** "Free AI-powered Solana wallet security scanner"
2. **Categories:** Crypto, Security, Web3, Developer Tools
3. **Screenshots:** Landing page, scan results (clean wallet vs risky wallet), Telegram alerts
4. **Maker comment:** Already drafted in `marketing/product-hunt.md`

---

## WEEKLY MILESTONES

### Week of March 10-16
- [ ] Fix Twitter API keys
- [ ] Post launch thread on Twitter
- [ ] Join 4 Solana Discords
- [ ] Send 3 partnership DMs
- [ ] Prep Product Hunt assets
- [ ] Write first blog post

### Week of March 17-23
- [ ] Launch on Product Hunt (Tue/Wed)
- [ ] Daily Twitter engagement (if keys fixed)
- [ ] Follow up on partnership DMs
- [ ] Join 2-3 Telegram Solana groups

### Week of March 24-31
- [ ] Analyze Product Hunt results
- [ ] Double down on what worked
- [ ] Prep Reddit content for April 4 launch
- [ ] Target: 200 total scans by March 31

### Week of April 1-7
- [ ] Reddit blitz (4-5 posts across subreddits)
- [ ] Target: 500 total scans

---

## SUCCESS METRICS

| Metric | Current | March 31 Target | Method |
|--------|---------|-----------------|--------|
| Total scans | 80 | 300 | PH + Twitter + Discords |
| Unique wallets | 9 | 100 | Organic traffic |
| Twitter followers | ~0 | 100 | Daily content + engagement |
| Discord members | 2 | 20 | Cross-promotion |
| Paying users | 0 | 1 | PH + direct outreach |
| Partnership convos | 0 | 3 | DMs to bot platforms |

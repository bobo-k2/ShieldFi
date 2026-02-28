# ShieldFi Business Strategy

*Last updated: 2026-02-28*

---

## 1. Competitive Landscape & Pricing Validation

### Direct Competitors

| Product | Model | Pricing | Notes |
|---------|-------|---------|-------|
| **Blowfish** | B2B API (acquired by Phantom ~$55M) | Free for end users; wallets pay API fees | Not consumer-facing anymore |
| **Pocket Universe** | Freemium browser extension (acquired by Kerberus 2025) | Free base + optional coverage up to $30K (fee-based) | 200K+ users pre-acquisition |
| **Web3 Antivirus** | Free browser extension | Free (token/future monetization) | Multi-chain, broad feature set |
| **GoPlus Security** | Free app + $GPS token staking | Token-based economy; API free tier + enterprise | 12M+ wallets, 30+ chains. VC-funded. |
| **De.Fi** | Freemium | Free scanner + Pro tier (token-gated via DEFI token holdings) | Portfolio-level security dashboard |
| **Revoke.cash** | Free / donations | Free (open source) | Approval revocation tool only |
| **Wallet Guard** | Free (acquired by MetaMask) | N/A | Now integrated into MetaMask |

### Key Observations

1. **Most competitors are free** — monetized through VC funding, token launches, or B2B API sales to wallets
2. **Very few charge consumers directly** — this is both a risk (hard to convert) and an opportunity (untapped willingness to pay among serious users)
3. **Acquisition trend** — Phantom bought Blowfish, MetaMask bought Wallet Guard, Kerberus bought Pocket Universe. Security is being absorbed into wallets.
4. **No Solana-native paid security tool exists** — ShieldFi occupies a unique niche

### Pricing Assessment

**$7/mo Guardian is well-positioned:**
- Below the "impulse buy" threshold for active Solana traders
- 0.04 SOL is trivial for anyone with meaningful holdings
- Comparable to a Netflix-tier micro-subscription
- Most Solana degens spend more on a single failed trade

**$19/mo Sentinel is reasonable but harder to justify:**
- At this price, users expect significant differentiation
- API access + 10 wallets + AI briefings provide real value
- Consider: whale users managing >$50K would pay this easily
- Risk: smaller users may see it as expensive vs free alternatives

**Recommendation:** Keep current pricing. Consider adding a **$49/mo Whale tier** later for power users (unlimited wallets, custom alerts, dedicated support, white-glove onboarding). Don't discount — anchor on value, not price competition with free tools.

---

## 2. Revenue Projections (First 6 Months)

### Assumptions
- Free scan users acquired through organic/Twitter/content marketing
- Conversion rate from free to paid: **1-3%** (industry standard for freemium SaaS)
- Guardian:Sentinel ratio: **3:1** (most users pick cheaper tier)
- Churn: **15%/month** (crypto users are volatile)
- Solo dev = limited marketing bandwidth = slower growth

### Scenario A: Conservative
*Slow organic growth, minimal marketing spend*

| Month | Free Users | Guardian ($7) | Sentinel ($19) | MRR |
|-------|-----------|---------------|-----------------|-----|
| 1 | 200 | 3 | 1 | $40 |
| 2 | 400 | 7 | 2 | $87 |
| 3 | 700 | 12 | 4 | $160 |
| 4 | 1,000 | 18 | 6 | $240 |
| 5 | 1,400 | 25 | 8 | $327 |
| 6 | 1,800 | 33 | 11 | $440 |

**6-month cumulative revenue: ~$1,294**
**Month 6 MRR: $440**

### Scenario B: Moderate
*Consistent content marketing, some viral moments, CT engagement*

| Month | Free Users | Guardian ($7) | Sentinel ($19) | MRR |
|-------|-----------|---------------|-----------------|-----|
| 1 | 500 | 8 | 2 | $94 |
| 2 | 1,200 | 20 | 6 | $254 |
| 3 | 2,500 | 40 | 12 | $508 |
| 4 | 4,000 | 65 | 20 | $835 |
| 5 | 6,000 | 95 | 30 | $1,235 |
| 6 | 8,000 | 130 | 42 | $1,708 |

**6-month cumulative revenue: ~$4,634**
**Month 6 MRR: $1,708**

### Scenario C: Aggressive
*Product goes semi-viral, featured by influencers, catches a rug-pull wave*

| Month | Free Users | Guardian ($7) | Sentinel ($19) | MRR |
|-------|-----------|---------------|-----------------|-----|
| 1 | 2,000 | 30 | 10 | $400 |
| 2 | 5,000 | 80 | 25 | $1,035 |
| 3 | 12,000 | 180 | 55 | $2,305 |
| 4 | 20,000 | 320 | 100 | $4,140 |
| 5 | 30,000 | 500 | 160 | $6,540 |
| 6 | 40,000 | 700 | 220 | $9,080 |

**6-month cumulative revenue: ~$23,500**
**Month 6 MRR: $9,080**

### Reality Check
- **Conservative is most likely** for a solo dev with no marketing budget
- **Moderate is achievable** with consistent CT presence + 2-3 viral moments
- **Aggressive requires** a major catalyst (big rug pull ShieldFi detects, influencer endorsement, or Solana ecosystem partnership)
- Break-even on server costs (~$50-100/mo) happens in Month 2-3 for moderate scenario

---

## 3. Additional Revenue Streams

### 3A. B2B API Access (HIGH PRIORITY)
**What:** Sell ShieldFi's scanning/risk-scoring engine as an API to other dApps, wallets, DEXs, and launchpads.

**Why it's the best revenue stream:**
- This is exactly how Blowfish got to $55M acquisition
- Recurring B2B revenue is more stable than B2C subscriptions
- Solana ecosystem is underserved for security APIs
- One enterprise client = 100+ consumer subscriptions

**Pricing model:**
- Free: 100 calls/day
- Builder: $49/mo — 10K calls/day
- Growth: $199/mo — 100K calls/day
- Enterprise: Custom pricing

**Target customers:**
- Solana DEX aggregators (Jupiter plugins)
- Launchpads (need token vetting)
- Portfolio trackers wanting security scores
- Telegram trading bots (huge market on Solana)

**Timeline:** Build after consumer product is stable. Needs rate limiting, API key management, docs.

### 3B. Affiliate/Referral Program (MEDIUM PRIORITY)
**What:** Give existing users a referral link. They get 1 month free (or 20% of referred user's first 3 months).

**Why:**
- Zero-cost acquisition channel
- Crypto users love sharing tools that "saved" them
- Works especially well after ShieldFi catches a real scam

**Implementation:** Simple — unique referral codes, track in DB, auto-credit.

### 3C. Premium Data & Analytics (MEDIUM PRIORITY)
**What:** Aggregate anonymized scan data into insights:
- "Top 10 riskiest tokens this week"
- "Rug pull trend reports"
- Scam token databases
- Risk heatmaps

**Revenue models:**
- Content marketing (free, drives users) → best short-term use
- Premium analytics dashboard ($29/mo for researchers/funds)
- Data licensing to security firms

**Why:** ShieldFi accumulates valuable data with every scan. Monetize the exhaust.

### 3D. Token-Gated Features (LOW PRIORITY — for now)
**What:** Launch a $SHIELD token; holders get premium features.

**Why NOT now:**
- Token launches require legal/regulatory consideration
- Distraction from core product
- Token price volatility hurts user experience
- Solo dev shouldn't also be a token manager

**When:** Only if ShieldFi reaches 10K+ users and there's genuine community demand. Consider as a 12-month+ play.

### 3E. White-Label Security Scanning (LOW PRIORITY)
**What:** Let other projects embed ShieldFi scanning under their own brand.

**Why later:**
- Requires mature, battle-tested product
- Needs proper SDK/documentation
- High support burden for a solo dev
- Better as a Phase 2 play after B2B API proves demand

**When:** 6-12 months after API launch, once enterprise clients are requesting it.

---

## 4. Go-to-Market Priorities

### Ranked by Revenue Impact ÷ Effort

| Priority | Action | Expected Impact | Effort |
|----------|--------|-----------------|--------|
| **1** | Ship free scanner & build CT presence | Foundation for everything | Medium |
| **2** | Create "ShieldFi caught this rug" content | Viral potential, trust building | Low |
| **3** | Launch Guardian tier ($7/mo) | First revenue | Medium |
| **4** | Partner with 2-3 Solana Telegram bot projects (API) | B2B revenue, distribution | Medium |
| **5** | Implement referral program | Organic growth amplifier | Low |
| **6** | Weekly "Solana Scam Report" thread on Twitter | Authority building, SEO, leads | Low |
| **7** | Launch Sentinel tier ($19/mo) | Higher ARPU | Medium |
| **8** | Build formal API product | B2B revenue | High |

### The Playbook (Month by Month)

**Month 1-2: Foundation**
- Free scanner live and working well
- Tweet every scan result, every caught scam
- Engage with Solana CT (Crypto Twitter) daily
- Get listed on Solana ecosystem pages

**Month 3-4: Monetize**
- Launch Guardian subscription
- Implement referral program
- Start reaching out to Telegram bot devs for API partnerships
- Create landing page with social proof (scans performed, threats detected)

**Month 5-6: Scale**
- Launch Sentinel tier
- Formalize API offering
- Pitch to Solana DEX/launchpad projects
- Weekly scam reports establish authority

### Content Strategy (Zero Budget)
- **Twitter/X:** 2-3 tweets/day — scan results, scam alerts, educational content
- **"ShieldFi saved me" testimonials** — encourage users to share
- **Rug pull post-mortems** — analyze recent scams, show ShieldFi would have flagged them
- **Solana ecosystem threads** — be the "security expert" voice on CT

---

## 5. Key Risks & Mitigation

### Risk 1: Users Won't Pay When Free Alternatives Exist
**Severity: HIGH**
- Most competitors are free (VC-funded or token-based)
- Crypto users are notoriously cheap

**Mitigation:**
- Free tier must be genuinely useful (builds trust and habit)
- Paid features must be clearly differentiated (monitoring, alerts, AI = ongoing value vs one-time scan)
- Position as "insurance" not "tool" — $7/mo to protect a $5K+ wallet is obvious value
- Focus on Solana-specific depth vs competitors' multi-chain breadth

### Risk 2: Wallet Integration Trend Makes Standalone Tools Obsolete
**Severity: HIGH**
- Phantom bought Blowfish, MetaMask bought Wallet Guard
- If wallets build security in, standalone tools lose their market

**Mitigation:**
- B2B API pivot — become the security engine wallets integrate
- Focus on monitoring/alerts (wallets don't do ongoing surveillance)
- Multi-wallet support is a moat (people use Phantom + Backpack + Solflare)

### Risk 3: Solo Dev Burnout / Bandwidth
**Severity: HIGH**
- Building product + marketing + support + infrastructure alone

**Mitigation:**
- Automate ruthlessly (Telegram bot for support, CI/CD, monitoring)
- Keep scope small — better to do 3 things well than 10 things poorly
- Revenue target: reach $1K MRR before adding complexity
- Consider bringing on a co-founder at $2K+ MRR

### Risk 4: Smart Contract / Security Liability
**Severity: MEDIUM**
- If ShieldFi says a token is "safe" and it rugs, users may blame ShieldFi

**Mitigation:**
- Clear disclaimers: "Risk assessment, not financial advice"
- Use probabilistic language ("high risk" vs "scam")
- Never claim guaranteed safety
- Terms of service with liability limitations

### Risk 5: Crypto Bear Market Kills Demand
**Severity: MEDIUM**
- In bear markets, fewer users, less trading, less need for security tools

**Mitigation:**
- Bear markets also mean fewer scams to scan, lower infrastructure costs
- Security awareness actually increases after big hacks/rug pulls
- Low burn rate (solo dev) means you can survive bear markets
- B2B API revenue is more recession-resistant than B2C

### Risk 6: On-Chain Payment Friction
**Severity: LOW-MEDIUM**
- Requiring SOL/USDC payment excludes users who prefer credit cards

**Mitigation:**
- Start with on-chain only (your target users have wallets by definition)
- Consider adding Stripe later for broader appeal
- On-chain payments are actually a feature for privacy-conscious users

---

## 6. Key Metrics to Track

| Metric | Target (Month 6) |
|--------|------------------|
| Total free scans | 10K+ |
| Unique wallets scanned | 5K+ |
| Paid subscribers | 50+ |
| MRR | $500+ (conservative) |
| Free → Paid conversion | 2%+ |
| Monthly churn | <15% |
| API partnerships | 1-2 |

---

## 7. Summary & Recommendations

1. **Pricing is right** — $7/$19 is competitive for the Solana niche. Don't race to the bottom.
2. **B2B API is the biggest revenue opportunity** — prioritize this after consumer launch.
3. **Content marketing on CT is your #1 growth lever** — every caught scam is a marketing event.
4. **Referral program is low-hanging fruit** — implement early.
5. **Don't launch a token** — it's a distraction at this stage.
6. **Realistic Month 6 target: $400-1,700 MRR** — enough to cover costs and validate the model.
7. **Path to sustainability:** 200 Guardian + 50 Sentinel subscribers = ~$2,350 MRR. Achievable within 9-12 months with consistent execution.

---

*This is a living document. Revisit monthly as real data replaces projections.*

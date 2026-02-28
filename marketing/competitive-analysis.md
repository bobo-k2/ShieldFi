# ShieldFi Competitive Intelligence Report

*Date: February 28, 2026*

---

## Executive Summary

ShieldFi operates in the Solana wallet security space — a niche with surprisingly few direct competitors. The two closest rivals (Wallet Guard and Blowfish) have been acquired or shut down, creating a significant market gap. De.Fi is the largest multi-chain player but has weak Solana support. RugCheck dominates token-level scanning on Solana but doesn't do wallet-level security. **ShieldFi has a genuine window of opportunity as the only dedicated, free, Solana-native wallet security scanner.**

---

## 1. Competitor Deep Dives

### 1.1 Wallet Guard (walletguard.app) — ☠️ SUNSET

| Attribute | Details |
|---|---|
| **Status** | **Shut down March 31, 2025** |
| **What it was** | Browser extension detecting phishing, malicious transactions, honeypots, open approvals |
| **Backing** | ConsenSys (MetaMask ecosystem) |
| **Chains** | Primarily EVM (Ethereum, Polygon, etc.) via MetaMask Snap |
| **Pricing** | Free |
| **Claimed users** | 50,000+ wallets protected |
| **Key features** | Phishing URL detection, transaction simulation, approval scanning, soft-locking of assets, MetaMask Snap integration |

**Why it matters for ShieldFi:** Wallet Guard's death leaves a vacuum. Their 50K+ users need alternatives. ShieldFi could capture Solana-focused users who lost this tool. Their feature set (especially soft-locking and browser extension phishing protection) is a roadmap reference.

---

### 1.2 De.Fi (de.fi) — Multi-Chain Security Super-App

| Attribute | Details |
|---|---|
| **Status** | Active, well-funded |
| **Founded** | July 2020 |
| **Users** | 5M+ signed up (per CoinMarketCap), tracking $25B in user funds |
| **Token** | $DEFI (trading ~$0.003) |
| **Chains** | 14+ EVM chains: Ethereum, Arbitrum, Avalanche, Base, BNB Chain, Celo, Cronos, Fantom, Gnosis, Linea, Moonbeam, Optimism, Polygon, zkSync Era. **No Solana support.** |
| **Pricing** | Freemium. Free scanner + revoke tool. Pro tier exists (details not publicly listed). Has API for B2B integrations. |

**Key Features:**
- Smart contract scanner (automated audit-level analysis)
- Wallet "Antivirus" — scans connected wallets for risky approvals, suspicious tokens
- Approval revocation tool (most advanced in market)
- Hack & scam database (REKT DB)
- Portfolio tracker with yield farming opportunities
- Audit database aggregator
- Token holder & liquidity analysis
- Browser extension
- API for wallet integrations (Holdstation, Eva Wallet, etc.)

**Strengths:**
- Massive user base and brand recognition
- Comprehensive EVM coverage
- "Crypto Antivirus" branding is memorable and clear
- REKT database is a unique content moat
- B2B API strategy creates network effects

**Weaknesses:**
- **Zero Solana support** — their scanner only works on EVM chains
- Overwhelming UI — too many features, not focused
- $DEFI token has crashed 99%+ from highs, hurting credibility
- Pro pricing opaque

**What they do that ShieldFi doesn't:**
- Multi-chain coverage (14+ chains)
- Approval revocation (ShieldFi shows approvals but revoke UX unclear)
- REKT/hack database
- Yield farming recommendations
- B2B API product
- Browser extension

**What ShieldFi does that they don't:**
- Solana support (at all)
- AI-powered risk analysis
- Telegram monitoring alerts
- No-signup, paste-and-scan UX
- Token-2022 program support

---

### 1.3 Blowfish (blowfish.xyz) — ☠️ ACQUIRED BY PHANTOM

| Attribute | Details |
|---|---|
| **Status** | **Acquired by Phantom (Nov 2024)** — still operates API but now Phantom-integrated |
| **Model** | B2B API for wallets (not consumer-facing) |
| **Chains** | 10+ (including Solana, Ethereum, Polygon, etc.) |
| **Pricing** | Developer: $500/mo for 25K API calls. Enterprise: custom. Free for development. |
| **Traction** | 2.8M scams prevented, 1.3B transactions scanned, $10B+ assets protected |

**Key Features:**
- Real-time transaction simulation before signing
- Message decoding (human-readable transaction previews)
- Dapp security (malicious dapp URL detection)
- Scam list / blocklist database
- Risk scoring for transactions
- Browser extension (Blowfish Protect)

**Strengths:**
- Best-in-class transaction simulation technology
- Now backed by Phantom (largest Solana wallet)
- Proven at massive scale (1.3B txns scanned)
- Multi-chain

**Weaknesses:**
- **No longer independent** — now part of Phantom, may not serve other wallets long-term
- B2B only — regular users can't use the API directly
- Expensive for developers ($500/mo minimum)
- Doesn't do wallet scanning/approval monitoring — only transaction-time protection

**What they do that ShieldFi doesn't:**
- Pre-transaction simulation (blocking bad txns before they execute)
- Human-readable transaction previews
- Dapp URL screening
- Scale (billions of transactions)

**What ShieldFi does that they don't:**
- Consumer-facing (anyone can use it)
- Wallet-level security overview (approvals, token classification, portfolio)
- AI risk analysis of contract metadata
- Telegram alerts
- Free for end users

---

### 1.4 RugCheck (rugcheck.xyz) — Solana Token Security

| Attribute | Details |
|---|---|
| **Status** | Active, dominant in Solana token checking |
| **Chains** | Solana only |
| **Pricing** | Free |
| **Token** | Has native token (community-driven) |

**Key Features:**
- Token contract analysis (mint authority, freeze authority, supply manipulation)
- Liquidity analysis (pool size, concentration)
- Ownership distribution analysis (whale detection)
- Verification system for projects (manual + automated)
- Token Extensions analysis (Token-2022)
- Integration with .token domain system
- API for third-party integrations
- Partnership with FluxBeam and other Solana protocols

**Strengths:**
- **#1 brand for Solana token safety** — "rugcheck it" is common Solana slang
- Deep Solana-native expertise
- Verification system creates trust layer
- Community-driven, strong organic adoption
- Free

**Weaknesses:**
- Token-only — doesn't scan wallets, approvals, or portfolio
- No real-time monitoring or alerts
- No AI analysis
- UI is basic/utilitarian
- No transaction simulation

**What they do that ShieldFi doesn't:**
- Deeper token contract analysis (specific rug-pull vectors)
- Project verification system
- Liquidity pool analysis
- Community-driven token reputation system
- Broader token database / trending tokens

**What ShieldFi does that they don't:**
- Wallet-level scanning (approvals, delegations, portfolio)
- AI-powered risk scoring
- Real-time Telegram monitoring
- Transaction history analysis
- Multi-token portfolio view
- No signup required for wallet scans

---

### 1.5 SolSniffer (solsniffer.com) — Solana Token Scanner

| Attribute | Details |
|---|---|
| **Status** | Active |
| **Chains** | Solana only |
| **Pricing** | Free (with premium features likely) |

**Key Features:**
- Token security scoring
- Contract analysis
- Holder analysis
- Trading analytics
- Risk indicators

**Strengths:**
- Clean UI
- Solana-focused
- Combines security with trading analytics

**Weaknesses:**
- Token-only (like RugCheck)
- Less brand recognition than RugCheck
- No wallet scanning
- No alerts or monitoring

---

### 1.6 Additional Relevant Tools

| Tool | What it does | Overlap with ShieldFi |
|---|---|---|
| **Solana FM** | Block explorer + analytics | Transaction data, but no security focus |
| **Step Finance** | Portfolio dashboard | Portfolio tracking, but no security scanning |
| **Solscan** | Block explorer | Transaction history, but no risk analysis |
| **Phantom (built-in)** | Now has Blowfish security built-in | Transaction simulation at signing time |
| **Jupiter** | DEX aggregator | Has basic token verification badges |

---

## 2. Competitive Matrix

| Feature | ShieldFi | De.Fi | Blowfish/Phantom | RugCheck | SolSniffer |
|---|---|---|---|---|---|
| **Solana Support** | ✅ Native | ❌ | ✅ (via Phantom) | ✅ | ✅ |
| **EVM Support** | ❌ | ✅ 14+ chains | ✅ 10+ chains | ❌ | ❌ |
| **Wallet Scanning** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Approval Detection** | ✅ SPL + Token-2022 | ✅ ERC-20 | ❌ | ❌ | ❌ |
| **Approval Revocation** | ⚠️ Unclear | ✅ Best-in-class | ❌ | ❌ | ❌ |
| **Token Risk Scoring** | ✅ AI-powered | ✅ | ❌ | ✅ | ✅ |
| **Token Contract Analysis** | ✅ (mint/freeze auth) | ✅ | ❌ | ✅ Deep | ✅ |
| **Transaction Simulation** | ❌ | ❌ | ✅ Best-in-class | ❌ | ❌ |
| **AI Risk Analysis** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Real-Time Alerts** | ✅ Telegram | ❌ | ❌ | ❌ | ❌ |
| **Portfolio View** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Transaction History** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **No Signup Required** | ✅ | ❌ | N/A (built into wallet) | ✅ | ✅ |
| **Browser Extension** | ❌ | ✅ | ✅ (Phantom) | ❌ | ❌ |
| **API for Developers** | ❌ | ✅ | ✅ ($500/mo+) | ✅ | ❌ |
| **Liquidity Analysis** | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Hack/Scam Database** | ❌ | ✅ (REKT DB) | ❌ | ❌ | ❌ |
| **Pricing** | 🆓 Free | Freemium | $500/mo+ (B2B) | 🆓 Free | 🆓 Free |
| **Status** | ✅ Active | ✅ Active | ⚠️ Phantom-owned | ✅ Active | ✅ Active |

---

## 3. ShieldFi's Unique Advantages

### What only ShieldFi does:
1. **AI-powered wallet risk analysis on Solana** — No one else combines AI + wallet scanning + Solana
2. **Real-time Telegram monitoring** — Unique feature, no competitor offers push alerts for wallet activity
3. **Zero-friction UX** — Paste any address, get results. No signup, no wallet connection, no extension install
4. **Combined wallet + token security** — RugCheck does tokens, De.Fi does wallets (on EVM). ShieldFi does both on Solana
5. **Token-2022 awareness** — Critical as Token Extensions become standard on Solana

### Key Gaps to Address:
1. **No approval revocation** — Users can see risks but can't act on them directly
2. **No browser extension** — Missing the "always-on protection" layer
3. **No transaction simulation** — Can't warn users before they sign a bad transaction
4. **No liquidity/rug-pull analysis** — RugCheck's core strength
5. **No API product** — Missing B2B revenue opportunity
6. **Single chain** — Solana only (though this is also a positioning strength)

---

## 4. Recommended Features to Build Next

### Priority 1 — Quick Wins (High Impact, Lower Effort)
| Feature | Why | Competitive Reference |
|---|---|---|
| **One-click approval revocation** | Complete the scan → detect → fix loop | De.Fi's revoke tool |
| **Deeper token rug-pull analysis** | Liquidity lock status, holder concentration, mint authority checks | RugCheck, SolSniffer |
| **Scam address database** | Crowdsource + maintain known scam addresses | De.Fi REKT DB |

### Priority 2 — Differentiators (High Impact, Medium Effort)
| Feature | Why | Competitive Reference |
|---|---|---|
| **Browser extension** | Always-on protection, phishing URL detection | Wallet Guard (RIP), De.Fi |
| **Pre-transaction warnings** | Warn before signing dangerous transactions in any Solana wallet | Blowfish (now Phantom-only) |
| **API for developers** | B2B revenue + distribution through other wallets/dapps | Blowfish ($500/mo), De.Fi API |

### Priority 3 — Moat Builders (Long-term)
| Feature | Why | Competitive Reference |
|---|---|---|
| **Multi-chain expansion** (EVM basics) | Capture De.Fi's users who also use Solana | De.Fi |
| **Community verification system** | Let the community flag/verify projects | RugCheck verification |
| **Mobile app** | Meet users where they are | No strong competitor here |

---

## 5. Positioning Strategy

### The Narrative

> **"ShieldFi is the free, AI-powered security scanner built specifically for Solana. No signup. No extension. Just paste your wallet address and know if you're safe."**

### Why This Works:

1. **Wallet Guard is dead.** ShieldFi can capture their narrative of "protecting crypto users" but for Solana specifically.

2. **Blowfish is Phantom-only now.** If you use Backpack, Solflare, or any other Solana wallet, you have zero transaction security. ShieldFi can be the security layer for non-Phantom users.

3. **De.Fi doesn't support Solana.** The biggest security platform in crypto simply doesn't cover the chain. ShieldFi owns this gap entirely.

4. **RugCheck only does tokens, not wallets.** ShieldFi is complementary — position alongside RugCheck, not against it. "RugCheck your tokens, ShieldFi your wallet."

### Positioning Pillars:

| Pillar | Message |
|---|---|
| **Solana-native** | "Built for Solana, not bolted on" — unlike De.Fi adding chains as afterthought |
| **AI-first** | "AI risk analysis catches what rule-based scanners miss" |
| **Zero friction** | "No signup, no extension, no wallet connection — just paste and scan" |
| **Free forever** | "Security shouldn't be paywalled" (vs Blowfish $500/mo) |
| **Real-time alerts** | "Know the moment something happens to your wallet" |

### Competitive Positioning Map:

```
                    Wallet-Level Security
                          ↑
                          |
                  ShieldFi ●
                          |
        De.Fi ●           |
      (no Solana)         |
                          |
   Token-Only ←——————————— ——————————→ Full Security
                          |
              RugCheck ●  |        ● Blowfish/Phantom
              SolSniffer ●|        (built into wallet,
                          |         not standalone)
                          |
                    Token-Level Only
```

### Marketing Angles:

1. **"Is your Solana wallet safe?"** — Fear-based, works for security products
2. **"The free security scan Phantom doesn't give you"** — Competitive positioning vs Phantom's built-in Blowfish (which only works at transaction time, not as a health check)
3. **"50,000 wallets lost their security tool when Wallet Guard shut down"** — Capture displaced users
4. **"RugCheck your tokens. ShieldFi your wallet."** — Complementary positioning with the Solana community's favorite tool
5. **Content play:** Publish weekly "Solana Threat Reports" — scam tokens trending, common attack vectors, wallets at risk. Builds authority and SEO.

---

## 6. Key Takeaways

1. **The timing is perfect.** Two major competitors (Wallet Guard, Blowfish as independent) are gone. De.Fi ignores Solana. The market is wide open.

2. **ShieldFi's biggest competitive advantage is focus.** Being Solana-only is a strength, not a weakness. Own the niche before expanding.

3. **The AI angle is genuinely unique.** No competitor uses AI for wallet risk analysis. Lean into this hard.

4. **Telegram alerts are a sleeper feature.** No one else does real-time wallet monitoring with push notifications. This is a retention and engagement driver.

5. **The approval revocation gap must be closed.** Detecting risks without enabling remediation is incomplete. This is the #1 feature to build.

6. **A browser extension would transform ShieldFi** from a "check-up tool" to an "always-on security layer." This is the single biggest missing category.

7. **B2B API is the revenue play.** Blowfish proved wallets will pay $500+/mo for security APIs. ShieldFi could offer Solana-specific security APIs to Backpack, Solflare, etc. — wallets that lost access to Blowfish when Phantom acquired it.

---

*Report compiled from live competitor data as of February 2026. Sources: competitor websites, documentation, CoinMarketCap, PitchBook, crypto media.*

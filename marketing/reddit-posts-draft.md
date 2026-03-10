# Reddit Posts — Ready for April 4+

*Post one per day, starting with r/solana. Answer EVERY comment.*

---

## Post 1: r/solana (Day 1)

**Title:** I built a free Solana wallet scanner — paste any address, see what's lurking inside

**Body:**

Hey r/solana,

I've been working on ShieldFi — a free tool that scans any Solana wallet address and shows you exactly what's in there, including fake tokens, suspicious approvals, and scam airdrops.

**How it works:**
- Paste any Solana wallet address (yours, a friend's, a project treasury)
- Get an instant risk report: token classification, authority checks, approval risks
- AI-powered analysis catches impersonation tokens (fake USDC, fake SOL)
- No wallet connect needed — it's a public lookup

**What it checks:**
- ✅ Token verification status (verified / unknown / suspicious)
- ✅ Mint & freeze authority (can the creator lock or mint more tokens?)
- ✅ Metadata mutability (can they change the token name/symbol?)
- ✅ Delegated approvals (who has permission to move your tokens?)
- ✅ Token-2022 program awareness

**Why I built it:**
Found a fake USDC in my own wallet last month. Turns out most people have no idea what tokens are sitting in their wallets. Existing tools either don't support Solana or require you to connect your wallet first.

It's free, no signup. Just paste and scan.

→ https://shieldfi.app

Would love feedback. What other checks would you want to see?

---

## Post 2: r/CryptoCurrency (Day 2)

**Title:** I scanned 80+ Solana wallets — here's what I found (data inside)

**Body:**

I built a free Solana wallet security scanner (ShieldFi) and have been scanning wallets for the past two weeks. Here's what the data shows:

**Stats from 80+ scans:**
- 73% of wallets had at least one unverified/unknown airdrop token
- ~12% had tokens with active freeze authority (creator can lock your funds)
- Several wallets had impersonation tokens (fake USDC, fake SOL with different mint addresses)
- Most wallet owners had NO IDEA these tokens were there

**The most common issues:**
1. **Airdrop spam** — tokens sent to millions of wallets to lure you to a phishing site
2. **Impersonation tokens** — named "USDC" or "Wrapped SOL" but completely fake
3. **Mutable metadata** — devs can change a token's name/image after you buy it
4. **Undisclosed freeze authority** — creator can freeze your tokens at will

**Context:** Solana's speed and low fees make it trivial for scammers to mass-airdrop fake tokens. Unlike Ethereum where gas costs limit spam, Solana wallets accumulate junk fast.

The tool is completely free, no wallet connect required. Just paste any Solana address.

→ https://shieldfi.app

Not here to shill — genuinely curious if other chains have similar patterns. Anyone seen comparable data on ETH or BSC?

---

## Post 3: r/solanadev (Day 3-4)

**Title:** Built a wallet security tool on Helius API + Token-2022 — looking for dev feedback

**Body:**

Hey devs,

I've been building ShieldFi, a Solana wallet security scanner. Thought this community might have interesting feedback on the technical approach.

**Stack:**
- Fastify backend + plain HTML frontend
- Helius API for transaction data and DAS (Digital Asset Standard)
- Direct RPC calls for token account data
- AI risk scoring for contract analysis
- SQLite (Prisma) for scan caching

**What it does technically:**
- Fetches all token accounts for a given wallet address
- Checks mint authority, freeze authority, metadata mutability
- Compares token names against verified token lists (detects impersonation)
- Analyzes Token-2022 extensions (transfer fees, permanent delegate, etc.)
- Runs AI analysis on suspicious tokens for deeper risk assessment

**What I'm thinking about next:**
- Approval revocation (one-click)
- Holder concentration analysis (flag tokens where top 3 wallets hold >50%)
- Pre-transaction simulation
- Public API for other projects to integrate

**Questions for the community:**
1. Are there Solana-specific rug vectors I'm not checking? (beyond mint/freeze authority)
2. Best approach for detecting honeypot tokens on Solana?
3. Anyone building something complementary?

API endpoints are public if anyone wants to play with them:
- `GET /api/risk/token/:mint` — risk score for any token
- `GET /api/risk/wallet?address=` — full wallet scan

→ https://shieldfi.app

---

## Post 4: r/SolanaMemeCoinz (Day 5)

**Title:** Before you ape into the next memecoin — scan the dev wallet first

**Body:**

Built a free tool that scans any Solana wallet. Before buying a memecoin:

1. Find the deployer/dev wallet on Solscan
2. Paste it into ShieldFi → https://shieldfi.app
3. Check for red flags:
   - **Mint authority still active?** They can print more tokens
   - **Freeze authority?** They can lock your tokens
   - **Mutable metadata?** They can rename the token
   - **Wallet full of dead memecoins?** Serial rugger

Takes 10 seconds. Free. No wallet connect.

Just saved you from aping into something held by a wallet with 47 previous dead memecoins. You're welcome.

→ https://shieldfi.app

---

## Post 5: r/defi (Week 2)

**Title:** Solana DeFi security: what I learned scanning 80+ wallets

**Body:**

Been building a Solana wallet security scanner for the past few weeks. Some observations that might be relevant to the DeFi crowd:

**Key findings:**
- Token approval hygiene on Solana is almost non-existent. Very few users know what delegations they've granted.
- Airdrop spam is industrial-scale — cheap transactions mean scammers can hit millions of wallets for pennies
- Impersonation tokens are sophisticated — correct names, logos, even fake metadata descriptions
- The biggest gap: **no standalone wallet security tool for Solana**. Wallet Guard is dead, Blowfish is Phantom-only now, De.Fi doesn't support Solana.

**For DeFi users specifically:**
If you're interacting with Solana DeFi protocols, you probably have delegated token approvals you've forgotten about. Our scanner shows these and flags risky ones.

Free, no signup, public lookup only: https://shieldfi.app

Interested in hearing how DeFi users on other chains manage approval hygiene. What tools do you use?

---

## COMMENT ENGAGEMENT STRATEGY

When anyone comments:
1. **Thank them** for feedback
2. **Answer specifically** — don't give generic responses
3. **If they drop a wallet** — actually scan it, share what you find
4. **If they have feature requests** — note them, tell them you'll consider it
5. **If they're skeptical** — acknowledge valid concerns, don't get defensive
6. **Never** cold-link without context

## POST TIMING
- Post between 9-11 AM EST (peak Reddit traffic)
- One post per day max
- Don't post on weekends (lower traffic)
- r/solana first (most relevant), then expand

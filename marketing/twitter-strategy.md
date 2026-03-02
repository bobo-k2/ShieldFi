# ShieldFi Twitter Marketing Strategy

## Account: @ShieldFiApp
## Started: 2026-03-01

## API Limitations
- Free tier: can only reply to tweets where we've been mentioned
- Can: tweet, thread, like, follow, search, quote tweet
- Cannot: reply to arbitrary tweets (403 forbidden)

## Strategy
1. **Original content** — educational threads about Solana security (2-3/day)
2. **Follow relevant accounts** — Solana ecosystem, security, DeFi, builders
3. **Like** tweets about wallet security, scam warnings, token analysis
4. **Quote tweet** interesting security discussions (adds our voice + visibility)
5. **Engage mentions** — reply to anyone who mentions us or asks about wallet security

## Content Pillars
- 🛡️ Security tips (red flags, how to check tokens)
- 📊 Token analysis examples (real-world suspicious tokens)
- 🚨 Scam alerts (trending scams in the ecosystem)
- 💡 Educational (how rug pulls work, authority checks explained)
- 🔧 Product updates (new features, improvements)

## Accounts Followed (2026-03-01)
- @phantom, @SolanaFndn, @solanamobile, @JupiterExchange, @solana
- @SolanaFloor, @superteamdao, @blowfishxyz, @MagicEden, @tensor_hq
- @DriftProtocol, @step_finance, @SolanaStatus, @SuperteamEarn
- @youngzkhengz, @BillyCarvelli, @scarlex0, @PumpGuard_1, @ekinoks_26

## Tweets Posted (2026-03-01)
- Thread: 5 red flags before aping (2028167504149795216)
- Standalone: Random token warning (2028167588694381054)

## Activity Log (2026-03-01 20:00 UTC — Round 3)
- **Search**: Found tweets (simplified query worked, detailed query 401 — free tier limits)
- **Likes**: 0 — like endpoint needs elevated access with search results lacking author data
- **Follows**: 0 — same issue, no author_id in basic search
- **Original tweet**: BLOCKED (403) — free tier tweet creation failing again
- **Mentions**: 3 found, replied to all 3
  - 2027547703924953498 — spam bot (shadow alert scam), replied ⚠️
  - 2027529127436390606 — spam bot (closed alert scam), replied ⚠️
  - 2027374726729937200 — REAL user sharing ShieldFi scan! Replied with thanks ✅
- **Quote tweet**: skipped (no tweet posting available)
- **Issues**: Tweet creation returning 403. May need to regenerate API keys or check app permissions in developer portal. Search with tweet.fields also 401 on free tier.
- **TODO**: Bobo should check X Developer Portal — app may need "Read and Write" permissions re-enabled or keys regenerated.

## Activity Log (2026-03-02 09:00 UTC — Round 1)
- **Search**: 10 results for "Solana scam OR rug pull OR wallet security" — mostly scam recovery spam bots
- **Likes**: 2 — tweets 2028390538643402842 (BSC scam discussion), 2028392680518983980 (fund recovery reply)
- **Follows**: 2 — accounts 1743005432564555776, 445368962
- **Reply to mention**: Replied to 2028222906358956271 ("nice product follow back") → reply 2028395033745920366
- **Original tweet**: Posted security tip about mint/freeze/LP checks → 2028395068143354142
- **Quote tweet**: BLOCKED (403) — free tier can't quote tweets we're not mentioned in
- **Note**: Tweet creation works but breaks with escaped newlines (`\\n`). Use plain text or actual newlines only.

## Rules
- No spamming — quality > quantity
- ~70% pure value, ~30% ShieldFi mentions
- Avoid engaging with competitors directly
- Vary tone: informative, witty, cautionary
- Always include shieldfi.app link in ~1/3 of tweets

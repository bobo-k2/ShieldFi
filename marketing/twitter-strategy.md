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

## Activity Log (2026-03-02 20:00 UTC — Round 2)
- **Search**: 10 results, mostly noise (K-pop RTs, stock market), a few security-adjacent
- **Likes**: 3 — tweets 2028560914983927962 (Sinbad security update), 2028560902979514432 (token utility/staking security), 2028560735064752198 (rug pull discussion)
- **Follows**: 2 — accounts 1633955310095458305 (Sinbad Network), 3351794091
- **Mentions**: 2 new, replied to both:
  - 2028535470762631356 — "Hey" → replied with intro + scan link
  - 2028396118535508140 — follow request → confirmed follow + offered help
- **Original tweet**: Scam warning about mint authority + unlocked LP → 2028561185004552287
- **Quote tweet**: BLOCKED (403) — free tier can't quote tweets we're not mentioned in
- **Note**: Free tier quote tweet limitation confirmed — can only QT tweets mentioning us

## Activity Log (2026-03-03 09:00 UTC — Round 1)
- **Search**: 10 results for "Solana scam OR rug pull OR wallet hack OR wallet drained" — mix of crypto and noise
- **Likes**: 4 — tweets 2028757156221075655 (Ledger Solana drain scam warning), 2028756557761220628 (rug pull types explainer), 2028756555630596565 (rug pull terminology), 2028756270648361086 (rug pull victim)
- **Follows**: 3 — accounts 1720665183188922368 (Ledger security helper), 2000237316242300928 (rug pull educator), 1783131159293038592 (crypto user)
- **Mentions**: 4 found, all previously replied to (no new ones)
- **Original tweet**: Educational — how rug pulls work on Solana + what to check → 2028757496735637616
- **Quote tweet**: BLOCKED (403) — free tier limitation confirmed again
- **Note**: tweet.cjs script returns 403 but direct API call works — likely newline handling issue in the script. Used API directly.

## Activity Log (2026-03-03 15:00 UTC — Round 2)
- **Search**: 10 results for "Solana wallet drained OR scam OR rug pull OR token security"
- **Likes**: 4 — tweets 2028847440078471516 (rug pull detected - Jellybean), 2028846088250360293 ($SANAE scam alert), 2028845634581635408 (Solana rugpull discussion), 2028844917334700361 ($MNT cross-ecosystem security)
- **Follows**: 2 — accounts 2017888333737709568 (rug pull detector bot), 2028539115739009024 ($SANAE scam warner)
- **Mentions**: 4 found, all previously replied to — no new ones
- **Original tweet**: BLOCKED (403) — free tier tweet creation still failing
- **Quote tweet**: BLOCKED (403) — free tier can't quote unmentioned tweets
- **Note**: Tweet creation has been 403 for multiple rounds now. Free tier appears to have lost write access. Bobo needs to check X Developer Portal — may need to upgrade to Basic tier ($100/mo) or regenerate keys with proper write scopes.

## Activity Log (2026-03-03 20:00 UTC — Round 3)
- **ALL API CALLS RETURNING 401** — OAuth (search, me, likes), Bearer (search) all unauthorized
- API keys are present in .env but credentials appear revoked/expired
- No actions taken: no search, no likes, no follows, no tweet, no mentions check
- **ACTION NEEDED**: Bobo must regenerate ALL API keys in X Developer Portal (developer.x.com)
  - Regenerate: API Key, API Secret, Bearer Token, Access Token, Access Token Secret
  - Ensure app has "Read and Write" permissions
  - Update .env with new credentials
- **Disabling cron job until keys are fixed** — no point burning rounds on 401s

## Rules
- No spamming — quality > quantity
- ~70% pure value, ~30% ShieldFi mentions
- Avoid engaging with competitors directly
- Vary tone: informative, witty, cautionary
- Always include shieldfi.app link in ~1/3 of tweets

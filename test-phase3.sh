#!/bin/bash
BASE="http://localhost:3001"
PASS=0
FAIL=0
WARN=0

pass() { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠️  WARN: $1"; WARN=$((WARN+1)); }

test_endpoint() {
  local desc="$1" url="$2" expect="$3"
  local result=$(curl -s --max-time 20 "$url" 2>/dev/null)
  if [ -z "$result" ]; then
    fail "$desc — empty response/timeout"
    return 1
  fi
  if echo "$result" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
    if [ -n "$expect" ]; then
      if echo "$result" | grep -q "$expect"; then
        pass "$desc"
      else
        fail "$desc — expected '$expect' not found"
        echo "    Got: $(echo $result | head -c 200)"
      fi
    else
      pass "$desc"
    fi
  else
    fail "$desc — invalid JSON"
    echo "    Got: $(echo $result | head -c 200)"
  fi
  echo "$result"
}

echo "========================================="
echo "ShieldFi Test Suite — $(date)"
echo "========================================="
echo ""

# ---- SECTION 1: Health & Basic Routes ----
echo "--- 1. Health & Basic Routes ---"

r=$(curl -s "$BASE/api/health")
echo "$r" | grep -q '"ok"' && pass "Health endpoint returns ok" || fail "Health endpoint"

r=$(curl -s "$BASE/")
echo "$r" | grep -q "ShieldFi" && pass "Landing page loads" || fail "Landing page loads"

r=$(curl -s "$BASE/dashboard.html")
echo "$r" | grep -q "ShieldFi Dashboard" && pass "Dashboard loads" || fail "Dashboard loads"

echo ""

# ---- SECTION 2: Input Validation ----
echo "--- 2. Input Validation (Edge Cases) ---"

# Invalid address
r=$(curl -s "$BASE/api/approvals/lookup?address=not-a-valid-address")
echo "$r" | grep -q "Invalid" && pass "Rejects invalid address" || fail "Rejects invalid address"

# Empty address
r=$(curl -s "$BASE/api/approvals/lookup?address=")
echo "$r" | grep -q "required\|Invalid" && pass "Rejects empty address" || fail "Rejects empty address"

# No address param
r=$(curl -s "$BASE/api/approvals/lookup")
echo "$r" | grep -q "required" && pass "Rejects missing address param" || fail "Rejects missing address param"

# Invalid mint for risk
r=$(curl -s "$BASE/api/risk/token/not-valid")
echo "$r" | grep -q "Invalid" && pass "Risk: rejects invalid mint" || fail "Risk: rejects invalid mint"

# Invalid address for wallet risk
r=$(curl -s "$BASE/api/risk/wallet?address=xyz")
echo "$r" | grep -q "Invalid" && pass "Wallet risk: rejects invalid address" || fail "Wallet risk: rejects invalid address"

# Invalid address for transactions
r=$(curl -s "$BASE/api/transactions/not-valid")
echo "$r" | grep -qi "invalid\|error" && pass "TX: rejects invalid address" || fail "TX: rejects invalid address"

# Missing address for wallet risk
r=$(curl -s "$BASE/api/risk/wallet")
echo "$r" | grep -q "required" && pass "Wallet risk: rejects missing address" || fail "Wallet risk: rejects missing address"

echo ""

# ---- SECTION 3: Known Verified Tokens ----
echo "--- 3. Known Verified Tokens ---"

for token_info in \
  "USDC:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" \
  "USDT:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" \
  "BONK:DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" \
  "wSOL:So11111111111111111111111111111111111111112"; do
  name="${token_info%%:*}"
  mint="${token_info##*:}"
  r=$(curl -s "$BASE/api/risk/token/$mint")
  level=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('level','?'))" 2>/dev/null)
  [ "$level" = "SAFE" ] && pass "$name detected as SAFE" || fail "$name should be SAFE, got $level"
done

echo ""

# ---- SECTION 4: Bot Wallet (Known Good) ----
echo "--- 4. Bot Wallet Scan (7CXjC..RsBf) ---"
BOT="7CXjC77JNXEqiV9ek2b1rLbJc8eNa1ANMbTMUQ57RsBf"

r=$(curl -s --max-time 30 "$BASE/api/approvals/lookup?address=$BOT")
sol_bal=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);b=d['balances'];sol=[x for x in b if x['symbol']=='SOL'];print(sol[0]['balance'] if sol else 'MISSING')" 2>/dev/null)
[ "$sol_bal" != "MISSING" ] && [ "$sol_bal" != "" ] && pass "SOL balance present: $sol_bal" || fail "SOL balance missing"

sol_usd=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);b=d['balances'];sol=[x for x in b if x['symbol']=='SOL'];print(sol[0].get('usdValue','None'))" 2>/dev/null)
[ "$sol_usd" != "None" ] && [ "$sol_usd" != "" ] && pass "SOL USD price present: \$$sol_usd" || fail "SOL USD price missing"

token_count=$(echo "$r" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('balances',[])))" 2>/dev/null)
[ "$token_count" -gt 1 ] && pass "Multiple tokens returned: $token_count" || fail "Expected multiple tokens, got $token_count"

verified=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len([b for b in d['balances'] if b['status']=='verified']))" 2>/dev/null)
[ "$verified" -gt 0 ] && pass "Has verified tokens: $verified" || fail "No verified tokens"

# Wallet risk analysis
r=$(curl -s --max-time 30 "$BASE/api/risk/wallet?address=$BOT")
level=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('level','?'))" 2>/dev/null)
[ "$level" = "SAFE" ] || [ "$level" = "LOW" ] && pass "Bot wallet risk: $level" || warn "Bot wallet risk unexpectedly: $level"

# Transactions
r=$(curl -s --max-time 20 "$BASE/api/transactions/$BOT?limit=5")
tx_count=$(echo "$r" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('transactions',[])))" 2>/dev/null)
[ "$tx_count" -gt 0 ] && pass "Transactions returned: $tx_count" || fail "No transactions returned"

echo ""

# ---- SECTION 5: Wallet with Unknown Tokens ----
echo "--- 5. Wallet with Unknown Tokens (CKs1E6..WqX) ---"
SPAM="CKs1E69a2e9TmH4mKKLrXFF8kD3ZnwKjoEuXa6sz9WqX"

r=$(curl -s --max-time 30 "$BASE/api/approvals/lookup?address=$SPAM")
unknown=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len([b for b in d['balances'] if b['status']=='unknown']))" 2>/dev/null)
[ "$unknown" -gt 0 ] && pass "Unknown tokens detected: $unknown" || warn "No unknown tokens found (may have changed)"

# Deep risk analysis should flag things
r=$(curl -s --max-time 30 "$BASE/api/risk/wallet?address=$SPAM")
reports=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('tokenReports',[])))" 2>/dev/null)
[ "$reports" -gt 0 ] && pass "Token risk reports generated: $reports" || warn "No risk reports generated"

flags_total=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(len(r['flags']) for r in d.get('tokenReports',[])))" 2>/dev/null)
[ "$flags_total" -gt 0 ] && pass "Risk flags found: $flags_total" || warn "No risk flags found"

# Risk summary contains clickable links
summary=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('summary',''))" 2>/dev/null)
echo "$summary" | grep -q "solscan.io/token/" && pass "Risk summary contains Solscan links" || fail "Risk summary missing Solscan links"

# Risk summary has separate lines (bullet points)
echo "$summary" | grep -q "•" && pass "Risk summary has bullet points" || fail "Risk summary missing bullet formatting"

# High-risk tokens named in summary
echo "$summary" | grep -qi "high-risk" && pass "Summary mentions high-risk tokens" || warn "No high-risk tokens in summary"

# Mint authority tokens named in summary
echo "$summary" | grep -qi "mint authority" && pass "Summary mentions mint authority tokens" || warn "No mint authority in summary"

echo ""

# ---- SECTION 5b: Fake Token Detection ----
echo "--- 5b. Fake Token Detection ---"
# Scan wallet with known fake USDC (6p6xgH...)
FAKEWALLET="6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"
r=$(curl -s --max-time 30 "$BASE/api/approvals/lookup?address=$FAKEWALLET")

# Check that impersonating tokens are prefixed with FAKE
fake_count=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len([b for b in d.get('balances',[]) if 'FAKE' in b.get('symbol','')]))" 2>/dev/null)
[ "$fake_count" -gt 0 ] && pass "Fake token prefix applied: $fake_count token(s)" || warn "No FAKE-prefixed tokens (wallet may have changed)"

# Check suspicious tokens have flags
susp_flags=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(len(b.get('flags',[])) for b in d.get('balances',[]) if b.get('status')=='suspicious'))" 2>/dev/null)
[ "$susp_flags" -gt 0 ] && pass "Suspicious tokens have flags: $susp_flags" || warn "No flags on suspicious tokens"

# Risk analysis also prefixes fake tokens
r2=$(curl -s --max-time 30 "$BASE/api/risk/wallet?address=$FAKEWALLET")
fake_in_reports=$(echo "$r2" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len([r for r in d.get('tokenReports',[]) if 'FAKE' in (r.get('symbol','') or '')]))" 2>/dev/null)
[ "$fake_in_reports" -gt 0 ] && pass "Risk analysis prefixes fake tokens: $fake_in_reports" || warn "No FAKE prefix in risk reports"

echo ""

# ---- SECTION 6: Empty/New Wallet ----
echo "--- 6. Empty/New Wallet ---"
# Fresh random wallet — almost certainly empty
EMPTY="Bnk2JbxLaiGFawCCFo9LkPX7GZuUxszQQ8Mhgrm4faAV"

r=$(curl -s --max-time 15 "$BASE/api/approvals/lookup?address=$EMPTY")
empty_count=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);b=[x for x in d.get('balances',[]) if x.get('mint')!='native'];print(len(b))" 2>/dev/null)
[ "$empty_count" = "0" ] && pass "Empty wallet: no SPL tokens" || warn "Empty wallet returned $empty_count tokens"

# SOL balance should still work even for near-empty
sol_exists=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);sol=[x for x in d['balances'] if x['symbol']=='SOL'];print('yes' if sol else 'no')" 2>/dev/null)
[ "$sol_exists" = "yes" ] && pass "SOL balance returned for empty wallet" || fail "No SOL balance for empty wallet"

echo ""

# ---- SECTION 7: Transaction Edge Cases ----
echo "--- 7. Transaction Edge Cases ---"

# Limit param
r=$(curl -s --max-time 15 "$BASE/api/transactions/$BOT?limit=1")
count=$(echo "$r" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('transactions',[])))" 2>/dev/null)
[ "$count" = "1" ] && pass "TX limit=1 works" || warn "TX limit=1 returned $count"

# Over max limit (should cap at 50)
r=$(curl -s --max-time 15 "$BASE/api/transactions/$BOT?limit=100")
count=$(echo "$r" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('transactions',[])))" 2>/dev/null)
[ "$count" -le 50 ] && pass "TX limit capped at 50 (got $count)" || fail "TX limit not capped: $count"

echo ""

# ---- SECTION 8: Risk Analysis Single Tokens ----
echo "--- 8. Single Token Risk Analysis ---"

# Non-existent token
r=$(curl -s "$BASE/api/risk/token/1111111111111111111111111111111111111111111")
level=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('level','?'))" 2>/dev/null)
[ "$level" != "SAFE" ] && pass "Non-existent token not SAFE: $level" || fail "Non-existent token flagged as SAFE"

echo ""

# ---- SECTION 9: Monitor Routes ----
echo "--- 9. Monitor Routes ---"

# Check status for non-monitored wallet
r=$(curl -s "$BASE/api/monitor/$BOT/status")
monitored=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('isMonitored',None))" 2>/dev/null)
[ "$monitored" = "False" ] && pass "Non-monitored wallet status correct" || warn "Monitor status: $monitored"

# Start monitoring
r=$(curl -s -X POST "$BASE/api/monitor/add" -H "Content-Type: application/json" -d "{\"address\":\"$BOT\"}")
echo "$r" | grep -q "error" && fail "Start monitoring failed" || pass "Start monitoring succeeded"

# Check now monitored
r=$(curl -s "$BASE/api/monitor/$BOT/status")
monitored=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('isMonitored',None))" 2>/dev/null)
[ "$monitored" = "True" ] && pass "Wallet now monitored" || fail "Wallet not monitored after add"

# Get alerts (should be empty or have some)
r=$(curl -s "$BASE/api/monitor/$BOT/alerts")
echo "$r" | python3 -c "import sys,json;json.load(sys.stdin)" 2>/dev/null && pass "Monitor alerts endpoint works" || fail "Monitor alerts endpoint broken"

# Check expiry field returned
r=$(curl -s "$BASE/api/monitor/$BOT/status")
expires=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print('yes' if d.get('expiresAt') else 'no')" 2>/dev/null)
[ "$expires" = "yes" ] && pass "Monitor expiry field present" || warn "Monitor expiry not in status response"

# Renew monitoring
r=$(curl -s -X POST "$BASE/api/monitor/renew" -H "Content-Type: application/json" -d "{\"address\":\"$BOT\"}")
echo "$r" | grep -q "success" && pass "Monitor renew works" || fail "Monitor renew failed"

# List monitors shows limit info
r=$(curl -s "$BASE/api/monitor")
has_limit=$(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin);print('yes' if 'limit' in d else 'no')" 2>/dev/null)
[ "$has_limit" = "yes" ] && pass "Monitor list includes limit info" || fail "Monitor list missing limit info"

# Stop monitoring
r=$(curl -s -X DELETE "$BASE/api/monitor/$BOT")
echo "$r" | grep -q "error" && fail "Stop monitoring failed" || pass "Stop monitoring succeeded"

# Rate limit test: add 5 wallets then try a 6th
FAKE_ADDRS=("1111111111111111111111111111111111" "2222222222222222222222222222222222" "3333333333333333333333333333333333" "4444444444444444444444444444444444" "5555555555555555555555555555555555")
for addr in "${FAKE_ADDRS[@]}"; do
  curl -s -X POST "$BASE/api/monitor/add" -H "Content-Type: application/json" -d "{\"address\":\"$addr\"}" > /dev/null
done
r=$(curl -s -X POST "$BASE/api/monitor/add" -H "Content-Type: application/json" -d "{\"address\":\"6666666666666666666666666666666666\"}")
echo "$r" | grep -q "limit" && pass "Monitor rate limit enforced (6th wallet rejected)" || fail "Monitor rate limit NOT enforced"
# Cleanup fake monitors
for addr in "${FAKE_ADDRS[@]}"; do
  curl -s -X DELETE "$BASE/api/monitor/$addr" > /dev/null
done

echo ""

# ---- SECTION 10: Auth Routes ----
echo "--- 10. Auth Routes ---"

# Nonce generation
r=$(curl -s -X POST "$BASE/api/auth/nonce" -H "Content-Type: application/json" -d "{\"wallet\":\"$BOT\"}")
nonce=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('nonce','NONE'))" 2>/dev/null)
[ "$nonce" != "NONE" ] && pass "Nonce generated" || fail "Nonce generation failed"

# Auth with bad signature
r=$(curl -s -X POST "$BASE/api/auth/verify" -H "Content-Type: application/json" -d "{\"wallet\":\"$BOT\",\"signature\":\"bad\",\"nonce\":\"$nonce\"}")
echo "$r" | grep -qi "error\|invalid\|fail" && pass "Rejects bad signature" || fail "Accepted bad signature!"

# Protected route without token
r=$(curl -s "$BASE/api/approvals")
echo "$r" | grep -qi "unauthorized\|error\|401" && pass "Protected route requires auth" || fail "Protected route accessible without auth"

# Protected route with fake JWT
r=$(curl -s "$BASE/api/approvals" -H "Authorization: Bearer fake.jwt.token")
echo "$r" | grep -qi "unauthorized\|error\|invalid" && pass "Rejects fake JWT" || fail "Accepted fake JWT!"

echo ""

# ---- SUMMARY ----
echo "========================================="
echo "RESULTS: ✅ $PASS passed | ❌ $FAIL failed | ⚠️  $WARN warnings"
echo "========================================="

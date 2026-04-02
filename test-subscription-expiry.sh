#!/bin/bash
BASE="http://localhost:3001"
PASS=0
FAIL=0
WARN=0
DB="prisma/dev.db"

pass() { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠️  WARN: $1"; WARN=$((WARN+1)); }

# Test wallet address (fake, just for DB testing)
TEST_WALLET="SubExpiryTestWallet111111111111111"

cleanup() {
  sqlite3 "$DB" "DELETE FROM subscriptions WHERE walletAddress='$TEST_WALLET';" 2>/dev/null
}

echo "========================================="
echo "ShieldFi Subscription Expiry Tests — $(date)"
echo "========================================="
echo ""

# Clean up any leftover test data
cleanup

# ---- SECTION 1: Active subscription returns correct plan ----
echo "--- 1. Active Subscription Status ---"

# Insert an active subscription expiring in 20 days
EXPIRES_FUTURE=$(python3 -c "from datetime import datetime,timedelta;print((datetime.utcnow()+timedelta(days=20)).strftime('%Y-%m-%dT%H:%M:%S.000Z'))")
sqlite3 "$DB" "INSERT INTO subscriptions (id, walletAddress, plan, status, startsAt, expiresAt, createdAt, updatedAt) VALUES ('test-sub-1', '$TEST_WALLET', 'guardian', 'active', datetime('now'), '$EXPIRES_FUTURE', datetime('now'), datetime('now'));"

r=$(curl -s "$BASE/api/subscription/status?wallet=$TEST_WALLET")
plan=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('plan','?'))" 2>/dev/null)
[ "$plan" = "guardian" ] && pass "Active sub returns guardian plan" || fail "Active sub expected guardian, got $plan"

# No warning for sub expiring in 20 days
warning=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('warning',None))" 2>/dev/null)
[ "$warning" = "None" ] && pass "No warning for sub expiring in 20 days" || fail "Unexpected warning for far-future sub: $warning"

echo ""

# ---- SECTION 2: Subscription expiring within 7 days shows warning ----
echo "--- 2. Expiry Warning (within 7 days) ---"

EXPIRES_5DAYS=$(python3 -c "from datetime import datetime,timedelta;print((datetime.utcnow()+timedelta(days=5)).strftime('%Y-%m-%dT%H:%M:%S.000Z'))")
sqlite3 "$DB" "UPDATE subscriptions SET expiresAt='$EXPIRES_5DAYS' WHERE walletAddress='$TEST_WALLET';"

r=$(curl -s "$BASE/api/subscription/status?wallet=$TEST_WALLET")
warn_level=$(echo "$r" | python3 -c "import sys,json;w=json.load(sys.stdin).get('warning');print(w['level'] if w else 'none')" 2>/dev/null)
[ "$warn_level" = "warning" ] && pass "Warning level for 5-day expiry" || fail "Expected warning level, got $warn_level"

warn_days=$(echo "$r" | python3 -c "import sys,json;w=json.load(sys.stdin).get('warning');print(w['daysLeft'] if w else '?')" 2>/dev/null)
[ "$warn_days" -le 6 ] && [ "$warn_days" -ge 4 ] && pass "Days left correct (~5): $warn_days" || fail "Days left wrong: $warn_days"

echo ""

# ---- SECTION 3: Grace period logic ----
echo "--- 3. Grace Period ---"

# Set subscription as expired 1 day ago with status='grace'
EXPIRES_1DAYAGO=$(python3 -c "from datetime import datetime,timedelta;print((datetime.utcnow()-timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S.000Z'))")
sqlite3 "$DB" "UPDATE subscriptions SET expiresAt='$EXPIRES_1DAYAGO', status='grace' WHERE walletAddress='$TEST_WALLET';"

r=$(curl -s "$BASE/api/subscription/status?wallet=$TEST_WALLET")
plan=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('plan','?'))" 2>/dev/null)
[ "$plan" = "guardian" ] && pass "Grace period still returns guardian plan" || fail "Grace period expected guardian, got $plan"

warn_level=$(echo "$r" | python3 -c "import sys,json;w=json.load(sys.stdin).get('warning');print(w['level'] if w else 'none')" 2>/dev/null)
[ "$warn_level" = "danger" ] && pass "Grace period shows danger warning" || fail "Grace period expected danger, got $warn_level"

# Status in response should be 'grace'
sub_status=$(echo "$r" | python3 -c "import sys,json;s=json.load(sys.stdin).get('subscription',{});print(s.get('status','?'))" 2>/dev/null)
[ "$sub_status" = "grace" ] && pass "Subscription status is 'grace'" || fail "Expected status grace, got $sub_status"

echo ""

# ---- SECTION 4: Expired past grace period returns free ----
echo "--- 4. Expired Past Grace Period ---"

# Set subscription as expired 5 days ago (past 3-day grace)
EXPIRES_5DAYSAGO=$(python3 -c "from datetime import datetime,timedelta;print((datetime.utcnow()-timedelta(days=5)).strftime('%Y-%m-%dT%H:%M:%S.000Z'))")
sqlite3 "$DB" "UPDATE subscriptions SET expiresAt='$EXPIRES_5DAYSAGO', status='expired' WHERE walletAddress='$TEST_WALLET';"

r=$(curl -s "$BASE/api/subscription/status?wallet=$TEST_WALLET")
plan=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('plan','?'))" 2>/dev/null)
[ "$plan" = "free" ] && pass "Expired sub returns free plan" || fail "Expired sub expected free, got $plan"

echo ""

# ---- SECTION 5: Status endpoint includes warning object structure ----
echo "--- 5. Warning Object Structure ---"

# Reset to expiring soon
EXPIRES_2DAYS=$(python3 -c "from datetime import datetime,timedelta;print((datetime.utcnow()+timedelta(days=2)).strftime('%Y-%m-%dT%H:%M:%S.000Z'))")
sqlite3 "$DB" "UPDATE subscriptions SET expiresAt='$EXPIRES_2DAYS', status='active' WHERE walletAddress='$TEST_WALLET';"

r=$(curl -s "$BASE/api/subscription/status?wallet=$TEST_WALLET")
has_warning=$(echo "$r" | python3 -c "import sys,json;w=json.load(sys.stdin).get('warning',{});print('yes' if w and 'level' in w and 'message' in w and 'daysLeft' in w else 'no')" 2>/dev/null)
[ "$has_warning" = "yes" ] && pass "Warning object has level, message, daysLeft" || fail "Warning object missing fields"

echo ""

# ---- SECTION 6: Notification dedup via lastNotificationType ----
echo "--- 6. Notification Dedup ---"

# Set lastNotificationType to '3day'
sqlite3 "$DB" "UPDATE subscriptions SET lastNotificationType='3day', lastNotifiedAt=datetime('now') WHERE walletAddress='$TEST_WALLET';"

# Verify the field was set
notif_type=$(sqlite3 "$DB" "SELECT lastNotificationType FROM subscriptions WHERE walletAddress='$TEST_WALLET';" 2>/dev/null)
[ "$notif_type" = "3day" ] && pass "lastNotificationType stored: $notif_type" || fail "lastNotificationType not stored: $notif_type"

# Verify lastNotifiedAt was set
notif_at=$(sqlite3 "$DB" "SELECT lastNotifiedAt FROM subscriptions WHERE walletAddress='$TEST_WALLET';" 2>/dev/null)
[ -n "$notif_at" ] && pass "lastNotifiedAt stored: $notif_at" || fail "lastNotifiedAt not stored"

echo ""

# ---- SECTION 7: DB schema has new columns ----
echo "--- 7. DB Schema Verification ---"

cols=$(sqlite3 "$DB" "PRAGMA table_info(subscriptions);" 2>/dev/null)
echo "$cols" | grep -q "lastNotifiedAt" && pass "DB: lastNotifiedAt column exists" || fail "DB: lastNotifiedAt column missing"
echo "$cols" | grep -q "lastNotificationType" && pass "DB: lastNotificationType column exists" || fail "DB: lastNotificationType column missing"

echo ""

# ---- SECTION 8: Free wallet returns no warning ----
echo "--- 8. Free Wallet (No Subscription) ---"

FREE_WALLET="FreeWalletNoSubTestAddr111111111111"
r=$(curl -s "$BASE/api/subscription/status?wallet=$FREE_WALLET")
plan=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('plan','?'))" 2>/dev/null)
[ "$plan" = "free" ] && pass "No-sub wallet returns free" || fail "No-sub wallet expected free, got $plan"

warning=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin).get('warning',None))" 2>/dev/null)
[ "$warning" = "None" ] && pass "No warning for free wallet" || fail "Unexpected warning for free wallet: $warning"

echo ""

# ---- Cleanup ----
cleanup

# ---- SUMMARY ----
echo "========================================="
echo "RESULTS: ✅ $PASS passed | ❌ $FAIL failed | ⚠️  $WARN warnings"
echo "========================================="

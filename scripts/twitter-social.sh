#!/bin/bash
# ShieldFi Twitter Social — like relevant tweets and follow accounts
# Runs standalone via system cron, no AI agent needed
set -uo pipefail

echo "=== ShieldFi Twitter Social ==="
echo "$(date -u '+%Y-%m-%d %H:%M UTC')"

LIKED=0
FOLLOWED=0

# Like relevant timeline posts
echo "--- Liking relevant posts ---"
xurl timeline -n 25 2>/dev/null | python3 -c "
import sys, json
from datetime import datetime, timezone, timedelta
keywords = ['solana', 'wallet', 'hack', 'scam', 'rug', 'security', 'exploit', 'phishing', 'defi', 'web3', 'crypto']
try:
    data = json.load(sys.stdin)
    now = datetime.now(timezone.utc)
    users = {u['id']: u for u in data.get('includes', {}).get('users', [])}
    count = 0
    for t in data.get('data', []):
        text = t['text']
        if text.startswith('RT @'): continue
        text_lower = text.lower()
        if not any(k in text_lower for k in keywords): continue
        try:
            dt = datetime.fromisoformat(t['created_at'].replace('Z','+00:00'))
            if (now - dt) > timedelta(hours=24): continue
        except: pass
        uid = t.get('author_id','')
        uname = users.get(uid, {}).get('username', '?')
        clean = text.replace('\n',' ')[:100]
        print(f\"{t['id']}|{uname}|{clean}\")
        count += 1
        if count >= 5: break
except: pass
" 2>/dev/null | while IFS='|' read -r tid uname text; do
    RESULT=$(xurl like "$tid" 2>&1)
    if echo "$RESULT" | grep -q '"liked"'; then
        echo "  ✅ Liked @$uname: $text"
        LIKED=$((LIKED+1))
    else
        echo "  ⏭️ Skip @$uname (already liked or error)"
    fi
done

# Follow interesting accounts from timeline
echo ""
echo "--- Following relevant accounts ---"
xurl timeline -n 25 2>/dev/null | python3 -c "
import sys, json
keywords = ['solana', 'security', 'wallet', 'defi', 'web3']
try:
    data = json.load(sys.stdin)
    users = {u['id']: u for u in data.get('includes', {}).get('users', [])}
    seen = set()
    count = 0
    for t in data.get('data', []):
        uid = t.get('author_id','')
        u = users.get(uid, {})
        uname = u.get('username','')
        if not uname or uname in seen: continue
        seen.add(uname)
        followers = u.get('public_metrics', {}).get('followers_count', 0)
        # Target 500-50K followers in our niche
        if followers < 500 or followers > 50000: continue
        bio = u.get('description', '').lower()
        if any(k in bio for k in keywords):
            print(uname)
            count += 1
            if count >= 2: break
except: pass
" 2>/dev/null | while read -r uname; do
    RESULT=$(xurl follow "$uname" 2>&1)
    if echo "$RESULT" | grep -q '"following"'; then
        echo "  ✅ Followed @$uname"
    else
        echo "  ⏭️ Skip @$uname (already following or error)"
    fi
done

echo ""
echo "=== Done ==="

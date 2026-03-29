#!/bin/bash
# ShieldFi Twitter Engagement — reply to ONE mention or like timeline posts
# Self-contained: no agent thinking needed
set -uo pipefail

echo "=== ShieldFi Twitter Engage ==="

# Get our recent replies to avoid double-replying
REPLIED_TO=$(xurl search "from:ShieldFiApp" -n 10 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    ids = set()
    for t in data.get('data', []):
        cid = t.get('conversation_id','')
        if cid and cid != t['id']: ids.add(cid)
        for r in t.get('referenced_tweets', []): ids.add(r.get('id',''))
    print(','.join(ids))
except: pass
" 2>/dev/null)

# Check mentions (priority — these we CAN always reply to)
MENTION_TARGET=$(xurl mentions -n 5 2>/dev/null | python3 -c "
import sys, json
from datetime import datetime, timezone, timedelta
replied = set('${REPLIED_TO}'.split(','))
try:
    data = json.load(sys.stdin)
    now = datetime.now(timezone.utc)
    for t in data.get('data', []):
        tid = t['id']
        conv = t.get('conversation_id','')
        if tid in replied or conv in replied: continue
        try:
            dt = datetime.fromisoformat(t['created_at'].replace('Z','+00:00'))
            if (now - dt) > timedelta(hours=48): continue
        except: pass
        if t['text'].startswith('RT @'): continue
        clean = t['text'].replace('\n',' ').replace('|',' ')[:200]
        print(f\"{tid}|{clean}\")
        break
except: pass
" 2>/dev/null)

if [ -n "$MENTION_TARGET" ]; then
    TARGET_ID=$(echo "$MENTION_TARGET" | head -1 | cut -d'|' -f1)
    TARGET_TEXT=$(echo "$MENTION_TARGET" | head -1 | cut -d'|' -f2-)
    echo "Replying to mention: $TARGET_ID"
    echo "Text: $TARGET_TEXT"
    
    TEXT_LOWER=$(echo "$TARGET_TEXT" | tr '[:upper:]' '[:lower:]')
    REPLY=""
    
    if echo "$TEXT_LOWER" | grep -qE 'wallet|scan|check|security|safe'; then
        REPLY="Thanks! Paste any Solana wallet address at shieldfi.app for an instant security scan — no signup needed 🛡️"
    elif echo "$TEXT_LOWER" | grep -qE 'nice|good|amazing|wow|great|love|fire'; then
        REPLY="Appreciate it! Shipping fast and building in public ⚡"
    elif echo "$TEXT_LOWER" | grep -qE 'how|what|when|where|\?'; then
        REPLY="Great question! Drop by our Discord or DM us — happy to help 🙌"
    else
        REPLY="Thanks for the support! More features dropping soon 🔥"
    fi
    
    echo "Reply: $REPLY"
    RESULT=$(xurl reply "$TARGET_ID" "$REPLY" 2>&1)
    echo "$RESULT"
    
    if echo "$RESULT" | grep -q '"id"'; then
        echo "STATUS: REPLIED_OK to mention $TARGET_ID"
    else
        echo "STATUS: REPLY_FAILED to mention $TARGET_ID"
    fi
    exit 0
fi

echo "No unreplied mentions found."

# No mentions — like relevant timeline posts instead
echo ""
echo "--- Liking relevant timeline posts ---"
LIKED=0
xurl timeline -n 20 2>/dev/null | python3 -c "
import sys, json
from datetime import datetime, timezone, timedelta
keywords = ['solana', 'wallet', 'hack', 'scam', 'rug', 'security', 'exploit', 'phishing', 'drain', 'defi', 'web3']
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
        if count >= 3: break
except: pass
" 2>/dev/null | while IFS='|' read -r tid uname text; do
    echo "Liking @$uname: $text"
    xurl like "$tid" 2>&1 | grep -q '"liked"' && echo "  ✅ Liked" || echo "  ❌ Failed"
    LIKED=$((LIKED+1))
done

echo ""
echo "STATUS: LIKED timeline posts (no mentions to reply to)"

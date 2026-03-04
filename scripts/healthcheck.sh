#!/usr/bin/env bash
# ShieldFi Health Check - outputs JSON health report
set -o pipefail

FAILURES=()
CHECKS="{}"

add_check() {
  local name="$1" status="$2" detail="$3"
  CHECKS=$(echo "$CHECKS" | jq --arg n "$name" --arg s "$status" --arg d "$detail" '. + {($n): {"status": $s, "detail": $d}}')
  [[ "$status" != "ok" ]] && FAILURES+=("$name: $detail")
}

# 1. App responding
if curl -sf -o /dev/null -w '' --max-time 10 https://shieldfi.app; then
  add_check "app_http" "ok" "HTTP 200"
else
  add_check "app_http" "fail" "App not responding"
fi

# 2. Stats API
STATS=$(curl -sf --max-time 10 https://shieldfi.app/api/stats 2>/dev/null)
if echo "$STATS" | jq . >/dev/null 2>&1; then
  add_check "stats_api" "ok" "Valid JSON"
else
  add_check "stats_api" "fail" "Stats API not returning valid JSON"
fi

# 3. Scan API
SCAN=$(curl -sf --max-time 15 "https://shieldfi.app/api/risk/wallet?address=CtGXh8D9MyXaPcEutWdMRe3QfZ1mteh7wvCBfTG9wYym" 2>/dev/null)
if echo "$SCAN" | jq . >/dev/null 2>&1; then
  add_check "scan_api" "ok" "Valid JSON"
else
  add_check "scan_api" "fail" "Scan API not returning valid JSON"
fi

# 4. PM2 shieldfi process
PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="shieldfi") | .pm2_env.status' 2>/dev/null)
if [[ "$PM2_STATUS" == "online" ]]; then
  add_check "pm2_shieldfi" "ok" "online"
else
  add_check "pm2_shieldfi" "fail" "Status: ${PM2_STATUS:-not found}"
fi

# 5. PM2 shieldfi-tunnel process
TUNNEL_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="shieldfi-tunnel") | .pm2_env.status' 2>/dev/null)
if [[ "$TUNNEL_STATUS" == "online" ]]; then
  add_check "pm2_tunnel" "ok" "online"
else
  add_check "pm2_tunnel" "fail" "Status: ${TUNNEL_STATUS:-not found}"
fi

# 6. Disk space
DISK_FREE_MB=$(df -m / | awk 'NR==2{print $4}')
if [[ "$DISK_FREE_MB" -ge 500 ]]; then
  add_check "disk_space" "ok" "${DISK_FREE_MB}MB free"
else
  add_check "disk_space" "warn" "Only ${DISK_FREE_MB}MB free (<500MB)"
fi

# 7. Memory
MEM_AVAIL_MB=$(awk '/MemAvailable/{printf "%d", $2/1024}' /proc/meminfo)
if [[ "$MEM_AVAIL_MB" -ge 200 ]]; then
  add_check "memory" "ok" "${MEM_AVAIL_MB}MB available"
else
  add_check "memory" "warn" "Only ${MEM_AVAIL_MB}MB available (<200MB)"
fi

# 8. Recent errors
RECENT_ERRORS=$(pm2 logs shieldfi --err --lines 20 --nostream 2>/dev/null | grep -c -i "error" || true)
if [[ "$RECENT_ERRORS" -eq 0 ]]; then
  add_check "recent_errors" "ok" "No recent errors"
else
  add_check "recent_errors" "warn" "${RECENT_ERRORS} error lines in recent logs"
fi

# Build output
HEALTHY=true
[[ ${#FAILURES[@]} -gt 0 ]] && HEALTHY=false

FAIL_JSON=$(printf '%s\n' "${FAILURES[@]}" | jq -R . | jq -s .)
[[ -z "$FAIL_JSON" || "$FAIL_JSON" == "null" ]] && FAIL_JSON="[]"

jq -n --argjson healthy "$HEALTHY" --argjson checks "$CHECKS" --argjson failures "$FAIL_JSON" \
  '{"healthy": $healthy, "checks": $checks, "failures": $failures, "timestamp": now | todate}'

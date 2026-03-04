#!/usr/bin/env bash
# ShieldFi Auto-Fix - attempts to recover common issues
set -o pipefail

ACTIONS=()

log() { echo "[$(date -u +%H:%M:%S)] $*"; ACTIONS+=("$*"); }

# Check and restart shieldfi if not online
PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="shieldfi") | .pm2_env.status' 2>/dev/null)
if [[ "$PM2_STATUS" != "online" ]]; then
  log "Restarting shieldfi (was: ${PM2_STATUS:-not found})"
  pm2 restart shieldfi 2>&1
fi

# Check and restart tunnel if not online
TUNNEL_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="shieldfi-tunnel") | .pm2_env.status' 2>/dev/null)
if [[ "$TUNNEL_STATUS" != "online" ]]; then
  log "Restarting shieldfi-tunnel (was: ${TUNNEL_STATUS:-not found})"
  pm2 restart shieldfi-tunnel 2>&1
fi

# Clear logs if too large (>50MB)
LOG_PATH=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="shieldfi") | .pm2_env.pm_err_log_path' 2>/dev/null)
if [[ -n "$LOG_PATH" && -f "$LOG_PATH" ]]; then
  LOG_SIZE=$(stat -c%s "$LOG_PATH" 2>/dev/null || echo 0)
  if [[ "$LOG_SIZE" -gt 52428800 ]]; then
    log "Flushing shieldfi logs (${LOG_SIZE} bytes)"
    pm2 flush shieldfi 2>&1
  fi
fi

if [[ ${#ACTIONS[@]} -eq 0 ]]; then
  echo '{"actions": [], "message": "Everything looks fine, no fixes needed"}'
else
  printf '%s\n' "${ACTIONS[@]}" | jq -R . | jq -s '{actions: ., message: "Auto-fix applied"}'
fi

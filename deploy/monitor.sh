#!/bin/bash
set -euo pipefail

# ============================================================
# BossZap — Health Monitor with Telegram Alerts
# Add to crontab: */5 * * * * /opt/bosszap/deploy/monitor.sh
# Runs every 5 minutes, sends Telegram alert on failure
# ============================================================

# Configuration
API_URL="http://127.0.0.1:3000/api/v1/health"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
LOG_FILE="/opt/bosszap/logs/monitor.log"
STATE_FILE="/tmp/bosszap_monitor_state"

# Load env vars
if [ -f /opt/bosszap/.env ]; then
  set -a
  source /opt/bosszap/.env
  set +a
fi

mkdir -p "$(dirname "$LOG_FILE")"

send_telegram() {
  local message="$1"
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_CHAT_ID" \
      -d text="$message" \
      -d parse_mode="HTML" > /dev/null 2>&1
  fi
}

check_service() {
  local name="$1"
  local container="$2"

  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "OK"
  else
    echo "DOWN"
  fi
}

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
ISSUES=""

# Check containers
for service in "Backend:bosszap-backend" "Database:bosszap-postgres" "Redis:bosszap-redis" "App:bosszap-app" "Admin:bosszap-admin" "Landing:bosszap-landing"; do
  NAME="${service%%:*}"
  CONTAINER="${service##*:}"
  STATUS=$(check_service "$NAME" "$CONTAINER")
  if [ "$STATUS" != "OK" ]; then
    ISSUES="${ISSUES}\n- ${NAME} is DOWN (${CONTAINER})"
  fi
done

# Check API health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$API_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  ISSUES="${ISSUES}\n- API health check failed (HTTP ${HTTP_CODE})"
fi

# Check disk usage
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
  ISSUES="${ISSUES}\n- Disk usage at ${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
if [ "$MEM_USAGE" -gt 90 ]; then
  ISSUES="${ISSUES}\n- Memory usage at ${MEM_USAGE}%"
fi

# Determine state
PREV_STATE=$(cat "$STATE_FILE" 2>/dev/null || echo "OK")

if [ -n "$ISSUES" ]; then
  CURRENT_STATE="ALERT"

  # Only send alert if state changed (avoid spam)
  if [ "$PREV_STATE" != "ALERT" ]; then
    MESSAGE="<b>BossZap Alert</b>

Issues detected at ${TIMESTAMP}:
$(echo -e "$ISSUES")

Server: $(hostname)
Check logs: <code>docker compose -f docker-compose.prod.yml logs --tail 50</code>"

    send_telegram "$MESSAGE"
    echo "[$TIMESTAMP] ALERT sent: $ISSUES" >> "$LOG_FILE"
  fi
else
  CURRENT_STATE="OK"

  # Send recovery notification if previously alerted
  if [ "$PREV_STATE" = "ALERT" ]; then
    send_telegram "<b>BossZap Recovered</b>

All services are back to normal at ${TIMESTAMP}."
    echo "[$TIMESTAMP] RECOVERED - all services OK" >> "$LOG_FILE"
  fi
fi

echo "$CURRENT_STATE" > "$STATE_FILE"

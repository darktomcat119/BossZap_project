#!/bin/bash
set -euo pipefail

# ============================================================
# BossZap — Install Cron Jobs
# Usage: sudo ./deploy/setup-crontab.sh
# ============================================================

APP_DIR="/opt/bosszap"
CRON_FILE="/etc/cron.d/bosszap"

cat > "$CRON_FILE" << EOF
# BossZap scheduled tasks
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Database backup — daily at 3 AM
0 3 * * * root ${APP_DIR}/deploy/backup.sh >> ${APP_DIR}/logs/backup.log 2>&1

# Health monitor — every 5 minutes
*/5 * * * * root ${APP_DIR}/deploy/monitor.sh

# Clean old Docker images — weekly on Sunday at 4 AM
0 4 * * 0 root docker image prune -af --filter "until=168h" >> ${APP_DIR}/logs/cleanup.log 2>&1

# Rotate logs — daily at 2 AM
0 2 * * * root find ${APP_DIR}/logs -name "*.log" -size +50M -exec truncate -s 0 {} \;
EOF

chmod 644 "$CRON_FILE"
mkdir -p "${APP_DIR}/logs"

echo "Cron jobs installed at ${CRON_FILE}:"
echo ""
cat "$CRON_FILE" | grep -v "^#" | grep -v "^$" | grep -v "^SHELL" | grep -v "^PATH"
echo ""
echo "Verify with: crontab -l (or check /etc/cron.d/bosszap)"

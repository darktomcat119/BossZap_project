#!/bin/bash
set -euo pipefail

# ============================================================
# BossZap — Automated PostgreSQL Backup
# Add to crontab: 0 3 * * * /opt/bosszap/deploy/backup.sh
# Runs daily at 3 AM, uploads to S3, keeps 30 days locally
# ============================================================

BACKUP_DIR="/opt/bosszap/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="bosszap_backup_${TIMESTAMP}.sql.gz"
S3_BUCKET="${AWS_S3_BUCKET:-bosszap-backups}"
S3_PATH="s3://${S3_BUCKET}/db-backups/"
KEEP_LOCAL_DAYS=30

# Load env vars
if [ -f /opt/bosszap/.env ]; then
  set -a
  source /opt/bosszap/.env
  set +a
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Dump from Docker container
docker compose -f /opt/bosszap/docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-bosszap}" "${POSTGRES_DB:-bosszap}" \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${FILESIZE})"

# Upload to S3 (if AWS CLI is installed and configured)
if command -v aws &>/dev/null && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "${S3_PATH}" --quiet
  echo "[$(date)] Uploaded to S3: ${S3_PATH}${BACKUP_FILE}"
else
  echo "[$(date)] AWS CLI not configured, skipping S3 upload"
fi

# Clean up old local backups
find "$BACKUP_DIR" -name "bosszap_backup_*.sql.gz" -mtime +${KEEP_LOCAL_DAYS} -delete
REMAINING=$(find "$BACKUP_DIR" -name "bosszap_backup_*.sql.gz" | wc -l)
echo "[$(date)] Cleanup done. ${REMAINING} local backups remaining."

echo "[$(date)] Backup complete!"

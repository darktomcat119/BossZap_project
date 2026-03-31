#!/bin/bash
set -euo pipefail

# ============================================================
# BossZap — Restore PostgreSQL Backup
# Usage: ./deploy/restore.sh <backup_file.sql.gz>
# ============================================================

if [ $# -eq 0 ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available local backups:"
  ls -lh /opt/bosszap/backups/bosszap_backup_*.sql.gz 2>/dev/null || echo "  No local backups found"
  echo ""
  echo "To restore from S3:"
  echo "  aws s3 cp s3://bosszap-backups/db-backups/<file> /opt/bosszap/backups/"
  echo "  $0 /opt/bosszap/backups/<file>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File not found: $BACKUP_FILE"
  exit 1
fi

# Load env vars
if [ -f /opt/bosszap/.env ]; then
  set -a
  source /opt/bosszap/.env
  set +a
fi

DB_USER="${POSTGRES_USER:-bosszap}"
DB_NAME="${POSTGRES_DB:-bosszap}"

echo "WARNING: This will overwrite the current database!"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[$(date)] Stopping backend..."
docker compose -f /opt/bosszap/docker-compose.prod.yml stop backend

echo "[$(date)] Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker compose -f /opt/bosszap/docker-compose.prod.yml exec -T postgres \
  psql -U "$DB_USER" -d "$DB_NAME" --quiet

echo "[$(date)] Restarting backend..."
docker compose -f /opt/bosszap/docker-compose.prod.yml start backend

echo "[$(date)] Restore complete!"

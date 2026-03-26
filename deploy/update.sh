#!/bin/bash
set -euo pipefail

# ============================================================
# BossZap — Update & Redeploy
# Run from the project root: ./deploy/update.sh
# ============================================================

echo "Pulling latest code..."
git pull origin main

echo "Building and restarting containers..."
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

echo "Running migrations..."
docker compose -f docker-compose.prod.yml exec -T backend \
  npx typeorm migration:run -d dist/config/data-source.js

echo "Cleaning up old images..."
docker image prune -f

echo ""
echo "Update complete!"
echo "Check status: docker compose -f docker-compose.prod.yml ps"
echo ""

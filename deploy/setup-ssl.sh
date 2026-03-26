#!/bin/bash
set -euo pipefail

# ============================================================
# BossZap — SSL Certificate Setup
# Run after DNS is pointing to the server
# Usage: sudo ./deploy/setup-ssl.sh
# ============================================================

DOMAIN="bosszap.com"
EMAIL="admin@bosszap.com"

echo "Requesting SSL certificates..."

# Copy nginx configs first
cp deploy/nginx/*.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/bosszap-landing.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/bosszap-api.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/bosszap-app.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/bosszap-admin.conf /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx (HTTP only first)
nginx -t
systemctl reload nginx

# Request certificates for all domains
certbot --nginx \
  -d "$DOMAIN" \
  -d "api.$DOMAIN" \
  -d "app.$DOMAIN" \
  -d "admin.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect

# Auto-renewal cron
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "SSL certificates installed!"
echo "Auto-renewal is enabled via systemd timer."
echo ""

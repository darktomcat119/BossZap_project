#!/bin/bash
set -euo pipefail

# ============================================================
# BossZap — VPS Initial Setup Script
# Run as root on a fresh Ubuntu 24.04 LTS droplet
# Usage: chmod +x setup-server.sh && ./setup-server.sh
# ============================================================

DOMAIN="bosszap.com"
EMAIL="admin@bosszap.com"
APP_USER="bosszap"
APP_DIR="/opt/bosszap"

echo "==========================================="
echo " BossZap Server Setup"
echo "==========================================="

# --- 1. System updates ---
echo "[1/8] Updating system..."
apt update && apt upgrade -y
apt install -y curl wget git ufw software-properties-common \
  apt-transport-https ca-certificates gnupg lsb-release

# --- 2. Create app user ---
echo "[2/8] Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$APP_USER"
  usermod -aG sudo "$APP_USER"
fi

# --- 3. Install Docker ---
echo "[3/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$APP_USER"
  systemctl enable docker
  systemctl start docker
fi

# --- 4. Install Docker Compose plugin ---
echo "[4/8] Verifying Docker Compose..."
docker compose version || {
  apt install -y docker-compose-plugin
}

# --- 5. Install Nginx ---
echo "[5/8] Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# --- 6. Install Certbot (SSL) ---
echo "[6/8] Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# --- 7. Configure firewall ---
echo "[7/8] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# --- 8. Create application directory ---
echo "[8/8] Setting up application directory..."
mkdir -p "$APP_DIR"
chown "$APP_USER":"$APP_USER" "$APP_DIR"

echo ""
echo "==========================================="
echo " Setup complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "  1. Point DNS records to this server IP:"
echo "     A  $DOMAIN           → $(curl -s ifconfig.me)"
echo "     A  api.$DOMAIN       → $(curl -s ifconfig.me)"
echo "     A  app.$DOMAIN       → $(curl -s ifconfig.me)"
echo "     A  admin.$DOMAIN     → $(curl -s ifconfig.me)"
echo ""
echo "  2. Clone the repo:"
echo "     su - $APP_USER"
echo "     cd $APP_DIR"
echo "     git clone <your-repo-url> ."
echo ""
echo "  3. Copy and edit the env file:"
echo "     cp .env.production .env"
echo "     nano .env"
echo ""
echo "  4. Run the SSL setup:"
echo "     sudo ./deploy/setup-ssl.sh"
echo ""
echo "  5. Start the application:"
echo "     docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "  6. Run database migrations:"
echo "     docker compose -f docker-compose.prod.yml exec backend npx typeorm migration:run -d dist/config/data-source.js"
echo ""
echo "  7. Seed initial data:"
echo "     docker compose -f docker-compose.prod.yml exec backend node dist/database/seed.js"
echo ""

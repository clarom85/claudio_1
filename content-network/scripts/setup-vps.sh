#!/bin/bash
# ============================================================
# VPS Setup Script — Content Network
# Ubuntu 22.04 / 24.04
# Esegui come root: bash setup-vps.sh
# ============================================================
set -e

echo "🚀 Content Network — VPS Setup"
echo "================================"

# ── System update ────────────────────────────────────────────
apt update && apt upgrade -y
apt install -y curl git ufw certbot python3-certbot-nginx build-essential

# ── Node.js 20 LTS ──────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node: $(node -v) | npm: $(npm -v)"

# ── PM2 ─────────────────────────────────────────────────────
npm install -g pm2
pm2 startup systemd -u root --hp /root
echo "PM2 installed"

# ── Nginx ───────────────────────────────────────────────────
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Config base nginx
cat > /etc/nginx/nginx.conf << 'NGINXCONF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 2048;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Virtual hosts
    include /etc/nginx/sites-enabled/*;
}
NGINXCONF

# Default site disabilitato
rm -f /etc/nginx/sites-enabled/default

# ── Firewall ─────────────────────────────────────────────────
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "Firewall configured"

# ── Directory struttura ──────────────────────────────────────
mkdir -p /var/www
mkdir -p /opt/content-network
mkdir -p /var/log/content-network

# ── Clone repo ───────────────────────────────────────────────
echo ""
echo "📦 Clona il repo sul VPS:"
echo "   git clone https://github.com/clarom85/claudio_1.git /opt/content-network"
echo "   cd /opt/content-network/content-network"
echo "   cp .env.example .env && nano .env"
echo "   npm install"
echo "   npm run db:migrate"
echo ""
echo "▶️  Poi avvia con PM2:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo ""
echo "✅ VPS setup completo!"

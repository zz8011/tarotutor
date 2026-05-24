#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-taro.renchengzhang.com}"
APP_DIR="${APP_DIR:-/var/www/tarot-tutor}"
NGINX_CONF="/etc/nginx/sites-available/tarot-tutor"

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This setup script targets Ubuntu/Debian Tencent CVM images."
  exit 1
fi

echo "=== Installing dependencies ==="
sudo apt-get update
sudo apt-get install -y nginx curl ca-certificates software-properties-common

# Install Certbot for SSL
if ! command -v certbot >/dev/null 2>&1; then
  echo "=== Installing Certbot ==="
  sudo apt-get install -y certbot python3-certbot-nginx
fi

echo "=== Creating app directory ==="
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

echo "=== Writing Nginx config ==="
sudo tee "$NGINX_CONF" >/dev/null <<'EOF'
server {
    listen 80;
    server_name taro.renchengzhang.com;
    root /var/www/tarot-tutor;
    index index.html;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name taro.renchengzhang.com;
    root /var/www/tarot-tutor;
    index index.html;

    # SSL certificates (Certbot will configure these)
    # ssl_certificate /etc/letsencrypt/live/taro.renchengzhang.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/taro.renchengzhang.com/privkey.pem;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    # Cache static assets
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location ~* \.(?:svg|ico|json)$ {
        expires 1h;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

if [ -d /etc/nginx/sites-enabled ]; then
  sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/tarot-tutor
  sudo rm -f /etc/nginx/sites-enabled/default
fi

echo "=== Testing Nginx config ==="
sudo nginx -t

sudo systemctl enable --now nginx
sudo systemctl reload nginx

echo ""
echo "========================================"
echo "Server is ready!"
echo "App directory: ${APP_DIR}"
echo "Domain: ${DOMAIN}"
echo ""
echo "Next steps:"
echo "1. Deploy files: scp -i your-key dist.tar.gz ubuntu@110.42.233.244:/tmp/"
echo "2. Extract: ssh -i your-key ubuntu@110.42.233.244 'tar -xzf /tmp/dist.tar.gz -C ${APP_DIR}'"
echo "3. Obtain SSL: sudo certbot --nginx -d taro.renchengzhang.com"
echo "========================================"

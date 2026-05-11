#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-_}"
APP_DIR="${APP_DIR:-/var/www/tarot-tutor}"
NGINX_CONF="/etc/nginx/sites-available/tarot-tutor"

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This setup script targets Ubuntu/Debian Tencent CVM images."
  exit 1
fi

sudo apt-get update
sudo apt-get install -y nginx curl ca-certificates

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

sudo tee "$NGINX_CONF" >/dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN};
    root ${APP_DIR};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location ~* \.(?:svg|ico|json)$ {
        expires 1h;
        add_header Cache-Control "public";
        try_files \$uri =404;
    }
}
EOF

if [ -d /etc/nginx/sites-enabled ]; then
  sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/tarot-tutor
  sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

echo "Server is ready. Deploy files into ${APP_DIR}."

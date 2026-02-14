#!/bin/bash
set -e

# ─────────────────────────────────────────────
# FORGE Deploy Script
# Run on a fresh Ubuntu instance (t3.micro etc)
# Usage: chmod +x deploy.sh && ./deploy.sh
# ─────────────────────────────────────────────

APP_DIR="/opt/forge"
SERVICE_NAME="forge"
PORT=3000
NODE_VERSION="20"

echo ""
echo "  ◆ FORGE Deploy"
echo "  ─────────────────"
echo ""

# ── Check if running as root or with sudo ──
if [ "$EUID" -ne 0 ]; then
  echo "Please run with sudo: sudo ./deploy.sh"
  exit 1
fi

# ── Get the non-root user who invoked sudo ──
REAL_USER="${SUDO_USER:-$USER}"
if [ "$REAL_USER" = "root" ]; then
  echo "⚠  Detecting user..."
  REAL_USER=$(logname 2>/dev/null || echo "ubuntu")
fi
echo "  User: $REAL_USER"
echo ""

# ── Install Node.js if not present ──
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  echo "→ Installing Node.js ${NODE_VERSION}..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
else
  echo "✓ Node.js $(node -v) already installed"
fi

# ── Install build essentials for better-sqlite3 ──
echo "→ Installing build dependencies..."
apt-get install -y build-essential python3 git -qq

# ── Clone or update repo ──
if [ -d "$APP_DIR" ]; then
  echo "→ Updating existing installation..."
  cd "$APP_DIR"
  sudo -u "$REAL_USER" git pull
else
  echo ""
  echo "  Where is the repo?"
  echo "  Examples:"
  echo "    https://github.com/yourusername/forge.git"
  echo "    git@github.com:yourusername/forge.git"
  echo ""
  read -p "  Git repo URL: " REPO_URL
  echo ""
  echo "→ Cloning repo..."
  git clone "$REPO_URL" "$APP_DIR"
  chown -R "$REAL_USER:$REAL_USER" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Setup .env if not exists ──
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  read -p "  Anthropic API key (leave blank to skip): " API_KEY
  echo ""
  cat > "$APP_DIR/.env" << ENVEOF
ANTHROPIC_API_KEY=${API_KEY}
PORT=${PORT}
ENVEOF
  chown "$REAL_USER:$REAL_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "✓ Created .env"
else
  echo "✓ .env already exists"
fi

# ── Install dependencies and build ──
echo "→ Installing dependencies..."
cd "$APP_DIR"
sudo -u "$REAL_USER" npm install

echo "→ Building frontend..."
sudo -u "$REAL_USER" npm run build

# ── Create systemd service ──
echo "→ Setting up systemd service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << SERVICEEOF
[Unit]
Description=FORGE Gym Tracker
After=network.target

[Service]
Type=simple
User=${REAL_USER}
WorkingDirectory=${APP_DIR}
ExecStart=$(which node) server.js
Environment=NODE_ENV=production
Environment=PORT=${PORT}
Restart=always
RestartSec=5

# Hardening
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=${APP_DIR}
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
SERVICEEOF

# ── Start service ──
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

# ── Wait and verify ──
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
  echo ""
  echo "  ┌──────────────────────────────────────────┐"
  echo "  │                                          │"
  echo "  │   ◆ FORGE deployed successfully          │"
  echo "  │                                          │"
  echo "  │   http://localhost:${PORT}                  │"
  echo "  │                                          │"
  echo "  │   Access via Tailscale:                  │"
  HOSTNAME=$(hostname)
  echo "  │   http://${HOSTNAME}:${PORT}"
  echo "  │                                          │"
  echo "  │   Logs: journalctl -u forge -f           │"
  echo "  │   Restart: sudo systemctl restart forge  │"
  echo "  │   DB: ${APP_DIR}/forge.db                │"
  echo "  │                                          │"
  echo "  └──────────────────────────────────────────┘"
  echo ""
else
  echo ""
  echo "  ✗ Service failed to start. Check logs:"
  echo "    journalctl -u forge -n 50"
  echo ""
  exit 1
fi

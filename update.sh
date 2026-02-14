#!/bin/bash
set -e

# ─────────────────────────────────────────────
# FORGE Update Script
# Pull latest changes, rebuild, and restart
# Usage: cd /opt/forge && ./update.sh
# ─────────────────────────────────────────────

APP_DIR="/opt/forge"

echo ""
echo "  ◆ FORGE Update"
echo "  ─────────────────"
echo ""

cd "$APP_DIR"

echo "→ Pulling latest..."
git pull

echo "→ Installing dependencies..."
npm install

echo "→ Rebuilding frontend..."
npm run build

echo "→ Restarting service..."
sudo systemctl restart forge

sleep 2
if systemctl is-active --quiet forge; then
  echo ""
  echo "  ✓ Updated and running"
  echo ""
else
  echo ""
  echo "  ✗ Restart failed — check: journalctl -u forge -n 50"
  echo ""
fi

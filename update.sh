#!/bin/bash
set -e

# ─────────────────────────────────────────────
# TALOS Update Script
# Pull latest changes, rebuild, and restart
# Usage: cd /opt/talos && ./update.sh
# ─────────────────────────────────────────────

APP_DIR="/opt/talos"

echo ""
echo "  Δ TALOS Update"
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
sudo systemctl restart talos

sleep 2
if systemctl is-active --quiet talos; then
  echo ""
  echo "  ✓ Updated and running"
  echo ""
else
  echo ""
  echo "  ✗ Restart failed — check: journalctl -u talos -n 50"
  echo ""
fi

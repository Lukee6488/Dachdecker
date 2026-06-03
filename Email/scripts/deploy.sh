#!/bin/bash
# Run locally (Windows Git Bash or WSL) to push changes to lukasserver
# Usage: bash scripts/deploy.sh
set -e

SERVER="lukas@192.168.0.58"
APP_DIR="/home/lukas/gueldenarm-email-agent"

echo "=== Dateien auf lukasserver übertragen ==="
rsync -avz --exclude=node_modules --exclude=.env --exclude=dist \
  ./ "$SERVER:$APP_DIR/"

echo ""
echo "=== npm install & Service neu starten ==="
ssh "$SERVER" "cd $APP_DIR && npm install --omit=dev && sudo systemctl restart gueldenarm-email-agent"

echo ""
echo "=== Live-Logs (Ctrl+C zum Beenden) ==="
ssh "$SERVER" "journalctl -u gueldenarm-email-agent -f --no-pager"

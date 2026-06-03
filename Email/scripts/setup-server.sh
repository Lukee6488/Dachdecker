#!/bin/bash
# Setup script – run on lukasserver (Ubuntu 22.04) as user lukas
# Usage: bash setup-server.sh
set -e

APP_DIR="$HOME/gueldenarm-email-agent"

echo "=== 1. Node.js installieren (v20 LTS) ==="
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node: $(node -v), npm: $(npm -v)"

echo ""
echo "=== 2. Projektdateien kopieren ==="
mkdir -p "$APP_DIR"
rsync -av --exclude=node_modules --exclude=.env --exclude=dist \
  ./ "$APP_DIR/"

echo ""
echo "=== 3. Abhängigkeiten installieren ==="
cd "$APP_DIR"
npm install --omit=dev

echo ""
echo "=== 4. .env Datei anlegen ==="
if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "WICHTIG: Bitte $APP_DIR/.env mit deinen echten Werten befüllen!"
  echo "         Dann nochmal: sudo systemctl restart gueldenarm-email-agent"
else
  echo ".env existiert bereits – wird nicht überschrieben."
fi

echo ""
echo "=== 5. Systemd Service installieren ==="
sudo cp "$APP_DIR/gueldenarm-email-agent.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gueldenarm-email-agent

echo ""
echo "=== Fertig! ==="
echo ""
echo "Nächste Schritte:"
echo "  1. .env befüllen:         nano $APP_DIR/.env"
echo "  2. Service starten:       sudo systemctl start gueldenarm-email-agent"
echo "  3. Status prüfen:         sudo systemctl status gueldenarm-email-agent"
echo "  4. Logs live sehen:       journalctl -u gueldenarm-email-agent -f"

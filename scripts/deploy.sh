#!/usr/bin/env bash
# CRM/ERP üretim dağıtımı — Ubuntu 22.04/24.04 VPS için (sağlayıcı-agnostik).
# Kullanım:  scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

# --- 1) Docker kurulumu ----------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Docker kuruluyor..."
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "==> docker compose eklentisi kuruluyor..."
  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin
fi

sudo systemctl enable --now docker

# --- 2) Ortam değişkenleri -------------------------------------------------
if [ ! -f .env ]; then
  echo "==> .env bulunamadı. .env.production.example kopyalandı."
  cp .env.production.example .env
  echo "!!! LÜTFEN .env içindeki DOMAIN ve tüm parolaları değiştirip tekrar çalıştırın."
  exit 1
fi

# --- 3) Build + ayağa kaldır ----------------------------------------------
echo "==> İmajlar derleniyor ve servisler başlatılıyor..."
sudo docker compose -f docker-compose.prod.yml up -d --build

# --- 4) Sağlık kontrolü ----------------------------------------------------
echo "==> Backend sağlık durumu bekleniyor (max 150 sn)..."
for i in $(seq 1 30); do
  status=$(sudo docker compose -f docker-compose.prod.yml ps backend --format '{{.Health.Status}}' 2>/dev/null || true)
  if [ "$status" = "healthy" ]; then
    echo "==> Backend hazır."
    break
  fi
  sleep 5
done

echo "==> Servis durumu:"
sudo docker compose -f docker-compose.prod.yml ps

domain=$(grep -E '^DOMAIN=' .env | cut -d= -f2- | tr -d '"' || true)
if [ -n "$domain" ] && [ "$domain" != "localhost" ]; then
  echo "==> Uygulama: https://$domain"
fi

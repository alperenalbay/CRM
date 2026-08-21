#!/usr/bin/env bash
# SQL Server veritabanı yedeği. 7 günden eski yerel yedekleri temizler.
# Cron örneği (her gün 03:00):  0 3 * * * /opt/crm/scripts/backup-db.sh >> /var/log/crm-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."

STAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

echo "==> $STAMP: CRM yedeği alınıyor..."
sudo docker compose -f docker-compose.prod.yml exec -T db \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C \
  -Q "BACKUP DATABASE [CRM] TO DISK='/var/opt/mssql/backups/crm_${STAMP}.bak' WITH COMPRESSION" -b

sudo docker compose -f docker-compose.prod.yml cp \
  "db:/var/opt/mssql/backups/crm_${STAMP}.bak" "$BACKUP_DIR/"

find "$BACKUP_DIR" -name 'crm_*.bak' -mtime +7 -delete
echo "==> Yedek tamam: $BACKUP_DIR/crm_${STAMP}.bak"

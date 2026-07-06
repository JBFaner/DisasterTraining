#!/usr/bin/env bash
# Run on the server after Inventory.sql is uploaded and .env uses MySQL.
set -euo pipefail

APP_DIR="/var/www/html/disaster_training_alertaraqc/my-app"
SQL_FILE="/var/www/html/disaster_training_alertaraqc/Inventory.sql"

cd "$APP_DIR"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Missing $SQL_FILE — upload Inventory.sql first."
  exit 1
fi

if grep -q '^DB_CONNECTION=sqlite' .env 2>/dev/null; then
  echo "ERROR: .env still uses sqlite. Set DB_CONNECTION=mysql first."
  exit 1
fi

echo "==> Clearing config cache"
php artisan config:clear

echo "==> Running migrations"
php artisan migrate --force

DB_NAME=$(grep '^DB_DATABASE=' .env | cut -d= -f2- | tr -d '"')
DB_USER=$(grep '^DB_USERNAME=' .env | cut -d= -f2- | tr -d '"')
DB_PASS=$(grep '^DB_PASSWORD=' .env | cut -d= -f2- | tr -d '"')

echo "==> Importing $SQL_FILE into $DB_NAME"
MYSQL_PWD="$DB_PASS" mysql -u "$DB_USER" "$DB_NAME" < "$SQL_FILE"

echo "==> Caching for production"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Done. Open your production URL and test login."

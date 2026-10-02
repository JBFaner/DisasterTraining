#!/bin/bash
set -euo pipefail
APP=/var/www/html/disaster_training_alertaraqc/my-app
ROUTE=/opt/disaster-training-route
set -a
# shellcheck disable=SC1091
source "$ROUTE/runtime.env"
set +a

fix_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$APP/.env"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$APP/.env"
  else
    echo "${key}=${val}" >> "$APP/.env"
  fi
}

fix_env APP_ENV production
fix_env APP_DEBUG false
fix_env APP_URL https://disaster-training.alertaraqc.com
fix_env MAIN_DOMAIN https://disaster-training.alertaraqc.com
fix_env DB_CONNECTION mysql
fix_env DB_HOST disaster-db
fix_env DB_PORT 3306
fix_env DB_DATABASE disaster_training
fix_env DB_USERNAME disaster_user
fix_env DB_PASSWORD "$DT_DB_PASSWORD"
fix_env SESSION_DRIVER database
fix_env SESSION_DOMAIN .alertaraqc.com
fix_env SESSION_SECURE_COOKIE true
fix_env CACHE_STORE database
fix_env QUEUE_CONNECTION database
fix_env DASHBOARD_PARTNER_API_ENABLED true
fix_env DASHBOARD_PARTNER_API_KEY Dashboardkey
fix_env DASHBOARD_PARTNER_API_HEADER X-Dashboard-Api-Key

echo '=== env check ==='
grep -E '^(APP_ENV|APP_URL|DB_HOST|DB_DATABASE|DB_USERNAME|DASHBOARD_PARTNER_API_)' "$APP/.env" | sed 's/KEY=.*/KEY=***/'

docker exec disaster-training-web bash -lc '
set -e
cd /var/www/html
php artisan config:clear
php artisan migrate --force || true
php artisan optimize:clear || true
php artisan storage:link || true
chown -R www-data:www-data storage bootstrap/cache
php artisan tinker --execute="echo \"users=\".\\App\\Models\\User::count().PHP_EOL;"
'

echo '=== curl local via container ==='
docker exec disaster-training-web curl -sS -o /tmp/out.html -w 'HTTP:%{http_code}\n' http://127.0.0.1/ | tail -1
head -c 200 /dev/null
docker exec disaster-training-web head -c 150 /tmp/out.html; echo

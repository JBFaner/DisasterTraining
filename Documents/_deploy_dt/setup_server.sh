#!/bin/bash
set -euo pipefail

APP=/var/www/html/disaster_training_alertaraqc/my-app
ROUTE=/opt/disaster-training-route
UPLOAD=/tmp/dt-upload

echo "=== Extract app ==="
rm -rf "$APP"
mkdir -p "$APP"
tar -xzf "$UPLOAD/my-app.tar.gz" -C "$APP"
mkdir -p "$APP/storage/framework/"{cache,sessions,views,data} "$APP/storage/logs" "$APP/bootstrap/cache"
chmod -R ug+rwx "$APP/storage" "$APP/bootstrap/cache"

echo "=== Load DB passwords ==="
sed -i 's/\r$//' "$ROUTE/runtime.env"
set -a
# shellcheck disable=SC1091
source "$ROUTE/runtime.env"
set +a

echo "=== Build production .env ==="
cp "$UPLOAD/local.env" "$APP/.env"
export APP DT_DB_PASSWORD
php <<'PHP'
$path = getenv('APP') . '/.env';
$t = file_get_contents($path);
$dbPass = getenv('DT_DB_PASSWORD');
$set = [
  'APP_ENV' => 'production',
  'APP_DEBUG' => 'false',
  'APP_URL' => 'https://disaster-training.alertaraqc.com',
  'MAIN_DOMAIN' => 'https://disaster-training.alertaraqc.com',
  'DB_CONNECTION' => 'mysql',
  'DB_HOST' => 'disaster-db',
  'DB_PORT' => '3306',
  'DB_DATABASE' => 'disaster_training',
  'DB_USERNAME' => 'disaster_user',
  'DB_PASSWORD' => $dbPass,
  'SESSION_DRIVER' => 'database',
  'SESSION_DOMAIN' => '.alertaraqc.com',
  'SESSION_SECURE_COOKIE' => 'true',
  'CACHE_STORE' => 'database',
  'QUEUE_CONNECTION' => 'database',
  'DASHBOARD_PARTNER_API_ENABLED' => 'true',
  'DASHBOARD_PARTNER_API_KEY' => 'Dashboardkey',
  'DASHBOARD_PARTNER_API_HEADER' => 'X-Dashboard-Api-Key',
];
foreach ($set as $k => $v) {
  if (preg_match('/^' . preg_quote($k, '/') . '=.*/m', $t)) {
    $t = preg_replace('/^' . preg_quote($k, '/') . '=.*/m', $k . '=' . $v, $t);
  } else {
    $t = rtrim($t) . "\n" . $k . '=' . $v . "\n";
  }
}
file_put_contents($path, $t);
echo "ENV_OK\n";
PHP

grep -E '^(APP_ENV|APP_URL|DB_HOST|DB_DATABASE|DB_USERNAME|DASHBOARD_PARTNER_API)' "$APP/.env" | sed 's/KEY=.*/KEY=***/'

echo "=== Docker compose up ==="
cd "$ROUTE"
docker compose --env-file runtime.env up -d --build

echo "=== Wait for MySQL healthy ==="
for i in $(seq 1 40); do
  if docker exec disaster-training-db mysqladmin ping -h 127.0.0.1 -uroot -p"$DT_DB_ROOT_PASSWORD" --silent 2>/dev/null; then
    echo "MYSQL_READY"
    break
  fi
  echo "waiting mysql... $i"
  sleep 3
done

echo "=== Import SQL dump ==="
docker exec -i disaster-training-db mysql -uroot -p"$DT_DB_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS disaster_training CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON disaster_training.* TO 'disaster_user'@'%'; FLUSH PRIVILEGES;"
docker exec -i disaster-training-db mysql -uroot -p"$DT_DB_ROOT_PASSWORD" disaster_training < "$UPLOAD/disaster_training.sql"
TABLES=$(docker exec disaster-training-db mysql -N -uroot -p"$DT_DB_ROOT_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='disaster_training';")
echo "IMPORT_DONE tables=$TABLES"

echo "=== Composer install + artisan ==="
docker exec disaster-training-web bash -lc '
set -e
cd /var/www/html
composer install --no-dev --optimize-autoloader --no-interaction
if ! grep -q "^APP_KEY=base64:" .env || grep -q "GENERATE_WITH" .env; then
  php artisan key:generate --force
fi
php artisan storage:link || true
php artisan migrate --force || true
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
chown -R www-data:www-data storage bootstrap/cache
'

echo "=== DONE ==="
docker ps --filter name=disaster-training --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

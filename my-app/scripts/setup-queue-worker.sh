#!/bin/bash
# Install/start a durable Laravel queue worker for Disaster Training (production).
set -euo pipefail

APP_DIR="/var/www/html/disaster_training_alertaraqc/my-app"
CONF="/etc/supervisor/conf.d/disaster-training-worker.conf"
PHP_BIN="$(command -v php)"

if [[ ! -d "$APP_DIR" ]]; then
  echo "App dir missing: $APP_DIR"
  exit 1
fi

if ! command -v supervisord >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y supervisor
fi

cat > "$CONF" <<EOF
[program:disaster-training-worker]
process_name=%(program_name)s_%(process_num)02d
command=${PHP_BIN} ${APP_DIR}/artisan queue:work database --sleep=3 --tries=5 --timeout=900 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=${APP_DIR}/storage/logs/queue-worker.log
stopwaitsecs=3600
EOF

mkdir -p "${APP_DIR}/storage/logs"
chown -R www-data:www-data "${APP_DIR}/storage/logs"

supervisorctl reread
supervisorctl update
supervisorctl restart disaster-training-worker:* || supervisorctl start disaster-training-worker:*
supervisorctl status disaster-training-worker:*

echo "Queue worker configured."

#!/bin/sh
set -e

cd /var/www/html

# Buat .env dari .env.example jika belum ada
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
  fi
fi

# Generate APP_KEY jika belum ada
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force || true
fi

# Install composer deps (optimize)
composer install --no-dev --prefer-dist --optimize-autoloader || true

# Permission
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

# Storage symlink
php artisan storage:link || true

# Cache config/views/routes (tidak wajib)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Migrate jika diminta
if [ "$RUN_MIGRATIONS" = "true" ]; then
  php artisan migrate --force || true
fi

exec "$@"
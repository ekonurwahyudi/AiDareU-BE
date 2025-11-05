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

# Ensure storage directory structure exists (for Docker volumes)
mkdir -p storage/app/public/theme/logos
mkdir -p storage/app/public/theme/slides
mkdir -p storage/app/public/theme/favicons
mkdir -p storage/app/public/theme/seo
mkdir -p storage/app/public/products
mkdir -p storage/app/public/products-digital
mkdir -p storage/app/public/editor-images
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs

# Permission
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

# Remove public/storage if it exists but is NOT a symlink
# This happens when Docker volume mounts create the directory
if [ -e "public/storage" ] && [ ! -L "public/storage" ]; then
  echo "WARNING: public/storage exists but is not a symlink. Removing..."
  rm -rf public/storage
fi

# Storage symlink (force recreate to ensure it's correct)
php artisan storage:link --force || true

# Verify symlink was created successfully
if [ -L "public/storage" ]; then
  echo "✓ Storage symlink created successfully"
  echo "  Source: public/storage"
  echo "  Target: $(readlink public/storage)"
else
  echo "✗ WARNING: Storage symlink creation failed!"
  echo "  Attempting manual creation..."
  ln -sf ../storage/app/public public/storage || true
fi

# Fix symlink ownership
chown -h www-data:www-data public/storage 2>/dev/null || true

# Cache config/views/routes (tidak wajib)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Migrate jika diminta
if [ "$RUN_MIGRATIONS" = "true" ]; then
  php artisan migrate --force || true
fi

exec "$@"
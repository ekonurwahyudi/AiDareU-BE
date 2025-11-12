#!/bin/sh
set -e

cd /var/www/html

echo "=========================================="
echo "Starting Laravel Container Setup..."
echo "=========================================="

# Buat .env dari .env.example jika belum ada
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✓ .env file created from .env.example"
  fi
fi

# Generate APP_KEY jika belum ada
if [ -z "$APP_KEY" ]; then
  echo "🔑 Generating APP_KEY..."
  php artisan key:generate --force || true
fi

# Install composer deps (optimize)
echo "📦 Installing composer dependencies..."
composer install --no-dev --prefer-dist --optimize-autoloader || true

# Ensure storage directory structure exists (for Docker volumes)
echo "📁 Creating storage directory structure..."
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

# Create public directory if not exists
mkdir -p public

# Permission
echo "🔒 Setting permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

# === CRITICAL: Storage Symlink Setup ===
echo "🔗 Setting up storage symlink..."

# ALWAYS remove public/storage first to ensure clean state
if [ -e "public/storage" ] || [ -L "public/storage" ]; then
  echo "  → Removing existing public/storage..."
  rm -rf public/storage
fi

# Create symlink using Laravel's artisan command (PREFERRED METHOD)
echo "  → Creating symlink with php artisan storage:link..."
php artisan storage:link --force 2>&1 || {
  echo "  ⚠️  Artisan storage:link failed, using manual method..."
  # Fallback: Manual symlink creation with absolute path
  ln -sf /var/www/html/storage/app/public /var/www/html/public/storage
}

# Verify symlink was created successfully
if [ -L "public/storage" ]; then
  SYMLINK_TARGET=$(readlink public/storage)
  echo "  ✓ Storage symlink created successfully!"
  echo "    Source: public/storage"
  echo "    Target: $SYMLINK_TARGET"

  # Additional verification: check if target directory exists
  if [ -d "$SYMLINK_TARGET" ] || [ -d "storage/app/public" ]; then
    echo "    Target directory exists: OK"
  else
    echo "    ⚠️  WARNING: Target directory does not exist!"
  fi
else
  echo "  ✗ CRITICAL: Storage symlink creation FAILED!"
  echo "    This will cause uploaded files to be inaccessible!"
  exit 1
fi

# Fix symlink ownership (use -h to change symlink itself, not target)
chown -h www-data:www-data public/storage 2>/dev/null || true

# Verify symlink is accessible
ls -lah public/storage 2>/dev/null && echo "  ✓ Symlink is accessible" || echo "  ⚠️  Symlink access check failed"

# Cache config/views/routes (tidak wajib)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Migrate jika diminta
if [ "$RUN_MIGRATIONS" = "true" ]; then
  php artisan migrate --force || true
fi

exec "$@"
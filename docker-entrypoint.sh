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

# IMPORTANT: Use absolute path to prevent wrong nesting
# Correct: public/storage -> /var/www/html/storage/app/public
# Wrong:   public/storage -> storage/app (missing /public at end)
echo "  → Creating symlink with absolute path..."
ln -sf /var/www/html/storage/app/public /var/www/html/public/storage

# Verify symlink was created successfully
if [ -L "public/storage" ]; then
  SYMLINK_TARGET=$(readlink public/storage)
  echo "  ✓ Storage symlink created successfully!"
  echo "    Source: public/storage"
  echo "    Target: $SYMLINK_TARGET"

  # Verify target directory exists
  if [ -d "$SYMLINK_TARGET" ]; then
    echo "    ✓ Target directory exists"

    # Verify files are accessible through symlink (optional - might be empty on first deploy)
    if [ "$(ls -A public/storage/products 2>/dev/null)" ]; then
      FILE_COUNT=$(ls -1 public/storage/products 2>/dev/null | wc -l)
      echo "    ✓ Files accessible through symlink: $FILE_COUNT files in products/"
    else
      echo "    ℹ️  Info: No files yet in public/storage/products/ (this is normal for new deployments)"
    fi
  else
    echo "    ⚠️  WARNING: Target directory does not exist at $SYMLINK_TARGET"
    echo "    Creating target directory..."
    mkdir -p storage/app/public
  fi
else
  echo "  ✗ CRITICAL: Storage symlink creation FAILED!"
  echo "    This will cause uploaded files to be inaccessible!"
  exit 1
fi

# Fix symlink ownership (use -h to change symlink itself, not target)
chown -h www-data:www-data public/storage 2>/dev/null || true

# Verify symlink structure is correct
echo "  → Verifying symlink structure..."
# Check if symlink points to the correct target
EXPECTED_TARGET="/var/www/html/storage/app/public"
ACTUAL_TARGET=$(readlink -f public/storage)

if [ "$ACTUAL_TARGET" = "$EXPECTED_TARGET" ]; then
  echo "    ✓ Symlink structure is correct"
  echo "    Target matches expected: $EXPECTED_TARGET"
else
  echo "    ⚠️  WARNING: Symlink target mismatch"
  echo "    Expected: $EXPECTED_TARGET"
  echo "    Actual:   $ACTUAL_TARGET"
  echo "    Continuing anyway (might work if target is correct)..."
fi

# Cache config/views/routes (tidak wajib)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Migrate jika diminta
if [ "$RUN_MIGRATIONS" = "true" ]; then
  php artisan migrate --force || true
fi

exec "$@"
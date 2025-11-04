#!/bin/bash
# Script to fix storage symlink and permissions in EasyPanel/Docker

echo "==================================="
echo "Fixing Storage Symlink & Permissions"
echo "==================================="

# Remove existing symlink if exists
if [ -L "public/storage" ] || [ -d "public/storage" ]; then
    echo "Removing existing storage symlink/directory..."
    rm -rf public/storage
fi

# Create storage directories if not exist
echo "Creating storage directories..."
mkdir -p storage/app/public/theme/logos
mkdir -p storage/app/public/theme/favicons
mkdir -p storage/app/public/theme/slides
mkdir -p storage/app/public/theme/seo
mkdir -p storage/app/public/products
mkdir -p storage/app/public/products-digital
mkdir -p storage/app/public/editor-images

# Set permissions to 777
echo "Setting permissions to 777..."
chmod -R 777 storage/app/public
chmod -R 777 storage/logs
chmod -R 777 storage/framework

# Create symlink
echo "Creating storage symlink..."
php artisan storage:link --force

# Verify symlink
if [ -L "public/storage" ]; then
    echo "✓ Symlink created successfully"
    ls -la public/storage
else
    echo "✗ Failed to create symlink"
    echo "Attempting manual symlink..."
    ln -s ../storage/app/public public/storage
fi

# Clear cache
echo "Clearing cache..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo "==================================="
echo "✓ Storage fix completed!"
echo "==================================="

# Display storage structure
echo ""
echo "Storage structure:"
ls -laR storage/app/public/theme/

echo ""
echo "Public storage link:"
ls -la public/ | grep storage

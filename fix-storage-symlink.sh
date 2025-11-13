#!/bin/bash
# Script to fix storage symlink if it's pointing to wrong directory
# Run this if you see public/storage/app/public instead of public/storage/products

set -e

echo "=========================================="
echo "Storage Symlink Fix Script"
echo "=========================================="

cd /var/www/html

echo "Current symlink status:"
ls -la public/storage 2>/dev/null || echo "  Symlink does not exist"

echo ""
echo "Checking current structure..."
if [ -d "public/storage/app" ]; then
  echo "  ⚠️  WRONG: public/storage/app exists (symlink pointing to storage/app)"
  echo "  Should be: public/storage directly contains products/, theme/, etc."
fi

if [ -d "public/storage/products" ]; then
  FILE_COUNT=$(ls -1 public/storage/products 2>/dev/null | wc -l)
  echo "  ✓ CORRECT: public/storage/products exists with $FILE_COUNT files"
else
  echo "  ✗ ERROR: public/storage/products does not exist"
fi

echo ""
echo "Fixing symlink..."

# Remove wrong symlink
echo "  → Removing existing public/storage..."
rm -rf public/storage

# Create correct symlink with absolute path
echo "  → Creating correct symlink..."
ln -sf /var/www/html/storage/app/public /var/www/html/public/storage

# Verify
echo ""
echo "Verification:"
SYMLINK_TARGET=$(readlink public/storage)
echo "  Source: public/storage"
echo "  Target: $SYMLINK_TARGET"

if [ -d "public/storage/products" ] && [ ! -d "public/storage/app" ]; then
  FILE_COUNT=$(ls -1 public/storage/products 2>/dev/null | wc -l)
  echo "  ✓ SUCCESS: Symlink fixed! Found $FILE_COUNT files in public/storage/products/"
  echo ""
  echo "Test URL should now work:"
  echo "  https://api.aidareu.com/storage/products/[filename]"
else
  echo "  ✗ FAILED: Symlink still incorrect"
  exit 1
fi

# Set permissions
chown -h www-data:www-data public/storage 2>/dev/null || true

echo ""
echo "=========================================="
echo "✓ Storage symlink fixed successfully!"
echo "=========================================="

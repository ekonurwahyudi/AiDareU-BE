#!/bin/sh
# Quick Symlink Fix Script
# Run inside container: sh fix-symlink.sh

set -e

echo "=== SYMLINK FIX SCRIPT ==="
echo ""

# Check current status
echo "1. Checking current status..."
if [ -L "public/storage" ]; then
    echo "   - Symlink exists (but might be broken)"
    echo "   - Target: $(readlink public/storage)"
elif [ -e "public/storage" ]; then
    echo "   - WARNING: public/storage exists but is NOT a symlink!"
    echo "   - Type: $(if [ -d public/storage ]; then echo 'directory'; else echo 'file'; fi)"
    echo "   - Removing it..."
    rm -rf public/storage
else
    echo "   - No symlink found (will create)"
fi
echo ""

# Check target directory
echo "2. Checking target directory..."
if [ -d "storage/app/public" ]; then
    echo "   ✓ Target exists: storage/app/public"
    echo "   - Files: $(find storage/app/public -type f | wc -l)"
else
    echo "   ✗ Target missing! Creating..."
    mkdir -p storage/app/public/theme/slides
    mkdir -p storage/app/public/theme/logos
    mkdir -p storage/app/public/theme/favicons
    mkdir -p storage/app/public/theme/seo
    mkdir -p storage/app/public/products
    mkdir -p storage/app/public/products-digital
    mkdir -p storage/app/public/editor-images
    echo "   ✓ Directories created"
fi
echo ""

# Create symlink using Laravel command
echo "3. Creating symlink via Laravel..."
php artisan storage:link --force
echo ""

# Verify symlink
echo "4. Verifying symlink..."
if [ -L "public/storage" ]; then
    LINK_TARGET=$(readlink public/storage)
    echo "   ✓ Symlink created successfully"
    echo "   - Source: public/storage"
    echo "   - Target: $LINK_TARGET"

    # Test if symlink works
    if [ -e "$LINK_TARGET" ]; then
        echo "   ✓ Target is accessible"
    else
        echo "   ✗ WARNING: Target not accessible!"
    fi
else
    echo "   ✗ FAILED: Symlink not created"
    exit 1
fi
echo ""

# Fix permissions
echo "5. Fixing permissions..."
chown -R www-data:www-data storage
chmod -R 775 storage/app/public
chown -h www-data:www-data public/storage 2>/dev/null || true
echo "   ✓ Permissions fixed"
echo ""

# Test access
echo "6. Testing file access..."
SLIDES_DIR="storage/app/public/theme/slides"
if [ -d "$SLIDES_DIR" ]; then
    FILE_COUNT=$(find "$SLIDES_DIR" -type f | wc -l)
    echo "   - Files in slides: $FILE_COUNT"

    if [ $FILE_COUNT -gt 0 ]; then
        TEST_FILE=$(find "$SLIDES_DIR" -type f | head -1)
        TEST_NAME=$(basename "$TEST_FILE")
        PUBLIC_PATH="public/storage/theme/slides/$TEST_NAME"

        if [ -e "$PUBLIC_PATH" ]; then
            echo "   ✓ File accessible via symlink: $TEST_NAME"
        else
            echo "   ✗ File NOT accessible via symlink"
        fi
    fi
fi
echo ""

# Test Nginx access (if nginx running)
echo "7. Testing Nginx configuration..."
if command -v nginx >/dev/null 2>&1; then
    nginx -t 2>&1 | grep -q "successful" && echo "   ✓ Nginx config valid" || echo "   ✗ Nginx config has errors"
fi
echo ""

echo "=== FIX COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Access: https://api.aidareu.com/storage-check.php"
echo "2. Verify 'Is Link: ✓ YES'"
echo "3. Test image URL from diagnostic"
echo ""

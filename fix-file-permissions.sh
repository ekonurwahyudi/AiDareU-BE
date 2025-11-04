#!/bin/bash
# Script to fix file permissions in storage

echo "==================================="
echo "Fixing File Permissions in Storage"
echo "==================================="

cd /app

# Fix permissions for all uploaded files
echo ""
echo "Setting permissions to 775 for all files in storage/app/public/theme..."

# Fix theme files
chmod -R 775 storage/app/public/theme/

# Fix products
chmod -R 775 storage/app/public/products/

# Fix products-digital
chmod -R 775 storage/app/public/products-digital/

# Fix editor-images
chmod -R 775 storage/app/public/editor-images/

echo ""
echo "==================================="
echo "✓ Permissions fixed!"
echo "==================================="

# Show current permissions
echo ""
echo "Current permissions:"
echo ""
echo "=== Slides ==="
ls -lh storage/app/public/theme/slides/
echo ""
echo "=== Logos ==="
ls -lh storage/app/public/theme/logos/
echo ""
echo "=== SEO ==="
ls -lh storage/app/public/theme/seo/
echo ""
echo "=== Favicons ==="
ls -lh storage/app/public/theme/favicons/

echo ""
echo "All files should now show as -rwxrwxr-x (775)"

#!/bin/bash
# Script to cleanup broken/orphaned files in storage

echo "==================================="
echo "Cleaning Up Broken Storage Files"
echo "==================================="

cd /app

# Function to check if file is broken (size 0 or doesn't exist)
echo ""
echo "Checking for broken files in storage/app/public/theme..."

# Check slides
echo ""
echo "=== Checking slides ==="
for file in storage/app/public/theme/slides/*; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$size" -eq 0 ]; then
            echo "⚠️  BROKEN: $file (size: 0 bytes) - DELETING"
            rm "$file"
        else
            echo "✓ OK: $file (size: $size bytes)"
        fi
    fi
done

# Check logos
echo ""
echo "=== Checking logos ==="
for file in storage/app/public/theme/logos/*; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$size" -eq 0 ]; then
            echo "⚠️  BROKEN: $file (size: 0 bytes) - DELETING"
            rm "$file"
        else
            echo "✓ OK: $file (size: $size bytes)"
        fi
    fi
done

# Check seo
echo ""
echo "=== Checking SEO images ==="
for file in storage/app/public/theme/seo/*; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$size" -eq 0 ]; then
            echo "⚠️  BROKEN: $file (size: 0 bytes) - DELETING"
            rm "$file"
        else
            echo "✓ OK: $file (size: $size bytes)"
        fi
    fi
done

# Check favicons
echo ""
echo "=== Checking favicons ==="
for file in storage/app/public/theme/favicons/*; do
    if [ -f "$file" ]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$size" -eq 0 ]; then
            echo "⚠️  BROKEN: $file (size: 0 bytes) - DELETING"
            rm "$file"
        else
            echo "✓ OK: $file (size: $size bytes)"
        fi
    fi
done

echo ""
echo "==================================="
echo "✓ Cleanup completed!"
echo "==================================="

# Show remaining files
echo ""
echo "Remaining files:"
echo ""
echo "Slides:"
ls -lh storage/app/public/theme/slides/
echo ""
echo "Logos:"
ls -lh storage/app/public/theme/logos/
echo ""
echo "SEO:"
ls -lh storage/app/public/theme/seo/
echo ""
echo "Favicons:"
ls -lh storage/app/public/theme/favicons/

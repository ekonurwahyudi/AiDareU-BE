#!/bin/bash
# Script to test storage route priority after deployment

echo "=========================================="
echo "Testing Storage Route Priority"
echo "=========================================="

cd /app

echo ""
echo "Step 1: Clear all caches"
echo "----------------------------------------"
php artisan route:clear
php artisan config:clear
php artisan cache:clear

echo ""
echo "Step 2: List all /storage routes"
echo "----------------------------------------"
php artisan route:list | grep storage

echo ""
echo "Step 3: Test file access from command line"
echo "----------------------------------------"
# Find a test file in slides directory
TEST_FILE=$(ls storage/app/public/theme/slides/ | head -n 1)
if [ -n "$TEST_FILE" ]; then
    echo "Testing file: $TEST_FILE"
    echo ""
    echo "Full path: storage/app/public/theme/slides/$TEST_FILE"
    echo "URL: https://api.aidareu.com/storage/theme/slides/$TEST_FILE"
    echo ""
    echo "File exists:"
    ls -lah "storage/app/public/theme/slides/$TEST_FILE"
    echo ""
    echo "Testing with curl (should return 200):"
    curl -I "https://api.aidareu.com/storage/theme/slides/$TEST_FILE" 2>&1 | head -n 5
else
    echo "No files found in slides directory"
fi

echo ""
echo "Step 4: Check Laravel logs for storage requests"
echo "----------------------------------------"
echo "Recent 'Storage request' logs:"
grep "Storage request" storage/logs/laravel.log | tail -n 5

echo ""
echo "Recent 'Storage file not found' logs:"
grep "Storage file not found" storage/logs/laravel.log | tail -n 5

echo ""
echo "=========================================="
echo "Test complete!"
echo "=========================================="
echo ""
echo "If curl returns 404:"
echo "1. Check Laravel logs above"
echo "2. Verify route is registered: php artisan route:list | grep storage"
echo "3. Try accessing URL in browser"
echo "4. Check if TenantController is catching the request"

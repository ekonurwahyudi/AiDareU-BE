#!/bin/bash
# Script to debug specific 404 storage file issue

echo "===================================="
echo "Debugging Storage 404 Issue"
echo "===================================="

cd /app

echo ""
echo "=== Step 1: List all slides files in storage ==="
echo ""
ls -la storage/app/public/theme/slides/

echo ""
echo "=== Step 2: Search for the problematic filename ==="
echo ""
echo "Searching for files starting with '3w4r':"
ls -la storage/app/public/theme/slides/ | grep "3w4r"

echo ""
echo "=== Step 3: Check database for slide paths ==="
echo ""
php artisan tinker --execute="
\$settings = \App\Models\SettingToko::latest()->first();
if (\$settings) {
    echo 'Slide 1 path: ' . (\$settings->slide_1 ?? 'NULL') . PHP_EOL;
    echo 'Slide 2 path: ' . (\$settings->slide_2 ?? 'NULL') . PHP_EOL;
    echo 'Slide 3 path: ' . (\$settings->slide_3 ?? 'NULL') . PHP_EOL;
    echo PHP_EOL;
    echo 'Full slide 1 URL: https://api.aidareu.com/storage/' . (\$settings->slide_1 ?? '') . PHP_EOL;
    echo 'Full slide 2 URL: https://api.aidareu.com/storage/' . (\$settings->slide_2 ?? '') . PHP_EOL;
    echo 'Full slide 3 URL: https://api.aidareu.com/storage/' . (\$settings->slide_3 ?? '') . PHP_EOL;
} else {
    echo 'No settings found!' . PHP_EOL;
}
"

echo ""
echo "=== Step 4: Recent Laravel logs (last 50 lines) ==="
echo ""
tail -n 50 storage/logs/laravel.log

echo ""
echo "===================================="
echo "Debug information collected!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Compare the filename in storage vs database"
echo "2. Try accessing the URL shown above"
echo "3. Check the Laravel logs for the Storage request/warning"

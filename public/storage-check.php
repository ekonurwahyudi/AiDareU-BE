<?php
/**
 * Quick Storage Diagnostic
 * Access: https://api.aidareu.com/storage-check.php
 */

header('Content-Type: text/plain; charset=utf-8');

echo "=== STORAGE DIAGNOSTIC ===\n\n";

$baseDir = dirname(__DIR__);

// 1. Symlink check
echo "1. SYMLINK STATUS:\n";
$symlinkPath = __DIR__ . '/storage';
echo "   Path: $symlinkPath\n";
echo "   Exists: " . (file_exists($symlinkPath) ? "✓ YES" : "✗ NO") . "\n";
echo "   Is Link: " . (is_link($symlinkPath) ? "✓ YES" : "✗ NO") . "\n";

if (is_link($symlinkPath)) {
    $target = readlink($symlinkPath);
    echo "   Target: $target\n";
    $realTarget = realpath($symlinkPath);
    echo "   Real Path: " . ($realTarget ?: "NOT FOUND") . "\n";
    echo "   Target Exists: " . ($realTarget && file_exists($realTarget) ? "✓ YES" : "✗ NO") . "\n";
} else {
    echo "   ⚠️  SYMLINK NOT CREATED!\n";
}
echo "\n";

// 2. Storage structure
echo "2. STORAGE STRUCTURE:\n";
$storagePublic = $baseDir . '/storage/app/public';
echo "   Base: $storagePublic\n";
echo "   Exists: " . (is_dir($storagePublic) ? "✓ YES" : "✗ NO") . "\n";

$dirs = [
    'theme/slides',
    'theme/logos',
    'theme/favicons',
    'theme/seo',
    'products',
    'products-digital',
    'editor-images'
];

foreach ($dirs as $dir) {
    $path = "$storagePublic/$dir";
    $exists = is_dir($path);
    echo "   - $dir: " . ($exists ? "✓" : "✗") . "\n";
}
echo "\n";

// 3. Check files in slides
echo "3. FILES IN theme/slides:\n";
$slidesDir = "$storagePublic/theme/slides";
if (is_dir($slidesDir)) {
    $files = glob($slidesDir . '/*');
    echo "   Count: " . count($files) . " files\n";

    if (count($files) > 0) {
        echo "   Recent files:\n";
        // Sort by modification time
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });

        foreach (array_slice($files, 0, 3) as $file) {
            $name = basename($file);
            $size = filesize($file);
            $time = date('Y-m-d H:i:s', filemtime($file));
            $perms = substr(sprintf('%o', fileperms($file)), -4);
            echo "   - $name\n";
            echo "     Size: " . number_format($size) . " bytes\n";
            echo "     Modified: $time\n";
            echo "     Perms: $perms\n";
        }
    }
} else {
    echo "   ✗ Directory not found!\n";
}
echo "\n";

// 4. Access test via symlink
echo "4. SYMLINK ACCESS TEST:\n";
if (is_link($symlinkPath) && is_dir($slidesDir)) {
    $files = glob($slidesDir . '/*');
    if (count($files) > 0) {
        $testFile = $files[0];
        $fileName = basename($testFile);
        $publicPath = $symlinkPath . '/theme/slides/' . $fileName;

        echo "   Test file: $fileName\n";
        echo "   Direct path accessible: " . (file_exists($testFile) ? "✓ YES" : "✗ NO") . "\n";
        echo "   Symlink path accessible: " . (file_exists($publicPath) ? "✓ YES" : "✗ NO") . "\n";

        if (file_exists($publicPath)) {
            echo "   Sizes match: " . (filesize($publicPath) === filesize($testFile) ? "✓ YES" : "✗ NO") . "\n";
        }
    }
}
echo "\n";

// 5. Test URLs
echo "5. TEST URLS:\n";
$protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'api.aidareu.com';

if (is_dir($slidesDir)) {
    $files = glob($slidesDir . '/*');
    if (count($files) > 0) {
        $testFile = basename($files[0]);
        $testUrl = "{$protocol}://{$host}/storage/theme/slides/{$testFile}";
        echo "   Copy and test this URL:\n";
        echo "   $testUrl\n\n";
        echo "   Expected: HTTP 200 with image\n";
        echo "   If 404: Symlink or route issue\n";
        echo "   If CORS error: Check middleware\n";
    }
}
echo "\n";

// 6. Environment info
echo "6. ENVIRONMENT:\n";
echo "   PHP Version: " . PHP_VERSION . "\n";
echo "   Server: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
echo "   Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'N/A') . "\n";
echo "   User: " . (function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : 'Unknown') . "\n";
echo "\n";

// 7. Recommendations
echo "7. RECOMMENDATIONS:\n";
if (!is_link($symlinkPath)) {
    echo "   ⚠️  RUN: php artisan storage:link --force\n";
}
if (!is_dir($slidesDir)) {
    echo "   ⚠️  RUN: mkdir -p storage/app/public/theme/slides\n";
}
if (is_link($symlinkPath) && !realpath($symlinkPath)) {
    echo "   ⚠️  BROKEN SYMLINK: Delete and recreate\n";
}

echo "\n=== END DIAGNOSTIC ===\n";

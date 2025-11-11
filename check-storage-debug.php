<?php
/**
 * Storage Diagnostic Script
 * Run this in browser: https://api.aidareu.com/check-storage-debug.php
 * Or via CLI: php check-storage-debug.php
 */

echo "=== STORAGE DIAGNOSTIC SCRIPT ===\n\n";

// 1. Check if running in Laravel context
echo "1. ENVIRONMENT CHECK:\n";
echo "   - PHP Version: " . PHP_VERSION . "\n";
echo "   - Script Location: " . __FILE__ . "\n";
echo "   - Current Working Dir: " . getcwd() . "\n\n";

// 2. Check symlink
echo "2. SYMLINK CHECK:\n";
$publicStorage = __DIR__ . '/public/storage';
echo "   - Public storage path: $publicStorage\n";
echo "   - Exists: " . (file_exists($publicStorage) ? "YES" : "NO") . "\n";
echo "   - Is link: " . (is_link($publicStorage) ? "YES" : "NO") . "\n";
if (is_link($publicStorage)) {
    $target = readlink($publicStorage);
    echo "   - Link target: $target\n";
    echo "   - Target exists: " . (file_exists($target) ? "YES" : "NO") . "\n";
}
echo "\n";

// 3. Check storage directory structure
echo "3. STORAGE DIRECTORY STRUCTURE:\n";
$storagePublic = __DIR__ . '/storage/app/public';
echo "   - Storage public path: $storagePublic\n";
echo "   - Exists: " . (is_dir($storagePublic) ? "YES" : "NO") . "\n";

if (is_dir($storagePublic)) {
    echo "   - Permissions: " . substr(sprintf('%o', fileperms($storagePublic)), -4) . "\n";
    echo "   - Owner: " . posix_getpwuid(filestat($storagePublic)['uid'])['name'] ?? 'unknown' . "\n";

    // Check subdirectories
    $subdirs = ['theme', 'products', 'products-digital', 'editor-images'];
    foreach ($subdirs as $subdir) {
        $path = "$storagePublic/$subdir";
        echo "   - $subdir: " . (is_dir($path) ? "EXISTS" : "MISSING") . "\n";

        if ($subdir === 'theme' && is_dir($path)) {
            $themeSubdirs = ['logos', 'slides', 'favicons', 'seo'];
            foreach ($themeSubdirs as $themeDir) {
                $themePath = "$path/$themeDir";
                echo "     - theme/$themeDir: " . (is_dir($themePath) ? "EXISTS" : "MISSING") . "\n";
            }
        }
    }
}
echo "\n";

// 4. Check actual files in theme/slides
echo "4. FILES IN theme/slides:\n";
$slidesPath = __DIR__ . '/storage/app/public/theme/slides';
if (is_dir($slidesPath)) {
    echo "   - Slides directory: EXISTS\n";
    echo "   - Permissions: " . substr(sprintf('%o', fileperms($slidesPath)), -4) . "\n";

    $files = glob($slidesPath . '/*');
    echo "   - File count: " . count($files) . "\n";

    if (count($files) > 0) {
        echo "   - Files:\n";
        foreach (array_slice($files, 0, 5) as $file) {
            $filename = basename($file);
            $size = filesize($file);
            $perms = substr(sprintf('%o', fileperms($file)), -4);
            $mime = mime_content_type($file);
            echo "     - $filename ($size bytes, $perms, $mime)\n";
        }
    }
} else {
    echo "   - Slides directory: MISSING\n";
}
echo "\n";

// 5. Check if files accessible via symlink
echo "5. SYMLINK ACCESS TEST:\n";
if (is_link($publicStorage)) {
    $testFile = null;
    $files = glob($slidesPath . '/*');
    if (count($files) > 0) {
        $testFile = basename($files[0]);
        $publicPath = $publicStorage . '/theme/slides/' . $testFile;
        echo "   - Test file: $testFile\n";
        echo "   - Public path: $publicPath\n";
        echo "   - Accessible: " . (file_exists($publicPath) ? "YES" : "NO") . "\n";

        if (file_exists($publicPath)) {
            echo "   - Size matches: " . (filesize($publicPath) === filesize($files[0]) ? "YES" : "NO") . "\n";
        }
    } else {
        echo "   - No test files found\n";
    }
} else {
    echo "   - Symlink not created, cannot test\n";
}
echo "\n";

// 6. Test storage facade (if Laravel available)
echo "6. LARAVEL STORAGE FACADE TEST:\n";
$bootstrapPath = __DIR__ . '/bootstrap/app.php';
if (file_exists($bootstrapPath)) {
    try {
        require __DIR__ . '/vendor/autoload.php';
        $app = require_once $bootstrapPath;
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();

        echo "   - Laravel loaded: YES\n";

        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        echo "   - Storage disk: public\n";
        echo "   - Root path: " . $disk->path('') . "\n";

        $files = $disk->files('theme/slides');
        echo "   - Files via Storage facade: " . count($files) . "\n";

        if (count($files) > 0) {
            $testFile = $files[0];
            echo "   - Test file: $testFile\n";
            echo "   - Exists (facade): " . ($disk->exists($testFile) ? "YES" : "NO") . "\n";
            echo "   - Size (facade): " . $disk->size($testFile) . " bytes\n";
            echo "   - URL: " . $disk->url($testFile) . "\n";
        }
    } catch (Exception $e) {
        echo "   - Error loading Laravel: " . $e->getMessage() . "\n";
    }
} else {
    echo "   - Laravel bootstrap not found\n";
}
echo "\n";

// 7. Check web server configuration
echo "7. WEB SERVER CHECK:\n";
echo "   - Server software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'CLI') . "\n";
echo "   - Document root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'N/A') . "\n";
echo "   - Script filename: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'N/A') . "\n";
echo "\n";

// 8. Generate test URLs
echo "8. TEST URLS:\n";
if (isset($_SERVER['HTTP_HOST'])) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];

    $files = glob($slidesPath . '/*');
    if (count($files) > 0) {
        $testFile = basename($files[0]);
        echo "   - Direct symlink: {$protocol}://{$host}/storage/theme/slides/{$testFile}\n";
        echo "   - Via Laravel route: {$protocol}://{$host}/storage/theme/slides/{$testFile}\n";
    }
} else {
    echo "   - Running in CLI mode, cannot generate URLs\n";
}
echo "\n";

echo "=== END DIAGNOSTIC ===\n";

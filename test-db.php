<?php

/**
 * Database Connection Test Script
 * Run this in backend directory: php test-db.php
 */

// Load Laravel
require __DIR__ . '/backend/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n========================================\n";
echo "  Database Connection Test\n";
echo "========================================\n\n";

// Test 1: PDO Connection
echo "Test 1: PDO Connection\n";
echo "----------------------\n";
try {
    $pdo = DB::connection()->getPdo();
    echo "✓ Database connected successfully!\n";
    echo "  Driver: " . $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) . "\n";
    echo "  Server Version: " . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) . "\n";
} catch (Exception $e) {
    echo "✗ Database connection FAILED!\n";
    echo "  Error: " . $e->getMessage() . "\n";
    exit(1);
}
echo "\n";

// Test 2: Database Configuration
echo "Test 2: Database Configuration\n";
echo "------------------------------\n";
$config = config('database.connections.' . config('database.default'));
echo "  Connection: " . config('database.default') . "\n";
echo "  Host: " . ($config['host'] ?? 'N/A') . "\n";
echo "  Port: " . ($config['port'] ?? 'N/A') . "\n";
echo "  Database: " . ($config['database'] ?? 'N/A') . "\n";
echo "  Username: " . ($config['username'] ?? 'N/A') . "\n";
echo "\n";

// Test 3: Tables Check
echo "Test 3: Database Tables\n";
echo "-----------------------\n";
try {
    $tables = DB::select('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');
    echo "  Tables found: " . count($tables) . "\n";
    if (count($tables) > 0) {
        echo "  Sample tables:\n";
        foreach (array_slice($tables, 0, 10) as $table) {
            echo "    - " . $table->tablename . "\n";
        }
    }
} catch (Exception $e) {
    echo "✗ Could not list tables: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 4: Users Table
echo "Test 4: Users Table\n";
echo "-------------------\n";
try {
    $userCount = DB::table('users')->count();
    echo "✓ Users table accessible\n";
    echo "  Total users: " . $userCount . "\n";

    if ($userCount > 0) {
        $sampleUser = DB::table('users')->first(['id', 'email', 'created_at']);
        echo "  Sample user:\n";
        echo "    ID: " . $sampleUser->id . "\n";
        echo "    Email: " . $sampleUser->email . "\n";
        echo "    Created: " . $sampleUser->created_at . "\n";
    }
} catch (Exception $e) {
    echo "✗ Could not access users table: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 5: Sessions Table
echo "Test 5: Sessions Table\n";
echo "----------------------\n";
try {
    $sessionCount = DB::table('sessions')->count();
    echo "✓ Sessions table accessible\n";
    echo "  Active sessions: " . $sessionCount . "\n";
} catch (Exception $e) {
    echo "✗ Could not access sessions table: " . $e->getMessage() . "\n";
    echo "  Note: Run migrations if table doesn't exist\n";
}
echo "\n";

// Test 6: Migrations Status
echo "Test 6: Migrations Status\n";
echo "-------------------------\n";
try {
    $migrations = DB::table('migrations')->count();
    echo "✓ Migrations table accessible\n";
    echo "  Migrations run: " . $migrations . "\n";
} catch (Exception $e) {
    echo "✗ Migrations table not found: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 7: Test Query
echo "Test 7: Test Query\n";
echo "------------------\n";
try {
    $result = DB::select('SELECT NOW() as current_time, version() as pg_version');
    echo "✓ Query executed successfully\n";
    echo "  Current Time: " . $result[0]->current_time . "\n";
    echo "  PostgreSQL Version: " . $result[0]->pg_version . "\n";
} catch (Exception $e) {
    echo "✗ Query failed: " . $e->getMessage() . "\n";
}
echo "\n";

echo "========================================\n";
echo "Database test complete!\n";
echo "========================================\n\n";

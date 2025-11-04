#!/bin/bash
# Script to check Laravel logs for storage requests

echo "===================================="
echo "Checking Laravel Logs"
echo "===================================="

cd /app

echo ""
echo "=== Last 100 lines of Laravel log ==="
echo ""
tail -n 100 storage/logs/laravel.log

echo ""
echo ""
echo "=== Filtering for 'Storage request' logs ==="
echo ""
grep "Storage request" storage/logs/laravel.log | tail -n 20

echo ""
echo "=== Filtering for 'Storage file not found' logs ==="
echo ""
grep "Storage file not found" storage/logs/laravel.log | tail -n 20

echo ""
echo "=== Filtering for the specific file ==="
echo ""
grep "3w4rDhc7CMh8oM7q6iQNf9qJ7HZYHypPJC3SvWCF" storage/logs/laravel.log | tail -n 20

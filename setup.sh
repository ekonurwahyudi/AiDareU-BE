#!/bin/bash

echo "========================================"
echo "    AiDareU Backend Setup Script"
echo "========================================"
echo ""

# Function to check command success
check_success() {
    if [ $? -ne 0 ]; then
        echo "ERROR: $1 failed!"
        exit 1
    fi
    echo "✓ $1 completed successfully!"
    echo ""
}

echo "[1] Installing Composer dependencies..."
composer install
check_success "Composer install"

echo "[2] Copying environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Environment file created from .env.example"
else
    echo "⚠ Environment file already exists, skipping..."
fi
echo ""

echo "[3] Generating application key..."
php artisan key:generate
check_success "Application key generation"

echo "[4] Running database migrations..."
php artisan migrate:fresh --force
check_success "Database migrations"

echo "[5] Running database seeders..."
php artisan db:seed
check_success "Database seeding"

echo "[6] Creating storage link..."
php artisan storage:link
if [ $? -ne 0 ]; then
    echo "WARNING: Storage link creation failed (this is optional)"
fi
echo ""

echo "[7] Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "✓ Application optimized successfully!"
echo ""

echo "========================================"
echo "           SETUP COMPLETED!"
echo "========================================"
echo ""
echo "Default Users Created:"
echo "┌─────────────────────────────────────────┐"
echo "│ Super Admin: admin@aidaru.com           │"
echo "│ Password: admin123                      │"
echo "│                                         │"
echo "│ Store Owner: owner@example.com          │"
echo "│ Password: owner123                      │"
echo "│                                         │"
echo "│ Admin Toko: admin.toko@example.com      │"
echo "│ Password: admin123                      │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "Sample Store: contoh-toko.aidaru.com"
echo ""
echo "API Endpoints available at:"
echo "- http://localhost:8000/api/auth/register"
echo "- http://localhost:8000/api/auth/login"
echo "- http://localhost:8000/api/rbac/*"
echo "- http://localhost:8000/api/stores/*"
echo ""
echo "To start the server, run: php artisan serve"
echo ""
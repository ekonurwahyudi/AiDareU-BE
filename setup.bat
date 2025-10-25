@echo off
echo ========================================
echo    AiDareU Backend Setup Script
echo ========================================
echo.

echo [1] Installing Composer dependencies...
composer install
if %errorlevel% neq 0 (
    echo ERROR: Composer install failed!
    pause
    exit /b 1
)
echo ✓ Composer dependencies installed successfully!
echo.

echo [2] Copying environment file...
if not exist .env (
    copy .env.example .env
    echo ✓ Environment file created from .env.example
) else (
    echo ⚠ Environment file already exists, skipping...
)
echo.

echo [3] Generating application key...
php artisan key:generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate application key!
    pause
    exit /b 1
)
echo ✓ Application key generated successfully!
echo.

echo [4] Running database migrations...
php artisan migrate:fresh --force
if %errorlevel% neq 0 (
    echo ERROR: Database migration failed!
    echo Please check your database configuration in .env file
    pause
    exit /b 1
)
echo ✓ Database migrations completed successfully!
echo.

echo [5] Running database seeders...
php artisan db:seed
if %errorlevel% neq 0 (
    echo ERROR: Database seeding failed!
    pause
    exit /b 1
)
echo ✓ Database seeding completed successfully!
echo.

echo [6] Creating storage link...
php artisan storage:link
if %errorlevel% neq 0 (
    echo WARNING: Storage link creation failed (this is optional)
)
echo.

echo [7] Optimizing application...
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo ✓ Application optimized successfully!
echo.

echo ========================================
echo           SETUP COMPLETED!
echo ========================================
echo.
echo Default Users Created:
echo ┌─────────────────────────────────────────┐
echo │ Super Admin: admin@aidaru.com           │
echo │ Password: admin123                      │
echo │                                         │
echo │ Store Owner: owner@example.com          │
echo │ Password: owner123                      │
echo │                                         │
echo │ Admin Toko: admin.toko@example.com      │
echo │ Password: admin123                      │
echo └─────────────────────────────────────────┘
echo.
echo Sample Store: contoh-toko.aidaru.com
echo.
echo API Endpoints available at:
echo - http://localhost:8080/api/auth/register
echo - http://localhost:8080/api/auth/login
echo - http://localhost:8080/api/rbac/*
echo - http://localhost:8080/api/stores/*
echo.
echo To start the server, run: php artisan serve --port=8080
echo.
pause
@echo off
REM AiDareU - Start All Services (Windows)
REM This script starts both backend and frontend services

echo.
echo 🚀 Starting AiDareU Services...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Start Backend
echo 📦 Starting Backend Services (PostgreSQL + Laravel API)...
cd backend
if not exist .env (
    echo ⚠️  .env file not found in backend. Copying from .env.docker...
    copy .env.docker .env
    echo ⚠️  Please edit backend\.env with your configuration!
    pause
    exit /b 1
)
docker-compose up -d
cd ..

REM Wait for backend to be healthy
echo ⏳ Waiting for backend to be ready...
timeout /t 10 /nobreak >nul

echo 🔍 Checking backend health...
timeout /t 5 /nobreak >nul

REM Start Frontend
echo.
echo 🎨 Starting Frontend Service (Next.js Dashboard)...
cd frontend
if not exist .env.production.local (
    echo ⚠️  .env.production.local not found. Copying from .env.docker...
    copy .env.docker .env.production.local
)
docker-compose up -d
cd ..

echo.
echo ✅ All services started successfully!
echo.
echo 📊 Service URLs:
echo    • Frontend:  http://localhost:3000
echo    • Backend:   http://localhost:8080
echo    • Database:  localhost:5432
echo.
echo 📝 View logs:
echo    • Backend:   docker-compose -f backend\docker-compose.yml logs -f
echo    • Frontend:  docker-compose -f frontend\docker-compose.yml logs -f
echo.
echo 🛑 Stop all services:
echo    stop-all.bat
echo.
pause

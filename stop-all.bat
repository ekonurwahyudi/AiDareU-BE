@echo off
REM AiDareU - Stop All Services (Windows)
REM This script stops both backend and frontend services

echo.
echo 🛑 Stopping AiDareU Services...
echo.

REM Stop Frontend
echo 🎨 Stopping Frontend Service...
cd frontend
docker-compose down
cd ..

REM Stop Backend
echo 📦 Stopping Backend Services...
cd backend
docker-compose down
cd ..

echo.
echo ✅ All services stopped successfully!
echo.
echo 💡 To remove all data (including database):
echo    cd backend ^&^& docker-compose down -v
echo.
pause

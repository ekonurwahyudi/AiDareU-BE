#!/bin/bash

# AiDareU - Stop All Services
# This script stops both backend and frontend services

set -e

echo "🛑 Stopping AiDareU Services..."
echo ""

# Stop Frontend
echo "🎨 Stopping Frontend Service..."
cd frontend
docker-compose down
cd ..

# Stop Backend
echo "📦 Stopping Backend Services..."
cd backend
docker-compose down
cd ..

echo ""
echo "✅ All services stopped successfully!"
echo ""
echo "💡 To remove all data (including database):"
echo "   cd backend && docker-compose down -v"
echo ""

#!/bin/bash

# AiDareU - Start All Services
# This script starts both backend and frontend services

set -e

echo "🚀 Starting AiDareU Services..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start Backend
echo "📦 Starting Backend Services (PostgreSQL + Laravel API)..."
cd backend
if [ ! -f .env ]; then
    echo "⚠️  .env file not found in backend. Copying from .env.docker..."
    cp .env.docker .env
    echo "⚠️  Please edit backend/.env with your configuration!"
    exit 1
fi
docker-compose up -d
cd ..

# Wait for backend to be healthy
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Check backend health
echo "🔍 Checking backend health..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose -f backend/docker-compose.yml ps | grep -q "healthy"; then
        echo "✅ Backend is healthy!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Backend failed to become healthy. Check logs with: docker-compose -f backend/docker-compose.yml logs"
    exit 1
fi

# Start Frontend
echo ""
echo "🎨 Starting Frontend Service (Next.js Dashboard)..."
cd frontend
if [ ! -f .env.production.local ]; then
    echo "⚠️  .env.production.local not found in frontend. Copying from .env.docker..."
    cp .env.docker .env.production.local
fi
docker-compose up -d
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📊 Service URLs:"
echo "   • Frontend:  http://localhost:3000"
echo "   • Backend:   http://localhost:8080"
echo "   • Database:  localhost:5432"
echo ""
echo "📝 View logs:"
echo "   • Backend:   docker-compose -f backend/docker-compose.yml logs -f"
echo "   • Frontend:  docker-compose -f frontend/docker-compose.yml logs -f"
echo ""
echo "🛑 Stop all services:"
echo "   ./stop-all.sh"
echo ""

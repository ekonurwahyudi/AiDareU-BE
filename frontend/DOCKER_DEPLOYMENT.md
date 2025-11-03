# AiDareU Frontend - Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose V2
- Backend service running (or accessible)

## Quick Start

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.docker .env.production.local
```

Edit `.env.production.local` and update:
- `NEXT_PUBLIC_API_URL`: Backend API URL for browser requests (e.g., http://localhost:8080/api)
- `API_URL`: Backend API URL for server-side requests (e.g., http://aidareu-backend:8080/api)

### 2. Build and Run

```bash
# Build and start frontend service
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- Frontend: http://localhost:3000

## Services

### Frontend (Next.js)
- Port: 3000
- Framework: Next.js 15
- Runtime: Node.js 18-alpine
- Build: Standalone output mode

## Network

The frontend connects to the `aidareu-network` Docker network to communicate with the backend service.

**Important**: Make sure the backend is running and has created the `aidareu-network` before starting the frontend.

## Management Commands

```bash
# Stop service
docker-compose down

# Restart service
docker-compose restart

# View logs
docker-compose logs -f frontend

# Rebuild service
docker-compose up -d --build

# Execute commands in container
docker-compose exec frontend sh
```

## Running with Backend

### Option 1: Run Both Services

From the root directory (aidareu):

```bash
# Start backend first (creates network)
cd backend
docker-compose up -d

# Then start frontend
cd ../frontend
docker-compose up -d
```

### Option 2: Combined Docker Compose (Root Level)

You can also use the root-level `docker-compose.yml` to run both services:

```bash
cd /path/to/aidareu
docker-compose up -d
```

## Environment Variables

### Build-time Variables
- `NEXT_PUBLIC_API_URL`: API URL accessible from browser

### Runtime Variables
- `NODE_ENV`: Set to `production`
- `PORT`: Application port (default: 3000)
- `NEXT_PUBLIC_API_URL`: Public API URL
- `API_URL`: Internal API URL for server-side requests

## Production Deployment

For production deployment:

1. Update environment variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
   API_URL=http://backend-service:8080/api
   ```

2. Build with production values:
   ```bash
   docker-compose build --build-arg NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
   docker-compose up -d
   ```

3. Configure reverse proxy (Nginx/Caddy) if needed

4. Set up SSL certificates

5. Configure proper security headers

## Dockerfile Explanation

The frontend uses a multi-stage build:

1. **deps stage**: Install dependencies
2. **builder stage**: Build the Next.js application with standalone output
3. **runner stage**: Run the optimized production build

The standalone output mode creates a minimal production image with only the necessary files.

## Troubleshooting

### Cannot Connect to Backend

Check if backend is running:
```bash
docker network inspect aidareu-network
```

The backend container should be listed in the network.

### Build Errors

Clear cache and rebuild:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### View Frontend Logs
```bash
docker-compose logs -f frontend
```

### API Connection Issues

Verify environment variables:
```bash
docker-compose exec frontend env | grep API
```

Make sure `NEXT_PUBLIC_API_URL` points to the correct backend URL.

## Health Checks

The frontend has a health check configured:
- HTTP check on port 3000
- Interval: 30s
- Start period: 40s (allows time for build and startup)

## Performance Optimization

The Docker image is optimized for production:
- Multi-stage build reduces image size
- Standalone output includes only necessary dependencies
- Static assets are properly cached
- Non-root user for security

## Development vs Production

This Docker setup is for **production deployment**. For development, use:

```bash
npm run dev
```

## Support

For issues and questions, please check:
- Next.js Documentation: https://nextjs.org/docs
- Docker Documentation: https://docs.docker.com
- Material-UI Documentation: https://mui.com

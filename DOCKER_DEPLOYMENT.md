# AiDareU Backend - Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose V2

## Quick Start

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.docker .env
```

Edit `.env` and update the following values:
- Database credentials (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`)
- Email configuration (`MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`)
- API keys (`OPENAI_API_KEY`, `BITESHIP_API_KEY`)

### 2. Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- Backend API: http://localhost:8080
- API Documentation: http://localhost:8080/api
- PostgreSQL: localhost:5432

### 4. Initial Setup

The application will automatically:
- Generate APP_KEY if not set
- Install Composer dependencies
- Run database migrations
- Create storage symlink
- Cache configurations

## Services

### Backend (Laravel + Nginx + PHP-FPM)
- Port: 8080
- Framework: Laravel 11
- PHP Version: 8.2
- Web Server: Nginx

### PostgreSQL Database
- Port: 5432
- Version: 15-alpine
- Database: aidareu (configurable)

## Network

The backend creates a Docker network named `aidareu-network` that can be shared with the frontend service.

## Management Commands

```bash
# Stop services
docker-compose down

# Stop and remove volumes (⚠️ Warning: This will delete all data)
docker-compose down -v

# Restart services
docker-compose restart

# View backend logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f postgres

# Execute commands in backend container
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan tinker

# Access database
docker-compose exec postgres psql -U postgres -d aidareu

# Rebuild services
docker-compose up -d --build
```

## Production Deployment

For production deployment:

1. Update `.env` with production values:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-domain.com
   ```

2. Use secure passwords for database

3. Configure proper email settings

4. Set up proper API keys

5. Consider using external database for better reliability

6. Set up proper backup strategies for volumes

## Troubleshooting

### Permission Issues
```bash
docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
docker-compose exec backend chmod -R ug+rwx storage bootstrap/cache
```

### Clear Cache
```bash
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan view:clear
docker-compose exec backend php artisan route:clear
```

### Database Issues
```bash
# Reset and re-migrate database (⚠️ Warning: This will delete all data)
docker-compose exec backend php artisan migrate:fresh --seed
```

### View Backend Logs
```bash
docker-compose logs -f backend
```

## Volumes

- `postgres_data`: PostgreSQL database files
- `backend_storage`: Laravel storage directory
- `backend_cache`: Laravel bootstrap cache

## Health Checks

Both services have health checks configured:
- Backend: HTTP check on port 8080
- PostgreSQL: pg_isready check

## Security Notes

- Never commit `.env` file to git
- Use strong passwords for production
- Keep API keys secure
- Update `SANCTUM_STATEFUL_DOMAINS` for your frontend domain
- Configure proper CORS settings in `config/cors.php`

## Support

For issues and questions, please check:
- Laravel Documentation: https://laravel.com/docs
- Docker Documentation: https://docs.docker.com

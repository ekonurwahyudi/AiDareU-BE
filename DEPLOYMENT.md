# 🚀 AiDareU - Deployment Guide

## 📋 Prerequisites

- Docker & Docker Compose installed
- GitHub account
- Easypanel account (or any VPS with Docker)
- Domain: `aidareu.com` (configured DNS)

---

## 🔧 Local Development

### 1. Clone Repository
```bash
git clone https://github.com/your-username/aidareu.git
cd aidareu
```

### 2. Setup Environment
```bash
# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 3. Build & Run
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database: localhost:5432

### 5. Initial Setup
```bash
# Generate Laravel key (if not set)
docker-compose exec backend-php php artisan key:generate

# Run migrations
docker-compose exec backend-php php artisan migrate

# (Optional) Seed database
docker-compose exec backend-php php artisan db:seed
```

---

## 🌐 Production Deployment to Easypanel

### Step 1: Prepare Repository

```bash
# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Push to GitHub
git push origin main
```

### Step 2: Create .env for Production

Create `.env` file in root directory (DO NOT commit this):

```env
# Database
POSTGRES_DB=aidareu_prod
POSTGRES_USER=aidareu_user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Laravel
APP_KEY=base64:GENERATE_THIS_KEY

# Domains
DOMAIN=aidareu.com
API_DOMAIN=api.aidareu.com

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@aidareu.com
MAIL_FROM_NAME=AiDareU

# NextAuth
NEXTAUTH_SECRET=generate-random-secret-here
```

### Step 3: Setup in Easypanel

#### 3.1 Create New Project
1. Login to Easypanel
2. Click "New Project"
3. Name: `aidareu`
4. Connect to GitHub repository

#### 3.2 Deploy Database
1. Go to "Services" → "Add Service"
2. Select "PostgreSQL 15"
3. Configuration:
   - Name: `aidareu-postgres`
   - Database: `aidareu_prod`
   - Username: `aidareu_user`
   - Password: `[secure-password]`
4. Click "Deploy"

#### 3.3 Deploy Backend
1. "Add Service" → "From GitHub"
2. Configuration:
   - Name: `aidareu-backend`
   - Repository: `your-username/aidareu`
   - Branch: `main`
   - Dockerfile Path: `backend/Dockerfile`
   - Port: `9000` (internal)
3. Environment Variables (copy from .env):
   ```
   APP_NAME=AiDareU
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.aidareu.com
   APP_KEY=[your-key]
   DB_CONNECTION=pgsql
   DB_HOST=aidareu-postgres
   DB_PORT=5432
   DB_DATABASE=aidareu_prod
   DB_USERNAME=aidareu_user
   DB_PASSWORD=[your-password]
   ... (copy all from .env)
   ```
4. Click "Deploy"

#### 3.4 Deploy Nginx
1. "Add Service" → "Custom"
2. Configuration:
   - Name: `aidareu-nginx`
   - Image: `nginx:1.25-alpine`
   - Port: `80`
3. Mount volumes:
   - `/var/www/html` → Link to backend service
   - Add `backend/nginx.conf` → `/etc/nginx/conf.d/default.conf`
4. Domain: `api.aidareu.com`
5. Enable SSL (Let's Encrypt)

#### 3.5 Deploy Frontend
1. "Add Service" → "From GitHub"
2. Configuration:
   - Name: `aidareu-frontend`
   - Repository: `your-username/aidareu`
   - Branch: `main`
   - Dockerfile Path: `frontend/Dockerfile`
   - Port: `3000`
3. Environment Variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://api.aidareu.com
   NEXTAUTH_URL=https://aidareu.com
   NEXTAUTH_SECRET=[your-secret]
   ```
4. Domains:
   - `aidareu.com`
   - `www.aidareu.com`
5. Enable SSL (Let's Encrypt)

### Step 4: DNS Configuration

Point your domain to Easypanel server:

```
Type    Name    Value                   TTL
A       @       [easypanel-ip]         300
A       www     [easypanel-ip]         300
A       api     [easypanel-ip]         300
CNAME   www     aidareu.com            300
```

### Step 5: Run Initial Migration

```bash
# SSH to Easypanel or use terminal in dashboard
docker exec -it aidareu-backend php artisan migrate --force
docker exec -it aidareu-backend php artisan db:seed --force
docker exec -it aidareu-backend php artisan storage:link
```

---

## 🔄 Auto-Deploy Setup

1. In Easypanel Project Settings
2. Enable "Auto Deploy from GitHub"
3. Select branch: `main`
4. Trigger: "Push to branch"

Now every push to `main` will auto-deploy! 🎉

---

## 🛠️ Useful Commands

### Docker Commands
```bash
# View logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up -d --build [service-name]

# Execute command in container
docker-compose exec backend-php php artisan [command]

# Stop all services
docker-compose down

# Remove everything (including volumes)
docker-compose down -v
```

### Laravel Commands
```bash
# Clear cache
docker-compose exec backend-php php artisan cache:clear
docker-compose exec backend-php php artisan config:clear
docker-compose exec backend-php php artisan route:clear
docker-compose exec backend-php php artisan view:clear

# Generate key
docker-compose exec backend-php php artisan key:generate

# Run migrations
docker-compose exec backend-php php artisan migrate

# Rollback
docker-compose exec backend-php php artisan migrate:rollback

# Create user
docker-compose exec backend-php php artisan tinker
>>> User::create([...])
```

---

## 📊 Monitoring

### Health Checks
- Frontend: `http://localhost:3000` (should return 200)
- Backend: `http://localhost:8080/api/health`
- Database: `docker-compose exec postgres pg_isready`

### Logs Location
- Backend: `backend/storage/logs/laravel.log`
- Nginx: `/var/log/nginx/`
- PostgreSQL: Docker logs

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Set strong `APP_KEY`
- [ ] Enable HTTPS (SSL)
- [ ] Set `APP_DEBUG=false` in production
- [ ] Configure CORS properly
- [ ] Set secure session cookies
- [ ] Regular database backups
- [ ] Keep Docker images updated
- [ ] Use environment variables (never commit secrets)

---

## 🆘 Troubleshooting

### Frontend not connecting to backend
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify CORS settings in backend
- Check network connectivity

### Database connection error
- Verify `DB_HOST` matches service name
- Check database credentials
- Ensure postgres is healthy: `docker-compose ps`

### Permission errors
```bash
docker-compose exec backend-php chown -R www-data:www-data storage bootstrap/cache
docker-compose exec backend-php chmod -R 775 storage bootstrap/cache
```

### Migration errors
```bash
# Check database connection
docker-compose exec backend-php php artisan migrate:status

# Run manually
docker-compose exec backend-php php artisan migrate --force
```

---

## 📞 Support

For issues, please check:
- GitHub Issues: `https://github.com/your-username/aidareu/issues`
- Documentation: This file
- Logs: `docker-compose logs`

---

**Last Updated:** 2025-01-08
**Version:** 1.0.0

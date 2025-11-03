# EasyPanel Deployment Guide - AiDareU

## 🌐 Domain Configuration

### Recommended Setup

| Service | Domain | Port (Internal) | Description |
|---------|--------|-----------------|-------------|
| **Backend API** | `api.aidareu.com` | 8080 | Laravel API Server |
| **Frontend** | `aidareu.com` or `app.aidareu.com` | 3000 | Next.js Dashboard |
| **PostgreSQL** | Internal only | 5432 | Database |

## 📋 Prerequisites

1. EasyPanel installed and running
2. Domain `aidareu.com` pointed to your server
3. SSL certificates (EasyPanel handles this automatically)
4. PostgreSQL service created in EasyPanel

## 🚀 Deployment Steps

### Step 1: Create PostgreSQL Database

1. In EasyPanel, create a new PostgreSQL service:
   - Name: `aidareu-postgres`
   - Database: `aidareu`
   - Username: `postgres`
   - Password: (generate secure password)

2. Note down the connection details:
   - Host: `aidareu-postgres` (internal network)
   - Port: `5432`
   - Database: `aidareu`

### Step 2: Deploy Backend (Laravel API)

#### 2.1 Create Backend App in EasyPanel

1. **Create New App**:
   - Name: `aidareu-backend`
   - Type: GitHub
   - Repository: `https://github.com/ekonurwahyudi/AiDareU-BE.git`
   - Branch: `main`

2. **Build Settings**:
   ```dockerfile
   # Use existing Dockerfile
   Build Command: (use Dockerfile)
   ```

3. **Environment Variables**:
   ```env
   APP_NAME=AiDareU
   APP_ENV=production
   APP_KEY=base64:WaPKKNrAyHnZJ/74r0/ZvfYbiSo521URtXldvYFfRhM=
   APP_DEBUG=false
   APP_URL=https://api.aidareu.com

   # Database
   DB_CONNECTION=pgsql
   DB_HOST=aidareu-postgres
   DB_PORT=5432
   DB_DATABASE=aidareu
   DB_USERNAME=postgres
   DB_PASSWORD=<your-secure-password>

   # Sessions & Cache
   CACHE_DRIVER=file
   SESSION_DRIVER=database
   QUEUE_CONNECTION=sync

   # CORS & Sanctum
   SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,api.aidareu.com
   SESSION_DOMAIN=.aidareu.com

   # Email (Gmail SMTP)
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS=your-email@gmail.com
   MAIL_FROM_NAME=AiDareU

   # API Keys
   OPENAI_API_KEY=sk-...
   BITESHIP_API_KEY=biteship_live...

   # Migrations
   RUN_MIGRATIONS=true

   # Trust Proxies
   TRUSTED_PROXIES=*
   ```

4. **Domain Settings**:
   - Domain: `api.aidareu.com`
   - Port: `8080` (internal)
   - Enable SSL: ✅ Yes

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

#### 2.2 Verify Backend

```bash
# Check if API is accessible
curl https://api.aidareu.com/api

# Should return API response or 404 (depending on routes)
```

### Step 3: Deploy Frontend (Next.js)

#### 3.1 Create Frontend App in EasyPanel

1. **Create New App**:
   - Name: `aidareu-frontend`
   - Type: GitHub
   - Repository: `https://github.com/ekonurwahyudi/AiDareU-FE.git`
   - Branch: `main`

2. **Build Settings**:
   ```dockerfile
   # Use existing Dockerfile
   Build Command: (use Dockerfile)

   # Build Arguments (important!)
   NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
   ```

3. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=3000

   # API Configuration
   NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
   NEXT_PUBLIC_BACKEND_URL=https://api.aidareu.com
   API_URL=http://aidareu-backend:8080/api

   # Next.js
   NEXT_TELEMETRY_DISABLED=1
   ```

4. **Domain Settings**:
   - Domain: `aidareu.com` (or `app.aidareu.com`)
   - Port: `3000` (internal)
   - Enable SSL: ✅ Yes

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (may take 5-10 minutes)

#### 3.2 Verify Frontend

```bash
# Visit frontend
https://aidareu.com

# Should load the dashboard login page
```

## 🔧 Docker Compose (Alternative Method)

If you prefer using Docker Compose in EasyPanel:

### Backend docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    image: ghcr.io/ekonurwahyudi/aidareu-backend:latest
    environment:
      APP_URL: https://api.aidareu.com
      DB_HOST: aidareu-postgres
      DB_DATABASE: aidareu
      DB_USERNAME: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      SANCTUM_STATEFUL_DOMAINS: aidareu.com,app.aidareu.com,api.aidareu.com
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aidareu
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Frontend docker-compose.yml

```yaml
version: "3.8"

services:
  frontend:
    image: ghcr.io/ekonurwahyudi/aidareu-frontend:latest
    environment:
      NEXT_PUBLIC_API_URL: https://api.aidareu.com/api
      NEXT_PUBLIC_BACKEND_URL: https://api.aidareu.com
      API_URL: http://aidareu-backend:8080/api
    ports:
      - "3000:3000"
    restart: unless-stopped
```

## 🔍 Configuration Checklist

### Backend Configuration

- [ ] `APP_URL` = `https://api.aidareu.com`
- [ ] `DB_HOST` = PostgreSQL service name
- [ ] `SANCTUM_STATEFUL_DOMAINS` includes frontend domains
- [ ] `SESSION_DOMAIN` = `.aidareu.com`
- [ ] `TRUSTED_PROXIES` = `*`
- [ ] CORS config includes production domains
- [ ] Email credentials configured
- [ ] API keys configured
- [ ] SSL enabled for domain

### Frontend Configuration

- [ ] `NEXT_PUBLIC_API_URL` = `https://api.aidareu.com/api`
- [ ] `NEXT_PUBLIC_BACKEND_URL` = `https://api.aidareu.com`
- [ ] `API_URL` = Internal backend URL for SSR
- [ ] Build arg `NEXT_PUBLIC_API_URL` set correctly
- [ ] SSL enabled for domain

### Network & DNS

- [ ] `api.aidareu.com` → Server IP (A record)
- [ ] `aidareu.com` → Server IP (A record)
- [ ] SSL certificates auto-generated by EasyPanel
- [ ] Backend accessible via HTTPS
- [ ] Frontend accessible via HTTPS

## 🧪 Testing

### 1. Test Backend API

```bash
# Health check (if you have one)
curl https://api.aidareu.com/api/health

# Login endpoint
curl -X POST https://api.aidareu.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Test Frontend

1. Open browser: `https://aidareu.com`
2. Should see login page
3. Check browser console for errors
4. Verify API calls go to `https://api.aidareu.com/api`

### 3. Test CORS

```bash
# Should return CORS headers
curl -I -X OPTIONS https://api.aidareu.com/api/auth/login \
  -H "Origin: https://aidareu.com" \
  -H "Access-Control-Request-Method: POST"
```

## 🐛 Troubleshooting

### Backend Issues

**Problem**: 500 Error or App Key Missing
```bash
# Generate new app key
docker exec -it aidareu-backend php artisan key:generate

# Clear cache
docker exec -it aidareu-backend php artisan config:clear
docker exec -it aidareu-backend php artisan cache:clear
```

**Problem**: Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -it aidareu-backend php artisan tinker
>>> DB::connection()->getPdo();
```

**Problem**: CORS Errors
- Check `config/cors.php` includes frontend domain
- Check `SANCTUM_STATEFUL_DOMAINS` includes frontend domain
- Clear config cache: `php artisan config:clear`

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser Network tab for actual URL being called
- Verify backend is accessible: `curl https://api.aidareu.com/api`

**Problem**: Build fails
```bash
# Check build logs in EasyPanel
# Common issues:
# - Missing NEXT_PUBLIC_API_URL build arg
# - Node modules cache issues
# - Out of memory (increase Docker memory)
```

**Problem**: Environment variables not updating
- Rebuild the container (not just restart)
- For `NEXT_PUBLIC_*` vars, you MUST rebuild (they're embedded during build)

## 📊 Port Summary

| Service | External Port | Internal Port | Protocol |
|---------|---------------|---------------|----------|
| Backend | 443 (HTTPS) | 8080 | HTTP |
| Frontend | 443 (HTTPS) | 3000 | HTTP |
| PostgreSQL | None (internal) | 5432 | PostgreSQL |

**Note**: EasyPanel handles SSL termination, so internal apps run on HTTP, exposed via HTTPS.

## 🔐 Security Best Practices

1. **Environment Variables**:
   - Never commit `.env` files
   - Use EasyPanel's environment variables UI
   - Rotate API keys regularly

2. **Database**:
   - Use strong passwords
   - Enable backups in EasyPanel
   - Restrict access to internal network only

3. **SSL/TLS**:
   - Let EasyPanel manage SSL certificates
   - Force HTTPS redirects
   - Enable HSTS headers

4. **Application**:
   - Set `APP_DEBUG=false` in production
   - Enable rate limiting
   - Monitor error logs

## 📝 Maintenance

### Update Backend

```bash
# In EasyPanel UI:
1. Go to aidareu-backend app
2. Click "Redeploy"
3. EasyPanel pulls latest from GitHub
4. Rebuilds and restarts
```

### Update Frontend

```bash
# In EasyPanel UI:
1. Go to aidareu-frontend app
2. Click "Redeploy"
3. May take 5-10 minutes (Next.js build)
```

### Database Backup

```bash
# In EasyPanel:
1. Go to PostgreSQL service
2. Enable automated backups
3. Set backup retention period
```

### View Logs

```bash
# In EasyPanel UI:
1. Select app (backend or frontend)
2. Click "Logs" tab
3. Real-time log streaming
```

## 🎯 Final Checklist

Before going live:

- [ ] Both apps deployed successfully
- [ ] SSL certificates active
- [ ] Database connected
- [ ] Frontend can login
- [ ] API calls working
- [ ] CORS configured correctly
- [ ] Email sending works
- [ ] All environment variables set
- [ ] Backups enabled
- [ ] Error monitoring setup
- [ ] Test all major features

---

**Support**: For issues, check EasyPanel logs and verify all environment variables are set correctly.

**Last Updated**: October 2025

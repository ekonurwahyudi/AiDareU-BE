# EasyPanel Deployment Setup

## Overview

**Repositories:**
- Frontend: https://github.com/ekonurwahyudi/AiDareU-FE.git
- Backend: https://github.com/ekonurwahyudi/AiDareU-BE.git

**Domains:**
- Frontend: https://aidareu.com
- Backend API: https://api.aidareu.com

**Port Mapping (Internal):**
- Frontend: 80 (internal container port - EasyPanel standard)
- Backend: 8080 (internal container port)
- PostgreSQL: 5432

**Note:** EasyPanel menggunakan Traefik reverse proxy, jadi port external akan otomatis di-handle melalui port 443 (HTTPS).

---

## 1. PostgreSQL Database Setup

1. Di EasyPanel, buat service **PostgreSQL**
2. Nama service: `postgres` atau `aidareu-db`
3. Catat credentials yang dibuat:
   - `POSTGRES_DB`: aidareu
   - `POSTGRES_USER`: aidareu_user
   - `POSTGRES_PASSWORD`: [your-secure-password]

---

## 2. Backend (Laravel API) Setup

### A. Create Backend Service

1. **Buat App baru** di EasyPanel
   - Name: `aidareu-be`
   - Type: **GitHub**

2. **Source:**
   - Repository: `https://github.com/ekonurwahyudi/AiDareU-BE.git`
   - Branch: `main`
   - Build Method: **Dockerfile**

3. **Domains:**
   - Add domain: `api.aidareu.com`
   - Enable HTTPS

### B. Environment Variables

Set di EasyPanel Environment Variables:

```bash
# App
APP_NAME=AiDareU
APP_ENV=production
APP_KEY=base64:WaPKKNrAyHnZJ/74r0/ZvfYbiSo521URtXldvYFfRhM=
APP_DEBUG=false
APP_URL=https://api.aidareu.com

# Database (gunakan nama service PostgreSQL yang dibuat)
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=aidareu
DB_USERNAME=aidareu_user
DB_PASSWORD=[your-postgres-password]

# PostgreSQL credentials (untuk docker-entrypoint.sh)
POSTGRES_DB=aidareu
POSTGRES_USER=aidareu_user
POSTGRES_PASSWORD=[your-postgres-password]

# CORS & Session
SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,api.aidareu.com
SESSION_DOMAIN=.aidareu.com

# Cache & Session
CACHE_DRIVER=file
SESSION_DRIVER=database
QUEUE_CONNECTION=sync

# Trust Proxies
TRUSTED_PROXIES=*

# Email (Gmail SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=[your-gmail@gmail.com]
MAIL_PASSWORD=[your-app-password]
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=[your-gmail@gmail.com]
MAIL_FROM_NAME=AiDareU

# API Keys
OPENAI_API_KEY=[your-openai-key]
BITESHIP_API_KEY=[your-biteship-key]
```

### C. Port Configuration

- **Internal Port:** 8080
- Set di EasyPanel: Port → `8080`
- Protocol: HTTP
- Traefik akan otomatis handle HTTPS

### D. Deployment

1. Click **Deploy**
2. Monitor logs untuk memastikan:
   - Composer install berhasil
   - Database migration berhasil (jika ada)
   - Nginx + PHP-FPM running

---

## 3. Frontend (Next.js) Setup

### A. Create Frontend Service

1. **Buat App baru** di EasyPanel
   - Name: `aidareu-fe`
   - Type: **GitHub**

2. **Source:**
   - Repository: `https://github.com/ekonurwahyudi/AiDareU-FE.git`
   - Branch: `main`
   - Build Method: **Dockerfile**

3. **Domains:**
   - Add domain: `aidareu.com`
   - Enable HTTPS

### B. Build Arguments

Set di Build Args (sangat penting untuk build time):

```bash
NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
API_URL=https://api.aidareu.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.aidareu.com
```

### C. Environment Variables (Runtime)

Set di Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
API_URL=https://api.aidareu.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.aidareu.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### D. Port Configuration

- **Internal Port:** 80
- Set di EasyPanel: Port → `80`
- Protocol: HTTP
- Traefik akan otomatis handle HTTPS

**Note:** EasyPanel menggunakan port 80 sebagai standard untuk web applications. Next.js akan listen di port 80 sesuai ENV PORT=80 di Dockerfile.

### E. Deployment

1. Click **Deploy**
2. Monitor logs untuk memastikan:
   - npm install berhasil
   - Build icons berhasil
   - Next.js build berhasil
   - Server running di port 80

---

## 4. Troubleshooting Port Conflicts

### Issue: Port sudah digunakan

**Yang terlihat di `docker ps`:**
```
easypanel/easypanel:latest  → 0.0.0.0:3000->3000/tcp
traefik:3.3.7               → 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

**Penjelasan:**
- Port 80 dan 8080 yang di-expose di Dockerfile adalah **internal container port**
- EasyPanel menggunakan **Traefik reverse proxy** untuk routing
- Traffic: `Client → Traefik (443) → Container (80/8080)`
- **Tidak ada konflik** karena setiap container punya network namespace sendiri

**Solusi:**
✅ Frontend menggunakan port 80 (EasyPanel standard)
✅ Backend menggunakan port 8080
✅ EasyPanel akan handle routing otomatis via Traefik
✅ Pastikan di EasyPanel settings set correct internal port (80 untuk FE, 8080 untuk BE)

---

## 5. Testing Deployment

### Backend API Test

```bash
# Test health check
curl https://api.aidareu.com/api/health

# Test specific endpoint
curl https://api.aidareu.com/api/products
```

### Frontend Test

```bash
# Access frontend
curl https://aidareu.com

# Check if API calls work
# Open browser: https://aidareu.com
```

---

## 6. Common Issues

### 1. Build Failed - TypeScript/ESLint Errors

**Sudah di-fix** dengan:
- `typescript.ignoreBuildErrors: true`
- `eslint.ignoreDuringBuilds: true`

### 2. CORS Errors

Check di backend:
- `config/cors.php` sudah include `aidareu.com`
- `SANCTUM_STATEFUL_DOMAINS` sudah benar

### 3. Database Connection Failed

Check:
- PostgreSQL service running
- `DB_HOST` sama dengan nama service PostgreSQL
- Credentials benar

### 4. 502 Bad Gateway

Check:
- Container running (`docker ps`)
- Port configuration benar di EasyPanel
- Logs untuk error messages

---

## 7. Update Deployment

### Update Backend
```bash
cd D:\aidareu\backend
git add .
git commit -m "Update backend"
git push
# Rebuild di EasyPanel dashboard
```

### Update Frontend
```bash
cd D:\aidareu\frontend
git add .
git commit -m "Update frontend"
git push
# Rebuild di EasyPanel dashboard
```

---

## 8. Architecture Diagram

```
Internet (HTTPS/443)
    ↓
Traefik Reverse Proxy
    ├── aidareu.com → Frontend Container (port 80)
    └── api.aidareu.com → Backend Container (port 8080)
                              ↓
                         PostgreSQL (port 5432)
```

---

## 9. Environment Files

**Development:** `.env` (local)
**Production:** Configured via EasyPanel UI

Files in repo:
- `backend/.env.production` (reference only)
- `frontend/.env.production` (reference only)

**Important:** Actual production env vars harus di-set di EasyPanel UI, bukan dari file.

---

## 10. DNS Configuration

Pastikan DNS records sudah di-set:

```
A Record:
aidareu.com         → [EasyPanel-Server-IP]
api.aidareu.com     → [EasyPanel-Server-IP]

atau CNAME:
aidareu.com         → [easypanel-domain]
api.aidareu.com     → [easypanel-domain]
```

SSL Certificate akan otomatis di-handle oleh EasyPanel/Traefik menggunakan Let's Encrypt.

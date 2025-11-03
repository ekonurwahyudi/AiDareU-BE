# AiDareU Deployment Guide - Fix CORS & Login Issues

## Masalah yang Anda Alami

Berdasarkan screenshot error:
1. ❌ **401 Unauthorized** pada `/api/users/me`, `/api/rbac/permissions/me`, `/api/rbac/roles`
2. ❌ **JSON.parse SyntaxError** - API mengembalikan HTML error page, bukan JSON
3. ❌ **CORS errors** - Access-Control-Allow-Origin header issues

## Root Cause

### 1. User Belum Login
- Endpoint `/api/users/me` memerlukan authentication
- Jika tidak ada session/token, akan return 401
- Error 401 kadang return HTML page (bukan JSON), menyebabkan JSON.parse error

### 2. CORS Configuration
- Backend tidak mengizinkan origin `https://aidareu.com`
- Sanctum stateful domains tidak include production domains

### 3. Session Cookie Configuration
- `SESSION_DOMAIN` tidak diset untuk cross-subdomain sharing
- `SESSION_SAME_SITE` harus `none` untuk cross-origin with credentials
- `SESSION_SECURE_COOKIE` harus `true` untuk HTTPS

## Solusi yang Telah Diterapkan

### File yang Dimodifikasi

1. ✅ **backend/backend/config/cors.php**
   - Menambahkan semua domain production ke `allowed_origins`

2. ✅ **backend/backend/config/sanctum.php**
   - Menambahkan domain production ke `stateful` domains

3. ✅ **backend/backend/.env.production** (NEW)
   - Template environment untuk production

4. ✅ **frontend/frontend/.env.local** (NEW)
   - Environment untuk local development

## Deployment Steps

### A. Backend Deployment (PRODUCTION)

#### 1. Set Environment Variables

Di server production, edit file `.env`:

```bash
cd /path/to/backend
nano .env
```

Pastikan ada configuration ini:

```env
APP_NAME="AiDareU"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.aidareu.com

# SESSION CONFIGURATION - PENTING!
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_PATH=/
SESSION_DOMAIN=.aidareu.com          # Leading dot untuk share across subdomains
SESSION_SECURE_COOKIE=true           # HTTPS only
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=none               # Allow cross-site with credentials

# SANCTUM CONFIGURATION
SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,www.aidareu.com,api.aidareu.com

# Database
DB_CONNECTION=postgres
DB_HOST=your_db_host
DB_PORT=5432
DB_DATABASE=aidareu_prod
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

#### 2. Deploy Perubahan

```bash
# Pull latest code
cd /path/to/backend
git pull origin main

# Install dependencies (jika ada perubahan)
composer install --optimize-autoloader --no-dev

# Clear ALL caches (PENTING!)
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Rebuild cache untuk performance
php artisan config:cache
php artisan route:cache

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Restart Nginx
sudo systemctl reload nginx
```

#### 3. Verify Config

```bash
# Check current configuration
php artisan config:show session
php artisan config:show cors

# Check routes
php artisan route:list | grep users
```

### B. Frontend Deployment (PRODUCTION)

#### 1. Environment Variables

Pastikan di build environment ada:

```env
NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
API_URL=https://api.aidareu.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.aidareu.com
```

#### 2. Build & Deploy

```bash
cd /path/to/frontend
git pull origin main

# Install dependencies
npm install

# Build dengan production env
npm run build

# Start/restart application
pm2 restart aidareu-frontend
# atau
npm run start
```

### C. Local Development

#### Backend

```bash
cd backend/backend
cp .env.example .env
php artisan key:generate

# Set local config
# SESSION_DOMAIN=null
# SESSION_SECURE_COOKIE=false
# SESSION_SAME_SITE=lax
```

#### Frontend

```bash
cd frontend/frontend
cp .env.local.example .env.local

# Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
API_URL=http://localhost:8080/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

npm install
npm run dev
```

## Testing After Deployment

### 1. Test CORS Preflight

```bash
curl -v -H "Origin: https://aidareu.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type, Authorization" \
     -X OPTIONS \
     https://api.aidareu.com/api/users/me
```

Expected headers in response:
```
Access-Control-Allow-Origin: https://aidareu.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### 2. Test Login Flow

1. **Clear browser cache & cookies** (Ctrl+Shift+Del)

2. **Open DevTools** (F12) > Network tab

3. **Go to** `https://aidareu.com/login`

4. **Enter credentials** and login

5. **Check Network tab**:
   - Look for `/api/login` request
   - Check Response Headers:
     ```
     Set-Cookie: laravel_session=...; Domain=.aidareu.com; Secure; HttpOnly; SameSite=None
     Set-Cookie: XSRF-TOKEN=...; Domain=.aidareu.com; Secure; SameSite=None
     ```

6. **Check Application tab** > Cookies:
   - Domain should be `.aidareu.com`
   - Secure should be `✓`
   - SameSite should be `None`

### 3. Test Authenticated Requests

After login, check if these requests succeed:
- `GET /api/users/me` → Should return user data
- `GET /api/rbac/permissions/me` → Should return permissions
- `GET /api/rbac/roles` → Should return roles

## Troubleshooting

### Issue: Masih 401 Unauthorized setelah login

**Kemungkinan penyebab:**

1. **Session cookie tidak ter-set**

   Check di DevTools > Application > Cookies:
   ```javascript
   // Di browser console
   document.cookie
   ```

   Harus ada `laravel_session` atau sejenisnya dengan domain `.aidareu.com`

2. **Backend tidak recognize session**

   ```bash
   # Di backend server, check logs
   tail -f storage/logs/laravel.log
   ```

   Cari error tentang session atau authentication

3. **Cookies blocked oleh browser**

   - Chrome: Settings > Privacy > Cookies > Allow third-party cookies untuk `aidareu.com`
   - Firefox: Settings > Privacy > Enhanced Tracking Protection > Custom > Uncheck "Cookies"

**Solusi:**

```bash
# Di backend server
cd /path/to/backend

# 1. Verify .env
cat .env | grep SESSION

# 2. Clear cache
php artisan config:clear
php artisan cache:clear

# 3. Restart PHP
sudo systemctl restart php8.2-fpm
```

### Issue: CORS error masih muncul

**Check:**

1. **Nginx/Apache tidak override CORS headers**

   ```nginx
   # Nginx - pastikan TIDAK ada ini di config
   add_header 'Access-Control-Allow-Origin' '*';
   ```

2. **Backend cache tidak clear**

   ```bash
   php artisan config:clear
   php artisan cache:clear
   sudo systemctl restart php8.2-fpm
   ```

3. **Multiple CORS headers**

   Check response dengan curl:
   ```bash
   curl -I https://api.aidareu.com/api/users/me
   ```

   Jika ada multiple `Access-Control-Allow-Origin` headers = conflict

### Issue: JSON.parse error

**Root cause:** API mengembalikan HTML (error page) bukan JSON

**Kemungkinan:**

1. **401 redirect ke login page** (returning HTML)
   - Sudah difix di `backend/bootstrap/app.php` line 39-46
   - Memastikan 401 return JSON, bukan redirect

2. **500 Internal Server Error** (returning HTML error page)
   - Check `storage/logs/laravel.log`
   - Fix error yang muncul

3. **Web server error** (Nginx/Apache returning error page)
   - Check `/var/log/nginx/error.log`
   - Check PHP-FPM logs

**Solution:**

```bash
# Check Laravel logs
tail -f /path/to/backend/storage/logs/laravel.log

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Check PHP-FPM logs
tail -f /var/log/php8.2-fpm.log
```

### Issue: Cookies tidak ter-set (masih null)

**Debugging:**

```javascript
// Di browser console, cek cookies
console.log(document.cookie);

// Cek fetch credentials
fetch('https://api.aidareu.com/api/users/me', {
  credentials: 'include'  // MUST have this!
})
```

**Solutions:**

1. **Pastikan fetch menggunakan `credentials: 'include'`**

2. **Check SESSION_DOMAIN di backend .env:**
   ```env
   SESSION_DOMAIN=.aidareu.com
   ```

3. **Check HTTPS (SESSION_SECURE_COOKIE):**
   ```env
   SESSION_SECURE_COOKIE=true  # Hanya untuk HTTPS
   ```

   Jika development (HTTP), set ke `false`

4. **Restart backend:**
   ```bash
   php artisan config:clear
   sudo systemctl restart php8.2-fpm
   ```

## Critical Configurations Summary

### Backend `.env` (Production)

```env
SESSION_DOMAIN=.aidareu.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,www.aidareu.com,api.aidareu.com
```

### Frontend Environment

```env
NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
```

### Fetch Requests (Frontend Code)

```javascript
fetch('https://api.aidareu.com/api/endpoint', {
  credentials: 'include',  // REQUIRED for session cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
```

## Commit dan Push Changes

### Backend

```bash
cd backend
git add backend/config/cors.php backend/config/sanctum.php
git commit -m "Fix CORS and Sanctum for production domains

- Add all production domains to CORS allowed_origins
- Add production domains to Sanctum stateful domains
- Support HTTP and HTTPS for all domains
- Enable cross-subdomain authentication

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### Frontend

```bash
cd frontend
git add frontend/.env.local
git commit -m "Add .env.local for local development

- Configure localhost API URL for development
- Separate from production .env.production

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

## Next Steps

1. ✅ Deploy backend dengan config baru
2. ✅ Deploy frontend dengan env variables correct
3. ✅ Clear browser cache & cookies
4. ✅ Test login flow
5. ✅ Verify cookies ter-set dengan domain `.aidareu.com`
6. ✅ Verify authenticated requests berhasil

## Need Help?

Jika masih ada error:

1. **Capture screenshot** dari:
   - Browser DevTools > Console tab
   - Browser DevTools > Network tab (dengan request/response headers)
   - Browser DevTools > Application > Cookies

2. **Check backend logs**:
   ```bash
   tail -100 storage/logs/laravel.log
   ```

3. **Test API directly**:
   ```bash
   curl -v https://api.aidareu.com/api/users/me
   ```

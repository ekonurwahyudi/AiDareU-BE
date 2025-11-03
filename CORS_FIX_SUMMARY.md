# CORS & Authentication Fix Summary

## Masalah yang Ditemukan

Berdasarkan screenshot error yang Anda berikan, ada beberapa masalah:

1. **CORS Error**: `Access-Control-Allow-Origin` header missing
2. **401 Unauthorized**: Failed to fetch user data
3. **Network Error**: TypeError saat fetch notifications

## Root Cause

1. **CORS Configuration**: Backend tidak mengizinkan domain `https://aidareu.com` (hanya `https://api.aidareu.com`)
2. **Sanctum Stateful Domains**: Domain production tidak terdaftar di Sanctum stateful domains
3. **Session Cookie Configuration**: SESSION_DOMAIN tidak dikonfigurasi untuk cross-subdomain sharing
4. **Environment Variables**: Frontend tidak memiliki `.env.local` untuk development

## Perbaikan yang Dilakukan

### 1. Backend CORS Configuration
**File**: `backend/backend/config/cors.php`

**Perubahan**:
```php
'allowed_origins' => [
    // ... existing development origins ...

    // Production - allow both http and https for all domains
    'http://aidareu.com',
    'https://aidareu.com',
    'http://app.aidareu.com',
    'https://app.aidareu.com',
    'http://api.aidareu.com',
    'https://api.aidareu.com',
    'http://www.aidareu.com',
    'https://www.aidareu.com',
],
```

### 2. Sanctum Stateful Domains
**File**: `backend/backend/config/sanctum.php`

**Perubahan**:
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:8080,127.0.0.1,127.0.0.1:3000,127.0.0.1:8080,::1,aidareu.com,app.aidareu.com,api.aidareu.com,www.aidareu.com',
    Sanctum::currentApplicationUrlWithPort(),
))),
```

### 3. Production Environment Configuration
**File**: `backend/backend/.env.production` (BARU)

**Konfigurasi penting**:
```env
APP_URL=https://api.aidareu.com

# Session Configuration for cross-subdomain cookie sharing
SESSION_DOMAIN=.aidareu.com          # Leading dot untuk share across subdomains
SESSION_SECURE_COOKIE=true           # HTTPS only
SESSION_SAME_SITE=none               # Allow cross-site with credentials
SESSION_HTTP_ONLY=true

# Sanctum domains
SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,www.aidareu.com,api.aidareu.com
```

### 4. Frontend Environment Configuration
**File**: `frontend/frontend/.env.local` (BARU)

**Untuk development**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
API_URL=http://localhost:8080/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

**Production sudah ada di**: `frontend/frontend/.env.production`
```env
NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
API_URL=https://api.aidareu.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.aidareu.com
```

## Langkah Selanjutnya untuk Deployment

### Backend (Laravel)

1. **Copy environment file untuk production**:
   ```bash
   cd backend/backend
   cp .env.production .env
   ```

2. **Generate APP_KEY**:
   ```bash
   php artisan key:generate
   ```

3. **Update database credentials** di `.env`:
   ```env
   DB_HOST=your_db_host
   DB_DATABASE=aidareu_prod
   DB_USERNAME=postgres
   DB_PASSWORD=your_secure_password
   ```

4. **Run migrations**:
   ```bash
   php artisan migrate --force
   ```

5. **Clear cache**:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

6. **Restart web server/PHP-FPM**

### Frontend (Next.js)

1. **Untuk production build**:
   ```bash
   cd frontend/frontend
   npm run build
   ```

2. **Deploy dengan environment variables**:
   - Pastikan `NEXT_PUBLIC_API_URL=https://api.aidareu.com/api` di build environment

### Testing

1. **Test CORS**:
   ```bash
   curl -H "Origin: https://aidareu.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://api.aidareu.com/api/users/me
   ```

2. **Test Login Flow**:
   - Buka `https://aidareu.com/login`
   - Coba login dengan credentials valid
   - Check browser DevTools Console untuk error
   - Check Network tab untuk response headers

3. **Verify Cookies**:
   - Di browser DevTools > Application > Cookies
   - Cek apakah ada cookie `aidareu-session` atau `laravel_session`
   - Domain harus `.aidareu.com`
   - SameSite harus `None`
   - Secure harus `true`

## Troubleshooting

### Jika masih ada CORS error:

1. **Check Apache/Nginx config** - pastikan tidak ada konflik CORS headers
2. **Clear browser cache** - hard refresh (Ctrl+Shift+R)
3. **Check CSP headers** - pastikan tidak memblokir API calls
4. **Verify SSL certificates** - pastikan valid untuk semua subdomain

### Jika masih 401 Unauthorized:

1. **Check session cookie**:
   ```bash
   # Di browser console
   document.cookie
   ```

2. **Verify credentials are sent**:
   - Pastikan fetch menggunakan `credentials: 'include'`
   - Check di Network tab apakah Cookie header ada

3. **Check Sanctum CSRF**:
   - Frontend harus hit `/sanctum/csrf-cookie` sebelum login
   - Check apakah `XSRF-TOKEN` cookie ada

### Jika cookie tidak ter-set:

1. **Check SESSION_DOMAIN** di backend `.env`:
   ```env
   SESSION_DOMAIN=.aidareu.com
   ```

2. **Check APP_URL** di backend `.env`:
   ```env
   APP_URL=https://api.aidareu.com
   ```

3. **Restart backend** setelah perubahan `.env`

## Files Modified

1. ✅ `backend/backend/config/cors.php` - Added production domains
2. ✅ `backend/backend/config/sanctum.php` - Added production domains to stateful
3. ✅ `backend/backend/.env.production` - Created with proper session config
4. ✅ `frontend/frontend/.env.local` - Created for local development

## Files Already Correct

1. ✅ `backend/backend/bootstrap/app.php` - HandleCors already prepended
2. ✅ `frontend/frontend/.env.production` - Already configured correctly

## Important Notes

⚠️ **SESSION_DOMAIN dengan leading dot** (`.aidareu.com`) memungkinkan cookie sharing antara:
- `aidareu.com`
- `app.aidareu.com`
- `api.aidareu.com`
- `www.aidareu.com`

⚠️ **SESSION_SAME_SITE=none** diperlukan untuk cross-site requests dengan credentials, tapi HARUS dikombinasi dengan **SESSION_SECURE_COOKIE=true** (HTTPS only)

⚠️ **SANCTUM_STATEFUL_DOMAINS** HARUS include semua domain yang akan akses API dengan session-based auth

## Commit Changes

Setelah testing berhasil, commit changes:

```bash
cd backend
git add .
git commit -m "Fix CORS and authentication for production domains

- Add production domains to CORS allowed_origins
- Add production domains to Sanctum stateful domains
- Configure SESSION_DOMAIN for cross-subdomain cookie sharing
- Add .env.production with proper session configuration
- Set SESSION_SAME_SITE=none for cross-site credentials

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
git push

cd ../frontend
git add .
git commit -m "Add .env.local for local development

- Create .env.local with localhost API URL
- Keep .env.production with production API URL

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

# EasyPanel Deployment Guide - AiDareU

## CHECKLIST DEPLOYMENT

### ✅ Backend Environment Variables (WAJIB!)

Pastikan environment variables di EasyPanel Backend sudah sesuai:

```env
# APP CONFIGURATION
APP_NAME=AiDareU
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.aidareu.com

# DATABASE
DB_CONNECTION=pgsql
DB_HOST=aidareu-db
DB_PORT=5432
DB_DATABASE=your_database_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# SESSION CONFIGURATION - CRITICAL FOR LOGIN!
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.aidareu.com
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true

# SANCTUM & CORS
SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,api.aidareu.com,www.aidareu.com
SANCTUM_GUARD=web
SANCTUM_MIDDLEWARE=web

# PROXY CONFIGURATION
TRUSTED_PROXIES=*

# MAIL CONFIGURATION
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"

# CACHE
CACHE_STORE=database

# OPENAI (optional)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=15000
OPENAI_TEMPERATURE=0.3

# BITESHIP (optional)
BITESHIP_API_KEY=your_biteship_key
```

### ✅ Frontend Environment Variables (WAJIB!)

Pastikan environment variables di EasyPanel Frontend sudah sesuai:

```env
NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
API_URL=https://api.aidareu.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.aidareu.com
NEXT_PUBLIC_FRONTEND_URL=https://aidareu.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## CARA DEPLOY/UPDATE

### 1. Backend Deployment

Setelah push ke GitHub:

1. **Go to EasyPanel** → Backend Service
2. **Click "Rebuild"** atau "Redeploy"
3. **Wait for build** to complete (~2-5 minutes)
4. **Clear Laravel cache**:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```
5. **Verify deployment**:
   - Open: https://api.aidareu.com/api/health
   - Should return: `{"status":"ok","message":"API is working!",...}`

### 2. Frontend Deployment

Setelah push ke GitHub:

1. **Go to EasyPanel** → Frontend Service
2. **Click "Rebuild"** atau "Redeploy"
3. **Wait for build** to complete (~3-10 minutes)
4. **Verify deployment**:
   - Open: https://aidareu.com
   - Check browser console (F12) - no errors about localhost
   - Open: https://aidareu.com/test-connection
   - Run all tests - should all be green

### 3. Testing After Deployment

#### A. Clear Browser Cache
```
1. Press CTRL + SHIFT + DELETE
2. Select "Cookies and other site data"
3. Select "Cached images and files"
4. Click "Clear data"
5. Close ALL tabs of aidareu.com
6. Open fresh tab: https://aidareu.com/login
```

#### B. Test Connection
```
1. Go to: https://aidareu.com/test-connection
2. Click "Run All Tests"
3. Verify all 4 tests pass:
   ✅ Health Check
   ✅ Database Connection
   ✅ CORS Configuration
   ✅ Authentication Endpoint (after login)
```

#### C. Test Login
```
1. Go to: https://aidareu.com/login
2. Enter email and password
3. Should successfully login
4. Should redirect to dashboard
5. No CORS errors in console
```

## TROUBLESHOOTING

### Problem: Login tidak berfungsi, 401 Unauthorized

**Penyebab:**
- Backend environment variables belum di-set dengan benar
- SESSION_SAME_SITE masih "lax" (harus "none")
- SESSION_DOMAIN tidak ada atau salah
- Frontend belum rebuild

**Solusi:**
1. Check backend env vars di EasyPanel
2. Pastikan `SESSION_SAME_SITE=none`
3. Pastikan `SESSION_DOMAIN=.aidareu.com` (dengan leading dot!)
4. Pastikan `SESSION_SECURE_COOKIE=true`
5. Rebuild backend
6. Run: `php artisan config:clear && php artisan cache:clear`
7. Clear browser cache dan cookies
8. Test login lagi

### Problem: CORS errors dengan localhost:8000

**Penyebab:**
- Frontend masih running di local development
- Frontend di EasyPanel belum rebuild dengan commit terbaru
- Browser cache masih menyimpan versi lama

**Solusi:**
1. **Stop local development server** (jangan jalankan `npm run dev`)
2. **Rebuild frontend di EasyPanel**
3. **Hard refresh browser**: CTRL + SHIFT + R
4. **Clear browser cache completely**
5. **Check URL** - harus `https://aidareu.com`, bukan `localhost:8000`

### Problem: JSON.parse errors

**Penyebab:**
- Backend mengembalikan HTML error page (500/404) bukan JSON
- Route tidak ditemukan
- Database tidak terkoneksi

**Solusi:**
1. Check backend logs di EasyPanel
2. Test endpoint langsung: `https://api.aidareu.com/api/test-db`
3. Verify database credentials di env vars
4. Run: `php artisan migrate` jika belum

### Problem: "Missing Allow Origin" CORS error

**Penyebab:**
- Backend CORS config tidak include frontend domain
- HandleCors middleware tidak aktif

**Solusi:**
1. Verify `config/cors.php` include `https://aidareu.com`
2. Verify `bootstrap/app.php` line 19: `$middleware->prepend(HandleCors::class)`
3. Rebuild backend
4. Clear cache: `php artisan config:clear`

## CRITICAL CONFIGURATIONS

### 1. Session Configuration (Backend)

**WAJIB untuk cross-domain authentication:**

```env
SESSION_DOMAIN=.aidareu.com      # Leading dot is CRITICAL!
SESSION_SAME_SITE=none           # Must be "none" for cross-domain
SESSION_SECURE_COOKIE=true       # Must be true for HTTPS
SESSION_HTTP_ONLY=true           # Security best practice
```

**Why?**
- `SESSION_DOMAIN=.aidareu.com` → Cookie berlaku untuk semua subdomain (aidareu.com, api.aidareu.com, app.aidareu.com)
- `SESSION_SAME_SITE=none` → Cookie dikirim pada cross-site requests (aidareu.com → api.aidareu.com)
- `SESSION_SECURE_COOKIE=true` → Cookie hanya dikirim via HTTPS
- Leading dot (`.aidareu.com`) is REQUIRED for cross-subdomain cookies!

### 2. CORS Configuration (Backend)

File: `config/cors.php`

```php
'allowed_origins' => [
    'https://aidareu.com',
    'https://app.aidareu.com',
    'https://api.aidareu.com',
    'https://www.aidareu.com',
],
'supports_credentials' => true,  // CRITICAL!
```

**Why?**
- `supports_credentials: true` → Allows cookies to be sent cross-domain
- Without this, browser akan ignore Set-Cookie headers dari API

### 3. Sanctum Configuration (Backend)

File: `config/sanctum.php`

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS',
    'aidareu.com,app.aidareu.com,api.aidareu.com,www.aidareu.com'
)),
'guard' => ['web'],
```

**Why?**
- Sanctum perlu tahu domain mana yang receive stateful authentication
- Guard `web` enables session-based auth

### 4. Frontend Fetch Configuration

**ALL** fetch calls to backend API MUST include:

```typescript
fetch('https://api.aidareu.com/api/endpoint', {
  method: 'POST',
  credentials: 'include',  // CRITICAL!
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
```

**Why?**
- `credentials: 'include'` → Browser will send cookies with the request
- Without this, session cookies won't be sent, resulting in 401 errors

## FILES YANG SUDAH DI-FIX

### Backend (Repository: AiDareU-BE)

✅ `config/cors.php` - CORS configuration
✅ `config/sanctum.php` - Sanctum stateful domains
✅ `config/session.php` - Session configuration
✅ `bootstrap/app.php` - HandleCors middleware
✅ `routes/api.php` - Route `/api/users/me` moved to authenticated routes
✅ `app/Http/Controllers/AuthController.php` - Added `auth()->login($user)` on line 288
✅ `.env.production` - Complete production environment variables

### Frontend (Repository: AiDareU-FE)

✅ All authentication files have `credentials: 'include'`:
- `src/views/pages/auth/LoginV1Simple.tsx`
- `src/views/pages/auth/RegisterV1Simple.tsx`
- `src/views/pages/auth/ForgotPasswordV1.tsx`
- `src/views/pages/auth/ResetPasswordV1.tsx`
- `src/views/pages/auth/TwoStepsV1.tsx`
- `src/views/Login.tsx`
- `src/views/Register.tsx`
- And 44 more files...

✅ All files use `process.env.NEXT_PUBLIC_BACKEND_URL` instead of `.replace('/api', '')`

✅ Route proxies fixed:
- `src/app/api/users/me/route.ts` - Fixed endpoint from `/api/user/me` to `/api/users/me`
- `src/app/api/rbac/roles/route.ts` - Has `credentials: 'include'`
- `src/app/api/rbac/permissions/me/route.ts` - Has `credentials: 'include'`

✅ Test connection page:
- `src/app/(blank-layout-pages)/test-connection/page.tsx` - Complete test suite

## LATEST COMMITS

### Backend
- Commit `8996764`: Add test endpoints: /test-db & /test-cors
- Commit `5b0fb29`: Fix: Move /api/users/me to auth routes & set web session on login

### Frontend
- Commit `5f39e32`: Fix: Use NEXT_PUBLIC_BACKEND_URL consistently across all files
- Commit `0eac988`: Add connection test page
- Commit `8e0e5a6`: Fix: Endpoint /api/users/me (was /api/user/me)

## SUMMARY

Untuk deployment sukses:

1. ✅ Backend env vars sudah benar (terutama SESSION_* variables)
2. ✅ Frontend env vars sudah benar (NEXT_PUBLIC_BACKEND_URL)
3. ✅ Rebuild backend di EasyPanel
4. ✅ Rebuild frontend di EasyPanel
5. ✅ Clear Laravel cache: `php artisan config:clear && php artisan cache:clear`
6. ✅ Clear browser cache dan cookies
7. ✅ Test di: https://aidareu.com/test-connection
8. ✅ Test login di: https://aidareu.com/login

**SEHARUSNYA LOGIN SUDAH BERFUNGSI SEKARANG!**

Jika masih ada masalah, check:
- Browser console (F12) untuk error messages
- Backend logs di EasyPanel
- https://aidareu.com/test-connection untuk diagnostic

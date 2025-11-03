# EasyPanel Deployment Fix - CORS & Login Issues

## 🚨 Masalah yang Ditemukan di Backend .env

### 1. SESSION_DOMAIN Duplikat dan Bertentangan

**SALAH:**
```env
SESSION_DOMAIN=localhost        # ❌ Baris 33
...
SESSION_DOMAIN=.aidareu.com     # ✅ Baris 77
```

**Akibat:** Laravel menggunakan nilai PERTAMA (`localhost`), sehingga cookie tidak ter-set untuk `aidareu.com`!

### 2. SESSION_SAME_SITE Salah

**SALAH:**
```env
SESSION_SAME_SITE=lax   # ❌ Tidak akan bekerja untuk cross-origin
```

**BENAR:**
```env
SESSION_SAME_SITE=none  # ✅ Required untuk cross-origin dengan credentials
```

### 3. SESSION_SECURE_COOKIE Salah

**SALAH:**
```env
SESSION_SECURE_COOKIE=false   # ❌ Cookie tidak akan dikirim via HTTPS
```

**BENAR:**
```env
SESSION_SECURE_COOKIE=true    # ✅ Required untuk production HTTPS
```

### 4. QUEUE_CONNECTION Duplikat

Muncul 2 kali (baris 46 dan 78) - hapus salah satu

---

## ✅ Solusi: Update Environment Variables di EasyPanel

### BACKEND Environment Variables

Di **EasyPanel > Your Backend Service > Environment**:

**HAPUS** atau **UPDATE** environment variables berikut:

```env
# ========================================
# SESSION CONFIGURATION - CRITICAL!
# ========================================
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.aidareu.com
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true

# ========================================
# SANCTUM CONFIGURATION
# ========================================
SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,api.aidareu.com,www.aidareu.com
SANCTUM_GUARD=web
SANCTUM_MIDDLEWARE=web
SANCTUM_EXPIRATION=null
```

**COMPLETE BACKEND .env** tersedia di file: `CORRECT_ENV_PRODUCTION.txt`

### FRONTEND Environment Variables

Di **EasyPanel > Your Frontend Service > Environment**:

```env
NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
API_URL=https://api.aidareu.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.aidareu.com
NEXT_PUBLIC_FRONTEND_URL=https://aidareu.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**Status:** ✅ Frontend environment sudah BENAR!

---

## 📋 Langkah Deployment di EasyPanel

### BACKEND

1. **Update Environment Variables di EasyPanel:**
   - Go to: Backend Service > Environment
   - Update/hapus SESSION_DOMAIN yang salah (localhost)
   - Pastikan hanya ada 1 SESSION_DOMAIN: `.aidareu.com`
   - Update SESSION_SAME_SITE: `none`
   - Update SESSION_SECURE_COOKIE: `true`

2. **Restart Backend Service:**
   - Di EasyPanel: Backend Service > Restart
   - Atau klik "Rebuild" jika perlu

3. **Verify Configuration:**
   ```bash
   # SSH ke container backend
   docker exec -it your-backend-container bash

   # Check environment
   php artisan config:show session

   # Should show:
   # domain: ".aidareu.com"
   # same_site: "none"
   # secure: true
   ```

### FRONTEND

Frontend environment sudah benar, tidak perlu perubahan.

Tapi jika ingin memastikan:

1. **Verify Environment Variables:**
   - Go to: Frontend Service > Environment
   - Pastikan `NEXT_PUBLIC_API_URL=https://api.aidareu.com/api`

2. **Rebuild (Optional):**
   - Hanya jika ada perubahan
   - Frontend Service > Rebuild

---

## 🧪 Testing Setelah Deployment

### 1. Clear Cache di Backend

Di EasyPanel, buka **Terminal** untuk backend service:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 2. Test CORS

```bash
curl -v -H "Origin: https://aidareu.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.aidareu.com/api/users/me
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: https://aidareu.com
Access-Control-Allow-Credentials: true
```

### 3. Test Login Flow

1. **Clear browser cache & cookies:** Ctrl+Shift+Delete

2. **Open Browser DevTools:** F12

3. **Go to:** https://aidareu.com/login

4. **Login** dengan credentials valid

5. **Check Network Tab:**
   - Find `POST /api/login` request
   - Check **Response Headers:**
     ```
     Set-Cookie: laravel_session=xxx; Domain=.aidareu.com; Secure; HttpOnly; SameSite=None
     Set-Cookie: XSRF-TOKEN=xxx; Domain=.aidareu.com; Secure; SameSite=None
     ```

6. **Check Application > Cookies:**
   - Should see `laravel_session`
   - Domain: `.aidareu.com`
   - Secure: ✓
   - HttpOnly: ✓
   - SameSite: `None`

7. **Test Authenticated Requests:**
   - After login, check Console for errors
   - `GET /api/users/me` should return **200 OK** with user data
   - No 401 errors

---

## 🔍 Verifikasi Konfigurasi CORS & Middleware

### Backend Config Verification

File yang sudah diperbaiki (di repository):

1. **config/cors.php** ✅
   ```php
   'allowed_origins' => [
       'https://aidareu.com',
       'https://app.aidareu.com',
       'https://api.aidareu.com',
       'https://www.aidareu.com',
       // ... etc
   ],
   ```

2. **config/sanctum.php** ✅
   ```php
   'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
       '%s%s',
       'localhost,localhost:3000,localhost:8080,127.0.0.1,127.0.0.1:3000,127.0.0.1:8080,::1,aidareu.com,app.aidareu.com,api.aidareu.com,www.aidareu.com',
       Sanctum::currentApplicationUrlWithPort(),
   ))),
   ```

3. **bootstrap/app.php** ✅
   - HandleCors middleware already prepended
   - 401 errors return JSON (not HTML redirect)

**Status:** ✅ Semua konfigurasi sudah benar di code!

**Masalah:** ❌ Environment variables di EasyPanel yang salah!

---

## ⚠️ Troubleshooting

### Issue: Masih 401 setelah login

**Kemungkinan:**

1. **Cookie tidak ter-set**

   Check di DevTools > Application > Cookies:
   ```javascript
   // Browser console
   document.cookie
   ```

   Jika tidak ada `laravel_session` = SESSION_DOMAIN masih salah

2. **Backend cache belum clear**

   ```bash
   # Di EasyPanel Terminal (backend)
   php artisan config:clear
   php artisan cache:clear
   ```

3. **Service belum restart**

   Di EasyPanel: Backend Service > Restart

### Issue: Cookie domain masih `localhost`

**Root Cause:** SESSION_DOMAIN di environment masih `localhost`

**Fix:**
1. EasyPanel > Backend Service > Environment
2. Cari `SESSION_DOMAIN`
3. Hapus atau update ke `.aidareu.com`
4. Restart service

### Issue: SameSite cookie warning di Console

**Error:**
```
Cookie "laravel_session" has been rejected because it is in a cross-site context and its "SameSite" is "Lax" or "Strict".
```

**Root Cause:** SESSION_SAME_SITE masih `lax`

**Fix:**
1. EasyPanel > Backend Service > Environment
2. Update `SESSION_SAME_SITE=none`
3. Pastikan `SESSION_SECURE_COOKIE=true`
4. Restart service

### Issue: Cookie tidak secure

**Root Cause:** SESSION_SECURE_COOKIE masih `false`

**Fix:**
1. EasyPanel > Backend Service > Environment
2. Update `SESSION_SECURE_COOKIE=true`
3. Restart service

---

## 📝 Summary Perubahan

### Environment Variables yang Harus Diupdate di EasyPanel Backend:

| Variable | Old Value (❌) | New Value (✅) |
|----------|----------------|----------------|
| SESSION_DOMAIN | `localhost` | `.aidareu.com` |
| SESSION_SAME_SITE | `lax` | `none` |
| SESSION_SECURE_COOKIE | `false` | `true` |
| SANCTUM_STATEFUL_DOMAINS | - | `aidareu.com,app.aidareu.com,api.aidareu.com,www.aidareu.com` |

### Files yang Sudah Benar di Repository:

✅ `backend/config/cors.php` - CORS configuration
✅ `backend/config/sanctum.php` - Sanctum stateful domains
✅ `backend/bootstrap/app.php` - Middleware setup
✅ Frontend environment variables - API URL configuration

---

## 🚀 Quick Fix Steps

**BACKEND (di EasyPanel):**

1. Environment > Edit Variables
2. Cari dan HAPUS atau UPDATE:
   ```
   SESSION_DOMAIN=localhost → SESSION_DOMAIN=.aidareu.com
   SESSION_SAME_SITE=lax → SESSION_SAME_SITE=none
   SESSION_SECURE_COOKIE=false → SESSION_SECURE_COOKIE=true
   ```
3. Click "Save"
4. Restart Backend Service
5. Terminal > Run:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

**FRONTEND (di EasyPanel):**

✅ No changes needed - already correct!

**TESTING:**

1. Clear browser cache & cookies
2. Go to https://aidareu.com/login
3. Login
4. Check DevTools > Application > Cookies
5. Verify `laravel_session` domain is `.aidareu.com`

---

## ✅ Checklist

Backend EasyPanel:
- [ ] Update SESSION_DOMAIN ke `.aidareu.com`
- [ ] Update SESSION_SAME_SITE ke `none`
- [ ] Update SESSION_SECURE_COOKIE ke `true`
- [ ] Verify SANCTUM_STATEFUL_DOMAINS includes all domains
- [ ] Restart backend service
- [ ] Run `php artisan config:clear`
- [ ] Run `php artisan cache:clear`

Testing:
- [ ] Clear browser cache & cookies
- [ ] Test login at https://aidareu.com/login
- [ ] Verify cookies in DevTools
- [ ] Check domain is `.aidareu.com`
- [ ] Check SameSite is `None`
- [ ] Check Secure is `✓`
- [ ] Test `/api/users/me` returns 200 OK
- [ ] No 401 errors in console

---

**File Reference:**
- Backend .env lengkap: `CORRECT_ENV_PRODUCTION.txt` (di folder backend)
- Frontend .env lengkap: `CORRECT_ENV_PRODUCTION.txt` (di folder frontend)

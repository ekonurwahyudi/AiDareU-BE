# Final Deployment Checklist - Login Fix

## ✅ Code Changes Complete

### Frontend Changes (Commit: d04d1e1, 06ac9da)

**Files modified dengan `credentials: 'include'`:**

1. ✅ `src/views/pages/auth/LoginV1Simple.tsx` - Line 72
2. ✅ `src/views/Login.tsx` - Line 140
3. ✅ `src/app/(dashboard)/dashboard/page.tsx` - Line 61
4. ✅ `src/views/pages/auth/RegisterV1Simple.tsx` - Line 137
5. ✅ `src/views/pages/auth/RegisterV1.tsx` - Line 121
6. ✅ `src/views/Register.tsx` - Line 170
7. ✅ `src/views/pages/auth/ForgotPasswordV1.tsx` - Line 69
8. ✅ `src/views/pages/auth/ResetPasswordV1.tsx` - Line 143
9. ✅ `src/views/pages/auth/TwoStepsV1.tsx` - Lines 101, 131, 190

**Total:** 9 files, 12 fetch calls fixed

### Backend Configuration (Already Correct)

1. ✅ `config/cors.php` - supports_credentials: true
2. ✅ `config/sanctum.php` - stateful domains configured
3. ✅ `bootstrap/app.php` - HandleCors prepended
4. ✅ `routes/api.php` - /api/auth/login is public

---

## 🚀 Deployment Steps

### STEP 1: Backend - Clear Cache (CRITICAL!)

**SSH ke Backend Service di EasyPanel, lalu run:**

```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Verify session configuration
php artisan config:show session
```

**Expected output untuk session:**
```
driver: "database"
lifetime: 120
domain: ".aidareu.com"        ← MUST BE THIS!
same_site: "none"             ← MUST BE THIS!
secure: true                  ← MUST BE THIS!
http_only: true
```

**Jika masih salah (e.g., domain: "localhost"):**

1. Check Environment Variables di EasyPanel UI:
   ```
   SESSION_DOMAIN=.aidareu.com
   SESSION_SAME_SITE=none
   SESSION_SECURE_COOKIE=true
   ```

2. Restart backend service

3. Run clear cache lagi:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

4. Verify lagi dengan `php artisan config:show session`

### STEP 2: Frontend - Rebuild

**Di EasyPanel:**

1. Go to Frontend Service
2. Click "Rebuild" atau "Redeploy"
3. Monitor deployment logs
4. Wait until status = "Running"

**Atau via Git:**

Frontend code sudah di-push ke main branch. EasyPanel auto-deploy akan pull code terbaru.

### STEP 3: Browser - Clear Everything

**IMPORTANT:** Old cookies dengan domain "localhost" harus dihapus!

**Chrome/Edge/Brave:**
1. `Ctrl + Shift + Delete`
2. Time range: **All time**
3. Check:
   - ✓ Cookies and other site data
   - ✓ Cached images and files
4. Click "Clear data"

**Firefox:**
1. `Ctrl + Shift + Delete`
2. Time range: **Everything**
3. Check:
   - ✓ Cookies
   - ✓ Cache
4. Click "Clear Now"

**ATAU:** Use Incognito/Private browsing untuk testing fresh.

### STEP 4: Test Login

1. **Open** https://aidareu.com/login (in incognito window)

2. **Open DevTools** (F12)
   - Go to **Network** tab
   - Check "Preserve log"
   - Clear existing logs

3. **Enter credentials** and click Login

4. **Check Network Tab** - Should see:

   **Request 1: OPTIONS (preflight)**
   ```
   Method: OPTIONS
   URL: https://api.aidareu.com/api/auth/login
   Status: 200 or 204

   Response Headers:
   ✓ access-control-allow-origin: https://aidareu.com
   ✓ access-control-allow-credentials: true
   ✓ access-control-allow-methods: POST, GET, OPTIONS
   ```

   **Request 2: POST (login)**
   ```
   Method: POST
   URL: https://api.aidareu.com/api/auth/login
   Status: 200

   Request Headers:
   ✓ content-type: application/json
   ✓ origin: https://aidareu.com

   Response Headers:
   ✓ access-control-allow-origin: https://aidareu.com
   ✓ access-control-allow-credentials: true
   ✓ set-cookie: laravel_session=...; Domain=.aidareu.com; Secure; HttpOnly; SameSite=None
   ✓ set-cookie: XSRF-TOKEN=...; Domain=.aidareu.com; Secure; SameSite=None
   ✓ content-type: application/json

   Response Body: (Preview tab)
   {
     "user": {
       "id": ...,
       "uuid": "...",
       "email": "...",
       ...
     },
     "token": "..."
   }
   ```

5. **Check Console Tab** - Should be **NO ERRORS**:
   - ✗ No "JSON.parse" errors
   - ✗ No 401 errors
   - ✗ No CORS errors

6. **Check Application Tab** > Cookies > https://aidareu.com

   **Should see:**
   - `laravel_session`
     - Domain: `.aidareu.com` ← WITH LEADING DOT!
     - Path: `/`
     - Secure: ✓
     - HttpOnly: ✓
     - SameSite: `None`

   - `XSRF-TOKEN`
     - Domain: `.aidareu.com`
     - Path: `/`
     - Secure: ✓
     - SameSite: `None`

7. **After Login** - Should redirect to dashboard

   Check Network tab for subsequent requests:
   ```
   GET https://aidareu.com/api/users/me
   Status: 200 OK ✓

   GET https://aidareu.com/api/rbac/permissions/me
   Status: 200 OK ✓

   GET https://aidareu.com/api/rbac/roles
   Status: 200 OK ✓
   ```

   **Request Headers should include:**
   ```
   cookie: laravel_session=...; XSRF-TOKEN=...
   ```

---

## 🔍 Troubleshooting

### Issue 1: Still Getting "JSON.parse" Error

**Symptoms:**
```
Login error: SyntaxError: JSON.parse: unexpected character at line 1
```

**Root Cause:** API returning HTML instead of JSON

**Debug:**
1. Check Network tab > POST login request
2. Click on request > Response tab
3. If you see HTML (not JSON) = something is wrong

**Possible causes:**

**A. Backend cache not cleared**
```bash
php artisan config:clear
php artisan cache:clear
```

**B. Wrong endpoint**
- Frontend calling wrong URL
- Check: Should be `https://api.aidareu.com/api/auth/login`

**C. Nginx/Proxy error**
- EasyPanel proxy returning error page
- Check backend service logs in EasyPanel

**D. Backend error before reaching controller**
- Check Laravel logs: `storage/logs/laravel.log`

### Issue 2: Still Getting 401 Unauthorized

**Symptoms:**
```
GET /api/users/me → 401
GET /api/rbac/permissions/me → 401
```

**Root Cause:** Session not established or cookies not sent

**Check:**

**A. Cookies not set after login**

DevTools > Application > Cookies

If NO cookies with domain `.aidareu.com`:
- Backend SESSION_DOMAIN still wrong (not `.aidareu.com`)
- CORS not allowing credentials
- `credentials: 'include'` missing (frontend not rebuilt)

**Solution:**
```bash
# Backend
php artisan config:show session | grep domain

# Should show: domain => ".aidareu.com"
# If not, check environment variables and restart
```

**B. Cookies set but not sent**

Network tab > Check request headers for cookies

If cookies exist but not sent in requests:
- Domain mismatch (cookie domain vs request domain)
- SameSite=Strict blocking (should be None)
- Secure flag issue (need HTTPS)

**C. Backend not recognizing session**

Even with cookies, backend returns 401:
- Session driver issue (check SESSION_DRIVER=database)
- Database connection problem
- Session table missing

```bash
# Check session driver
php artisan config:show session.driver

# Should be: "database"

# Check if sessions table exists
php artisan tinker
>>> \DB::table('sessions')->count()
```

### Issue 3: CORS Errors Still Appearing

**Symptoms:**
```
Access to fetch at 'https://api.aidareu.com/api/auth/login' from origin 'https://aidareu.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Root Cause:** CORS middleware not working or config not applied

**Solutions:**

**A. Clear backend cache**
```bash
php artisan config:clear
php artisan cache:clear
```

**B. Check CORS config**
```bash
php artisan config:show cors
```

Should show:
```
supports_credentials: true
allowed_origins: array containing "https://aidareu.com"
```

**C. Check if HandleCors middleware is active**

Test with curl:
```bash
curl -I -H "Origin: https://aidareu.com" \
  https://api.aidareu.com/api/auth/login
```

Should return:
```
access-control-allow-origin: https://aidareu.com
access-control-allow-credentials: true
```

If NO CORS headers in response:
- HandleCors not loaded
- Nginx overriding headers
- Wrong route (not matching 'api/*')

### Issue 4: Cookies Domain is "aidareu.com" (without leading dot)

**Problem:** Cookie set as `Domain=aidareu.com` instead of `Domain=.aidareu.com`

**Impact:** Cookie tidak shared ke subdomain `api.aidareu.com`

**Root Cause:** SESSION_DOMAIN tidak ada leading dot

**Fix:**
```env
# WRONG
SESSION_DOMAIN=aidareu.com

# CORRECT
SESSION_DOMAIN=.aidareu.com
```

**Leading dot (.) is CRITICAL** for cross-subdomain cookies!

---

## 📊 Environment Variables Summary

### Backend (EasyPanel - MUST BE EXACT!)

```env
# Session Configuration
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.aidareu.com          ← WITH LEADING DOT!
SESSION_SAME_SITE=none                ← LOWERCASE
SESSION_SECURE_COOKIE=true            ← BOOLEAN TRUE
SESSION_HTTP_ONLY=true

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,api.aidareu.com,www.aidareu.com

# App Configuration
APP_URL=https://api.aidareu.com
APP_ENV=production
APP_DEBUG=false
```

### Frontend (EasyPanel)

```env
NEXT_PUBLIC_API_URL=https://api.aidareu.com/api
API_URL=https://api.aidareu.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.aidareu.com
NEXT_PUBLIC_FRONTEND_URL=https://aidareu.com
NODE_ENV=production
```

---

## ✅ Success Criteria

### Login flow should work like this:

1. **User clicks "Login"**
   - ✓ Frontend sends POST to `https://api.aidareu.com/api/auth/login`
   - ✓ With `credentials: 'include'`

2. **Backend authenticates**
   - ✓ Validates credentials
   - ✓ Creates session
   - ✓ Sets cookies with `Domain=.aidareu.com`

3. **Browser saves cookies**
   - ✓ Stores `laravel_session` with domain `.aidareu.com`
   - ✓ Stores `XSRF-TOKEN` with domain `.aidareu.com`

4. **Frontend redirects to dashboard**
   - ✓ Loads dashboard page

5. **Dashboard makes API calls**
   - ✓ Sends GET to `/api/users/me`
   - ✓ **Automatically includes cookies** in request
   - ✓ Backend recognizes session → 200 OK
   - ✓ Returns user data

6. **No errors in console**
   - ✓ No JSON.parse errors
   - ✓ No 401 errors
   - ✓ No CORS errors

---

## 🎯 Quick Verification Commands

### Backend (EasyPanel Terminal)

```bash
# 1. Clear caches
php artisan config:clear && php artisan cache:clear

# 2. Check session config
php artisan config:show session.domain
php artisan config:show session.same_site
php artisan config:show session.secure

# 3. Check CORS config
php artisan config:show cors.supports_credentials
php artisan config:show cors.allowed_origins

# 4. Check routes
php artisan route:list | grep "api/auth/login"

# Expected output:
# POST  api/auth/login  › Api\AuthController@login
```

### Test API (From Local Terminal)

```bash
# Test CORS
curl -I -H "Origin: https://aidareu.com" \
  https://api.aidareu.com/api/auth/login

# Should show:
# access-control-allow-origin: https://aidareu.com
# access-control-allow-credentials: true
```

---

## 📝 Final Checklist

**Before Testing:**
- [ ] Backend: Environment variables set correctly
- [ ] Backend: Cache cleared (`php artisan config:clear`)
- [ ] Backend: Config verified (`php artisan config:show session`)
- [ ] Backend: Service restarted
- [ ] Frontend: Code pushed to repository
- [ ] Frontend: Service rebuilt in EasyPanel
- [ ] Browser: Cache & cookies cleared
- [ ] Browser: Using incognito/private window

**During Testing:**
- [ ] DevTools Network tab open
- [ ] See OPTIONS request to login endpoint
- [ ] OPTIONS returns 200/204 with CORS headers
- [ ] See POST request to login endpoint
- [ ] POST returns 200 with JSON body (not HTML!)
- [ ] POST response has Set-Cookie headers
- [ ] Cookies appear in Application tab
- [ ] Cookie domain is `.aidareu.com` (with dot!)
- [ ] Cookie SameSite is `None`
- [ ] Cookie Secure is checked

**After Login:**
- [ ] Redirected to dashboard
- [ ] No errors in Console
- [ ] GET /api/users/me returns 200
- [ ] GET /api/rbac/permissions/me returns 200
- [ ] GET /api/rbac/roles returns 200
- [ ] Cookies sent in request headers

---

## 🆘 Still Not Working?

If after following ALL steps above, login still fails:

**Collect this information:**

1. **Backend config output:**
   ```bash
   php artisan config:show session > session-config.txt
   php artisan config:show cors > cors-config.txt
   ```

2. **Network tab screenshots:**
   - OPTIONS request & response
   - POST request & response
   - Response body (is it JSON or HTML?)

3. **Console errors:**
   - Full error message
   - Stack trace if available

4. **Cookies:**
   - Screenshot dari Application > Cookies
   - List all cookies dengan domain & properties

5. **Backend logs:**
   ```bash
   tail -50 storage/logs/laravel.log
   ```

Send all above untuk further debugging.

---

**CURRENT STATUS:** All code changes pushed to repository. Ready for deployment.

**NEXT ACTION:** Deploy backend & frontend di EasyPanel, clear caches, test login.

# Debug Login Issue - JSON.parse Error & 401

## 🔍 Current Status

**Error dari screenshot:**
```
GET https://aidareu.com/api/users/me
❌ Failed to fetch user data from API: 401

GET https://aidareu.com/api/rbac/permissions/me
❌ HTTP/2 401

GET https://aidareu.com/api/rbac/roles
❌ HTTP/2 401

❌ Login error: SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data
```

## ✅ Yang Sudah Benar

1. ✅ Frontend code - `credentials: 'include'` sudah ditambahkan ke semua fetch
2. ✅ Backend CORS config - `supports_credentials: true`, origins configured
3. ✅ Backend Sanctum config - stateful domains include aidareu.com
4. ✅ Backend middleware - HandleCors prepended, CSRF disabled for api/*
5. ✅ Backend environment di EasyPanel:
   - `SESSION_DOMAIN=.aidareu.com`
   - `SESSION_SAME_SITE=none`
   - `SESSION_SECURE_COOKIE=true`

## 🚨 Kemungkinan Masalah

### 1. JSON.parse Error = API Return HTML (bukan JSON)

**Kemungkinan penyebab:**

#### A. Backend Cache Belum Clear

Backend masih menggunakan config lama dari cache.

**Solution:**
```bash
# Di EasyPanel terminal (backend service)
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Restart PHP-FPM
# (biasanya auto-restart di EasyPanel)
```

#### B. Session Configuration Tidak Ter-apply

Environment variables di EasyPanel belum ter-apply dengan benar.

**Verify:**
```bash
# Di EasyPanel terminal (backend)
php artisan config:show session

# Harus menunjukkan:
# domain: ".aidareu.com"
# same_site: "none"
# secure: true
```

**Jika masih salah:**
1. Double-check environment variables di EasyPanel
2. Restart backend service completely
3. Run `php artisan config:clear` lagi

#### C. Nginx/Web Server Menambahkan Header Sendiri

EasyPanel proxy atau nginx bisa menambahkan CORS headers yang conflict.

**Check:**
```bash
# Test CORS headers dari curl
curl -I -H "Origin: https://aidareu.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.aidareu.com/api/auth/login
```

**Expected headers:**
```
Access-Control-Allow-Origin: https://aidareu.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE
```

**Jika ada duplikat headers atau conflict:**
- Check nginx config di EasyPanel
- Pastikan nginx tidak menambahkan `add_header Access-Control-*`

#### D. Frontend Masih Menggunakan Code Lama

Frontend belum rebuild dengan code terbaru.

**Solution:**
```bash
# Di EasyPanel, rebuild frontend service
# Atau manual:
cd frontend
npm run build
```

### 2. Login Request Format Issue

Mari kita cek apakah login request dikirim dengan benar.

**Expected request:**
```javascript
fetch('https://api.aidareu.com/api/auth/login', {
  method: 'POST',
  credentials: 'include',  // MUST HAVE
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})
```

**Check di browser DevTools > Network:**
1. Find request to `/api/auth/login`
2. Check **Request Headers** - harus ada `Content-Type: application/json`
3. Check **Request Payload** - harus ada `email` dan `password`
4. Check **Response** - apa yang dikembalikan?

### 3. Preflight CORS Request Gagal

Jika browser mengirim OPTIONS preflight request dan gagal, POST request tidak akan dikirim.

**Check di DevTools > Network:**
1. Look for `OPTIONS /api/auth/login` request
2. Check response status - **harus 200 atau 204**
3. Check response headers - harus ada CORS headers

**Jika OPTIONS request gagal:**
- Backend tidak handle OPTIONS dengan benar
- CORS middleware tidak aktif
- Nginx blocking OPTIONS

---

## 🧪 Step-by-Step Debugging

### Step 1: Clear All Caches (Backend)

```bash
# EasyPanel > Backend Service > Terminal
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Verify config
php artisan config:show session | grep -E "domain|same_site|secure"
php artisan config:show cors | grep -E "supports_credentials|allowed_origins"
```

Expected output:
```
session.domain => ".aidareu.com"
session.same_site => "none"
session.secure => true
cors.supports_credentials => true
```

### Step 2: Rebuild Frontend

```bash
# EasyPanel > Frontend Service > Rebuild
# (akan auto-pull latest code dan rebuild)
```

### Step 3: Clear Browser Cache & Cookies

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cookies and other site data"
3. Select "Cached images and files"
4. Time range: "All time"
5. Click "Clear data"

**Important:** Harus clear cookies, karena cookie lama mungkin punya domain yang salah!

### Step 4: Test CORS dengan Curl

```bash
# Test OPTIONS preflight
curl -v \
  -H "Origin: https://aidareu.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://api.aidareu.com/api/auth/login

# Test actual POST request
curl -v \
  -H "Origin: https://aidareu.com" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"email":"test@example.com","password":"password"}' \
  https://api.aidareu.com/api/auth/login
```

**Look for in response:**
- HTTP status code (should be 200 for POST, 200/204 for OPTIONS)
- `Access-Control-Allow-Origin: https://aidareu.com`
- `Access-Control-Allow-Credentials: true`
- `Set-Cookie` headers (for POST request)

### Step 5: Test Login dengan Browser

1. **Open Incognito/Private Window** (fresh start, no cache)

2. **Open DevTools** (F12)

3. **Go to Network tab**

4. **Go to** https://aidareu.com/login

5. **Enter credentials** and click Login

6. **Check Network tab:**

   **Look for OPTIONS request (preflight):**
   - URL: `/api/auth/login`
   - Method: `OPTIONS`
   - Status: Should be **200 or 204**
   - Response Headers should include:
     ```
     Access-Control-Allow-Origin: https://aidareu.com
     Access-Control-Allow-Credentials: true
     Access-Control-Allow-Methods: POST
     ```

   **Look for POST request (actual login):**
   - URL: `/api/auth/login`
   - Method: `POST`
   - Request Headers should include:
     ```
     Content-Type: application/json
     Origin: https://aidareu.com
     ```
   - Request Payload should include:
     ```json
     {"email":"...","password":"..."}
     ```
   - Response Status: Should be **200**
   - Response Headers should include:
     ```
     Access-Control-Allow-Origin: https://aidareu.com
     Access-Control-Allow-Credentials: true
     Set-Cookie: laravel_session=...; Domain=.aidareu.com; ...
     Set-Cookie: XSRF-TOKEN=...; Domain=.aidareu.com; ...
     ```
   - Response Body should be **valid JSON**:
     ```json
     {
       "user": {...},
       "token": "..."
     }
     ```

7. **If POST request fails:**
   - Check **Status Code**
   - Check **Response Preview** - is it HTML or JSON?
   - Check **Console** for errors

### Step 6: Check Cookies

**After successful login:**

DevTools > Application > Cookies > https://aidareu.com

**Should see:**
- `laravel_session`
  - Value: (long string)
  - Domain: `.aidareu.com`
  - Path: `/`
  - Secure: ✓
  - HttpOnly: ✓
  - SameSite: `None`

- `XSRF-TOKEN`
  - Value: (long string)
  - Domain: `.aidareu.com`
  - Path: `/`
  - Secure: ✓
  - SameSite: `None`

**If cookies NOT set:**
- `credentials: 'include'` not working
- CORS blocking cookies
- SESSION_DOMAIN wrong

---

## 🎯 Most Likely Issue

Berdasarkan error "JSON.parse" + 401, kemungkinan besar:

### Issue #1: Backend Cache Belum Clear

Backend masih menggunakan config lama dengan `SESSION_DOMAIN=localhost`.

**Fix:**
```bash
php artisan config:clear
php artisan cache:clear
```

### Issue #2: Frontend Masih Code Lama

Frontend belum rebuild dengan `credentials: 'include'`.

**Fix:**
- Rebuild frontend service di EasyPanel

### Issue #3: Browser Cache

Browser masih menggunakan code lama atau cookie lama.

**Fix:**
- Clear browser cache & cookies
- Use incognito window untuk testing

---

## 📋 Quick Checklist

**Backend (EasyPanel):**
- [ ] Environment variables updated:
  - `SESSION_DOMAIN=.aidareu.com`
  - `SESSION_SAME_SITE=none`
  - `SESSION_SECURE_COOKIE=true`
  - `SANCTUM_STATEFUL_DOMAINS=aidareu.com,app.aidareu.com,api.aidareu.com,www.aidareu.com`
- [ ] Backend service restarted
- [ ] Caches cleared:
  - [ ] `php artisan config:clear`
  - [ ] `php artisan cache:clear`
  - [ ] `php artisan route:clear`
- [ ] Config verified with `php artisan config:show session`

**Frontend (EasyPanel):**
- [ ] Code pushed to repository (✅ Done - commit d04d1e1)
- [ ] Frontend service rebuilt
- [ ] Deployment successful

**Browser:**
- [ ] Cache cleared (Ctrl+Shift+Delete)
- [ ] Cookies cleared
- [ ] Using incognito/private window for testing

**Testing:**
- [ ] CORS test with curl shows correct headers
- [ ] Login request shows OPTIONS + POST in Network tab
- [ ] OPTIONS request returns 200/204
- [ ] POST request returns 200 with JSON
- [ ] Cookies are set with domain `.aidareu.com`
- [ ] Subsequent requests include cookies
- [ ] No 401 errors on `/api/users/me`

---

## 🔧 Emergency Debug

If still not working, add temporary logging:

**Frontend - LoginV1Simple.tsx (temporary debug):**

```typescript
const response = await fetch(`${backendUrl}/api/auth/login`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: data.email,
    password: data.password
  })
})

// ADD THIS FOR DEBUG
console.log('Login response status:', response.status)
console.log('Login response headers:', Object.fromEntries(response.headers.entries()))

const responseText = await response.text()
console.log('Login response body (text):', responseText)

// Try to parse JSON
let result
try {
  result = JSON.parse(responseText)
  console.log('Login response (parsed):', result)
} catch (e) {
  console.error('Failed to parse JSON:', e)
  console.error('Response was:', responseText)
  throw new Error('Server returned non-JSON response: ' + responseText.substring(0, 200))
}
```

This will show you exactly what the backend is returning!

---

## 💡 Recommended Action

**DO THIS NOW:**

1. **Backend:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   ```

2. **Frontend:**
   - Rebuild di EasyPanel

3. **Browser:**
   - Clear all cache & cookies
   - Open incognito window
   - Try login again

4. **Check DevTools:**
   - Network tab: Look at login request/response
   - Console tab: Look for errors
   - Application tab: Check cookies

Report back dengan:
- Screenshot Network tab (showing login request & response)
- Response body dari login request
- Cookies yang ter-set (jika ada)

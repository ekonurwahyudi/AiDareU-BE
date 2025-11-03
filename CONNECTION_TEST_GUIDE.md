# Connection Test Guide - Database & API

## 🎯 Testing Checklist

### ✅ Backend Database Connection
### ✅ Backend API Endpoints
### ✅ Frontend ↔ Backend Communication
### ✅ Session & Cookies

---

## 📋 Test 1: Backend Database Connection

### Via EasyPanel Terminal (Backend Service)

```bash
# Test 1: Check database connection
php artisan db:show

# Test 2: Show database config
php artisan config:show database

# Test 3: Test connection with tinker
php artisan tinker
>>> DB::connection()->getPdo();
>>> echo "Connected!";
>>> exit

# Test 4: Count users
php artisan tinker --execute="echo App\Models\User::count();"

# Test 5: Check sessions table
php artisan tinker --execute="echo DB::table('sessions')->count();"

# Test 6: List tables
php artisan tinker
>>> DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
>>> exit
```

### Expected Output

**If database is connected:**
```
✓ Database connected
✓ Can query tables
✓ Users table accessible
✓ Sessions table accessible
```

**If database NOT connected:**
```
✗ SQLSTATE[08006] Connection refused
✗ could not connect to server
✗ Connection timed out
```

### Common Database Issues

#### Issue 1: Connection Refused

**Error:**
```
SQLSTATE[08006] [7] could not connect to server: Connection refused
```

**Cause:** Database host/port wrong or database service not running

**Fix:**
```bash
# Check environment
php artisan config:show database | grep -E "host|port|database"

# Should show:
# host: "aidareu-db" or your DB host
# port: 5432
# database: "postgres" or your DB name
```

Verify in EasyPanel:
- Database service is running
- DB_HOST environment variable matches database service name
- DB_PORT is 5432 (default PostgreSQL)

#### Issue 2: Authentication Failed

**Error:**
```
SQLSTATE[08006] password authentication failed for user "postgres"
```

**Cause:** Wrong database credentials

**Fix:**
Check environment variables in EasyPanel:
```
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

#### Issue 3: Database Not Exist

**Error:**
```
SQLSTATE[08006] database "postgres" does not exist
```

**Cause:** Database name wrong or database not created

**Fix:**
1. Check DB_DATABASE environment variable
2. Create database if needed (via EasyPanel database service)

---

## 📋 Test 2: Backend API Endpoints

### Via curl (From Local Machine)

```bash
# Test 1: Backend health
curl -i https://api.aidareu.com/health

# Test 2: Test environment endpoint
curl -i https://api.aidareu.com/api/test-env

# Test 3: Login endpoint (will fail but should return JSON)
curl -i \
  -H "Origin: https://aidareu.com" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"email":"test@test.com","password":"test"}' \
  https://api.aidareu.com/api/auth/login

# Test 4: CORS preflight
curl -i \
  -H "Origin: https://aidareu.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://api.aidareu.com/api/auth/login
```

### Expected Responses

**Health Check:**
```
HTTP/2 200
{"status":"ok"}
```

**Login Endpoint (with wrong credentials):**
```
HTTP/2 401
access-control-allow-origin: https://aidareu.com
access-control-allow-credentials: true
content-type: application/json

{"message":["Invalid credentials"]}
```

**CORS Preflight:**
```
HTTP/2 200
access-control-allow-origin: https://aidareu.com
access-control-allow-credentials: true
access-control-allow-methods: POST, GET, OPTIONS, PUT, DELETE
```

### Common API Issues

#### Issue 1: 502 Bad Gateway

**Error:**
```
HTTP/2 502
<html>502 Bad Gateway</html>
```

**Cause:** Backend service not running or crashed

**Fix:**
1. Check backend service status in EasyPanel
2. Check backend logs for errors
3. Restart backend service

#### Issue 2: 404 Not Found

**Error:**
```
HTTP/2 404
{"message":"Not Found"}
```

**Cause:** Route not found or wrong URL

**Fix:**
```bash
# Check routes
php artisan route:list | grep "auth/login"

# Should show:
# POST  api/auth/login  › Api\AuthController@login
```

#### Issue 3: No CORS Headers

**Error:**
```
HTTP/2 200
(no access-control-* headers)
```

**Cause:** CORS middleware not active or cache not cleared

**Fix:**
```bash
# Clear cache
php artisan config:clear
php artisan cache:clear

# Verify CORS config
php artisan config:show cors
```

---

## 📋 Test 3: Frontend ↔ Backend Communication

### Via Browser DevTools

1. **Open** https://aidareu.com
2. **Open DevTools** (F12)
3. **Go to Console tab**
4. **Run these commands:**

```javascript
// Test 1: Check frontend environment
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
// Should show: https://api.aidareu.com/api

// Test 2: Test fetch to backend
fetch('https://api.aidareu.com/api/test-env', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => {
    console.log('Backend response:', data)
  })
  .catch(err => {
    console.error('Fetch error:', err)
  })

// Test 3: Test login endpoint
fetch('https://api.aidareu.com/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@test.com',
    password: 'test123'
  })
})
  .then(async response => {
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    const text = await response.text()
    console.log('Body:', text)
    try {
      console.log('Parsed:', JSON.parse(text))
    } catch (e) {
      console.error('Not JSON:', text.substring(0, 200))
    }
  })
```

### Expected Output

**Test 1:**
```
API URL: https://api.aidareu.com/api
```

**Test 2:**
```
Backend response: {
  NEXT_PUBLIC_API_URL: "https://api.aidareu.com/api",
  NODE_ENV: "production"
}
```

**Test 3:**
```
Status: 401
Headers: {
  "access-control-allow-origin": "https://aidareu.com",
  "access-control-allow-credentials": "true",
  "content-type": "application/json",
  "set-cookie": "laravel_session=...; ..."
}
Body: {"message":["Invalid credentials"]}
Parsed: { message: ["Invalid credentials"] }
```

### Common Communication Issues

#### Issue 1: CORS Error

**Error in Console:**
```
Access to fetch at 'https://api.aidareu.com/api/auth/login' from origin
'https://aidareu.com' has been blocked by CORS policy
```

**Cause:** Backend CORS not configured or cache not cleared

**Fix:**
1. Backend: `php artisan config:clear`
2. Check CORS config includes aidareu.com
3. Check CORS middleware is active

#### Issue 2: Network Error

**Error:**
```
TypeError: Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Cause:** Backend server not reachable

**Fix:**
1. Check backend service is running in EasyPanel
2. Check domain DNS points to correct IP
3. Check SSL certificate is valid

#### Issue 3: JSON Parse Error

**Error:**
```
SyntaxError: JSON.parse: unexpected character at line 1 column 1
```

**Cause:** Backend returning HTML instead of JSON

**Check response body:**
- If shows HTML error page = backend error occurred
- Check backend logs for PHP errors
- Check if route exists

---

## 📋 Test 4: Session & Cookies

### Check Session Configuration

**Backend (EasyPanel Terminal):**

```bash
# Show session config
php artisan config:show session

# Should show:
# driver: "database"
# domain: ".aidareu.com"
# same_site: "none"
# secure: true
```

### Check Cookies in Browser

**After Login Attempt:**

1. DevTools > **Application** tab
2. **Cookies** > https://aidareu.com
3. Should see:
   - `laravel_session`
     - Domain: `.aidareu.com` ✓
     - Secure: ✓
     - HttpOnly: ✓
     - SameSite: `None` ✓

### Test Cookie Transmission

**In Browser Console:**

```javascript
// Check if cookies exist
console.log(document.cookie)

// Should show cookies for aidareu.com domain

// Test if cookies sent in request
fetch('https://api.aidareu.com/api/users/me', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// If 401 = no valid session
// If 200 = session working!
```

---

## 🔧 Automated Test Script

I've created two test scripts:

### 1. test-connection.sh (Shell Script)

Tests from external (your machine):
- Backend reachability
- API endpoints
- CORS headers
- Cookie setup

**Run:**
```bash
cd /d/aidareu_app
bash test-connection.sh
```

### 2. test-db.php (PHP Script)

Tests from backend server:
- Database connection
- Tables access
- Users count
- Sessions table

**Run in Backend EasyPanel Terminal:**
```bash
cd /app
php test-db.php
```

---

## 📊 Full Test Sequence

### Step 1: Backend Database

```bash
# EasyPanel > Backend Service > Terminal
php artisan tinker --execute="echo DB::connection()->getPdo() ? 'Connected' : 'Failed';"
```

**Expected:** `Connected`

### Step 2: Backend API

```bash
# Local terminal
curl -i https://api.aidareu.com/api/test-env
```

**Expected:** HTTP 200 with JSON response

### Step 3: CORS

```bash
# Local terminal
curl -I -H "Origin: https://aidareu.com" https://api.aidareu.com/api/auth/login
```

**Expected:**
```
access-control-allow-origin: https://aidareu.com
access-control-allow-credentials: true
```

### Step 4: Frontend to Backend

```
1. Open https://aidareu.com
2. Open DevTools Console
3. Run: fetch('https://api.aidareu.com/api/test-env').then(r=>r.json()).then(console.log)
```

**Expected:** JSON response with environment data

### Step 5: Login Flow

```
1. Go to https://aidareu.com/login
2. Open DevTools > Network tab
3. Enter valid credentials
4. Click Login
5. Check POST /api/auth/login request
```

**Expected:**
- Status: 200
- Response: JSON with user & token
- Set-Cookie headers present
- Cookies saved in Application tab

---

## ✅ Success Criteria

### Database Connection
- [ ] `php artisan db:show` works
- [ ] Can count users
- [ ] Can access sessions table
- [ ] Migrations table exists

### API Endpoints
- [ ] `/health` returns 200
- [ ] `/api/test-env` returns JSON
- [ ] `/api/auth/login` returns JSON (even if 401)
- [ ] CORS headers present in responses

### Frontend-Backend
- [ ] Frontend can fetch from backend
- [ ] CORS allows credentials
- [ ] Cookies are set with domain `.aidareu.com`
- [ ] Cookies sent in subsequent requests

### Login Flow
- [ ] Login request returns 200 with valid credentials
- [ ] Session cookies set after login
- [ ] `/api/users/me` returns 200 after login
- [ ] Dashboard loads without errors

---

## 🆘 If Tests Fail

### Database Connection Fails

**Collect info:**
```bash
php artisan config:show database
cat .env | grep DB_
```

**Check:**
- Database service running in EasyPanel
- Credentials correct
- Database exists

### API Not Responding

**Check:**
- Backend service status in EasyPanel
- Backend logs for errors
- Domain DNS records
- SSL certificate

### CORS Issues

**Fix:**
```bash
php artisan config:clear
php artisan cache:clear
php artisan config:show cors
```

**Verify:**
- `supports_credentials: true`
- `allowed_origins` includes `https://aidareu.com`

### Cookies Not Set

**Fix:**
```bash
php artisan config:show session
```

**Verify:**
- `domain: ".aidareu.com"` (with leading dot!)
- `same_site: "none"`
- `secure: true`

---

## 📝 Quick Diagnostic Commands

**Backend (EasyPanel Terminal):**
```bash
# Database
php artisan tinker --execute="echo DB::connection()->getPdo() ? 'DB OK' : 'DB FAIL';"

# Config
php artisan config:show session.domain
php artisan config:show cors.supports_credentials

# Tables
php artisan tinker --execute="echo 'Users: ' . App\Models\User::count();"
```

**Local Terminal:**
```bash
# API
curl -i https://api.aidareu.com/health

# CORS
curl -I -H "Origin: https://aidareu.com" https://api.aidareu.com/api/auth/login
```

**Browser Console:**
```javascript
// Environment
console.log(process.env.NEXT_PUBLIC_API_URL)

// API Test
fetch('https://api.aidareu.com/api/test-env',{credentials:'include'}).then(r=>r.json()).then(console.log)

// Cookies
console.log(document.cookie)
```

---

**All test scripts created and ready to use!**

Run tests in this order:
1. Backend database test
2. API endpoint test
3. CORS test
4. Frontend-backend test
5. Full login flow test

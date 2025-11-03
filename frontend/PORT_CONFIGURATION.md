# Port Configuration Guide

## Port Assignment

| Service | Port | Purpose |
|---------|------|---------|
| **Frontend (Next.js)** | 3000 | Development & Production Dashboard |
| **Backend (Laravel API)** | 8080 | API Server |
| **PostgreSQL** | 5432 | Database |

## Environment Variables

### Development (.env or .env.local)

```env
# API Configuration - Backend runs on port 8080
NEXT_PUBLIC_API_URL=http://localhost:8080/api
API_URL=http://localhost:8080/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Production (.env.production or .env.production.local)

```env
# API Configuration - Backend runs on port 8080
NEXT_PUBLIC_API_URL=http://localhost:8080/api
API_URL=http://localhost:8080/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Docker (.env.docker - for Docker deployment)

```env
# For client-side requests (browser)
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# For server-side requests (internal Docker network)
API_URL=http://aidareu-backend:8080/api
```

## Environment Variable Usage

### NEXT_PUBLIC_API_URL
- Used for **client-side** API requests (from browser)
- Includes `/api` suffix
- Example: `http://localhost:8080/api`
- Used in: Components, pages, client-side hooks

### NEXT_PUBLIC_BACKEND_URL
- Used for **backend base URL** (without /api)
- For storage URLs and non-API endpoints
- Example: `http://localhost:8080`
- Used in: Storage URLs (`/storage/...`)

### API_URL
- Used for **server-side** API requests
- From Next.js API routes and server components
- In Docker: Uses internal network (e.g., `http://aidareu-backend:8080/api`)
- In local dev: Uses localhost (e.g., `http://localhost:8080/api`)

## API Configuration Helper

We provide a centralized helper module: `src/utils/apiConfig.ts`

### Usage Examples

```typescript
import { getApiUrl, getStorageUrl, getBackendUrl } from '@/utils/apiConfig'

// Get API endpoint
const productsUrl = getApiUrl('/products')
// Returns: http://localhost:8080/api/products

// Get storage URL
const imageUrl = getStorageUrl('products/image.jpg')
// Returns: http://localhost:8080/storage/products/image.jpg

// Get backend URL
const storeUrl = getBackendUrl('/s/my-store')
// Returns: http://localhost:8080/s/my-store
```

### Helper Functions

| Function | Purpose | Example Input | Example Output |
|----------|---------|---------------|----------------|
| `getApiUrl(endpoint)` | API endpoints | `'/products'` | `http://localhost:8080/api/products` |
| `getStorageUrl(path)` | Storage assets | `'products/img.jpg'` | `http://localhost:8080/storage/products/img.jpg` |
| `getBackendUrl(path)` | Backend URLs | `'/s/store'` | `http://localhost:8080/s/store` |

## Migration Guide

### Before (Hardcoded URLs)
```typescript
// ❌ Don't do this
const apiUrl = 'http://localhost:8000/api'
const imageUrl = `http://localhost:8000/storage/${image}`
```

### After (Using Helper)
```typescript
// ✅ Do this instead
import { getApiUrl, getStorageUrl } from '@/utils/apiConfig'

const apiUrl = getApiUrl('/products')
const imageUrl = getStorageUrl(image)
```

## Running the Application

### Development Mode
```bash
# Frontend runs on port 3000
npm run dev
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server (default port 3000)
npm start
```

### Docker Mode
```bash
# Frontend runs on port 3000 (exposed from container)
docker-compose up -d
```

## Connecting to Backend

The frontend expects the backend to be running on **port 8080**.

### Start Backend (from backend directory)
```bash
# Development
php artisan serve --port=8080

# Docker
docker-compose up -d
```

### Verify Connection
1. Backend should be accessible at: http://localhost:8080
2. Backend API should respond at: http://localhost:8080/api
3. Test with: `curl http://localhost:8080/api/health` (if health endpoint exists)

## Troubleshooting

### Frontend can't connect to backend

1. **Check backend is running**:
   ```bash
   curl http://localhost:8080/api
   ```

2. **Check environment variables**:
   ```bash
   # In frontend directory
   cat .env.local
   ```

3. **Verify CORS settings** in backend:
   - File: `backend/config/cors.php`
   - Should include: `http://localhost:3000`

4. **Check browser console** for CORS errors

### Port already in use

If port 3000 or 8080 is already in use:

```bash
# Check what's using the port (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# Check what's using the port (Linux/Mac)
lsof -i :3000
lsof -i :8080
```

## Best Practices

1. **Always use environment variables** - Never hardcode URLs
2. **Use the API helper** - Import from `src/utils/apiConfig.ts`
3. **Different URLs for different environments**:
   - Development: `localhost:8080`
   - Production: Your production domain
   - Docker: Internal network name

4. **Test connections** before deployment
5. **Check CORS configuration** in backend

## Production Deployment

When deploying to production:

1. Update environment variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
   NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
   ```

2. Update backend CORS settings to allow frontend domain

3. Ensure SSL/TLS certificates are configured

4. Test all API connections

---

**Last Updated**: October 2025

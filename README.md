# AiDareU - AI-Powered E-commerce Platform

Full-stack e-commerce platform with AI integration, featuring automated landing page generation, product management, and shipping integration.

## 🏗️ Architecture

This project consists of two separate repositories:

### Backend (Laravel API)
- **Repository**: https://github.com/ekonurwahyudi/AiDareU-BE.git
- **Tech Stack**: Laravel 11, PHP 8.2, PostgreSQL 15
- **Features**: RESTful API, Authentication, RBAC, OpenAI Integration, Biteship Shipping

### Frontend (Next.js Dashboard)
- **Repository**: https://github.com/ekonurwahyudi/AiDareU-FE.git
- **Tech Stack**: Next.js 15, TypeScript, Material-UI
- **Features**: Admin Dashboard, Product Management, Order Processing, Theme Customization

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose V2
- Git

### Option 1: Clone and Run Separately

```bash
# Clone backend
git clone https://github.com/ekonurwahyudi/AiDareU-BE.git backend
cd backend
cp .env.docker .env
# Edit .env with your configuration
docker-compose up -d
cd ..

# Clone frontend
git clone https://github.com/ekonurwahyudi/AiDareU-FE.git frontend
cd frontend
cp .env.docker .env.production.local
# Edit .env.production.local with API URLs
docker-compose up -d
```

### Option 2: Use Convenience Scripts (if both repos are in same directory)

**Linux/Mac:**
```bash
./start-all.sh
```

**Windows:**
```batch
start-all.bat
```

## 📊 Services

| Service    | Port | URL                         |
|------------|------|-----------------------------|
| Frontend   | 3000 | http://localhost:3000       |
| Backend    | 8080 | http://localhost:8080       |
| PostgreSQL | 5432 | localhost:5432              |

## 🔧 Configuration

### Backend (.env)
```env
APP_KEY=base64:...
DB_HOST=postgres
DB_DATABASE=aidareu
DB_USERNAME=postgres
DB_PASSWORD=your-password
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
OPENAI_API_KEY=sk-...
BITESHIP_API_KEY=biteship_live...
```

### Frontend (.env.production.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
API_URL=http://aidareu-backend:8080/api
```

## ✨ Features

### Backend API
- ✅ RESTful API with Laravel 11
- ✅ PostgreSQL database
- ✅ Authentication & Authorization (Sanctum)
- ✅ Role-Based Access Control (RBAC)
- ✅ Product & Category Management
- ✅ Order Processing & Tracking
- ✅ Customer Management
- ✅ Email Notifications (Gmail SMTP)
- ✅ OpenAI Integration for AI features
- ✅ Biteship Shipping Integration
- ✅ Landing Page Builder
- ✅ Digital Product Support
- ✅ Theme Customization API

### Frontend Dashboard
- ✅ Modern Material-UI Design
- ✅ TypeScript for Type Safety
- ✅ Dashboard Analytics
- ✅ Product Management UI
- ✅ Order Management & Tracking
- ✅ Customer Database
- ✅ Theme Settings
- ✅ Landing Page Editor
- ✅ User & Role Management
- ✅ Responsive Design
- ✅ Dark/Light Mode

## 📦 Docker Setup

### Backend Docker Compose
Located in `backend/docker-compose.yml`:
- Backend (Laravel + Nginx + PHP-FPM)
- PostgreSQL Database
- Shared Docker network: `aidareu-network`

### Frontend Docker Compose
Located in `frontend/docker-compose.yml`:
- Frontend (Next.js standalone)
- Connects to backend via Docker network

## 📚 Documentation

- **Deployment Summary**: [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)
- **Backend Deployment**: [backend/DOCKER_DEPLOYMENT.md](backend/DOCKER_DEPLOYMENT.md)
- **Frontend Deployment**: [frontend/DOCKER_DEPLOYMENT.md](frontend/DOCKER_DEPLOYMENT.md)

## 🛠️ Development

### Backend Development
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend Development
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## 📝 Common Commands

### Start Services
```bash
# Linux/Mac
./start-all.sh

# Windows
start-all.bat
```

### Stop Services
```bash
# Linux/Mac
./stop-all.sh

# Windows
stop-all.bat
```

### View Logs
```bash
# Backend
docker-compose -f backend/docker-compose.yml logs -f

# Frontend
docker-compose -f frontend/docker-compose.yml logs -f
```

### Access Database
```bash
docker-compose -f backend/docker-compose.yml exec postgres psql -U postgres -d aidareu
```

### Run Artisan Commands
```bash
docker-compose -f backend/docker-compose.yml exec backend php artisan migrate
docker-compose -f backend/docker-compose.yml exec backend php artisan tinker
```

## 🔐 Security

- Never commit `.env` files
- Use strong passwords for production
- Keep API keys secure
- Configure proper CORS settings
- Use HTTPS in production
- Regular security updates

## 🌐 Production Deployment

1. **Configure Environment Variables**
   - Set production URLs
   - Use secure credentials
   - Enable SSL/TLS

2. **Database**
   - Use managed database service
   - Set up automated backups
   - Configure access controls

3. **Web Server**
   - Set up reverse proxy (Nginx/Caddy)
   - Configure SSL certificates
   - Enable security headers

4. **Monitoring**
   - Application monitoring
   - Error tracking
   - Performance monitoring

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check logs
docker-compose -f backend/docker-compose.yml logs -f backend

# Restart services
docker-compose -f backend/docker-compose.yml restart

# Rebuild
docker-compose -f backend/docker-compose.yml up -d --build
```

### Frontend Issues
```bash
# Check logs
docker-compose -f frontend/docker-compose.yml logs -f

# Rebuild
docker-compose -f frontend/docker-compose.yml up -d --build
```

### Database Issues
```bash
# Check database health
docker-compose -f backend/docker-compose.yml ps postgres

# Access database directly
docker-compose -f backend/docker-compose.yml exec postgres psql -U postgres -d aidareu
```

## 📞 Support

- Laravel Documentation: https://laravel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Docker Documentation: https://docs.docker.com
- Material-UI Documentation: https://mui.com

## 📄 License

Proprietary - All rights reserved

## 👥 Contributors

- Backend API: Laravel 11 with PHP 8.2
- Frontend Dashboard: Next.js 15 with TypeScript
- Generated with [Claude Code](https://claude.com/claude-code)

---

**Last Updated**: October 2025

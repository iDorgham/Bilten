# 🔐 Bilten Login Guide

## Overview
The Bilten application features a robust authentication system with automatic fallback capabilities. It can operate with a real backend API or automatically fall back to a mock authentication system when the backend is unavailable. This guide explains how to use both modes and troubleshoot common issues.

## 🚀 Quick Start

### Option 1: Full Stack Setup (Recommended)
```bash
# Start all services with Docker
docker compose up -d

# Or start manually:
# 1. Start backend (in one terminal)
cd bilten-backend && npm run dev

# 2. Start frontend (in another terminal)
cd bilten-frontend && npm start

# 3. Start scanner app (optional, in another terminal)
cd bilten-scanner && npm run dev
```

### Option 2: Frontend Only (Mock Mode)
```bash
cd bilten-frontend
npm start
```

The application will start on `http://localhost:3000` with automatic backend detection.

### 2. Available Test Accounts

#### Admin User
- **Email:** `admin@bilten.com`
- **Password:** `admin123`
- **Role:** Admin (full access)

#### Regular User
- **Email:** `user@bilten.com`
- **Password:** `user123`
- **Role:** User (standard access)

#### Event Organizer
- **Email:** `organizer@bilten.com`
- **Password:** `organizer123`
- **Role:** Organizer (event management access)

## 🔧 How It Works

### Intelligent Authentication System
- **Real Backend Mode:** Uses full authentication with PostgreSQL and JWT tokens
- **Mock Mode:** Automatic fallback when backend is unavailable
- **Smart Detection:** Automatically detects backend availability
- **Seamless Switching:** No manual configuration required for fallback

### API Configuration
```javascript
// bilten-frontend/src/config/api.js
const USE_MOCK_API = false; // Use real backend API (current setting)
```

### Automatic Fallback Behavior
The system automatically detects when the backend is unavailable and switches to mock mode:
- Network errors trigger automatic fallback
- Console shows "🔄 Backend not available, falling back to mock API"
- No user interaction required for the switch

## 🛠️ Troubleshooting

### Login Fails with "Invalid email or password"
**Cause:** Incorrect credentials or mock API not working

**Solutions:**
1. **Verify credentials** - Use the exact test accounts listed above
2. **Check browser console** - Look for error messages
3. **Clear browser storage** - Clear localStorage and sessionStorage
4. **Restart application** - Stop and restart the React development server

### "Backend not available" Error
**Cause:** Backend server is not running (expected in mock mode)

**Solutions:**
1. **This is normal** - Mock mode is designed for this scenario
2. **Check console logs** - Should show "🔄 Using mock auth API"
3. **Verify API config** - Ensure `USE_MOCK_API = true`

### Authentication State Issues
**Cause:** Stale authentication data in browser storage

**Solutions:**
1. **Clear browser data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
2. **Refresh the page**
3. **Log out and log back in**

## 🔄 Backend Setup & Configuration

### Setting Up the Full Stack

#### Using Docker (Recommended)
```bash
# Start all services including database
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f bilten-backend
```

#### Manual Setup
```bash
# 1. Start PostgreSQL and Redis (if not using Docker)
# See DATABASE_SETUP.md for detailed instructions

# 2. Install backend dependencies
cd bilten-backend
npm install

# 3. Set up environment variables
# Copy .env.example to .env and configure

# 4. Run database migrations
npm run migrate

# 5. Start backend server
npm run dev
```

### Environment Variables
Create a `.env` file in the `bilten-backend` directory:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://bilten_user:bilten_password@localhost:5432/bilten_db
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:3000
```

### Switching API Modes

#### Force Mock API (Development Testing)
```javascript
// bilten-frontend/src/config/api.js
const USE_MOCK_API = true; // Force mock mode
```

#### Use Real API (Default)
```javascript
// bilten-frontend/src/config/api.js
const USE_MOCK_API = false; // Use real backend (current setting)
```

**Note:** The system automatically falls back to mock mode if the backend is unavailable, regardless of this setting.

## 📱 Testing Different User Roles

### Admin Features
- Access to admin dashboard
- User management
- System configuration
- Analytics and reports

### Organizer Features
- Event creation and management
- Ticket management
- Event analytics
- Attendee management

### User Features
- Browse events
- Purchase tickets
- Manage profile
- View order history

## 🔒 Security Notes

### Mock Mode Security
- **Passwords are not hashed** in mock mode
- **JWT tokens are simulated** (not real cryptographic tokens)
- **Data is stored in memory** (not persistent)
- **For development only** - not suitable for production

### Production Security
- Use real backend server with proper authentication
- Implement proper password hashing
- Use real JWT tokens
- Enable HTTPS
- Implement proper session management

## 🔍 QR Scanner App

### Scanner Authentication
The QR scanner app (`http://localhost:3002`) uses the same authentication system:
- **Purpose:** Ticket validation at event venues
- **Authentication:** Uses same backend API
- **Fallback:** Also supports mock mode for testing

### Scanner Setup
```bash
# Start scanner app
cd bilten-scanner
npm run dev
# App available at http://localhost:3002
```

## 🚨 Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid email or password" | Wrong credentials | Use test accounts listed above |
| "User not found" | Email doesn't exist | Use one of the test emails |
| "Backend not available" | Server not running | Check Docker services or start backend manually |
| "Network error" | Connection issues | Check backend status and network connection |
| "Database connection error" | DB not running | Start PostgreSQL: `docker compose up -d postgres` |
| "JWT token expired" | Session expired | Log out and log back in |

## 📞 Support

If you continue to experience login issues:

1. **Check the browser console** for detailed error messages
2. **Verify the application is running** on the correct port
3. **Clear browser cache and storage**
4. **Restart the development server**
5. **Check the network tab** for failed API requests

## 🔄 Development Workflow

### Development Mode Setup
1. **Quick Testing (Mock Only):**
   ```bash
   cd bilten-frontend && npm start
   # Uses automatic fallback to mock API
   ```

2. **Full Development (Recommended):**
   ```bash
   # Start all services
   docker compose up -d
   
   # Or manually:
   cd bilten-backend && npm run dev &
   cd bilten-frontend && npm start &
   cd bilten-scanner && npm run dev &
   ```

### Production Deployment
1. **Environment Setup:**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   DATABASE_URL=your_production_db_url
   JWT_SECRET=your_secure_jwt_secret
   ```

2. **Build and Deploy:**
   ```bash
   # Build frontend
   cd bilten-frontend && npm run build
   
   # Start production server
   cd bilten-backend && npm start
   ```

## 🐳 Docker Services

### Service Ports
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:3001`
- **Scanner App:** `http://localhost:3002`
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`
- **pgAdmin:** `http://localhost:5050`

### Docker Commands
```bash
# Start all services
docker compose up -d

# View service status
docker compose ps

# View logs
docker compose logs -f bilten-backend

# Stop services
docker compose down

# Rebuild services
docker compose up -d --build
```

## 🔧 Environment Configuration

### Frontend Environment Variables
Create `bilten-frontend/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1
REACT_APP_USE_MOCK_API=false
```

### Backend Environment Variables
See [ENV_CONFIGURATION.md](ENV_CONFIGURATION.md) for complete setup guide.

## 🔍 Debugging Authentication

### Check Backend Status
```bash
# Test backend health
curl http://localhost:3001/api/v1/health

# Check authentication endpoint
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bilten.com","password":"admin123"}'
```

### Browser Console Debugging
Look for these messages in the browser console:
- `🔄 Backend not available, falling back to mock API` - Automatic fallback activated
- `🔄 Using mock auth API` - Mock authentication in use
- Authentication errors will show detailed error messages

## 🆕 Latest Features & Improvements

### Enhanced Authentication System
- **Automatic Fallback:** Seamless switching between real and mock APIs
- **JWT Token Management:** Secure token handling with automatic refresh
- **Role-based Access Control:** Admin, organizer, and user roles with proper permissions
- **Email Verification:** Secure account verification system
- **Password Reset:** Complete forgot/reset password functionality

### New Security Features
- **Rate Limiting:** Protection against brute force attacks
- **CORS Configuration:** Proper cross-origin request handling
- **Helmet Security:** Security headers for production
- **Input Validation:** Comprehensive request validation

### Development Improvements
- **Mock Data Enhancement:** Realistic test data with Egyptian events and venues
- **Error Handling:** Improved error messages and user feedback
- **Logging System:** Comprehensive logging for debugging
- **Test Coverage:** Extensive test suite for authentication flows

### Multi-App Support
- **Frontend App:** Main user interface (`localhost:3000`)
- **Backend API:** RESTful API server (`localhost:3001`)
- **Scanner App:** QR code scanner for events (`localhost:3002`)
- **Database Tools:** pgAdmin for database management (`localhost:5050`)

## 🔗 Related Documentation

- **[ENV_CONFIGURATION.md](ENV_CONFIGURATION.md)** - Complete environment setup
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Database configuration
- **[Docs/ADMIN_DASHBOARD_GUIDE.md](Docs/ADMIN_DASHBOARD_GUIDE.md)** - Admin features guide
- **[Docs/PROJECT_PROGRESS_REPORT.md](Docs/PROJECT_PROGRESS_REPORT.md)** - Project status and features

---

**Note:** This guide covers both development and production authentication. The Bilten platform now supports full-stack development with automatic fallback capabilities for seamless development experience.

# 🔐 Bilten Login Guide

## Overview
The Bilten application uses a mock authentication system for development when the backend server is not running. This guide explains how to use the login system and troubleshoot common issues.

## 🚀 Quick Start

### 1. Start the Frontend Application
```bash
cd bilten-frontend
npm start
```

The application will start on `http://localhost:3000`

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

### Mock Authentication System
- **Purpose:** Provides authentication when backend server is not running
- **Configuration:** Set in `bilten-frontend/src/config/api.js`
- **Fallback:** Automatically switches between real API and mock API

### API Configuration
```javascript
// bilten-frontend/src/config/api.js
const USE_MOCK_API = true; // Use mock API for development
```

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

## 🔄 Switching Between Mock and Real API

### Enable Mock API (Development)
```javascript
// bilten-frontend/src/config/api.js
const USE_MOCK_API = true;
```

### Enable Real API (Production)
```javascript
// bilten-frontend/src/config/api.js
const USE_MOCK_API = false;
```

**Note:** When using real API, ensure the backend server is running on port 3001.

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

## 🚨 Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid email or password" | Wrong credentials | Use test accounts listed above |
| "User not found" | Email doesn't exist | Use one of the test emails |
| "Backend not available" | Server not running | Normal in mock mode |
| "Network error" | Connection issues | Check internet connection |

## 📞 Support

If you continue to experience login issues:

1. **Check the browser console** for detailed error messages
2. **Verify the application is running** on the correct port
3. **Clear browser cache and storage**
4. **Restart the development server**
5. **Check the network tab** for failed API requests

## 🔄 Development Workflow

### Typical Development Setup
1. Start frontend: `npm start`
2. Use mock authentication (no backend required)
3. Test with provided test accounts
4. Develop and test features

### Backend Integration
1. Start backend server on port 3001
2. Set `USE_MOCK_API = false`
3. Use real authentication endpoints
4. Test with real user accounts

---

**Note:** This guide is for development purposes. For production deployment, ensure proper backend authentication is implemented.

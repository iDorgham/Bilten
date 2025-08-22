# 🔄 Switching to Real Backend API

## ✅ What's Already Done

1. **Backend Server**: Created and running on port 3001
2. **API Configuration**: Updated `bilten-frontend/src/config/api.js` to use real backend
3. **Authentication**: Real JWT authentication implemented

## 🔧 Manual Setup Steps

### Step 1: Create Frontend Environment File

Create a file named `.env` in the `bilten-frontend` directory with this content:

```env
# Bilten Frontend Environment Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/v1
REACT_APP_API_TIMEOUT=30000
REACT_APP_API_VERSION=v1
REACT_APP_USE_MOCK_API=false
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51R0ijeRoDcHlFS1D77oMNlDYd31WKJWGXYcHrKn6tyrhGils5JcH86i4rPCLrxRqu2ZWgxYHvODMuX7RE0i27tUk006RyIdbDN
REACT_APP_VERSION=1.0.0
```

### Step 2: Verify Backend is Running

Check if backend is running on port 3001:
```powershell
netstat -an | findstr ":3001"
```

If not running, start it:
```powershell
cd bilten-backend
npm start
```

### Step 3: Start Frontend

```powershell
cd bilten-frontend
npm start
```

## 🔐 Test Accounts

Use these accounts to test the real backend:

- **Admin**: `admin@bilten.com` / `admin123`
- **User**: `user@bilten.com` / `user123`
- **Organizer**: `organizer@bilten.com` / `organizer123`

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:3001/health
- **API Base**: http://localhost:3001/api/v1

## ✅ Verification

1. Open http://localhost:3000
2. Try to login with test accounts
3. Check browser console for API calls to port 3001
4. Verify authentication works with real JWT tokens

## 🔄 Switching Back to Mock API

If you need to switch back to mock API for development:

1. Edit `bilten-frontend/src/config/api.js`
2. Change `USE_MOCK_API = false` to `USE_MOCK_API = true`
3. Restart frontend

## 🚨 Troubleshooting

### Backend Not Responding
- Check if backend is running: `netstat -an | findstr ":3001"`
- Restart backend: `cd bilten-backend && npm start`

### Frontend Can't Connect
- Verify .env file exists in bilten-frontend directory
- Check REACT_APP_API_BASE_URL is correct
- Restart frontend after making changes

### Login Fails
- Use exact test account credentials
- Check browser console for error messages
- Verify backend authentication endpoints are working

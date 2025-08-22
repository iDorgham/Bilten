# 🔧 API Connection Troubleshooting Guide

## Problem: "API Error: Connection failed"

This error occurs when the frontend cannot connect to the backend API. Here's how to diagnose and fix it.

## 🔍 Quick Diagnosis

### 1. Check Container Status
```bash
docker compose ps
```
All containers should show `Up` status.

### 2. Test Backend API Directly
```bash
# Test backend health
curl http://localhost:3001/health

# Test API endpoint
curl http://localhost:3001/api/v1
```

### 3. Check Frontend Environment
The frontend needs the correct API URL configuration.

## 🛠️ Common Solutions

### **Solution 1: Fix Environment Variable Mismatch**

**Problem**: Docker Compose uses `REACT_APP_API_URL` but frontend expects `REACT_APP_API_BASE_URL`

**Fix**: Update `docker-compose.yml`:
```yaml
bilten-frontend:
  environment:
    REACT_APP_API_BASE_URL: http://localhost:3001/api/v1  # ✅ Correct
    # REACT_APP_API_URL: http://localhost:3001/api/v1     # ❌ Wrong
```

**Apply Fix**:
```bash
docker compose restart bilten-frontend
```

### **Solution 2: Create Frontend .env File**

If running frontend outside Docker, create `bilten-frontend/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1
REACT_APP_USE_MOCK_API=false
```

### **Solution 3: Check CORS Configuration**

**Problem**: Backend CORS not allowing frontend requests

**Fix**: Update backend CORS in `docker-compose.yml`:
```yaml
bilten-backend:
  environment:
    CORS_ORIGIN: http://localhost:3000
```

### **Solution 4: Verify Port Availability**

**Check if ports are in use**:
```bash
# Windows
netstat -an | findstr ":3001"
netstat -an | findstr ":3000"

# Linux/Mac
lsof -i :3001
lsof -i :3000
```

## 🔄 Step-by-Step Resolution

### **Step 1: Restart All Services**
```bash
docker compose down
docker compose up -d
```

### **Step 2: Check Logs**
```bash
# Backend logs
docker compose logs bilten-backend --tail=20

# Frontend logs
docker compose logs bilten-frontend --tail=20
```

### **Step 3: Test Connectivity**
```bash
# Test backend
curl http://localhost:3001/api/v1

# Test frontend
curl http://localhost:3000
```

### **Step 4: Verify Environment Variables**
```bash
# Check frontend container environment
docker exec bilten-frontend env | grep REACT_APP
```

## 🚨 Emergency Fallback

If API connection fails, the system automatically falls back to mock data:

1. **Automatic Fallback**: System detects backend unavailability
2. **Mock Data**: Uses realistic sample data
3. **Visual Indicator**: Shows "API Connected: Mock Mode" in development

## 📋 Configuration Checklist

### **Backend Configuration**
- [ ] Container running on port 3001
- [ ] CORS configured for `http://localhost:3000`
- [ ] API routes responding correctly
- [ ] Database connection working

### **Frontend Configuration**
- [ ] Container running on port 3000
- [ ] `REACT_APP_API_BASE_URL` set correctly
- [ ] `REACT_APP_USE_MOCK_API` set to `false`
- [ ] Environment variables loaded

### **Network Configuration**
- [ ] Ports 3000 and 3001 available
- [ ] No firewall blocking connections
- [ ] Docker network connectivity

## 🔍 Debug Information

### **Frontend API Configuration**
```javascript
// bilten-frontend/src/config/api.js
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api/v1',
  USE_MOCK: USE_MOCK_API,
  TIMEOUT: 10000,
};
```

### **Backend CORS Configuration**
```javascript
// bilten-backend/src/app.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### **Docker Network**
```bash
# Check Docker network
docker network ls
docker network inspect bilten_default
```

## 📞 Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "API Error: Connection failed" | Frontend can't reach backend | Check environment variables |
| "CORS error" | Backend blocking frontend requests | Update CORS configuration |
| "Network Error" | Port not available or service down | Restart containers |
| "Timeout" | Backend responding slowly | Check backend logs |

## 🚀 Quick Commands

### **Full Reset**
```bash
# Stop all services
docker compose down

# Remove volumes (optional - clears data)
docker compose down -v

# Start fresh
docker compose up -d

# Check status
docker compose ps
```

### **Logs Check**
```bash
# All services
docker compose logs

# Specific service
docker compose logs bilten-backend
docker compose logs bilten-frontend
```

### **Environment Check**
```bash
# Check environment variables
docker exec bilten-frontend printenv | grep REACT_APP
docker exec bilten-backend printenv | grep CORS
```

## ✅ Success Indicators

When everything is working correctly:

1. **Backend Health**: `http://localhost:3001/health` returns 200
2. **API Endpoint**: `http://localhost:3001/api/v1` returns JSON
3. **Frontend**: `http://localhost:3000` loads without errors
4. **Admin Dashboard**: `http://localhost:3000/admin/dashboard` loads
5. **No Console Errors**: Browser console shows no API errors

## 📚 Additional Resources

- [Environment Configuration Guide](ENV_CONFIGURATION.md)
- [Real API Setup Guide](REAL_API_SETUP.md)
- [Network Error Solution](bilten-frontend/NETWORK_ERROR_SOLUTION.md)

---

*Last Updated: August 2024*
*Version: 1.0.0*

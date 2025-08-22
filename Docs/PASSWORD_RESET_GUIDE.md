# 🔐 Bilten Password Reset Guide

## Overview
This guide explains how to reset passwords in the Bilten Event Management Platform. The system supports both frontend UI and direct API access for password reset functionality.

## 🚀 Quick Start

### Frontend UI Method (Recommended for Users)

1. **Navigate to Login Page**
   ```
   http://localhost:3000/login
   ```

2. **Click "Forgot Password?"**
   - Located below the login form

3. **Enter Email Address**
   - Use one of the test accounts:
     - `admin@bilten.com`
     - `user@bilten.com`
     - `organizer@bilten.com`

4. **Get Reset Token**
   - In development, check backend logs:
   ```bash
   docker compose logs bilten-backend --tail=10
   ```
   - Look for: `Password reset requested for [email]. Reset token: [token]`

5. **Reset Password**
   - Navigate to: `http://localhost:3000/reset-password?token=[token]`
   - Enter new password (see requirements below)

## 🔧 API Methods

### Method 1: Request Password Reset

#### cURL
```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bilten.com"}'
```

#### PowerShell
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/v1/auth/forgot-password `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"user@bilten.com"}'
```

#### JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:3001/api/v1/auth/forgot-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@bilten.com'
  })
});
```

### Method 2: Reset Password with Token

#### cURL
```bash
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "newPassword":"NewPassword123"
  }'
```

#### PowerShell
```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/v1/auth/reset-password `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"token":"[token]","newPassword":"NewPassword123"}'
```

#### JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:3001/api/v1/auth/reset-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    newPassword: 'NewPassword123'
  })
});
```

## 📋 API Endpoints

### POST `/api/v1/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@bilten.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent. Check your email for reset instructions."
}
```

**Response (404):**
```json
{
  "error": "User Not Found",
  "message": "User with this email does not exist"
}
```

### POST `/api/v1/auth/reset-password`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewPassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

**Response (400):**
```json
{
  "error": "Invalid Token",
  "message": "Invalid or expired reset token"
}
```

## 🔒 Password Requirements

### Minimum Requirements
- **Length:** At least 8 characters
- **Uppercase:** At least 1 uppercase letter (A-Z)
- **Lowercase:** At least 1 lowercase letter (a-z)
- **Numbers:** At least 1 number (0-9)

### Examples
✅ **Valid Passwords:**
- `NewPassword123`
- `SecurePass456`
- `MyComplexP@ss789`

❌ **Invalid Passwords:**
- `password` (no uppercase, no numbers)
- `PASSWORD123` (no lowercase)
- `pass` (too short)

## 🧪 Test Accounts

### Available Test Users
| Email | Original Password | Role |
|-------|------------------|------|
| `admin@bilten.com` | `admin123` | Admin |
| `user@bilten.com` | `user123` | User |
| `organizer@bilten.com` | `organizer123` | Organizer |

### Reset All Test Passwords
```bash
# Reset admin password
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bilten.com"}'

# Reset user password
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bilten.com"}'

# Reset organizer password
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"organizer@bilten.com"}'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "User Not Found" Error
**Problem:** Email doesn't exist in the system
**Solution:** Use one of the test accounts listed above

#### 2. "Invalid Token" Error
**Problem:** Token is expired or invalid
**Solution:** 
- Request a new password reset
- Tokens expire after 1 hour
- Check token format in logs

#### 3. "Validation Error" for Password
**Problem:** Password doesn't meet requirements
**Solution:** Ensure password has:
- At least 8 characters
- Uppercase and lowercase letters
- At least 1 number

#### 4. Backend Not Responding
**Problem:** API endpoints return 404
**Solution:**
```bash
# Check if backend is running
docker compose ps

# Restart backend if needed
docker compose restart bilten-backend

# Check logs
docker compose logs bilten-backend
```

### Debugging Steps

1. **Check Backend Status**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Verify API Endpoints**
   ```bash
   curl http://localhost:3001/api/v1
   ```

3. **Check Logs for Reset Tokens**
   ```bash
   docker compose logs bilten-backend --tail=20
   ```

4. **Test Login After Reset**
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@bilten.com","password":"NewPassword123"}'
   ```

## 🔄 Development vs Production

### Development Environment
- **Token Storage:** Logged to console
- **Email Service:** Not implemented (tokens shown in logs)
- **Token Expiration:** 1 hour
- **Security:** Basic validation

### Production Environment
- **Token Storage:** Secure database with expiration
- **Email Service:** Real email delivery (SendGrid, AWS SES, etc.)
- **Token Expiration:** Configurable (default: 1 hour)
- **Security:** Enhanced validation and rate limiting

## 📱 Frontend Integration

### React Components
- `ForgotPassword.js` - Request password reset
- `ResetPassword.js` - Set new password with token

### Usage in React
```javascript
import { authAPI } from '../services/api';

// Request password reset
const requestReset = async (email) => {
  try {
    await authAPI.forgotPassword(email);
    console.log('Reset email sent');
  } catch (error) {
    console.error('Reset request failed:', error);
  }
};

// Reset password with token
const resetPassword = async (token, newPassword) => {
  try {
    await authAPI.resetPassword(token, newPassword);
    console.log('Password reset successful');
  } catch (error) {
    console.error('Password reset failed:', error);
  }
};
```

## 🔐 Security Considerations

### Token Security
- Tokens are JWT-based with expiration
- Tokens are single-use (invalidated after reset)
- Tokens contain user ID and email for verification

### Password Security
- Passwords are hashed using bcrypt (12 rounds)
- Password validation prevents weak passwords
- No password history tracking (in development)

### Rate Limiting
- Implemented on authentication endpoints
- Prevents brute force attacks
- Configurable limits in production

## 📊 API Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Validation Error / Invalid Token |
| 404 | User Not Found |
| 500 | Internal Server Error |

## 🛠️ Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Password Reset Configuration
RESET_TOKEN_EXPIRES_IN=1h
BCRYPT_ROUNDS=12
```

### Backend Configuration
```javascript
// Token expiration (in seconds)
const RESET_TOKEN_EXPIRES_IN = 3600; // 1 hour

// Password validation
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIRE_UPPERCASE = true;
const PASSWORD_REQUIRE_LOWERCASE = true;
const PASSWORD_REQUIRE_NUMBERS = true;
```

## 📞 Support

If you encounter issues with password reset:

1. **Check the logs:** `docker compose logs bilten-backend`
2. **Verify backend status:** `curl http://localhost:3001/health`
3. **Test with known accounts:** Use the test accounts provided
4. **Check token expiration:** Tokens expire after 1 hour

## 🔄 Related Documentation

- [Login Guide](./LOGIN_GUIDE.md) - User authentication
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Security Guide](./SECURITY_GUIDE.md) - Security best practices
- [Development Setup](./DEVELOPMENT_SETUP.md) - Local development guide

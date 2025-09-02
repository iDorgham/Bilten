# Authentication API Documentation

## Overview
The EventChain Authentication API provides secure user authentication and authorization services for the platform. It supports JWT-based authentication with role-based access control.

## Base URL
```
Production: https://api.eventchain.com/v1/auth
Staging: https://staging-api.eventchain.com/v1/auth
Development: http://localhost:3001/v1/auth
```

## Authentication Flow

### 1. User Registration
```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "attendee"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "attendee",
      "isVerified": false
    },
    "message": "Registration successful. Please verify your email."
  }
}
```

### 2. User Login
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "attendee"
    },
    "expiresIn": 3600
  }
}
```

### 3. Token Refresh
```http
POST /refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout
```http
POST /logout
Authorization: Bearer {accessToken}
```

## User Management

### Get User Profile
```http
GET /profile
Authorization: Bearer {accessToken}
```

### Update User Profile
```http
PUT /profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

### Change Password
```http
PUT /password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

## Email Verification

### Send Verification Email
```http
POST /verify/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Verify Email
```http
POST /verify/confirm
Content-Type: application/json

{
  "token": "verification_token_here"
}
```

## Password Reset

### Request Password Reset
```http
POST /password/reset/request
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```http
POST /password/reset/confirm
Content-Type: application/json

{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

## Role-Based Access Control

### Roles
- **attendee**: Basic user who can purchase tickets and attend events
- **organizer**: Can create and manage events
- **admin**: Full platform administration access

### Permission Endpoints
```http
GET /permissions
Authorization: Bearer {accessToken}
```

## Error Responses

### Common Error Codes
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Account not verified
- `AUTH_003`: Token expired
- `AUTH_004`: Invalid token
- `AUTH_005`: Account locked
- `AUTH_006`: Password too weak
- `AUTH_007`: Email already exists

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid email or password",
    "details": {}
  }
}
```

## Rate Limiting
- Login attempts: 5 per minute per IP
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email

## Security Headers
All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
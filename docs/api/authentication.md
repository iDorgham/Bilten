# Authentication Guide

## 🔐 Overview

This document covers all authentication methods available in the Bilten API, including JWT tokens, OAuth 2.0, API keys, and role-based access control.

## 🎯 Authentication Methods

### 1. JWT Token Authentication
Primary authentication method for user accounts and API access.

### 2. OAuth 2.0
Third-party application authentication and authorization.

### 3. API Key Authentication
Simple authentication for server-to-server communication.

### 4. Session-based Authentication
Web application authentication using cookies.

## 🔑 JWT Token Authentication

### Login Process
```bash
# User login
curl -X POST https://api.bilten.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password"
  }'
```

### Response Format
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "refreshExpiresIn": 604800,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "organizer"
    }
  }
}
```

### Using Access Tokens
```bash
# Make authenticated request
curl -X GET https://api.bilten.com/api/v1/events \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Refresh
```bash
# Refresh expired token
curl -X POST https://api.bilten.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Token Structure
```javascript
// JWT Token Payload
{
  "sub": "user_123",
  "email": "user@example.com",
  "role": "organizer",
  "permissions": ["events:read", "events:write"],
  "iat": 1640995200,
  "exp": 1640996100
}
```

## 🔄 OAuth 2.0 Authentication

### OAuth Flow Types

#### Authorization Code Flow
```bash
# 1. Redirect user to authorization URL
https://api.bilten.com/oauth/authorize?
  client_id=your_client_id&
  redirect_uri=https://your-app.com/callback&
  response_type=code&
  scope=events:read events:write&
  state=random_state_string

# 2. Exchange authorization code for tokens
curl -X POST https://api.bilten.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&
       client_id=your_client_id&
       client_secret=your_client_secret&
       code=authorization_code&
       redirect_uri=https://your-app.com/callback"
```

#### Client Credentials Flow
```bash
# Server-to-server authentication
curl -X POST https://api.bilten.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&
       client_id=your_client_id&
       client_secret=your_client_secret&
       scope=events:read"
```

### OAuth Scopes
- **events:read**: Read event information
- **events:write**: Create and update events
- **tickets:read**: Read ticket information
- **tickets:write**: Create and manage tickets
- **users:read**: Read user profiles
- **users:write**: Update user information
- **organizations:read**: Read organization data
- **organizations:write**: Manage organizations
- **analytics:read**: Access analytics data
- **admin**: Full administrative access

## 🔑 API Key Authentication

### API Key Generation
```bash
# Generate API key
curl -X POST https://api.bilten.com/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "permissions": ["events:read", "events:write"],
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

### Using API Keys
```bash
# Make request with API key
curl -X GET https://api.bilten.com/api/v1/events \
  -H "X-API-Key: bilten_live_1234567890abcdef"
```

### API Key Management
```bash
# List API keys
curl -X GET https://api.bilten.com/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Revoke API key
curl -X DELETE https://api.bilten.com/api/v1/api-keys/key_id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 👥 Role-Based Access Control (RBAC)

### User Roles

#### Platform Admin
- Full system access
- User management
- System configuration
- Analytics access

#### Organization Admin
- Organization management
- Event creation and management
- User invitation and management
- Financial reporting

#### Event Organizer
- Event creation and management
- Ticket management
- Attendee management
- Basic analytics

#### Event Manager
- Event management (assigned events)
- Ticket management
- Attendee support

#### Attendee
- View events
- Purchase tickets
- Manage personal information
- View ticket history

### Permission System
```javascript
// Permission structure
const permissions = {
  // Event permissions
  'events:read': 'Read event information',
  'events:write': 'Create and update events',
  'events:delete': 'Delete events',
  'events:publish': 'Publish events',
  
  // Ticket permissions
  'tickets:read': 'Read ticket information',
  'tickets:write': 'Create and update tickets',
  'tickets:delete': 'Delete tickets',
  'tickets:refund': 'Process refunds',
  
  // User permissions
  'users:read': 'Read user profiles',
  'users:write': 'Update user information',
  'users:delete': 'Delete users',
  
  // Organization permissions
  'organizations:read': 'Read organization data',
  'organizations:write': 'Update organization data',
  'organizations:delete': 'Delete organizations',
  
  // Analytics permissions
  'analytics:read': 'Access analytics data',
  'analytics:export': 'Export analytics data'
};
```

### Permission Checking
```javascript
// Check user permissions
const hasPermission = (user, permission) => {
  return user.permissions.includes(permission) || 
         user.permissions.includes('admin');
};

// Check role permissions
const hasRole = (user, role) => {
  return user.roles.includes(role);
};
```

## 🔒 Security Best Practices

### Token Security
```javascript
// Secure token storage
const secureTokenStorage = {
  // Store tokens in memory (not localStorage)
  accessToken: null,
  refreshToken: null,
  
  // Set tokens
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  },
  
  // Clear tokens on logout
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }
};
```

### Token Refresh Strategy
```javascript
// Automatic token refresh
class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshTimeout = null;
  }
  
  async refreshTokenIfNeeded() {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }
  }
  
  isTokenExpired() {
    if (!this.accessToken) return true;
    
    const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  }
  
  async refreshToken() {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: this.refreshToken
      })
    });
    
    const data = await response.json();
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
  }
}
```

### Error Handling
```javascript
// Handle authentication errors
const handleAuthError = (error) => {
  switch (error.status) {
    case 401:
      // Unauthorized - redirect to login
      redirectToLogin();
      break;
    case 403:
      // Forbidden - insufficient permissions
      showPermissionError();
      break;
    case 429:
      // Rate limited
      showRateLimitError();
      break;
    default:
      // Other errors
      showGenericError();
  }
};
```

## 📋 Authentication Examples

### JavaScript/Node.js
```javascript
const BiltenAPI = require('@bilten/api');

// Initialize with API key
const client = new BiltenAPI({
  apiKey: 'your-api-key'
});

// Or initialize with OAuth tokens
const client = new BiltenAPI({
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  onTokenRefresh: (newTokens) => {
    // Handle token refresh
    console.log('Tokens refreshed:', newTokens);
  }
});

// Make authenticated request
const events = await client.events.list();
```

### Python
```python
from bilten_api import BiltenAPI

# Initialize with API key
client = BiltenAPI(api_key='your-api-key')

# Or initialize with OAuth tokens
client = BiltenAPI(
    access_token='your-access-token',
    refresh_token='your-refresh-token'
)

# Make authenticated request
events = client.events.list()
```

### PHP
```php
use Bilten\API\Client;

// Initialize with API key
$client = new Client('your-api-key');

// Or initialize with OAuth tokens
$client = new Client([
    'access_token' => 'your-access-token',
    'refresh_token' => 'your-refresh-token'
]);

// Make authenticated request
$events = $client->events->list();
```

## 🔧 Configuration

### Environment Variables
```bash
# Authentication configuration
BILTEN_API_KEY=your-api-key
BILTEN_CLIENT_ID=your-oauth-client-id
BILTEN_CLIENT_SECRET=your-oauth-client-secret
BILTEN_REDIRECT_URI=https://your-app.com/callback
```

### SDK Configuration
```javascript
// SDK configuration
const config = {
  apiKey: process.env.BILTEN_API_KEY,
  clientId: process.env.BILTEN_CLIENT_ID,
  clientSecret: process.env.BILTEN_CLIENT_SECRET,
  redirectUri: process.env.BILTEN_REDIRECT_URI,
  environment: 'production', // or 'sandbox'
  timeout: 30000,
  retries: 3
};
```

## 📞 Troubleshooting

### Common Issues

#### Token Expired
```javascript
// Handle token expiration
if (error.code === 'TOKEN_EXPIRED') {
  await refreshToken();
  // Retry original request
}
```

#### Invalid API Key
```javascript
// Check API key format
const isValidApiKey = (apiKey) => {
  return /^bilten_(live|test)_[a-zA-Z0-9]{32}$/.test(apiKey);
};
```

#### Rate Limited
```javascript
// Handle rate limiting
if (error.code === 'RATE_LIMITED') {
  const retryAfter = error.headers['retry-after'];
  setTimeout(() => {
    // Retry request
  }, retryAfter * 1000);
}
```

### Support Resources
- **Authentication FAQ**: [FAQ](./faq.md)
- **Error Codes**: [Error Reference](./errors.md)
- **Support Email**: auth-support@bilten.com

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: Security Team

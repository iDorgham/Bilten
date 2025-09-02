# OAuth Integration Implementation

## Overview

The Bilten platform now includes comprehensive OAuth integration supporting Google, Facebook, Apple, and LinkedIn authentication. This implementation allows users to register and authenticate using their social media accounts, providing a seamless user experience while maintaining security best practices.

## Supported Providers

### Google OAuth 2.0
- **Scopes**: `openid email profile`
- **User Info**: Name, email, profile picture, email verification status
- **Configuration**: Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Facebook OAuth 2.0
- **Scopes**: `email public_profile`
- **User Info**: Name, email, profile picture
- **Configuration**: Requires `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`

### Apple Sign In
- **Scopes**: `name email`
- **User Info**: Name, email (from ID token)
- **Configuration**: Requires `APPLE_CLIENT_ID` and `APPLE_CLIENT_SECRET`
- **Special Features**: Uses `form_post` response mode

### LinkedIn OAuth 2.0
- **Scopes**: `r_liteprofile r_emailaddress`
- **User Info**: Name, email, profile picture
- **Configuration**: Requires `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`

## Architecture

### Core Components

1. **OAuthConfigService**: Manages provider configurations and validation
2. **SocialAuthService**: Handles OAuth flows and user management
3. **OAuth Routes**: RESTful API endpoints for OAuth operations
4. **Database Schema**: Social accounts and user integration

### Database Schema

The OAuth integration uses the following database tables:

```sql
-- Social accounts table
authentication.social_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users.users(id),
  provider VARCHAR(50) CHECK (provider IN ('google', 'facebook', 'apple', 'linkedin')),
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(200),
  avatar VARCHAR(500),
  connected_at TIMESTAMP WITH TIME ZONE
);

-- User activity logging
authentication.user_activity (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users.users(id),
  activity_type VARCHAR(50),
  success BOOLEAN,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE
);
```

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# OAuth Configuration
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Apple OAuth
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# OAuth Settings
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `{API_BASE_URL}/api/auth/social/google/callback`

#### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure Valid OAuth Redirect URIs: `{API_BASE_URL}/api/auth/social/facebook/callback`

#### Apple Sign In Setup
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a new App ID with Sign In with Apple capability
3. Create a Services ID for web authentication
4. Configure return URLs: `{API_BASE_URL}/api/auth/social/apple/callback`

#### LinkedIn OAuth Setup
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add Sign In with LinkedIn product
4. Configure Authorized redirect URLs: `{API_BASE_URL}/api/auth/social/linkedin/callback`

## API Endpoints

### Get Available Providers
```http
GET /api/v1/auth/oauth/providers
```

**Response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "key": "google",
        "name": "Google",
        "enabled": true
      },
      {
        "key": "facebook",
        "name": "Facebook",
        "enabled": true
      }
    ]
  },
  "message": "OAuth providers retrieved successfully"
}
```

### Get Authorization URL
```http
GET /api/v1/auth/oauth/:provider?state=csrf-token&redirect_uri=callback-url
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
  },
  "message": "OAuth authorization URL generated for google"
}
```

### OAuth Callback
```http
GET /api/v1/auth/oauth/:provider/callback?code=auth-code&state=csrf-token
```

**Response:** Redirects to frontend with tokens:
```
{FRONTEND_URL}/oauth/callback?access_token=...&refresh_token=...&user_id=...&provider=google&is_new_user=false
```

### Connect OAuth Account
```http
POST /api/v1/auth/oauth/:provider/connect
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "code": "authorization-code"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "socialAccount": {
      "id": "social-account-id",
      "provider": "google",
      "email": "user@gmail.com",
      "display_name": "John Doe"
    }
  },
  "message": "google account connected successfully"
}
```

### Disconnect OAuth Account
```http
DELETE /api/v1/auth/oauth/:provider/disconnect
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "google account unlinked successfully"
}
```

### Get Connected Accounts
```http
GET /api/v1/auth/oauth/accounts
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "provider": "google",
        "provider_id": "google-123",
        "email": "user@gmail.com",
        "display_name": "John Doe",
        "avatar": "https://example.com/avatar.jpg",
        "connected_at": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "message": "OAuth accounts retrieved successfully"
}
```

## Usage Examples

### Frontend Integration

#### React Example
```javascript
// Get available providers
const getProviders = async () => {
  const response = await fetch('/api/v1/auth/oauth/providers');
  const data = await response.json();
  return data.data.providers;
};

// Initiate OAuth flow
const initiateOAuth = async (provider) => {
  const state = generateCSRFToken();
  const response = await fetch(`/api/v1/auth/oauth/${provider}?state=${state}`);
  const data = await response.json();
  
  // Redirect user to OAuth provider
  window.location.href = data.data.authUrl;
};

// Handle OAuth callback
const handleOAuthCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');
  const userId = urlParams.get('user_id');
  const isNewUser = urlParams.get('is_new_user') === 'true';
  
  if (accessToken) {
    // Store tokens and redirect to dashboard
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    if (isNewUser) {
      // Redirect to onboarding
      window.location.href = '/onboarding';
    } else {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  }
};
```

### Backend Service Usage

```javascript
const SocialAuthService = require('./services/SocialAuthService');

// Initialize service
const socialAuthService = new SocialAuthService();

// Check if provider is supported
if (socialAuthService.isProviderSupported('google')) {
  // Generate authorization URL
  const authUrl = socialAuthService.getAuthorizationUrl('google', 'csrf-token');
  
  // Handle OAuth callback
  const result = await socialAuthService.handleOAuthCallback('google', 'auth-code', 'csrf-token');
  
  // Result contains user, socialAccount, and isNewUser
  console.log('User:', result.user);
  console.log('Is new user:', result.isNewUser);
}
```

## Security Features

### CSRF Protection
- State parameter validation for all OAuth flows
- Secure token generation and verification

### Token Security
- JWT tokens with appropriate expiration times
- Secure token storage and transmission
- Token revocation support

### User Data Protection
- Minimal data collection from OAuth providers
- Secure storage of social account information
- GDPR-compliant data handling

### Activity Logging
- Comprehensive logging of OAuth activities
- Security event tracking
- Audit trail for compliance

## Error Handling

### Common Error Scenarios

1. **Provider Not Configured**
   - Error: `OAuth provider {provider} is not configured or disabled`
   - Solution: Configure provider credentials in environment variables

2. **Invalid Authorization Code**
   - Error: `Failed to exchange authorization code for access token`
   - Solution: Ensure callback URL matches configured redirect URI

3. **User Cancellation**
   - Redirect: `{FRONTEND_URL}/login?error=oauth_cancelled`
   - Handling: Show appropriate message to user

4. **Account Already Linked**
   - Error: `This {provider} account is already linked to another user`
   - Solution: User needs to unlink from other account first

### Error Response Format

```json
{
  "error": "OAuth authentication failed",
  "message": "Detailed error description",
  "code": "OAUTH_ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456"
}
```

## Testing

### Unit Tests
Run OAuth integration tests:
```bash
npm test -- --testPathPattern=OAuthIntegration.test.js
```

### Route Tests
Run OAuth route tests:
```bash
npm test -- --testPathPattern=oauth.routes.test.js
```

### Manual Testing
1. Configure OAuth providers in development environment
2. Test authorization URL generation
3. Test OAuth callback handling
4. Test account linking/unlinking
5. Test error scenarios

## Monitoring and Analytics

### Metrics to Track
- OAuth authentication success/failure rates
- Provider usage statistics
- User registration via OAuth
- Account linking activities

### Logging
- All OAuth activities are logged with appropriate detail
- Security events are tracked for audit purposes
- Performance metrics for OAuth flows

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Ensure callback URLs match exactly in provider configuration
   - Check for trailing slashes and protocol differences

2. **Invalid Client Credentials**
   - Verify client ID and secret are correct
   - Check environment variable names and values

3. **Scope Issues**
   - Ensure requested scopes are approved by provider
   - Check provider-specific scope requirements

4. **Token Validation Failures**
   - Verify token format and expiration
   - Check JWT signing configuration

### Debug Mode
Enable debug logging by setting `LOG_LEVEL=debug` in environment variables.

## Future Enhancements

### Planned Features
1. Additional OAuth providers (Twitter, GitHub, Microsoft)
2. Enhanced user profile synchronization
3. OAuth token refresh automation
4. Advanced security features (device fingerprinting)
5. OAuth provider analytics dashboard

### Migration Path
The current implementation is designed to be extensible. New providers can be added by:
1. Adding provider configuration to `OAuthConfigService`
2. Implementing provider-specific user info handling
3. Adding provider to database constraints
4. Creating provider-specific tests

## Compliance

### GDPR Compliance
- User consent for data collection
- Right to data portability
- Right to erasure (account deletion)
- Data minimization principles

### Security Standards
- OAuth 2.0 specification compliance
- PKCE support for enhanced security
- Secure token storage and transmission
- Regular security audits and updates

This OAuth integration provides a robust, secure, and user-friendly authentication system that enhances the Bilten platform's accessibility while maintaining high security standards.
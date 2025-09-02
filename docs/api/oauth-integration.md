# OAuth Integration Documentation

This document provides comprehensive information about the OAuth integration implementation for Google, Facebook, and Apple authentication in the Bilten platform.

## Overview

The OAuth integration allows users to authenticate using their existing accounts from Google, Facebook, and Apple, providing a seamless and secure authentication experience.

### Supported Providers
- **Google OAuth 2.0**: Full integration with Google Sign-In
- **Facebook OAuth 2.0**: Facebook Login integration
- **Apple Sign-In**: Apple ID authentication

## Architecture

### Backend Components
- **OAuthService**: Core service handling OAuth flows
- **OAuth Routes**: API endpoints for OAuth operations
- **Database**: OAuth accounts table for storing provider connections

### Frontend Components
- **OAuthButtons**: Login buttons for each provider
- **OAuthCallback**: Handles OAuth callback responses
- **Integration**: Seamless integration with existing auth flow

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret

# API Configuration
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### 2. Database Migration

Run the OAuth database migration:

```bash
npm run db:migrate
```

This creates:
- `authentication.oauth_accounts` table
- Adds OAuth columns to `users.users` table

### 3. Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/v1/auth/oauth/google/callback` (development)
   - `https://yourdomain.com/api/v1/auth/oauth/google/callback` (production)

#### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth settings
5. Add redirect URIs:
   - `http://localhost:3001/api/v1/auth/oauth/facebook/callback` (development)
   - `https://yourdomain.com/api/v1/auth/oauth/facebook/callback` (production)

#### Apple Sign-In Setup
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create App ID with Sign In capability
3. Create Service ID
4. Configure domains and redirect URLs
5. Generate private key for client secret

## API Endpoints

### OAuth Authorization
```
GET /api/v1/auth/oauth/:provider
```
Get OAuth authorization URL for the specified provider.

**Parameters:**
- `provider`: google, facebook, or apple
- `state`: Optional state parameter for security

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  },
  "message": "OAuth authorization URL generated for google"
}
```

### OAuth Callback
```
GET /api/v1/auth/oauth/:provider/callback
```
Handle OAuth callback from providers.

**Parameters:**
- `code`: Authorization code from provider
- `state`: State parameter (if provided)
- `error`: Error code (if authentication failed)

### Connect OAuth Account
```
POST /api/v1/auth/oauth/:provider/connect
```
Connect OAuth account to existing user account.

**Headers:**
- `Authorization: Bearer <access_token>`

**Body:**
```json
{
  "code": "authorization_code_from_provider"
}
```

### Disconnect OAuth Account
```
DELETE /api/v1/auth/oauth/:provider/disconnect
```
Disconnect OAuth account from user.

**Headers:**
- `Authorization: Bearer <access_token>`

### Get Connected Accounts
```
GET /api/v1/auth/oauth/accounts
```
Get user's connected OAuth accounts.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "provider": "google",
        "provider_user_id": "123456789",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "picture_url": "https://...",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## Frontend Integration

### OAuth Buttons Component

```jsx
import OAuthButtons from '../components/OAuthButtons';

function LoginPage() {
  return (
    <div>
      <h1>Sign In</h1>
      <OAuthButtons 
        onSuccess={(user) => console.log('OAuth success:', user)}
        onError={(error) => console.error('OAuth error:', error)}
      />
    </div>
  );
}
```

### OAuth Callback Handling

The `OAuthCallback` component automatically handles:
- Token extraction from URL parameters
- User authentication
- Redirect to dashboard
- Error handling

## Security Features

### 1. State Parameter
- Prevents CSRF attacks
- Validates OAuth flow integrity

### 2. Token Validation
- Verifies OAuth tokens with providers
- Validates user information

### 3. Account Linking
- Links OAuth accounts to existing users
- Prevents duplicate accounts

### 4. Secure Storage
- OAuth tokens not stored in database
- Only user information stored securely

## User Flow

### New User OAuth Flow
1. User clicks OAuth button
2. Redirected to provider (Google/Facebook/Apple)
3. User authorizes application
4. Provider redirects back with code
5. Backend exchanges code for tokens
6. Backend gets user info from provider
7. New user account created
8. User redirected to dashboard

### Existing User OAuth Flow
1. User clicks OAuth button
2. Redirected to provider
3. User authorizes application
4. Provider redirects back with code
5. Backend exchanges code for tokens
6. Backend gets user info from provider
7. Existing user account linked
8. User redirected to dashboard

## Error Handling

### Common Errors
- `oauth_cancelled`: User cancelled OAuth flow
- `oauth_no_code`: No authorization code received
- `unsupported_provider`: Invalid OAuth provider
- `oauth_failed`: General OAuth failure

### Error Responses
```json
{
  "error": "OAuth authentication failed",
  "message": "Failed to exchange code for token"
}
```

## Testing

### Manual Testing
1. Test each OAuth provider flow
2. Verify account creation and linking
3. Test error scenarios
4. Validate token handling

### Automated Testing
```bash
# Run OAuth tests
npm run test:oauth
```

## Monitoring

### Logging
- OAuth authentication attempts
- Success/failure rates
- Error tracking
- User behavior analytics

### Metrics
- OAuth provider usage
- Conversion rates
- Error rates by provider
- User engagement

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**
   - Ensure redirect URIs match exactly
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **Missing Environment Variables**
   - Verify all OAuth environment variables are set
   - Check for typos in variable names

3. **Database Migration Issues**
   - Ensure migration ran successfully
   - Check database connection
   - Verify table structure

4. **CORS Issues**
   - Configure CORS for OAuth domains
   - Check frontend-backend communication

### Debug Mode
Enable debug logging:
```bash
DEBUG=oauth:* npm start
```

## Best Practices

1. **Security**
   - Always validate OAuth tokens
   - Use HTTPS in production
   - Implement proper error handling
   - Store minimal user data

2. **User Experience**
   - Provide clear error messages
   - Implement loading states
   - Handle edge cases gracefully
   - Maintain consistent UI

3. **Performance**
   - Cache OAuth provider responses
   - Optimize database queries
   - Implement proper timeouts
   - Monitor response times

## Future Enhancements

1. **Additional Providers**
   - GitHub OAuth
   - Twitter OAuth
   - LinkedIn OAuth

2. **Advanced Features**
   - OAuth account merging
   - Social login analytics
   - Custom OAuth providers
   - Multi-provider linking

3. **Security Improvements**
   - OAuth token refresh
   - Advanced fraud detection
   - Rate limiting
   - Audit logging

## Support

For OAuth integration support:
- Check the troubleshooting section
- Review error logs
- Test with provider documentation
- Contact development team

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)

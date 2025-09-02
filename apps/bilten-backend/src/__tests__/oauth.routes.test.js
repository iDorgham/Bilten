const request = require('supertest');
const express = require('express');
const oauthRoutes = require('../routes/oauth');

// Mock dependencies
jest.mock('../services/SocialAuthService');
jest.mock('../middleware/auth');

const SocialAuthService = require('../services/SocialAuthService');
const { authenticateToken } = require('../middleware/auth');

describe('OAuth Routes', () => {
  let app;
  let mockSocialAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth/oauth', oauthRoutes);

    // Mock SocialAuthService
    mockSocialAuthService = {
      isProviderSupported: jest.fn(),
      getAuthorizationUrl: jest.fn(),
      handleOAuthCallback: jest.fn(),
      exchangeCodeForToken: jest.fn(),
      getUserInfo: jest.fn(),
      linkSocialAccount: jest.fn(),
      unlinkSocialAccount: jest.fn(),
      getConnectedAccounts: jest.fn()
    };

    SocialAuthService.mockImplementation(() => mockSocialAuthService);

    // Mock auth middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'user-123' };
      next();
    });

    // Mock environment variables
    process.env.FRONTEND_URL = 'https://frontend.example.com';
    process.env.API_BASE_URL = 'https://api.example.com';
  });

  describe('GET /:provider', () => {
    it('should generate authorization URL for supported provider', async () => {
      mockSocialAuthService.isProviderSupported.mockReturnValue(true);
      mockSocialAuthService.getAuthorizationUrl.mockReturnValue('https://google.com/oauth/authorize?client_id=123');

      const response = await request(app)
        .get('/api/v1/auth/oauth/google')
        .query({ state: 'test-state' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { authUrl: 'https://google.com/oauth/authorize?client_id=123' },
        message: 'OAuth authorization URL generated for google'
      });

      expect(mockSocialAuthService.isProviderSupported).toHaveBeenCalledWith('google');
      expect(mockSocialAuthService.getAuthorizationUrl).toHaveBeenCalledWith('google', 'test-state', undefined);
    });

    it('should return error for unsupported provider', async () => {
      mockSocialAuthService.isProviderSupported.mockReturnValue(false);

      const response = await request(app)
        .get('/api/v1/auth/oauth/unsupported');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Unsupported OAuth provider');
    });
  });

  describe('GET /:provider/callback', () => {
    it('should handle successful OAuth callback', async () => {
      const mockAuthResult = {
        user: { id: 'user-123', email: 'user@example.com' },
        socialAccount: { id: 'social-123' },
        isNewUser: false
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      mockSocialAuthService.isProviderSupported.mockReturnValue(true);
      mockSocialAuthService.handleOAuthCallback.mockResolvedValue(mockAuthResult);

      // Mock AuthService
      const AuthService = require('../services/AuthService');
      AuthService.generateTokens = jest.fn().mockResolvedValue(mockTokens);

      const response = await request(app)
        .get('/api/v1/auth/oauth/google/callback')
        .query({ code: 'auth-code', state: 'test-state' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('https://frontend.example.com/oauth/callback');
      expect(response.headers.location).toContain('access_token=access-token');
      expect(response.headers.location).toContain('user_id=user-123');
      expect(response.headers.location).toContain('provider=google');
    });

    it('should redirect to frontend with error on OAuth error', async () => {
      const response = await request(app)
        .get('/api/v1/auth/oauth/google/callback')
        .query({ error: 'access_denied' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://frontend.example.com/login?error=oauth_cancelled');
    });

    it('should redirect to frontend with error when no code provided', async () => {
      const response = await request(app)
        .get('/api/v1/auth/oauth/google/callback');

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://frontend.example.com/login?error=oauth_no_code');
    });
  });

  describe('POST /:provider/connect', () => {
    it('should connect OAuth account to existing user', async () => {
      const mockSocialAccount = {
        id: 'social-123',
        provider: 'google',
        provider_id: 'google-123'
      };

      const mockTokenData = { access_token: 'access-token' };
      const mockUserInfo = { id: 'google-123', email: 'user@gmail.com' };

      mockSocialAuthService.isProviderSupported.mockReturnValue(true);
      mockSocialAuthService.exchangeCodeForToken.mockResolvedValue(mockTokenData);
      mockSocialAuthService.getUserInfo.mockResolvedValue(mockUserInfo);
      mockSocialAuthService.linkSocialAccount.mockResolvedValue(mockSocialAccount);

      const response = await request(app)
        .post('/api/v1/auth/oauth/google/connect')
        .send({ code: 'auth-code' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { socialAccount: mockSocialAccount },
        message: 'google account connected successfully'
      });

      expect(mockSocialAuthService.linkSocialAccount).toHaveBeenCalledWith('user-123', 'google', mockUserInfo);
    });

    it('should return validation error when code is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/oauth/google/connect')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /:provider/disconnect', () => {
    it('should disconnect OAuth account', async () => {
      const mockResult = {
        success: true,
        message: 'google account unlinked successfully'
      };

      mockSocialAuthService.isProviderSupported.mockReturnValue(true);
      mockSocialAuthService.unlinkSocialAccount.mockResolvedValue(mockResult);

      const response = await request(app)
        .delete('/api/v1/auth/oauth/google/disconnect');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);

      expect(mockSocialAuthService.unlinkSocialAccount).toHaveBeenCalledWith('user-123', 'google');
    });
  });

  describe('GET /accounts', () => {
    it('should get connected OAuth accounts', async () => {
      const mockAccounts = [
        { provider: 'google', email: 'user@gmail.com' },
        { provider: 'facebook', email: 'user@facebook.com' }
      ];

      mockSocialAuthService.getConnectedAccounts.mockResolvedValue(mockAccounts);

      const response = await request(app)
        .get('/api/v1/auth/oauth/accounts')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { accounts: mockAccounts },
        message: 'OAuth accounts retrieved successfully'
      });

      expect(mockSocialAuthService.getConnectedAccounts).toHaveBeenCalledWith('user-123');
    });
  });
});
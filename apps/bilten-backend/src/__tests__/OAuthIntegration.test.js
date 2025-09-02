const request = require('supertest');
const express = require('express');
const SocialAuthService = require('../services/SocialAuthService');
const OAuthConfigService = require('../services/OAuthConfigService');

// Mock dependencies
jest.mock('../database/connection');
jest.mock('../models/UserAccount');
jest.mock('../utils/logger');
jest.mock('axios');

const axios = require('axios');
const { query } = require('../database/connection');

describe('OAuth Integration', () => {
  let socialAuthService;
  let oauthConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.FACEBOOK_CLIENT_ID = 'facebook-client-id';
    process.env.FACEBOOK_CLIENT_SECRET = 'facebook-client-secret';
    process.env.APPLE_CLIENT_ID = 'apple-client-id';
    process.env.APPLE_CLIENT_SECRET = 'apple-client-secret';
    process.env.LINKEDIN_CLIENT_ID = 'linkedin-client-id';
    process.env.LINKEDIN_CLIENT_SECRET = 'linkedin-client-secret';
    process.env.API_BASE_URL = 'https://api.example.com';
    process.env.FRONTEND_URL = 'https://frontend.example.com';

    socialAuthService = new SocialAuthService();
    oauthConfigService = new OAuthConfigService();
  });

  describe('OAuthConfigService', () => {
    it('should identify enabled providers correctly', () => {
      const enabledProviders = oauthConfigService.getEnabledProviders();
      expect(enabledProviders).toEqual(['google', 'facebook', 'apple', 'linkedin']);
    });

    it('should generate correct authorization URL for Google', () => {
      const authUrl = oauthConfigService.generateAuthUrl('google', 'test-state', 'https://callback.example.com');
      
      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=google-client-id');
      expect(authUrl).toContain('redirect_uri=https%3A%2F%2Fcallback.example.com');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=openid+email+profile');
      expect(authUrl).toContain('state=test-state');
    });

    it('should generate correct authorization URL for Apple with response_mode', () => {
      const authUrl = oauthConfigService.generateAuthUrl('apple', 'test-state', 'https://callback.example.com');
      
      expect(authUrl).toContain('https://appleid.apple.com/auth/authorize');
      expect(authUrl).toContain('response_mode=form_post');
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        oauthConfigService.getProviderConfig('unsupported');
      }).toThrow('Unsupported OAuth provider: unsupported');
    });

    it('should validate provider configuration', () => {
      expect(() => {
        oauthConfigService.validateConfiguration();
      }).not.toThrow();
    });
  });

  describe('SocialAuthService', () => {
    it('should check if providers are supported', () => {
      expect(socialAuthService.isProviderSupported('google')).toBe(true);
      expect(socialAuthService.isProviderSupported('facebook')).toBe(true);
      expect(socialAuthService.isProviderSupported('apple')).toBe(true);
      expect(socialAuthService.isProviderSupported('linkedin')).toBe(true);
      expect(socialAuthService.isProviderSupported('unsupported')).toBe(false);
    });

    it('should generate authorization URL', () => {
      const authUrl = socialAuthService.getAuthorizationUrl('google', 'test-state');
      
      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=google-client-id');
    });

    it('should exchange code for token successfully', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600
        }
      };

      axios.post.mockResolvedValue(mockTokenResponse);

      const tokenData = await socialAuthService.exchangeCodeForToken('google', 'auth-code');
      
      expect(tokenData).toEqual(mockTokenResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          client_id: 'google-client-id',
          client_secret: 'google-client-secret',
          code: 'auth-code',
          grant_type: 'authorization_code'
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          timeout: 10000
        })
      );
    });

    it('should handle token exchange failure', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      await expect(
        socialAuthService.exchangeCodeForToken('google', 'auth-code')
      ).rejects.toThrow('Failed to exchange authorization code for access token');
    });

    it('should get Google user info', async () => {
      const mockUserResponse = {
        data: {
          id: 'google-123',
          email: 'user@gmail.com',
          given_name: 'John',
          family_name: 'Doe',
          name: 'John Doe',
          picture: 'https://example.com/avatar.jpg',
          verified_email: true
        }
      };

      axios.get.mockResolvedValue(mockUserResponse);

      const userInfo = await socialAuthService.getGoogleUserInfo('access-token');
      
      expect(userInfo).toEqual(mockUserResponse.data);
      expect(axios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: 'Bearer access-token' },
          timeout: 10000
        }
      );
    });

    it('should get Facebook user info', async () => {
      const mockUserResponse = {
        data: {
          id: 'facebook-123',
          name: 'John Doe',
          email: 'user@facebook.com',
          picture: {
            data: {
              url: 'https://example.com/avatar.jpg'
            }
          }
        }
      };

      axios.get.mockResolvedValue(mockUserResponse);

      const userInfo = await socialAuthService.getFacebookUserInfo('access-token');
      
      expect(userInfo).toEqual(mockUserResponse.data);
      expect(axios.get).toHaveBeenCalledWith(
        'https://graph.facebook.com/me',
        {
          params: {
            fields: 'id,name,email,picture.type(large)',
            access_token: 'access-token'
          },
          timeout: 10000
        }
      );
    });

    it('should normalize user info correctly for Google', () => {
      const googleUserInfo = {
        id: 'google-123',
        email: 'user@gmail.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
        picture: 'https://example.com/avatar.jpg',
        verified_email: true
      };

      const normalized = socialAuthService.normalizeUserInfo('google', googleUserInfo);
      
      expect(normalized).toEqual({
        id: 'google-123',
        email: 'user@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
        emailVerified: true
      });
    });

    it('should normalize user info correctly for Facebook', () => {
      const facebookUserInfo = {
        id: 'facebook-123',
        name: 'John Doe',
        email: 'user@facebook.com',
        picture: {
          data: {
            url: 'https://example.com/avatar.jpg'
          }
        }
      };

      const normalized = socialAuthService.normalizeUserInfo('facebook', facebookUserInfo);
      
      expect(normalized).toEqual({
        id: 'facebook-123',
        email: 'user@facebook.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
        emailVerified: true
      });
    });

    it('should create social account successfully', async () => {
      const mockResult = {
        rows: [{
          id: 'social-account-123',
          user_id: 'user-123',
          provider: 'google',
          provider_id: 'google-123',
          email: 'user@gmail.com',
          display_name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
          connected_at: new Date()
        }]
      };

      query.mockResolvedValue(mockResult);

      const userInfo = {
        id: 'google-123',
        email: 'user@gmail.com',
        displayName: 'John Doe',
        avatar: 'https://example.com/avatar.jpg'
      };

      const socialAccount = await socialAuthService.createSocialAccount('user-123', 'google', userInfo);
      
      expect(socialAccount).toEqual(mockResult.rows[0]);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO authentication.social_accounts'),
        ['user-123', 'google', 'google-123', 'user@gmail.com', 'John Doe', 'https://example.com/avatar.jpg']
      );
    });

    it('should find user by social account', async () => {
      const mockResult = {
        rows: [{
          id: 'user-123',
          email: 'user@gmail.com',
          first_name: 'John',
          last_name: 'Doe'
        }]
      };

      query.mockResolvedValue(mockResult);

      const user = await socialAuthService.findUserBySocialAccount('google', 'google-123');
      
      expect(user).toEqual(mockResult.rows[0]);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN authentication.social_accounts sa ON u.id = sa.user_id'),
        ['google', 'google-123']
      );
    });

    it('should get connected accounts', async () => {
      const mockResult = {
        rows: [
          {
            provider: 'google',
            provider_id: 'google-123',
            email: 'user@gmail.com',
            display_name: 'John Doe',
            avatar: 'https://example.com/avatar.jpg',
            connected_at: new Date()
          }
        ]
      };

      query.mockResolvedValue(mockResult);

      const accounts = await socialAuthService.getConnectedAccounts('user-123');
      
      expect(accounts).toEqual(mockResult.rows);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM authentication.social_accounts'),
        ['user-123']
      );
    });

    it('should unlink social account', async () => {
      const mockResult = {
        rows: [{
          id: 'social-account-123',
          provider: 'google'
        }]
      };

      query.mockResolvedValue(mockResult);

      const result = await socialAuthService.unlinkSocialAccount('user-123', 'google');
      
      expect(result).toEqual({
        success: true,
        message: 'google account unlinked successfully'
      });
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM authentication.social_accounts WHERE user_id = $1 AND provider = $2 RETURNING *',
        ['user-123', 'google']
      );
    });
  });

  describe('OAuth Flow Integration', () => {
    it('should handle token exchange and user info retrieval', async () => {
      // Mock token exchange
      const mockTokenResponse = {
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token'
        }
      };

      // Mock user info response
      const mockUserResponse = {
        data: {
          id: 'google-123',
          email: 'user@gmail.com',
          given_name: 'John',
          family_name: 'Doe',
          name: 'John Doe',
          picture: 'https://example.com/avatar.jpg',
          verified_email: true
        }
      };

      axios.post.mockResolvedValue(mockTokenResponse);
      axios.get.mockResolvedValue(mockUserResponse);

      // Test token exchange
      const tokenData = await socialAuthService.exchangeCodeForToken('google', 'auth-code');
      expect(tokenData).toEqual(mockTokenResponse.data);

      // Test user info retrieval
      const userInfo = await socialAuthService.getUserInfo('google', 'access-token');
      expect(userInfo).toEqual({
        id: 'google-123',
        email: 'user@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
        emailVerified: true
      });
    });
  });
});
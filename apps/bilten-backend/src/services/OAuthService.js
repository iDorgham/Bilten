const axios = require('axios');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const AuthService = require('./AuthService');

class OAuthService {
  constructor() {
    this.providers = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      },
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET
      }
    };
  }

  getAuthorizationUrl(provider, state) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: `${process.env.API_BASE_URL}/auth/oauth/${provider}/callback`,
      response_type: 'code',
      scope: this.getScope(provider),
      state: state
    });

    const baseUrl = this.getAuthUrl(provider);
    return `${baseUrl}?${params.toString()}`;
  }

  getAuthUrl(provider) {
    switch (provider) {
      case 'google': return 'https://accounts.google.com/o/oauth2/v2/auth';
      case 'facebook': return 'https://www.facebook.com/v18.0/dialog/oauth';
      case 'apple': return 'https://appleid.apple.com/auth/authorize';
      default: throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  getScope(provider) {
    switch (provider) {
      case 'google': return 'openid email profile';
      case 'facebook': return 'email public_profile';
      case 'apple': return 'name email';
      default: return 'email';
    }
  }

  async authenticateOAuth(provider, code, state) {
    try {
      const tokenData = await this.exchangeCodeForToken(provider, code);
      const userInfo = await this.getUserInfo(provider, tokenData.access_token);
      const user = await this.findOrCreateUser(userInfo);
      const tokens = await AuthService.generateTokens(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified
        },
        ...tokens
      };
    } catch (error) {
      logger.error('OAuth authentication failed', { provider, error: error.message });
      throw error;
    }
  }

  async exchangeCodeForToken(provider, code) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    const tokenData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.API_BASE_URL}/auth/oauth/${provider}/callback`
    };

    try {
      const response = await axios.post(this.getTokenUrl(provider), tokenData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to exchange code for token');
    }
  }

  getTokenUrl(provider) {
    switch (provider) {
      case 'google': return 'https://oauth2.googleapis.com/token';
      case 'facebook': return 'https://graph.facebook.com/v18.0/oauth/access_token';
      case 'apple': return 'https://appleid.apple.com/auth/token';
      default: throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async getUserInfo(provider, accessToken) {
    try {
      let userInfo;
      switch (provider) {
        case 'google':
          userInfo = await this.getGoogleUserInfo(accessToken);
          break;
        case 'facebook':
          userInfo = await this.getFacebookUserInfo(accessToken);
          break;
        case 'apple':
          userInfo = await this.getAppleUserInfo(accessToken);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      return this.normalizeUserInfo(provider, userInfo);
    } catch (error) {
      throw error;
    }
  }

  async getGoogleUserInfo(accessToken) {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  }

  async getFacebookUserInfo(accessToken) {
    const response = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken
      }
    });
    return response.data;
  }

  async getAppleUserInfo(accessToken) {
    const decoded = require('jsonwebtoken').decode(accessToken);
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name || {}
    };
  }

  normalizeUserInfo(provider, userInfo) {
    const normalized = {
      provider,
      providerId: userInfo.id,
      email: userInfo.email,
      firstName: '',
      lastName: '',
      picture: null
    };

    switch (provider) {
      case 'google':
        normalized.firstName = userInfo.given_name || '';
        normalized.lastName = userInfo.family_name || '';
        normalized.picture = userInfo.picture;
        break;
      case 'facebook':
        const nameParts = (userInfo.name || '').split(' ');
        normalized.firstName = nameParts[0] || '';
        normalized.lastName = nameParts.slice(1).join(' ') || '';
        normalized.picture = userInfo.picture?.data?.url;
        break;
      case 'apple':
        normalized.firstName = userInfo.name?.firstName || '';
        normalized.lastName = userInfo.name?.lastName || '';
        break;
    }

    return normalized;
  }

  async findOrCreateUser(oauthData) {
    let user = await this.findUserByOAuthId(oauthData.provider, oauthData.providerId);
    
    if (!user) {
      user = await this.findUserByEmail(oauthData.email);
      
      if (user) {
        await this.linkOAuthToUser(user.id, oauthData);
      } else {
        user = await this.createUserFromOAuth(oauthData);
      }
    }

    return user;
  }

  async findUserByOAuthId(provider, providerId) {
    const result = await query(
      `SELECT u.* FROM users.users u
       JOIN authentication.oauth_accounts oa ON u.id = oa.user_id
       WHERE oa.provider = $1 AND oa.provider_user_id = $2`,
      [provider, providerId]
    );
    return result.rows[0] || null;
  }

  async findUserByEmail(email) {
    const result = await query(
      'SELECT * FROM users.users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async linkOAuthToUser(userId, oauthData) {
    await query(
      `INSERT INTO authentication.oauth_accounts 
       (user_id, provider, provider_user_id, email, first_name, last_name, picture_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (provider, provider_user_id) DO UPDATE SET
       email = EXCLUDED.email, updated_at = NOW()`,
      [userId, oauthData.provider, oauthData.providerId, oauthData.email, 
       oauthData.firstName, oauthData.lastName, oauthData.picture]
    );
  }

  async createUserFromOAuth(oauthData) {
    const userResult = await query(
      `INSERT INTO users.users 
       (email, first_name, last_name, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [oauthData.email, oauthData.firstName, oauthData.lastName, true]
    );

    const user = userResult.rows[0];

    await query(
      `INSERT INTO authentication.oauth_accounts 
       (user_id, provider, provider_user_id, email, first_name, last_name, picture_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [user.id, oauthData.provider, oauthData.providerId, oauthData.email,
       oauthData.firstName, oauthData.lastName, oauthData.picture]
    );

    return user;
  }

  async disconnectOAuth(userId, provider) {
    try {
      await query(
        'DELETE FROM authentication.oauth_accounts WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );
      return { success: true, message: 'OAuth account disconnected successfully' };
    } catch (error) {
      throw error;
    }
  }

  async getConnectedAccounts(userId) {
    try {
      const result = await query(
        'SELECT provider, provider_user_id, email, first_name, last_name, picture_url, created_at FROM authentication.oauth_accounts WHERE user_id = $1',
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OAuthService();

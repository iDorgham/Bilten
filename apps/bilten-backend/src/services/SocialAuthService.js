const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const UserAccount = require('../models/UserAccount');
const { logger } = require('../utils/logger');
const OAuthConfigService = require('./OAuthConfigService');

/**
 * Social Authentication Service
 * 
 * Handles OAuth integration with Google, Facebook, Apple, and LinkedIn
 * Implements social account linking and profile synchronization
 * Supports user registration and authentication via social providers
 */
class SocialAuthService {
  constructor() {
    this.userAccount = new UserAccount();
    this.oauthConfig = new OAuthConfigService();
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} provider - OAuth provider (google, facebook, apple, linkedin)
   * @param {string} state - CSRF protection state parameter
   * @param {string} redirectUri - Callback URL
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(provider, state, redirectUri) {
    if (!this.isProviderSupported(provider)) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    const defaultRedirectUri = `${process.env.API_BASE_URL}/api/auth/social/${provider}/callback`;
    return this.oauthConfig.generateAuthUrl(provider, state, redirectUri || defaultRedirectUri);
  }

  /**
   * Handle OAuth callback and authenticate user
   * @param {string} provider - OAuth provider
   * @param {string} code - Authorization code
   * @param {string} state - State parameter for CSRF protection
   * @param {string} redirectUri - Callback URL
   * @returns {Promise<Object>} Authentication result
   */
  async handleOAuthCallback(provider, code, state, redirectUri) {
    try {
      // Exchange authorization code for access token
      const tokenData = await this.exchangeCodeForToken(provider, code, redirectUri);
      
      // Get user information from provider
      const userInfo = await this.getUserInfo(provider, tokenData.access_token);
      
      // Find or create user account
      const result = await this.findOrCreateUser(provider, userInfo);
      
      // Log social authentication activity
      await this.logSocialAuthActivity(result.user.id, 'social_login', {
        success: true,
        provider,
        provider_id: userInfo.id,
        is_new_user: result.isNewUser
      });

      logger.info('Social authentication successful', {
        userId: result.user.id,
        provider,
        providerId: userInfo.id,
        isNewUser: result.isNewUser
      });

      return {
        user: result.user,
        socialAccount: result.socialAccount,
        isNewUser: result.isNewUser,
        message: result.isNewUser ? 'Account created successfully' : 'Login successful'
      };

    } catch (error) {
      logger.error('Social authentication failed', {
        provider,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   * @param {string} provider - OAuth provider
   * @param {string} code - Authorization code
   * @param {string} redirectUri - Callback URL
   * @returns {Promise<Object>} Token data
   */
  async exchangeCodeForToken(provider, code, redirectUri) {
    const config = this.oauthConfig.getProviderConfig(provider);
    const defaultRedirectUri = `${process.env.API_BASE_URL}/api/auth/social/${provider}/callback`;
    const tokenData = this.oauthConfig.getTokenExchangeData(provider, code, redirectUri || defaultRedirectUri);

    try {
      const response = await axios.post(config.tokenUrl, tokenData, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.data.access_token) {
        throw new Error('No access token received from provider');
      }

      logger.info('Successfully exchanged code for token', {
        provider,
        hasAccessToken: !!response.data.access_token,
        hasRefreshToken: !!response.data.refresh_token
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to exchange code for token', {
        provider,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw new Error(`Failed to exchange authorization code for access token: ${error.message}`);
    }
  }

  /**
   * Get user information from OAuth provider
   * @param {string} provider - OAuth provider
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} User information
   */
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
        case 'linkedin':
          userInfo = await this.getLinkedInUserInfo(accessToken);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      return this.normalizeUserInfo(provider, userInfo);
    } catch (error) {
      logger.error('Failed to get user info from provider', {
        provider,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get Google user information
   * @param {string} accessToken - Google access token
   * @returns {Promise<Object>} Google user data
   */
  async getGoogleUserInfo(accessToken) {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000
    });
    return response.data;
  }

  /**
   * Get Facebook user information
   * @param {string} accessToken - Facebook access token
   * @returns {Promise<Object>} Facebook user data
   */
  async getFacebookUserInfo(accessToken) {
    const response = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture.type(large)',
        access_token: accessToken
      },
      timeout: 10000
    });
    return response.data;
  }

  /**
   * Get Apple user information (from ID token)
   * @param {string} idToken - Apple ID token
   * @returns {Promise<Object>} Apple user data
   */
  async getAppleUserInfo(idToken) {
    try {
      // Apple provides user info in the ID token
      const decoded = jwt.decode(idToken);
      return {
        id: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified,
        name: decoded.name || {}
      };
    } catch (error) {
      throw new Error('Failed to decode Apple ID token');
    }
  }

  /**
   * Get LinkedIn user information
   * @param {string} accessToken - LinkedIn access token
   * @returns {Promise<Object>} LinkedIn user data
   */
  async getLinkedInUserInfo(accessToken) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    
    try {
      // Get profile information
      const profileResponse = await axios.get('https://api.linkedin.com/v2/people/~:(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))', {
        headers,
        timeout: 10000
      });

      // Get email address
      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers,
        timeout: 10000
      });

      const profile = profileResponse.data;
      const email = emailResponse.data.elements?.[0]?.['handle~']?.emailAddress;

      return {
        id: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        email: email,
        picture: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
      };
    } catch (error) {
      logger.error('Failed to get LinkedIn user info', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`Failed to get LinkedIn user information: ${error.message}`);
    }
  }

  /**
   * Normalize user information from different providers
   * @param {string} provider - OAuth provider
   * @param {Object} userInfo - Raw user info from provider
   * @returns {Object} Normalized user information
   */
  normalizeUserInfo(provider, userInfo) {
    const normalized = {
      id: userInfo.id,
      email: userInfo.email,
      firstName: '',
      lastName: '',
      displayName: '',
      avatar: null,
      emailVerified: false
    };

    switch (provider) {
      case 'google':
        normalized.firstName = userInfo.given_name || '';
        normalized.lastName = userInfo.family_name || '';
        normalized.displayName = userInfo.name || `${normalized.firstName} ${normalized.lastName}`.trim();
        normalized.avatar = userInfo.picture;
        normalized.emailVerified = userInfo.verified_email || false;
        break;
        
      case 'facebook':
        const nameParts = (userInfo.name || '').split(' ');
        normalized.firstName = nameParts[0] || '';
        normalized.lastName = nameParts.slice(1).join(' ') || '';
        normalized.displayName = userInfo.name || `${normalized.firstName} ${normalized.lastName}`.trim();
        normalized.avatar = userInfo.picture?.data?.url;
        normalized.emailVerified = true; // Facebook emails are pre-verified
        break;
        
      case 'apple':
        normalized.firstName = userInfo.name?.firstName || '';
        normalized.lastName = userInfo.name?.lastName || '';
        normalized.displayName = `${normalized.firstName} ${normalized.lastName}`.trim();
        normalized.emailVerified = userInfo.email_verified || false;
        break;
        
      case 'linkedin':
        normalized.firstName = userInfo.firstName || '';
        normalized.lastName = userInfo.lastName || '';
        normalized.displayName = `${normalized.firstName} ${normalized.lastName}`.trim();
        normalized.avatar = userInfo.picture;
        normalized.emailVerified = true; // LinkedIn emails are pre-verified
        break;
    }

    return normalized;
  }

  /**
   * Find existing user or create new one from social auth
   * @param {string} provider - OAuth provider
   * @param {Object} userInfo - Normalized user information
   * @returns {Promise<Object>} User and social account data
   */
  async findOrCreateUser(provider, userInfo) {
    try {
      // First, try to find user by social account
      let user = await this.findUserBySocialAccount(provider, userInfo.id);
      let socialAccount = null;
      let isNewUser = false;

      if (user) {
        // User exists with this social account, update social account info
        socialAccount = await this.updateSocialAccount(user.id, provider, userInfo);
      } else {
        // Check if user exists by email
        user = await this.userAccount.findByEmail(userInfo.email, false);
        
        if (user) {
          // User exists, link social account
          socialAccount = await this.createSocialAccount(user.id, provider, userInfo);
        } else {
          // Create new user and social account
          user = await this.createUserFromSocial(provider, userInfo);
          socialAccount = await this.createSocialAccount(user.id, provider, userInfo);
          isNewUser = true;
        }
      }

      return {
        user,
        socialAccount,
        isNewUser
      };
    } catch (error) {
      logger.error('Failed to find or create user from social auth', {
        provider,
        userInfo: { id: userInfo.id, email: userInfo.email },
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find user by social account
   * @param {string} provider - OAuth provider
   * @param {string} providerId - Provider user ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserBySocialAccount(provider, providerId) {
    try {
      const result = await query(
        `SELECT u.* FROM users.users u
         JOIN authentication.social_accounts sa ON u.id = sa.user_id
         WHERE sa.provider = $1 AND sa.provider_id = $2 AND u.deleted_at IS NULL`,
        [provider, providerId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by social account', {
        provider,
        providerId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create new user from social authentication
   * @param {string} provider - OAuth provider
   * @param {Object} userInfo - Normalized user information
   * @returns {Promise<Object>} Created user
   */
  async createUserFromSocial(provider, userInfo) {
    try {
      const userData = {
        email: userInfo.email.toLowerCase(),
        first_name: userInfo.firstName || 'User',
        last_name: userInfo.lastName || '',
        display_name: userInfo.displayName || `${userInfo.firstName} ${userInfo.lastName}`.trim() || 'User',
        avatar: userInfo.avatar,
        status: 'active',
        email_verified: userInfo.emailVerified,
        sso_provider: provider,
        sso_subject: userInfo.id,
        privacy_settings: {
          profile_visibility: 'private',
          email_notifications: true,
          marketing_emails: false
        },
        notification_preferences: {
          email: true,
          push: true,
          sms: false
        }
      };

      const user = await this.userAccount.create(userData);

      logger.info('User created from social authentication', {
        userId: user.id,
        provider,
        email: user.email
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user from social auth', {
        provider,
        userInfo: { id: userInfo.id, email: userInfo.email },
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create social account record
   * @param {string} userId - User ID
   * @param {string} provider - OAuth provider
   * @param {Object} userInfo - Normalized user information
   * @returns {Promise<Object>} Created social account
   */
  async createSocialAccount(userId, provider, userInfo) {
    try {
      const result = await query(
        `INSERT INTO authentication.social_accounts 
         (user_id, provider, provider_id, email, display_name, avatar, connected_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          userId,
          provider,
          userInfo.id,
          userInfo.email,
          userInfo.displayName,
          userInfo.avatar
        ]
      );

      const socialAccount = result.rows[0];

      logger.info('Social account created', {
        userId,
        provider,
        providerId: userInfo.id
      });

      return socialAccount;
    } catch (error) {
      logger.error('Failed to create social account', {
        userId,
        provider,
        providerId: userInfo.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update existing social account
   * @param {string} userId - User ID
   * @param {string} provider - OAuth provider
   * @param {Object} userInfo - Normalized user information
   * @returns {Promise<Object>} Updated social account
   */
  async updateSocialAccount(userId, provider, userInfo) {
    try {
      const result = await query(
        `UPDATE authentication.social_accounts 
         SET email = $3, display_name = $4, avatar = $5, connected_at = NOW()
         WHERE user_id = $1 AND provider = $2
         RETURNING *`,
        [
          userId,
          provider,
          userInfo.email,
          userInfo.displayName,
          userInfo.avatar
        ]
      );

      const socialAccount = result.rows[0];

      logger.info('Social account updated', {
        userId,
        provider,
        providerId: userInfo.id
      });

      return socialAccount;
    } catch (error) {
      logger.error('Failed to update social account', {
        userId,
        provider,
        providerId: userInfo.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Link social account to existing user
   * @param {string} userId - User ID
   * @param {string} provider - OAuth provider
   * @param {Object} userInfo - Normalized user information
   * @returns {Promise<Object>} Created social account
   */
  async linkSocialAccount(userId, provider, userInfo) {
    try {
      // Check if social account already exists for this provider
      const existingAccount = await query(
        'SELECT id FROM authentication.social_accounts WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );

      if (existingAccount.rows.length > 0) {
        throw new Error(`${provider} account is already linked to this user`);
      }

      // Check if this social account is linked to another user
      const linkedToOther = await query(
        'SELECT user_id FROM authentication.social_accounts WHERE provider = $1 AND provider_id = $2',
        [provider, userInfo.id]
      );

      if (linkedToOther.rows.length > 0 && linkedToOther.rows[0].user_id !== userId) {
        throw new Error(`This ${provider} account is already linked to another user`);
      }

      return await this.createSocialAccount(userId, provider, userInfo);
    } catch (error) {
      logger.error('Failed to link social account', {
        userId,
        provider,
        providerId: userInfo.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Unlink social account from user
   * @param {string} userId - User ID
   * @param {string} provider - OAuth provider
   * @returns {Promise<Object>} Result
   */
  async unlinkSocialAccount(userId, provider) {
    try {
      const result = await query(
        'DELETE FROM authentication.social_accounts WHERE user_id = $1 AND provider = $2 RETURNING *',
        [userId, provider]
      );

      if (result.rows.length === 0) {
        throw new Error(`No ${provider} account found to unlink`);
      }

      // Log social account unlinking
      await this.logSocialAuthActivity(userId, 'social_unlink', {
        success: true,
        provider
      });

      logger.info('Social account unlinked', {
        userId,
        provider
      });

      return {
        success: true,
        message: `${provider} account unlinked successfully`
      };
    } catch (error) {
      logger.error('Failed to unlink social account', {
        userId,
        provider,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user's connected social accounts
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of connected social accounts
   */
  async getConnectedAccounts(userId) {
    try {
      const result = await query(
        `SELECT provider, provider_id, email, display_name, avatar, connected_at
         FROM authentication.social_accounts 
         WHERE user_id = $1 
         ORDER BY connected_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get connected social accounts', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Synchronize user profile with social account data
   * @param {string} userId - User ID
   * @param {string} provider - OAuth provider
   * @param {Object} userInfo - Updated user information from provider
   * @returns {Promise<Object>} Updated user
   */
  async synchronizeProfile(userId, provider, userInfo) {
    try {
      // Update social account
      await this.updateSocialAccount(userId, provider, userInfo);

      // Update user profile if needed
      const user = await this.userAccount.findById(userId, false);
      if (!user) {
        throw new Error('User not found');
      }

      const updates = {};
      
      // Update avatar if not set or if social avatar is newer
      if (!user.avatar && userInfo.avatar) {
        updates.avatar = userInfo.avatar;
      }

      // Update display name if not set
      if (!user.display_name && userInfo.displayName) {
        updates.display_name = userInfo.displayName;
      }

      if (Object.keys(updates).length > 0) {
        const updatedUser = await this.userAccount.update(userId, updates);
        
        logger.info('User profile synchronized with social account', {
          userId,
          provider,
          updates: Object.keys(updates)
        });

        return updatedUser;
      }

      return user;
    } catch (error) {
      logger.error('Failed to synchronize profile with social account', {
        userId,
        provider,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Log social authentication activity
   * @param {string} userId - User ID
   * @param {string} activityType - Type of activity
   * @param {Object} metadata - Additional metadata
   */
  async logSocialAuthActivity(userId, activityType, metadata = {}) {
    try {
      await query(
        `INSERT INTO authentication.user_activity 
         (user_id, activity_type, success, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          activityType,
          metadata.success || false,
          JSON.stringify(metadata),
          metadata.ipAddress || null,
          metadata.userAgent || null
        ]
      );
    } catch (error) {
      logger.error('Failed to log social auth activity', {
        userId,
        activityType,
        error: error.message
      });
      // Don't throw error for logging failures
    }
  }

  /**
   * Validate OAuth provider
   * @param {string} provider - Provider name
   * @returns {boolean} Whether provider is supported
   */
  isProviderSupported(provider) {
    return this.oauthConfig.isProviderSupported(provider);
  }

  /**
   * Get provider configuration
   * @param {string} provider - Provider name
   * @returns {Object} Provider configuration
   */
  getProviderConfig(provider) {
    return this.oauthConfig.getProviderConfig(provider);
  }

  /**
   * Get all enabled providers
   * @returns {Array} List of enabled provider names
   */
  getEnabledProviders() {
    return this.oauthConfig.getEnabledProviders();
  }

  /**
   * Get provider display information
   * @returns {Array} List of provider display info
   */
  getProviderDisplayInfo() {
    return this.oauthConfig.getProviderDisplayInfo();
  }

  /**
   * Get supported providers (static method for routes)
   * @returns {Array} List of supported provider names
   */
  static getSupportedProviders() {
    return ['google', 'facebook', 'apple', 'linkedin'];
  }
}

module.exports = SocialAuthService;
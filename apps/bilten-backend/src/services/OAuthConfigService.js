const { logger } = require('../utils/logger');

/**
 * OAuth Configuration Service
 * 
 * Manages OAuth provider configurations and validation
 * Provides centralized configuration management for all OAuth providers
 */
class OAuthConfigService {
  constructor() {
    this.providers = {
      google: {
        name: 'Google',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: 'openid email profile',
        requiredFields: ['email', 'given_name', 'family_name'],
        enabled: this.isProviderEnabled('google')
      },
      facebook: {
        name: 'Facebook',
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        userInfoUrl: 'https://graph.facebook.com/me',
        scope: 'email public_profile',
        requiredFields: ['email', 'name'],
        enabled: this.isProviderEnabled('facebook')
      },
      apple: {
        name: 'Apple',
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
        authUrl: 'https://appleid.apple.com/auth/authorize',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        scope: 'name email',
        requiredFields: ['email'],
        enabled: this.isProviderEnabled('apple'),
        responseMode: 'form_post'
      },
      linkedin: {
        name: 'LinkedIn',
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        userInfoUrl: 'https://api.linkedin.com/v2/people/~',
        scope: 'r_liteprofile r_emailaddress',
        requiredFields: ['localizedFirstName', 'localizedLastName'],
        enabled: this.isProviderEnabled('linkedin')
      }
    };

    this.validateConfiguration();
  }

  /**
   * Check if a provider is enabled
   * @param {string} provider - Provider name
   * @returns {boolean} Whether provider is enabled
   */
  isProviderEnabled(provider) {
    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    
    return !!(clientId && clientSecret && 
              clientId !== `your-${provider}-client-id` && 
              clientSecret !== `your-${provider}-client-secret`);
  }

  /**
   * Get provider configuration
   * @param {string} provider - Provider name
   * @returns {Object} Provider configuration
   */
  getProviderConfig(provider) {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    
    if (!config.enabled) {
      throw new Error(`OAuth provider ${provider} is not configured or disabled`);
    }
    
    return config;
  }

  /**
   * Get all enabled providers
   * @returns {Array} List of enabled provider names
   */
  getEnabledProviders() {
    return Object.keys(this.providers).filter(provider => this.providers[provider].enabled);
  }

  /**
   * Get provider display information
   * @returns {Array} List of provider display info
   */
  getProviderDisplayInfo() {
    return Object.entries(this.providers)
      .filter(([, config]) => config.enabled)
      .map(([key, config]) => ({
        key,
        name: config.name,
        enabled: config.enabled
      }));
  }

  /**
   * Validate OAuth configuration
   */
  validateConfiguration() {
    const enabledProviders = this.getEnabledProviders();
    
    if (enabledProviders.length === 0) {
      logger.warn('No OAuth providers are configured. Social authentication will be unavailable.');
      return;
    }

    logger.info('OAuth providers configured', {
      enabledProviders,
      totalProviders: Object.keys(this.providers).length
    });

    // Validate each enabled provider
    enabledProviders.forEach(provider => {
      const config = this.providers[provider];
      this.validateProviderConfig(provider, config);
    });
  }

  /**
   * Validate individual provider configuration
   * @param {string} provider - Provider name
   * @param {Object} config - Provider configuration
   */
  validateProviderConfig(provider, config) {
    const requiredFields = ['clientId', 'clientSecret', 'authUrl', 'tokenUrl'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      logger.error(`OAuth provider ${provider} is missing required configuration`, {
        provider,
        missingFields
      });
      throw new Error(`OAuth provider ${provider} configuration is incomplete: missing ${missingFields.join(', ')}`);
    }

    // Validate URLs
    const urlFields = ['authUrl', 'tokenUrl', 'userInfoUrl'].filter(field => config[field]);
    urlFields.forEach(field => {
      try {
        new URL(config[field]);
      } catch (error) {
        logger.error(`Invalid URL for ${provider} ${field}`, {
          provider,
          field,
          url: config[field]
        });
        throw new Error(`Invalid URL for ${provider} ${field}: ${config[field]}`);
      }
    });

    logger.debug(`OAuth provider ${provider} configuration validated successfully`);
  }

  /**
   * Generate authorization URL for provider
   * @param {string} provider - Provider name
   * @param {string} state - CSRF state parameter
   * @param {string} redirectUri - Callback URL
   * @returns {string} Authorization URL
   */
  generateAuthUrl(provider, state, redirectUri) {
    const config = this.getProviderConfig(provider);
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scope,
      state: state
    });

    // Add provider-specific parameters
    if (provider === 'apple' && config.responseMode) {
      params.append('response_mode', config.responseMode);
    }

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Get token exchange data for provider
   * @param {string} provider - Provider name
   * @param {string} code - Authorization code
   * @param {string} redirectUri - Callback URL
   * @returns {Object} Token exchange data
   */
  getTokenExchangeData(provider, code, redirectUri) {
    const config = this.getProviderConfig(provider);
    
    return {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    };
  }

  /**
   * Check if provider is supported
   * @param {string} provider - Provider name
   * @returns {boolean} Whether provider is supported
   */
  isProviderSupported(provider) {
    return Object.keys(this.providers).includes(provider);
  }

  /**
   * Get configuration summary for debugging
   * @returns {Object} Configuration summary
   */
  getConfigSummary() {
    return {
      totalProviders: Object.keys(this.providers).length,
      enabledProviders: this.getEnabledProviders(),
      disabledProviders: Object.keys(this.providers).filter(p => !this.providers[p].enabled),
      apiBaseUrl: process.env.API_BASE_URL,
      frontendUrl: process.env.FRONTEND_URL
    };
  }
}

module.exports = OAuthConfigService;
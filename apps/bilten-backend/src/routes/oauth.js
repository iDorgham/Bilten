const express = require('express');
const router = express.Router();
const SocialAuthService = require('../services/SocialAuthService');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * @route GET /api/v1/auth/oauth/providers
 * @desc Get available OAuth providers
 * @access Public
 */
router.get('/providers', (req, res) => {
  try {
    const socialAuthService = new SocialAuthService();
    const providers = socialAuthService.getProviderDisplayInfo();
    
    res.status(200).json({
      success: true,
      data: { providers },
      message: 'OAuth providers retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get OAuth providers', { error: error.message });
    res.status(500).json({
      error: 'Failed to get OAuth providers',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/auth/oauth/accounts
 * @desc Get user's connected OAuth accounts
 * @access Private
 */
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const socialAuthService = new SocialAuthService();
    const accounts = await socialAuthService.getConnectedAccounts(userId);
    
    res.status(200).json({
      success: true,
      data: { accounts },
      message: 'OAuth accounts retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get OAuth accounts', { error: error.message });
    res.status(500).json({
      error: 'Failed to get OAuth accounts',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/auth/oauth/:provider
 * @desc Get OAuth authorization URL
 * @access Public
 */
router.get('/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const { state, redirect_uri } = req.query;
    
    const socialAuthService = new SocialAuthService();
    
    if (!socialAuthService.isProviderSupported(provider)) {
      return res.status(400).json({
        error: 'Unsupported OAuth provider',
        message: `Supported providers: ${socialAuthService.constructor.getSupportedProviders ? socialAuthService.constructor.getSupportedProviders().join(', ') : 'google, facebook, apple, linkedin'}`
      });
    }

    const authUrl = socialAuthService.getAuthorizationUrl(provider, state, redirect_uri);
    
    res.status(200).json({
      success: true,
      data: { authUrl },
      message: `OAuth authorization URL generated for ${provider}`
    });
  } catch (error) {
    logger.error('Failed to generate OAuth URL', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate OAuth URL',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/auth/oauth/:provider/callback
 * @desc OAuth callback handler
 * @access Public
 */
router.get('/:provider/callback', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;
    
    const socialAuthService = new SocialAuthService();
    
    if (error) {
      logger.error('OAuth callback error', { provider, error });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_cancelled`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_no_code`);
    }

    if (!socialAuthService.isProviderSupported(provider)) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=unsupported_provider`);
    }

    const authResult = await socialAuthService.handleOAuthCallback(provider, code, state);
    
    // Generate JWT tokens for the authenticated user
    const AuthService = require('../services/AuthService');
    const tokens = await AuthService.generateTokens(authResult.user);
    
    // Redirect to frontend with tokens
    const params = new URLSearchParams({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user_id: authResult.user.id,
      provider: provider,
      is_new_user: authResult.isNewUser
    });

    res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?${params.toString()}`);
  } catch (error) {
    logger.error('OAuth callback failed', { 
      provider: req.params.provider, 
      error: error.message 
    });
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

/**
 * @route POST /api/v1/auth/oauth/:provider/connect
 * @desc Connect OAuth account to existing user
 * @access Private
 */
router.post('/:provider/connect', [
  authenticateToken,
  body('code').notEmpty().withMessage('Authorization code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { provider } = req.params;
    const { code } = req.body;
    const { userId } = req.user;

    const socialAuthService = new SocialAuthService();

    if (!socialAuthService.isProviderSupported(provider)) {
      return res.status(400).json({
        error: 'Unsupported OAuth provider',
        message: `Supported providers: ${socialAuthService.constructor.getSupportedProviders ? socialAuthService.constructor.getSupportedProviders().join(', ') : 'google, facebook, apple, linkedin'}`
      });
    }

    // Exchange code for token and get user info
    const tokenData = await socialAuthService.exchangeCodeForToken(provider, code);
    const userInfo = await socialAuthService.getUserInfo(provider, tokenData.access_token);
    
    // Link social account to existing user
    const socialAccount = await socialAuthService.linkSocialAccount(userId, provider, userInfo);
    
    res.status(200).json({
      success: true,
      data: { socialAccount },
      message: `${provider} account connected successfully`
    });
  } catch (error) {
    logger.error('OAuth connection failed', { error: error.message });
    res.status(400).json({
      error: 'Failed to connect OAuth account',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/auth/oauth/:provider/disconnect
 * @desc Disconnect OAuth account
 * @access Private
 */
router.delete('/:provider/disconnect', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    const { userId } = req.user;

    const socialAuthService = new SocialAuthService();

    if (!socialAuthService.isProviderSupported(provider)) {
      return res.status(400).json({
        error: 'Unsupported OAuth provider',
        message: `Supported providers: ${socialAuthService.constructor.getSupportedProviders ? socialAuthService.constructor.getSupportedProviders().join(', ') : 'google, facebook, apple, linkedin'}`
      });
    }

    const result = await socialAuthService.unlinkSocialAccount(userId, provider);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('OAuth disconnection failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to disconnect OAuth account',
      message: error.message
    });
  }
});

module.exports = router;

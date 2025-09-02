const BaseRepository = require('../database/BaseRepository');
const { query } = require('../database/connection');

/**
 * SocialAccount Model
 * 
 * Manages social authentication accounts linked to users.
 * Supports Google, Facebook, Apple, and LinkedIn OAuth providers.
 */
class SocialAccount extends BaseRepository {
  constructor() {
    super('authentication.social_accounts', 'social_account', 1800); // 30 minutes cache
  }

  /**
   * Create a new social account
   */
  async create(socialAccountData) {
    const {
      user_id,
      provider,
      provider_id,
      email,
      display_name,
      avatar
    } = socialAccountData;

    // Validate required fields
    if (!user_id || !provider || !provider_id) {
      throw new Error('User ID, provider, and provider ID are required');
    }

    // Validate provider
    const supportedProviders = ['google', 'facebook', 'apple', 'linkedin'];
    if (!supportedProviders.includes(provider)) {
      throw new Error(`Unsupported provider: ${provider}. Supported providers: ${supportedProviders.join(', ')}`);
    }

    // Check if social account already exists for this provider and user
    const existingAccount = await this.findByUserAndProvider(user_id, provider);
    if (existingAccount) {
      throw new Error(`${provider} account is already linked to this user`);
    }

    // Check if this provider account is linked to another user
    const linkedToOther = await this.findByProviderAndId(provider, provider_id);
    if (linkedToOther && linkedToOther.user_id !== user_id) {
      throw new Error(`This ${provider} account is already linked to another user`);
    }

    const newSocialAccountData = {
      user_id,
      provider,
      provider_id,
      email: email ? email.toLowerCase() : null,
      display_name,
      avatar,
      connected_at: new Date()
    };

    return await super.create(newSocialAccountData);
  }

  /**
   * Find social account by user ID and provider
   */
  async findByUserAndProvider(userId, provider, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(`${userId}:${provider}`, 'user_provider');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      'SELECT * FROM authentication.social_accounts WHERE user_id = $1 AND provider = $2',
      [userId, provider],
      useReplica
    );

    const socialAccount = result.rows[0] || null;

    if (socialAccount && useCache) {
      await this.setCache(cacheKey, socialAccount);
      await this.setCache(this.getCacheKey(socialAccount.id), socialAccount);
    }

    return socialAccount;
  }

  /**
   * Find social account by provider and provider ID
   */
  async findByProviderAndId(provider, providerId, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(`${provider}:${providerId}`, 'provider_id');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      'SELECT * FROM authentication.social_accounts WHERE provider = $1 AND provider_id = $2',
      [provider, providerId],
      useReplica
    );

    const socialAccount = result.rows[0] || null;

    if (socialAccount && useCache) {
      await this.setCache(cacheKey, socialAccount);
      await this.setCache(this.getCacheKey(socialAccount.id), socialAccount);
    }

    return socialAccount;
  }

  /**
   * Get all social accounts for a user
   */
  async findByUserId(userId, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(userId, 'user_accounts');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      `SELECT provider, provider_id, email, display_name, avatar, connected_at
       FROM authentication.social_accounts 
       WHERE user_id = $1 
       ORDER BY connected_at DESC`,
      [userId],
      useReplica
    );

    const socialAccounts = result.rows;

    if (useCache) {
      await this.setCache(cacheKey, socialAccounts);
    }

    return socialAccounts;
  }

  /**
   * Update social account information
   */
  async updateByUserAndProvider(userId, provider, updateData) {
    const { email, display_name, avatar } = updateData;

    const result = await query(
      `UPDATE authentication.social_accounts 
       SET email = $3, display_name = $4, avatar = $5, connected_at = NOW()
       WHERE user_id = $1 AND provider = $2
       RETURNING *`,
      [userId, provider, email ? email.toLowerCase() : null, display_name, avatar]
    );

    const socialAccount = result.rows[0];

    if (socialAccount) {
      // Update caches
      await this.setCache(this.getCacheKey(socialAccount.id), socialAccount);
      await this.setCache(this.getCacheKey(`${userId}:${provider}`, 'user_provider'), socialAccount);
      await this.setCache(this.getCacheKey(`${provider}:${socialAccount.provider_id}`, 'provider_id'), socialAccount);
      
      // Invalidate user accounts cache
      await this.invalidateCache(userId, ['user_accounts']);
    }

    return socialAccount;
  }

  /**
   * Delete social account by user and provider
   */
  async deleteByUserAndProvider(userId, provider) {
    // Get the account first for cache cleanup
    const socialAccount = await this.findByUserAndProvider(userId, provider, false);
    
    const result = await query(
      'DELETE FROM authentication.social_accounts WHERE user_id = $1 AND provider = $2 RETURNING *',
      [userId, provider]
    );

    if (result.rows.length > 0 && socialAccount) {
      // Clear caches
      await this.invalidateCache(socialAccount.id);
      await this.invalidateCache(`${userId}:${provider}`, ['user_provider']);
      await this.invalidateCache(`${provider}:${socialAccount.provider_id}`, ['provider_id']);
      await this.invalidateCache(userId, ['user_accounts']);
    }

    return result.rows[0] || null;
  }

  /**
   * Get social account statistics for a user
   */
  async getUserSocialStats(userId, useReplica = true) {
    const result = await query(
      `SELECT 
         COUNT(*) as total_accounts,
         array_agg(provider ORDER BY connected_at DESC) as providers,
         MAX(connected_at) as last_connected
       FROM authentication.social_accounts 
       WHERE user_id = $1`,
      [userId],
      useReplica
    );

    return result.rows[0] || {
      total_accounts: 0,
      providers: [],
      last_connected: null
    };
  }

  /**
   * Find user by social account
   */
  async findUserBySocialAccount(provider, providerId, useReplica = true) {
    const result = await query(
      `SELECT u.* FROM users.users u
       JOIN authentication.social_accounts sa ON u.id = sa.user_id
       WHERE sa.provider = $1 AND sa.provider_id = $2 AND u.deleted_at IS NULL`,
      [provider, providerId],
      useReplica
    );

    return result.rows[0] || null;
  }

  /**
   * Get social accounts with user information
   */
  async findWithUserInfo(provider, providerId, useReplica = true) {
    const result = await query(
      `SELECT 
         sa.*,
         u.email as user_email,
         u.first_name,
         u.last_name,
         u.display_name as user_display_name,
         u.status as user_status
       FROM authentication.social_accounts sa
       JOIN users.users u ON sa.user_id = u.id
       WHERE sa.provider = $1 AND sa.provider_id = $2 AND u.deleted_at IS NULL`,
      [provider, providerId],
      useReplica
    );

    return result.rows[0] || null;
  }

  /**
   * Validate provider
   */
  static isProviderSupported(provider) {
    const supportedProviders = ['google', 'facebook', 'apple', 'linkedin'];
    return supportedProviders.includes(provider);
  }

  /**
   * Get supported providers
   */
  static getSupportedProviders() {
    return ['google', 'facebook', 'apple', 'linkedin'];
  }
}

module.exports = SocialAccount;
const BaseRepository = require('../database/BaseRepository');
const { query } = require('../database/connection');
const bcrypt = require('bcryptjs');

/**
 * UserAccount Model
 * 
 * Enhanced user account model with comprehensive authentication features
 * including MFA, social accounts, SSO, and security tracking.
 */
class UserAccount extends BaseRepository {
  constructor() {
    super('users.users', 'user', 3600); // 1 hour cache
  }

  /**
   * Create a new user account with enhanced validation
   */
  async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      display_name,
      timezone = 'UTC',
      locale = 'en',
      role = 'user',
      organization_id,
      sso_provider,
      sso_subject
    } = userData;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      throw new Error('Email, first name, and last name are required');
    }

    // Ensure email is lowercase
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await this.findByEmail(normalizedEmail, false);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password if provided
    let password_hash = null;
    let password_salt = null;
    if (password) {
      password_salt = await bcrypt.genSalt(12);
      password_hash = await bcrypt.hash(password, password_salt);
    }

    const newUserData = {
      email: normalizedEmail,
      password_hash,
      password_salt,
      password_updated_at: password ? new Date() : null,
      first_name,
      last_name,
      display_name: display_name || `${first_name} ${last_name}`,
      timezone,
      locale,
      role,
      organization_id,
      sso_provider,
      sso_subject,
      status: sso_provider ? 'active' : 'pending_verification',
      email_verified: !!sso_provider, // SSO users are pre-verified
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

    const user = await super.create(newUserData);

    // Cache by email as well
    await this.setCache(this.getCacheKey(user.email, 'email'), user);

    return user;
  }

  /**
   * Find user by email with enhanced caching
   */
  async findByEmail(email, useCache = true, useReplica = true) {
    const normalizedEmail = email.toLowerCase();
    const cacheKey = this.getCacheKey(normalizedEmail, 'email');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      'SELECT * FROM users.users WHERE email = $1 AND deleted_at IS NULL',
      [normalizedEmail],
      useReplica
    );

    const user = result.rows[0] || null;

    if (user && useCache) {
      await this.setCache(cacheKey, user);
      // Also cache by ID
      await this.setCache(this.getCacheKey(user.id), user);
    }

    return user;
  }

  /**
   * Find user by SSO provider and subject
   */
  async findBySSOProvider(provider, subject, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(`${provider}:${subject}`, 'sso');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      'SELECT * FROM users.users WHERE sso_provider = $1 AND sso_subject = $2 AND deleted_at IS NULL',
      [provider, subject],
      useReplica
    );

    const user = result.rows[0] || null;

    if (user && useCache) {
      await this.setCache(cacheKey, user);
      await this.setCache(this.getCacheKey(user.id), user);
    }

    return user;
  }

  /**
   * Find user by UUID (for compatibility with new UUID field)
   */
  async findByUUID(uuid, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(uuid, 'uuid');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      'SELECT * FROM users.users WHERE uuid_id = $1 AND deleted_at IS NULL',
      [uuid],
      useReplica
    );

    const user = result.rows[0] || null;

    if (user && useCache) {
      await this.setCache(cacheKey, user);
      await this.setCache(this.getCacheKey(user.id), user);
    }

    return user;
  }

  /**
   * Update user with enhanced validation and cache management
   */
  async update(id, userData) {
    // Normalize email if provided
    if (userData.email) {
      userData.email = userData.email.toLowerCase();
    }

    // Hash new password if provided
    if (userData.password) {
      userData.password_salt = await bcrypt.genSalt(12);
      userData.password_hash = await bcrypt.hash(userData.password, userData.password_salt);
      userData.password_updated_at = new Date();
      
      // Add to password history
      const currentUser = await this.findById(id, false);
      if (currentUser && currentUser.password_hash) {
        const passwordHistory = currentUser.password_history || [];
        passwordHistory.push({
          hash: currentUser.password_hash,
          changed_at: currentUser.password_updated_at || currentUser.created_at
        });
        
        // Keep only last 5 passwords
        userData.password_history = passwordHistory.slice(-5);
      }
      
      // Remove password from userData to avoid storing plain text
      delete userData.password;
    }

    const user = await super.update(id, userData);

    if (user) {
      // Update email cache if email changed
      if (userData.email) {
        await this.setCache(this.getCacheKey(user.email, 'email'), user);
      }
      
      // Update SSO cache if SSO data changed
      if (user.sso_provider && user.sso_subject) {
        await this.setCache(
          this.getCacheKey(`${user.sso_provider}:${user.sso_subject}`, 'sso'), 
          user
        );
      }
    }

    return user;
  }

  /**
   * Verify user password
   */
  async verifyPassword(userId, password) {
    const user = await this.findById(userId, false);
    if (!user || !user.password_hash) {
      return false;
    }

    return await bcrypt.compare(password, user.password_hash);
  }

  /**
   * Check if password was used recently
   */
  async isPasswordReused(userId, newPassword) {
    const user = await this.findById(userId, false);
    if (!user) {
      return false;
    }

    const passwordHistory = user.password_history || [];
    
    // Check current password
    if (user.password_hash && await bcrypt.compare(newPassword, user.password_hash)) {
      return true;
    }

    // Check password history
    for (const historyEntry of passwordHistory) {
      if (await bcrypt.compare(newPassword, historyEntry.hash)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update last login information
   */
  async updateLastLogin(userId, ipAddress) {
    const result = await query(
      `UPDATE users.users 
       SET last_login_at = NOW(), last_login_ip = $2, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [userId, ipAddress]
    );

    const user = result.rows[0];
    
    if (user) {
      // Update cache
      await this.setCache(this.getCacheKey(user.id), user);
      if (user.email) {
        await this.setCache(this.getCacheKey(user.email, 'email'), user);
      }
    }

    return user;
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLogins(userId) {
    const result = await query(
      `UPDATE users.users 
       SET failed_login_attempts = failed_login_attempts + 1,
           locked_until = CASE 
             WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'
             ELSE locked_until
           END,
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [userId]
    );

    const user = result.rows[0];
    
    if (user) {
      // Update cache
      await this.setCache(this.getCacheKey(user.id), user);
      if (user.email) {
        await this.setCache(this.getCacheKey(user.email, 'email'), user);
      }
    }

    return user;
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedLogins(userId) {
    const result = await query(
      `UPDATE users.users 
       SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [userId]
    );

    const user = result.rows[0];
    
    if (user) {
      // Update cache
      await this.setCache(this.getCacheKey(user.id), user);
      if (user.email) {
        await this.setCache(this.getCacheKey(user.email, 'email'), user);
      }
    }

    return user;
  }

  /**
   * Check if user account is locked
   */
  async isAccountLocked(userId) {
    const user = await this.findById(userId, true, true);
    if (!user) {
      return false;
    }

    return user.locked_until && new Date(user.locked_until) > new Date();
  }

  /**
   * Get user with social accounts
   */
  async findWithSocialAccounts(userId, useReplica = true) {
    const result = await query(
      `SELECT 
         u.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', sa.id,
               'provider', sa.provider,
               'provider_id', sa.provider_id,
               'email', sa.email,
               'display_name', sa.display_name,
               'avatar', sa.avatar,
               'connected_at', sa.connected_at
             )
           ) FILTER (WHERE sa.id IS NOT NULL),
           '[]'
         ) as social_accounts
       FROM users.users u
       LEFT JOIN authentication.social_accounts sa ON u.id = sa.user_id
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [userId],
      useReplica
    );

    return result.rows[0] || null;
  }

  /**
   * Get user with MFA methods
   */
  async findWithMFAMethods(userId, useReplica = true) {
    const result = await query(
      `SELECT 
         u.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', mfa.id,
               'type', mfa.type,
               'phone_number', mfa.phone_number,
               'is_active', mfa.is_active,
               'created_at', mfa.created_at
             )
           ) FILTER (WHERE mfa.id IS NOT NULL),
           '[]'
         ) as mfa_methods
       FROM users.users u
       LEFT JOIN authentication.mfa_methods mfa ON u.id = mfa.user_id AND mfa.is_active = true
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [userId],
      useReplica
    );

    return result.rows[0] || null;
  }

  /**
   * Search users with enhanced filtering
   */
  async searchUsers(searchTerm, filters = {}, options = {}) {
    const {
      role,
      status,
      organization_id,
      sso_provider,
      mfa_enabled
    } = filters;

    const {
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      useReplica = true
    } = options;

    let whereConditions = ['u.deleted_at IS NULL'];
    let params = [];
    let paramIndex = 1;

    // Search term
    if (searchTerm) {
      whereConditions.push(`(
        u.first_name ILIKE $${paramIndex} OR 
        u.last_name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR
        u.display_name ILIKE $${paramIndex}
      )`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Filters
    if (role) {
      whereConditions.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`u.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (organization_id) {
      whereConditions.push(`u.organization_id = $${paramIndex}`);
      params.push(organization_id);
      paramIndex++;
    }

    if (sso_provider) {
      whereConditions.push(`u.sso_provider = $${paramIndex}`);
      params.push(sso_provider);
      paramIndex++;
    }

    if (typeof mfa_enabled === 'boolean') {
      whereConditions.push(`u.mfa_enabled = $${paramIndex}`);
      params.push(mfa_enabled);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await query(
      `SELECT 
         u.id, u.email, u.first_name, u.last_name, u.display_name,
         u.role, u.status, u.mfa_enabled, u.last_login_at, u.created_at,
         u.organization_id, u.sso_provider
       FROM users.users u
       WHERE ${whereClause}
       ORDER BY u.${orderBy} ${orderDirection}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
      useReplica
    );

    return result.rows;
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId, useReplica = true) {
    const result = await query(
      `SELECT 
         u.id,
         u.email,
         u.first_name,
         u.last_name,
         u.role,
         u.status,
         u.created_at,
         u.last_login_at,
         u.mfa_enabled,
         COUNT(DISTINCT s.id) as active_sessions,
         COUNT(DISTINCT sa.id) as social_accounts,
         COUNT(DISTINCT mfa.id) as mfa_methods
       FROM users.users u
       LEFT JOIN authentication.user_sessions s ON u.id = s.user_id AND s.is_active = true
       LEFT JOIN authentication.social_accounts sa ON u.id = sa.user_id
       LEFT JOIN authentication.mfa_methods mfa ON u.id = mfa.user_id AND mfa.is_active = true
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [userId],
      useReplica
    );

    return result.rows[0] || null;
  }

  /**
   * Delete user with proper cleanup
   */
  async delete(id, soft = true) {
    // Get user first to clear caches
    const user = await this.findById(id, false);
    
    const deletedUser = await super.delete(id, soft);
    
    if (deletedUser && user) {
      // Clear all caches
      await this.invalidateCache(user.id);
      if (user.email) {
        await this.invalidateCache(user.email, ['email']);
      }
      if (user.sso_provider && user.sso_subject) {
        await this.invalidateCache(`${user.sso_provider}:${user.sso_subject}`, ['sso']);
      }
    }

    return deletedUser;
  }
}

module.exports = UserAccount;
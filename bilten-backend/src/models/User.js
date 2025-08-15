const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./index');
const config = require('../config');

class User {
  static get tableName() {
    return 'users';
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user (without password)
   */
  static async create(userData) {
    const { email, password, firstName, lastName, role = 'user' } = userData;

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

    const [user] = await db(this.tableName)
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
        email_verified: false,
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'email_verified', 'created_at', 'updated_at']);

    return user;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const user = await db(this.tableName)
      .select(['id', 'email', 'first_name', 'last_name', 'role', 'email_verified', 'created_at', 'updated_at'])
      .where({ id })
      .first();

    return user || null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const user = await db(this.tableName)
      .select(['id', 'email', 'first_name', 'last_name', 'role', 'email_verified', 'created_at', 'updated_at'])
      .where({ email: email.toLowerCase() })
      .first();

    return user || null;
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object|null>} User object or null if authentication fails
   */
  static async authenticate(email, password) {
    const user = await db(this.tableName)
      .select(['id', 'email', 'password_hash', 'first_name', 'last_name', 'role', 'email_verified'])
      .where({ email: email.toLowerCase() })
      .first();

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    // Remove password hash from returned user
    delete user.password_hash;
    return user;
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  static async update(id, updateData) {
    const allowedFields = ['first_name', 'last_name', 'email'];
    const filteredData = {};

    // Only allow specific fields to be updated
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    if (filteredData.email) {
      filteredData.email = filteredData.email.toLowerCase();
    }

    filteredData.updated_at = new Date();

    const [user] = await db(this.tableName)
      .where({ id })
      .update(filteredData)
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'email_verified', 'created_at', 'updated_at']);

    return user;
  }

  /**
   * Change user password
   * @param {number} id - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async changePassword(id, currentPassword, newPassword) {
    const user = await db(this.tableName)
      .select(['password_hash'])
      .where({ id })
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    await db(this.tableName)
      .where({ id })
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date(),
      });

    return true;
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token payload
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Mark email as verified
   * @param {number} id - User ID
   * @returns {Promise<Object>} Updated user
   */
  static async verifyEmail(id) {
    const [user] = await db(this.tableName)
      .where({ id })
      .update({
        email_verified: true,
        updated_at: new Date(),
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'email_verified', 'created_at', 'updated_at']);

    return user;
  }

  /**
   * Get all users (admin only)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of users
   */
  static async findAll(filters = {}) {
    let query = db(this.tableName)
      .select(['id', 'email', 'first_name', 'last_name', 'role', 'email_verified', 'created_at', 'updated_at']);

    if (filters.role) {
      query = query.where('role', filters.role);
    }

    if (filters.email_verified !== undefined) {
      query = query.where('email_verified', filters.email_verified);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${filters.search}%`)
            .orWhere('last_name', 'ilike', `%${filters.search}%`)
            .orWhere('email', 'ilike', `%${filters.search}%`);
      });
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    return query;
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const deletedCount = await db(this.tableName)
      .where({ id })
      .del();

    return deletedCount > 0;
  }
}

module.exports = User;
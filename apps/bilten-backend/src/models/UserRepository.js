const BaseRepository = require('../database/BaseRepository');
const { query } = require('../database/connection');

class UserRepository extends BaseRepository {
  constructor() {
    super('users.users', 'user', 3600); // 1 hour cache
  }

  async findByEmail(email, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(email, 'email');
    
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const result = await query(
      'SELECT * FROM users.users WHERE email = $1 AND deleted_at IS NULL',
      [email],
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

  async findByRole(role, options = {}) {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      useReplica = true
    } = options;

    const result = await query(
      `SELECT * FROM users.users 
       WHERE role = $1 AND deleted_at IS NULL 
       ORDER BY ${orderBy} ${orderDirection}
       LIMIT $2 OFFSET $3`,
      [role, limit, offset],
      useReplica
    );

    return result.rows;
  }

  async updateLastActivity(userId) {
    const result = await query(
      `UPDATE users.users 
       SET updated_at = NOW() 
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

  async searchUsers(searchTerm, options = {}) {
    const {
      limit = 20,
      offset = 0,
      useReplica = true
    } = options;

    const result = await query(
      `SELECT id, email, first_name, last_name, role, status, created_at
       FROM users.users 
       WHERE (
         first_name ILIKE $1 OR 
         last_name ILIKE $1 OR 
         email ILIKE $1
       ) AND deleted_at IS NULL
       ORDER BY 
         CASE 
           WHEN email ILIKE $1 THEN 1
           WHEN first_name ILIKE $1 THEN 2
           WHEN last_name ILIKE $1 THEN 3
           ELSE 4
         END,
         created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${searchTerm}%`, limit, offset],
      useReplica
    );

    return result.rows;
  }

  async getUserStats(userId, useReplica = true) {
    const result = await query(
      `SELECT 
         u.id,
         u.email,
         u.first_name,
         u.last_name,
         u.role,
         u.created_at,
         COUNT(DISTINCT e.id) as events_count,
         COUNT(DISTINCT t.id) as tickets_count,
         COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_spent
       FROM users.users u
       LEFT JOIN events.events e ON e.organizer_id = u.id AND e.deleted_at IS NULL
       LEFT JOIN tickets.tickets t ON t.buyer_id = u.id
       LEFT JOIN payments.transactions p ON p.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.created_at`,
      [userId],
      useReplica
    );

    return result.rows[0] || null;
  }

  async create(userData) {
    // Ensure email is lowercase
    if (userData.email) {
      userData.email = userData.email.toLowerCase();
    }

    const user = await super.create(userData);

    // Cache by email as well
    if (user.email) {
      await this.setCache(this.getCacheKey(user.email, 'email'), user);
    }

    return user;
  }

  async update(id, userData) {
    // Ensure email is lowercase
    if (userData.email) {
      userData.email = userData.email.toLowerCase();
    }

    const user = await super.update(id, userData);

    if (user) {
      // Update email cache if email changed
      if (userData.email) {
        await this.setCache(this.getCacheKey(user.email, 'email'), user);
      }
    }

    return user;
  }

  async delete(id, soft = true) {
    // Get user first to clear email cache
    const user = await this.findById(id, false);
    
    const deletedUser = await super.delete(id, soft);
    
    if (deletedUser && user?.email) {
      // Clear email cache
      await this.invalidateCache(user.email, ['email']);
    }

    return deletedUser;
  }
}

module.exports = UserRepository;
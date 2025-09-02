const { query, transaction } = require('./connection');
const cacheService = require('../cache/CacheService');
const CacheKeys = require('../cache/CacheKeys');

class BaseRepository {
  constructor(tableName, entityName, cacheTTL = 3600) {
    this.tableName = tableName;
    this.entityName = entityName;
    this.cacheTTL = cacheTTL;
  }

  // Helper methods for SQL generation
  getColumns(data) {
    return Object.keys(data).join(', ');
  }

  getPlaceholders(data) {
    return Object.keys(data).map((_, index) => `$${index + 1}`).join(', ');
  }

  getUpdateClause(data) {
    return Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
  }

  // Cache methods using CacheService
  getCacheKey(id, suffix = '') {
    return `${this.entityName}:${id}${suffix ? ':' + suffix : ''}`;
  }

  async getFromCache(key) {
    try {
      return await cacheService.cacheAside(key, () => null, this.cacheTTL);
    } catch (error) {
      // Cache is optional - return null if Redis is not available
      console.warn('Cache get failed:', error.message);
      return null;
    }
  }

  async setCache(key, data, ttl = this.cacheTTL) {
    try {
      const redisManager = require('../cache/RedisManager');
      return await redisManager.set(key, data, ttl, 'cache');
    } catch (error) {
      // Cache is optional - don't fail if Redis is not available
      console.warn('Cache set failed:', error.message);
      return null;
    }
  }

  async invalidateCache(id, patterns = []) {
    try {
      // Use CacheService for intelligent invalidation
      await cacheService.invalidateRelated(this.entityName, id, patterns);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  // CRUD operations with advanced caching
  async findById(id, useCache = true, useReplica = true) {
    const cacheKey = this.getCacheKey(id);
    
    if (useCache) {
      // Use cache-aside pattern with CacheService
      return await cacheService.cacheAside(
        cacheKey,
        async () => {
          const result = await query(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL`,
            [id],
            useReplica
          );
          return result.rows[0] || null;
        },
        this.cacheTTL
      );
    }

    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL`,
      [id],
      useReplica
    );

    return result.rows[0] || null;
  }

  async findAll(options = {}) {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      where = '',
      params = [],
      useReplica = true
    } = options;

    let sql = `SELECT * FROM ${this.tableName}`;
    
    if (where) {
      sql += ` WHERE ${where} AND deleted_at IS NULL`;
    } else {
      sql += ` WHERE deleted_at IS NULL`;
    }
    
    sql += ` ORDER BY ${orderBy} ${orderDirection}`;
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const result = await query(sql, [...params, limit, offset], useReplica);
    return result.rows;
  }

  async count(where = '', params = [], useReplica = true) {
    let sql = `SELECT COUNT(*) FROM ${this.tableName}`;
    
    if (where) {
      sql += ` WHERE ${where} AND deleted_at IS NULL`;
    } else {
      sql += ` WHERE deleted_at IS NULL`;
    }

    const result = await query(sql, params, useReplica);
    return parseInt(result.rows[0].count);
  }

  async create(data) {
    const columns = this.getColumns(data);
    const placeholders = this.getPlaceholders(data);
    
    // Use write-through pattern for create operations
    return await cacheService.writeThrough(
      this.getCacheKey('new'), // Temporary key, will be replaced
      data,
      async (data) => {
        const result = await query(
          `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
          Object.values(data)
        );
        
        const entity = result.rows[0];
        
        // Cache with proper key after creation
        await this.setCache(this.getCacheKey(entity.id), entity);
        
        return entity;
      },
      this.cacheTTL
    );
  }

  async update(id, data) {
    const cacheKey = this.getCacheKey(id);
    
    // Use write-through pattern for updates
    return await cacheService.writeThrough(
      cacheKey,
      data,
      async (data) => {
        const updateClause = this.getUpdateClause(data);
        const values = [...Object.values(data), id];
        
        const result = await query(
          `UPDATE ${this.tableName} 
           SET ${updateClause}, updated_at = NOW() 
           WHERE id = $${values.length} AND deleted_at IS NULL
           RETURNING *`,
          values
        );

        const entity = result.rows[0];
        
        if (entity) {
          // Trigger cache invalidation for related entities
          await cacheService.onEntityUpdate(this.entityName, id, data);
        }

        return entity;
      },
      this.cacheTTL
    );
  }

  async delete(id, soft = true) {
    if (soft) {
      const result = await query(
        `UPDATE ${this.tableName} 
         SET deleted_at = NOW() 
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING *`,
        [id]
      );
      
      const entity = result.rows[0];
      
      if (entity) {
        await this.invalidateCache(id);
      }
      
      return entity;
    } else {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
        [id]
      );
      
      const entity = result.rows[0];
      
      if (entity) {
        await this.invalidateCache(id);
      }
      
      return entity;
    }
  }

  // Transaction wrapper
  async withTransaction(callback) {
    return await transaction(callback);
  }

  // Batch operations
  async createMany(dataArray) {
    if (!dataArray.length) return [];

    return await transaction(async (client) => {
      const results = [];
      
      for (const data of dataArray) {
        const columns = this.getColumns(data);
        const placeholders = this.getPlaceholders(data);
        
        const result = await client.query(
          `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
          Object.values(data)
        );
        
        results.push(result.rows[0]);
      }
      
      // Cache all new entities
      for (const entity of results) {
        await this.setCache(this.getCacheKey(entity.id), entity);
      }
      
      return results;
    });
  }

  async updateMany(updates) {
    if (!updates.length) return [];

    return await transaction(async (client) => {
      const results = [];
      
      for (const { id, data } of updates) {
        const updateClause = this.getUpdateClause(data);
        const values = [...Object.values(data), id];
        
        const result = await client.query(
          `UPDATE ${this.tableName} 
           SET ${updateClause}, updated_at = NOW() 
           WHERE id = $${values.length} AND deleted_at IS NULL
           RETURNING *`,
          values
        );
        
        if (result.rows[0]) {
          results.push(result.rows[0]);
        }
      }
      
      // Update cache for all entities
      for (const entity of results) {
        await this.setCache(this.getCacheKey(entity.id), entity);
      }
      
      return results;
    });
  }
}

module.exports = BaseRepository;
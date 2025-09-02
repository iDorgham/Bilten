/**
 * Event Model
 * Handles database operations for events
 */

const BaseRepository = require('../database/BaseRepository');
const logger = require('../utils/logger');

class Event extends BaseRepository {
  constructor() {
    super('events');
  }

  /**
   * Create events table if it doesn't exist
   */
  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        tags JSONB DEFAULT '[]',
        
        -- Venue information
        venue_name VARCHAR(255) NOT NULL,
        venue_address TEXT NOT NULL,
        location POINT,
        city VARCHAR(100),
        country VARCHAR(100),
        
        -- Date and time
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        timezone VARCHAR(50) DEFAULT 'UTC',
        
        -- Pricing
        base_price DECIMAL(10,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'USD',
        is_free BOOLEAN DEFAULT false,
        
        -- Event details
        max_attendees INTEGER,
        available_tickets INTEGER,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
        is_featured BOOLEAN DEFAULT false,
        
        -- Media
        cover_image_url VARCHAR(500),
        
        -- Organizer
        organizer_id UUID NOT NULL,
        organizer_first_name VARCHAR(100),
        organizer_last_name VARCHAR(100),
        organizer_verified BOOLEAN DEFAULT false,
        
        -- Analytics
        popularity_score FLOAT DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        bookmark_count INTEGER DEFAULT 0,
        registration_count INTEGER DEFAULT 0,
        
        -- Audit fields
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `;

    await this.query(query);

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);',
      'CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);',
      'CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);',
      'CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);',
      'CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);',
      'CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);',
      'CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);',
      'CREATE INDEX IF NOT EXISTS idx_events_free ON events(is_free);',
      'CREATE INDEX IF NOT EXISTS idx_events_price ON events(base_price);',
      'CREATE INDEX IF NOT EXISTS idx_events_popularity ON events(popularity_score);',
      'CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);',
      'CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST(location);'
    ];

    for (const indexQuery of indexes) {
      await this.query(indexQuery);
    }

    // Create updated_at trigger
    await this.query(`
      CREATE OR REPLACE FUNCTION update_events_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await this.query(`
      DROP TRIGGER IF EXISTS update_events_updated_at ON events;
      CREATE TRIGGER update_events_updated_at
        BEFORE UPDATE ON events
        FOR EACH ROW
        EXECUTE FUNCTION update_events_updated_at();
    `);

    logger.info('Events table and indexes created successfully');
  }

  /**
   * Find events with filters and pagination
   */
  async findWithFilters(filters = {}, pagination = { page: 1, limit: 20 }, sort = { field: 'start_date', order: 'asc' }) {
    let query = `
      SELECT 
        id, title, description, category, tags,
        venue_name, venue_address, city, country,
        start_date, end_date, timezone,
        base_price, currency, is_free,
        max_attendees, available_tickets, status, is_featured,
        cover_image_url,
        organizer_id, organizer_first_name, organizer_last_name, organizer_verified,
        popularity_score, view_count, bookmark_count, registration_count,
        created_at, updated_at
      FROM events 
      WHERE deleted_at IS NULL
    `;

    const params = [];
    let paramCount = 0;

    // Add filters
    if (filters.category && filters.category !== 'all') {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.city) {
      paramCount++;
      query += ` AND city ILIKE $${paramCount}`;
      params.push(`%${filters.city}%`);
    }

    if (filters.country) {
      paramCount++;
      query += ` AND country ILIKE $${paramCount}`;
      params.push(`%${filters.country}%`);
    }

    if (filters.is_free !== undefined) {
      paramCount++;
      query += ` AND is_free = $${paramCount}`;
      params.push(filters.is_free);
    }

    if (filters.is_featured !== undefined) {
      paramCount++;
      query += ` AND is_featured = $${paramCount}`;
      params.push(filters.is_featured);
    }

    if (filters.organizer_id) {
      paramCount++;
      query += ` AND organizer_id = $${paramCount}`;
      params.push(filters.organizer_id);
    }

    if (filters.price_min !== undefined) {
      paramCount++;
      query += ` AND base_price >= $${paramCount}`;
      params.push(filters.price_min);
    }

    if (filters.price_max !== undefined) {
      paramCount++;
      query += ` AND base_price <= $${paramCount}`;
      params.push(filters.price_max);
    }

    if (filters.start_date) {
      paramCount++;
      query += ` AND start_date >= $${paramCount}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      paramCount++;
      query += ` AND start_date <= $${paramCount}`;
      params.push(filters.end_date);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (
        title ILIKE $${paramCount} OR 
        description ILIKE $${paramCount} OR 
        venue_name ILIKE $${paramCount} OR
        CONCAT(organizer_first_name, ' ', organizer_last_name) ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
    }

    // Add sorting
    const validSortFields = ['start_date', 'created_at', 'base_price', 'popularity_score', 'title'];
    const sortField = validSortFields.includes(sort.field) ? sort.field : 'start_date';
    const sortOrder = sort.order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Add pagination
    const offset = (pagination.page - 1) * pagination.limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(pagination.limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await this.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM events WHERE deleted_at IS NULL`;
    const countParams = [];
    let countParamCount = 0;

    // Apply same filters for count
    if (filters.category && filters.category !== 'all') {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(filters.category);
    }

    if (filters.status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(filters.status);
    }

    if (filters.city) {
      countParamCount++;
      countQuery += ` AND city ILIKE $${countParamCount}`;
      countParams.push(`%${filters.city}%`);
    }

    if (filters.country) {
      countParamCount++;
      countQuery += ` AND country ILIKE $${countParamCount}`;
      countParams.push(`%${filters.country}%`);
    }

    if (filters.is_free !== undefined) {
      countParamCount++;
      countQuery += ` AND is_free = $${countParamCount}`;
      countParams.push(filters.is_free);
    }

    if (filters.is_featured !== undefined) {
      countParamCount++;
      countQuery += ` AND is_featured = $${countParamCount}`;
      countParams.push(filters.is_featured);
    }

    if (filters.organizer_id) {
      countParamCount++;
      countQuery += ` AND organizer_id = $${countParamCount}`;
      countParams.push(filters.organizer_id);
    }

    if (filters.price_min !== undefined) {
      countParamCount++;
      countQuery += ` AND base_price >= $${countParamCount}`;
      countParams.push(filters.price_min);
    }

    if (filters.price_max !== undefined) {
      countParamCount++;
      countQuery += ` AND base_price <= $${countParamCount}`;
      countParams.push(filters.price_max);
    }

    if (filters.start_date) {
      countParamCount++;
      countQuery += ` AND start_date >= $${countParamCount}`;
      countParams.push(filters.start_date);
    }

    if (filters.end_date) {
      countParamCount++;
      countQuery += ` AND start_date <= $${countParamCount}`;
      countParams.push(filters.end_date);
    }

    if (filters.search) {
      countParamCount++;
      countQuery += ` AND (
        title ILIKE $${countParamCount} OR 
        description ILIKE $${countParamCount} OR 
        venue_name ILIKE $${countParamCount} OR
        CONCAT(organizer_first_name, ' ', organizer_last_name) ILIKE $${countParamCount}
      )`;
      countParams.push(`%${filters.search}%`);
    }

    const countResult = await this.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return {
      events: result.rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
        hasMore: total > (pagination.page * pagination.limit)
      }
    };
  }

  /**
   * Get event categories with counts
   */
  async getCategories() {
    const query = `
      SELECT category, COUNT(*) as count 
      FROM events 
      WHERE deleted_at IS NULL AND status = 'published'
      GROUP BY category 
      ORDER BY count DESC, category ASC
    `;

    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Get event locations with counts
   */
  async getLocations() {
    const query = `
      SELECT 
        city, 
        country, 
        COUNT(*) as count 
      FROM events 
      WHERE deleted_at IS NULL AND status = 'published' AND city IS NOT NULL
      GROUP BY city, country 
      ORDER BY count DESC, city ASC
      LIMIT 50
    `;

    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Update event analytics
   */
  async updateAnalytics(eventId, analytics) {
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (analytics.view_count !== undefined) {
      paramCount++;
      updates.push(`view_count = $${paramCount}`);
      params.push(analytics.view_count);
    }

    if (analytics.bookmark_count !== undefined) {
      paramCount++;
      updates.push(`bookmark_count = $${paramCount}`);
      params.push(analytics.bookmark_count);
    }

    if (analytics.registration_count !== undefined) {
      paramCount++;
      updates.push(`registration_count = $${paramCount}`);
      params.push(analytics.registration_count);
    }

    if (analytics.popularity_score !== undefined) {
      paramCount++;
      updates.push(`popularity_score = $${paramCount}`);
      params.push(analytics.popularity_score);
    }

    if (updates.length === 0) {
      return null;
    }

    paramCount++;
    const query = `
      UPDATE events 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;
    params.push(eventId);

    const result = await this.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(eventId) {
    const query = `
      UPDATE events 
      SET view_count = view_count + 1, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING view_count
    `;

    const result = await this.query(query, [eventId]);
    return result.rows[0]?.view_count || 0;
  }

  /**
   * Get trending events
   */
  async getTrending(limit = 20, timeframe = 'week') {
    let dateFilter = '';
    
    switch (timeframe) {
      case 'day':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 day'";
        break;
      case 'week':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 week'";
        break;
      case 'month':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 month'";
        break;
    }

    const query = `
      SELECT 
        id, title, description, category, tags,
        venue_name, venue_address, city, country,
        start_date, end_date, timezone,
        base_price, currency, is_free,
        max_attendees, available_tickets, status, is_featured,
        cover_image_url,
        organizer_id, organizer_first_name, organizer_last_name, organizer_verified,
        popularity_score, view_count, bookmark_count, registration_count,
        created_at, updated_at
      FROM events 
      WHERE deleted_at IS NULL 
        AND status = 'published' 
        AND start_date >= NOW()
        ${dateFilter}
      ORDER BY 
        popularity_score DESC, 
        view_count DESC, 
        registration_count DESC,
        created_at DESC
      LIMIT $1
    `;

    const result = await this.query(query, [limit]);
    return result.rows;
  }

  /**
   * Search events by text
   */
  async searchByText(searchText, filters = {}, pagination = { page: 1, limit: 20 }) {
    const searchFilters = {
      ...filters,
      search: searchText
    };

    return this.findWithFilters(searchFilters, pagination);
  }
}

module.exports = new Event();
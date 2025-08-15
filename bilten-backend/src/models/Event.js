const db = require('./index');

class Event {
  static get tableName() {
    return 'events';
  }

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created event
   */
  static async create(eventData) {
    const {
      title,
      description,
      category,
      venueName,
      venueAddress,
      startDate,
      endDate,
      timezone = 'UTC',
      maxAttendees,
      isFree = false,
      basePrice,
      organizerId,
      coverImageUrl,
    } = eventData;

    const [event] = await db(this.tableName)
      .insert({
        title,
        description,
        category,
        venue_name: venueName,
        venue_address: venueAddress,
        start_date: startDate,
        end_date: endDate,
        timezone,
        max_attendees: maxAttendees,
        is_free: isFree,
        base_price: basePrice,
        organizer_id: organizerId,
        cover_image_url: coverImageUrl,
        status: 'draft',
      })
      .returning('*');

    return event;
  }

  /**
   * Find event by ID with organizer information
   * @param {number} id - Event ID
   * @returns {Promise<Object|null>} Event object or null
   */
  static async findById(id) {
    const event = await db(this.tableName)
      .select(
        'events.*',
        'users.first_name as organizer_first_name',
        'users.last_name as organizer_last_name',
        'users.email as organizer_email'
      )
      .leftJoin('users', 'events.organizer_id', 'users.id')
      .where('events.id', id)
      .first();

    return event || null;
  }

  /**
   * Find all events with filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of events
   */
  static async findAll(filters = {}) {
    let query = db(this.tableName)
      .select(
        'events.*',
        'users.first_name as organizer_first_name',
        'users.last_name as organizer_last_name'
      )
      .leftJoin('users', 'events.organizer_id', 'users.id');

    // Filter by status (default to published for public API)
    if (filters.status) {
      query = query.where('events.status', filters.status);
    } else if (!filters.includeAll) {
      query = query.where('events.status', 'published');
    }

    // Filter by category
    if (filters.category) {
      query = query.where('events.category', filters.category);
    }

    // Filter by organizer
    if (filters.organizerId) {
      query = query.where('events.organizer_id', filters.organizerId);
    }

    // Filter by date range
    if (filters.startDate) {
      query = query.where('events.start_date', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query = query.where('events.end_date', '<=', filters.endDate);
    }

    // Filter by location
    if (filters.location) {
      query = query.where(function() {
        this.where('events.venue_name', 'ilike', `%${filters.location}%`)
            .orWhere('events.venue_address', 'ilike', `%${filters.location}%`);
      });
    }

    // Search functionality
    if (filters.search) {
      query = query.where(function() {
        this.where('events.title', 'ilike', `%${filters.search}%`)
            .orWhere('events.description', 'ilike', `%${filters.search}%`)
            .orWhere('events.venue_name', 'ilike', `%${filters.search}%`);
      });
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      query = query.where('events.base_price', '>=', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.where('events.base_price', '<=', filters.maxPrice);
    }

    // Filter free events
    if (filters.freeOnly === true) {
      query = query.where('events.is_free', true);
    }

    // Sorting
    const sortBy = filters.sortBy || 'start_date';
    const sortOrder = filters.sortOrder || 'asc';
    
    if (sortBy === 'popularity') {
      // TODO: Implement popularity sorting based on ticket sales
      query = query.orderBy('events.created_at', 'desc');
    } else {
      query = query.orderBy(`events.${sortBy}`, sortOrder);
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
   * Update event
   * @param {number} id - Event ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated event
   */
  static async update(id, updateData) {
    const allowedFields = [
      'title',
      'description',
      'category',
      'venue_name',
      'venue_address',
      'start_date',
      'end_date',
      'timezone',
      'max_attendees',
      'is_free',
      'base_price',
      'cover_image_url',
      'status',
    ];

    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    filteredData.updated_at = new Date();

    const [event] = await db(this.tableName)
      .where({ id })
      .update(filteredData)
      .returning('*');

    return event;
  }

  /**
   * Delete event
   * @param {number} id - Event ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const deletedCount = await db(this.tableName)
      .where({ id })
      .del();

    return deletedCount > 0;
  }

  /**
   * Get events by organizer
   * @param {number} organizerId - Organizer ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of events
   */
  static async findByOrganizer(organizerId, filters = {}) {
    return this.findAll({
      ...filters,
      organizerId,
      includeAll: true, // Include all statuses for organizer
    });
  }

  /**
   * Get event statistics
   * @param {number} id - Event ID
   * @returns {Promise<Object>} Event statistics
   */
  static async getStatistics(id) {
    // Get basic event info
    const event = await this.findById(id);
    if (!event) {
      return null;
    }

    // Get ticket sales statistics
    const ticketStats = await db('orders')
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('SUM(total_amount) as total_revenue'),
        db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_orders')
      )
      .where('event_id', id)
      .first();

    // Get ticket type breakdown
    const ticketBreakdown = await db('order_items')
      .select('ticket_type', db.raw('COUNT(*) as quantity_sold'))
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('orders.event_id', id)
      .where('orders.status', 'completed')
      .groupBy('ticket_type');

    return {
      event: {
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        status: event.status,
      },
      sales: {
        total_orders: parseInt(ticketStats.total_orders) || 0,
        completed_orders: parseInt(ticketStats.completed_orders) || 0,
        total_revenue: parseFloat(ticketStats.total_revenue) || 0,
      },
      tickets: ticketBreakdown,
    };
  }

  /**
   * Publish event (change status to published)
   * @param {number} id - Event ID
   * @returns {Promise<Object>} Updated event
   */
  static async publish(id) {
    return this.update(id, { status: 'published' });
  }

  /**
   * Unpublish event (change status to draft)
   * @param {number} id - Event ID
   * @returns {Promise<Object>} Updated event
   */
  static async unpublish(id) {
    return this.update(id, { status: 'draft' });
  }

  /**
   * Get upcoming events
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of upcoming events
   */
  static async getUpcoming(filters = {}) {
    const now = new Date();
    return this.findAll({
      ...filters,
      startDate: now.toISOString(),
      status: 'published',
    });
  }

  /**
   * Get past events
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of past events
   */
  static async getPast(filters = {}) {
    const now = new Date();
    return this.findAll({
      ...filters,
      endDate: now.toISOString(),
      status: 'published',
      sortBy: 'end_date',
      sortOrder: 'desc',
    });
  }
}

module.exports = Event;
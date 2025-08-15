const db = require('./index');

class Order {
  static get tableName() {
    return 'orders';
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  static async create(orderData) {
    const {
      userId,
      eventId,
      totalAmount,
      paymentIntentId,
      items = [],
      promoCodeId = null,
      discountAmount = 0,
      promoCodeUsed = null,
    } = orderData;

    // Start transaction
    const trx = await db.transaction();

    try {
      // Create order
      const [order] = await trx(this.tableName)
        .insert({
          user_id: userId,
          event_id: eventId,
          total_amount: totalAmount,
          payment_intent_id: paymentIntentId,
          status: 'pending',
          promo_code_id: promoCodeId,
          discount_amount: discountAmount,
          promo_code_used: promoCodeUsed,
        })
        .returning('*');

      // Create order items
      if (items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: order.id,
          ticket_id: item.ticketId,
          ticket_type: item.ticketType,
          quantity: item.quantity,
          price: item.price,
        }));

        await trx('order_items').insert(orderItems);
      }

      // Record promo code usage if applicable
      if (promoCodeId && discountAmount > 0) {
        const PromoCode = require('./PromoCode');
        await PromoCode.recordUsage(promoCodeId, userId, order.id, discountAmount);
      }

      await trx.commit();
      return order;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Find order by ID with items
   * @param {number} id - Order ID
   * @returns {Promise<Object|null>} Order object or null
   */
  static async findById(id) {
    const order = await db(this.tableName)
      .select(
        'orders.*',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'users.email as user_email',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.venue_name as event_venue_name',
        'promo_codes.name as promo_code_name',
        'promo_codes.code as promo_code_code'
      )
      .leftJoin('users', 'orders.user_id', 'users.id')
      .leftJoin('events', 'orders.event_id', 'events.id')
      .leftJoin('promo_codes', 'orders.promo_code_id', 'promo_codes.id')
      .where('orders.id', id)
      .first();

    if (!order) {
      return null;
    }

    // Get order items
    const items = await db('order_items')
      .where({ order_id: id });

    order.items = items;
    return order;
  }

  /**
   * Find orders by user
   * @param {number} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of orders
   */
  static async findByUser(userId, filters = {}) {
    let query = db(this.tableName)
      .select(
        'orders.*',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.venue_name as event_venue_name',
        'events.cover_image_url as event_cover_image_url'
      )
      .leftJoin('events', 'orders.event_id', 'events.id')
      .where('orders.user_id', userId);

    // Filter by status
    if (filters.status) {
      query = query.where('orders.status', filters.status);
    }

    // Filter by date range
    if (filters.startDate) {
      query = query.where('orders.created_at', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query = query.where('orders.created_at', '<=', filters.endDate);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.orderBy(`orders.${sortBy}`, sortOrder);

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const orders = await query;

    // Get items for each order
    for (const order of orders) {
      const items = await db('order_items')
        .where({ order_id: order.id });
      order.items = items;
    }

    return orders;
  }

  /**
   * Find orders by event
   * @param {number} eventId - Event ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of orders
   */
  static async findByEvent(eventId, filters = {}) {
    let query = db(this.tableName)
      .select(
        'orders.*',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'users.email as user_email'
      )
      .leftJoin('users', 'orders.user_id', 'users.id')
      .where('orders.event_id', eventId);

    // Filter by status
    if (filters.status) {
      query = query.where('orders.status', filters.status);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.orderBy(`orders.${sortBy}`, sortOrder);

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const orders = await query;

    // Get items for each order
    for (const order of orders) {
      const items = await db('order_items')
        .where({ order_id: order.id });
      order.items = items;
    }

    return orders;
  }

  /**
   * Update order status
   * @param {number} id - Order ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Updated order
   */
  static async updateStatus(id, status, additionalData = {}) {
    const updateData = {
      status,
      updated_at: new Date(),
      ...additionalData,
    };

    const [order] = await db(this.tableName)
      .where({ id })
      .update(updateData)
      .returning('*');

    return order;
  }

  /**
   * Complete order (mark as completed)
   * @param {number} id - Order ID
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Updated order
   */
  static async complete(id, paymentIntentId = null) {
    const updateData = {
      status: 'completed',
      updated_at: new Date(),
    };

    if (paymentIntentId) {
      updateData.payment_intent_id = paymentIntentId;
    }

    return this.updateStatus(id, 'completed', updateData);
  }

  /**
   * Cancel order
   * @param {number} id - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated order
   */
  static async cancel(id, reason = null) {
    const updateData = {
      status: 'cancelled',
      updated_at: new Date(),
    };

    if (reason) {
      updateData.cancellation_reason = reason;
    }

    return this.updateStatus(id, 'cancelled', updateData);
  }

  /**
   * Get order statistics for an event
   * @param {number} eventId - Event ID
   * @returns {Promise<Object>} Order statistics
   */
  static async getEventStatistics(eventId) {
    const stats = await db(this.tableName)
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_orders'),
        db.raw('COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending_orders'),
        db.raw('COUNT(CASE WHEN status = \'cancelled\' THEN 1 END) as cancelled_orders'),
        db.raw('SUM(CASE WHEN status = \'completed\' THEN total_amount ELSE 0 END) as total_revenue'),
        db.raw('AVG(CASE WHEN status = \'completed\' THEN total_amount ELSE NULL END) as average_order_value')
      )
      .where('event_id', eventId)
      .first();

    // Get ticket breakdown
    const ticketBreakdown = await db('order_items')
      .select(
        'ticket_type',
        db.raw('SUM(quantity) as total_quantity'),
        db.raw('SUM(quantity * price) as total_revenue')
      )
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('orders.event_id', eventId)
      .where('orders.status', 'completed')
      .groupBy('ticket_type');

    return {
      orders: {
        total: parseInt(stats.total_orders) || 0,
        completed: parseInt(stats.completed_orders) || 0,
        pending: parseInt(stats.pending_orders) || 0,
        cancelled: parseInt(stats.cancelled_orders) || 0,
      },
      revenue: {
        total: parseFloat(stats.total_revenue) || 0,
        average_order_value: parseFloat(stats.average_order_value) || 0,
      },
      tickets: ticketBreakdown.map(item => ({
        type: item.ticket_type,
        quantity_sold: parseInt(item.total_quantity),
        revenue: parseFloat(item.total_revenue),
      })),
    };
  }

  /**
   * Get user order statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User order statistics
   */
  static async getUserStatistics(userId) {
    const stats = await db(this.tableName)
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_orders'),
        db.raw('SUM(CASE WHEN status = \'completed\' THEN total_amount ELSE 0 END) as total_spent')
      )
      .where('user_id', userId)
      .first();

    return {
      total_orders: parseInt(stats.total_orders) || 0,
      completed_orders: parseInt(stats.completed_orders) || 0,
      total_spent: parseFloat(stats.total_spent) || 0,
    };
  }

  /**
   * Delete order (admin only)
   * @param {number} id - Order ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const trx = await db.transaction();

    try {
      // Delete order items first
      await trx('order_items').where({ order_id: id }).del();
      
      // Delete order
      const deletedCount = await trx(this.tableName)
        .where({ id })
        .del();

      await trx.commit();
      return deletedCount > 0;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}

module.exports = Order;
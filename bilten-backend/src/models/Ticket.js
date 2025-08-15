const db = require('./index');

class Ticket {
  static get tableName() {
    return 'tickets';
  }

  /**
   * Create a new ticket type
   * @param {Object} ticketData - Ticket data
   * @returns {Promise<Object>} Created ticket
   */
  static async create(ticketData) {
    const {
      eventId,
      type,
      price,
      quantityAvailable,
      description,
    } = ticketData;

    const [ticket] = await db(this.tableName)
      .insert({
        event_id: eventId,
        type,
        price,
        quantity_available: quantityAvailable,
        description,
      })
      .returning('*');

    return ticket;
  }

  /**
   * Find ticket by ID
   * @param {number} id - Ticket ID
   * @returns {Promise<Object|null>} Ticket object or null
   */
  static async findById(id) {
    const ticket = await db(this.tableName)
      .where({ id })
      .first();

    return ticket || null;
  }

  /**
   * Find all tickets for an event
   * @param {number} eventId - Event ID
   * @returns {Promise<Array>} Array of tickets
   */
  static async findByEvent(eventId) {
    const tickets = await db(this.tableName)
      .where({ event_id: eventId })
      .orderBy('price', 'asc');

    // Add availability information
    for (const ticket of tickets) {
      const soldCount = await this.getSoldCount(ticket.id);
      ticket.quantity_sold = soldCount;
      ticket.quantity_remaining = ticket.quantity_available - soldCount;
      ticket.is_available = ticket.quantity_remaining > 0;
    }

    return tickets;
  }

  /**
   * Update ticket
   * @param {number} id - Ticket ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated ticket
   */
  static async update(id, updateData) {
    const allowedFields = [
      'type',
      'price',
      'quantity_available',
      'description',
    ];

    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    const [ticket] = await db(this.tableName)
      .where({ id })
      .update(filteredData)
      .returning('*');

    return ticket;
  }

  /**
   * Delete ticket
   * @param {number} id - Ticket ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const deletedCount = await db(this.tableName)
      .where({ id })
      .del();

    return deletedCount > 0;
  }

  /**
   * Get sold count for a ticket type
   * @param {number} ticketId - Ticket ID
   * @returns {Promise<number>} Number of sold tickets
   */
  static async getSoldCount(ticketId) {
    const result = await db('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('order_items.ticket_id', ticketId)
      .where('orders.status', 'completed')
      .sum('order_items.quantity as total')
      .first();

    return parseInt(result.total) || 0;
  }

  /**
   * Check ticket availability
   * @param {number} ticketId - Ticket ID
   * @param {number} requestedQuantity - Requested quantity
   * @returns {Promise<Object>} Availability information
   */
  static async checkAvailability(ticketId, requestedQuantity) {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return {
        available: false,
        reason: 'Ticket type not found',
      };
    }

    const soldCount = await this.getSoldCount(ticketId);
    const remainingQuantity = ticket.quantity_available - soldCount;

    if (remainingQuantity < requestedQuantity) {
      return {
        available: false,
        reason: 'Insufficient tickets available',
        remaining: remainingQuantity,
        requested: requestedQuantity,
      };
    }

    return {
      available: true,
      remaining: remainingQuantity,
      requested: requestedQuantity,
    };
  }

  /**
   * Reserve tickets (for order processing)
   * @param {number} ticketId - Ticket ID
   * @param {number} quantity - Quantity to reserve
   * @returns {Promise<boolean>} Success status
   */
  static async reserve(ticketId, quantity) {
    // This is a simplified reservation system
    // In production, you might want to implement a proper reservation table
    const availability = await this.checkAvailability(ticketId, quantity);
    
    if (!availability.available) {
      throw new Error(availability.reason);
    }

    return true;
  }

  /**
   * Get ticket sales statistics
   * @param {number} eventId - Event ID
   * @returns {Promise<Array>} Ticket sales statistics
   */
  static async getSalesStatistics(eventId) {
    const tickets = await db(this.tableName)
      .select(
        'tickets.*',
        db.raw('COALESCE(SUM(order_items.quantity), 0) as quantity_sold'),
        db.raw('COALESCE(SUM(order_items.quantity * order_items.price), 0) as revenue')
      )
      .leftJoin('order_items', 'tickets.id', 'order_items.ticket_id')
      .leftJoin('orders', function() {
        this.on('order_items.order_id', 'orders.id')
            .andOn('orders.status', db.raw('?', ['completed']));
      })
      .where('tickets.event_id', eventId)
      .groupBy('tickets.id')
      .orderBy('tickets.price', 'asc');

    return tickets.map(ticket => ({
      ...ticket,
      quantity_sold: parseInt(ticket.quantity_sold),
      revenue: parseFloat(ticket.revenue),
      quantity_remaining: ticket.quantity_available - parseInt(ticket.quantity_sold),
      sell_through_rate: ticket.quantity_available > 0 
        ? (parseInt(ticket.quantity_sold) / ticket.quantity_available * 100).toFixed(2)
        : 0,
    }));
  }

  /**
   * Create default ticket types for an event
   * @param {number} eventId - Event ID
   * @param {Object} eventData - Event data for pricing
   * @returns {Promise<Array>} Created tickets
   */
  static async createDefaultTickets(eventId, eventData = {}) {
    const defaultTickets = [
      {
        eventId,
        type: 'standing',
        price: eventData.basePrice || 25.00,
        quantityAvailable: 150,
        description: 'General admission standing area with great views of the stage',
      },
      {
        eventId,
        type: 'vipStanding',
        price: (eventData.basePrice || 25.00) * 3,
        quantityAvailable: 50,
        description: 'Premium standing area with exclusive access and better views',
      },
      {
        eventId,
        type: 'backStage',
        price: (eventData.basePrice || 25.00) * 6,
        quantityAvailable: 20,
        description: 'Exclusive backstage access with meet & greet opportunity',
      },
    ];

    const createdTickets = [];
    for (const ticketData of defaultTickets) {
      const ticket = await this.create(ticketData);
      createdTickets.push(ticket);
    }

    return createdTickets;
  }

  /**
   * Get available ticket types for an event (public API)
   * @param {number} eventId - Event ID
   * @returns {Promise<Array>} Available tickets
   */
  static async getAvailableTickets(eventId) {
    const tickets = await this.findByEvent(eventId);
    
    // Only return tickets that are available
    return tickets.filter(ticket => ticket.is_available);
  }
}

module.exports = Ticket;
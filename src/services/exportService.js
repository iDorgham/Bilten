const knex = require('../utils/database');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

class ExportService {
  constructor() {
    this.exportTypes = {
      events: this.exportEvents.bind(this),
      users: this.exportUsers.bind(this),
      orders: this.exportOrders.bind(this),
      tickets: this.exportTickets.bind(this),
      analytics: this.exportAnalytics.bind(this),
      tracking: this.exportTracking.bind(this),
      financial: this.exportFinancial.bind(this)
    };
  }

  /**
   * Main export method
   */
  async exportData(config) {
    const {
      type,
      format = 'csv',
      filters = {},
      dateRange = {},
      includeRelations = false,
      limit = null
    } = config;

    try {
      // Validate export type
      if (!this.exportTypes[type]) {
        throw new Error(`Unsupported export type: ${type}`);
      }

      // Get data
      const data = await this.exportTypes[type]({
        filters,
        dateRange,
        includeRelations,
        limit
      });

      // Format data based on requested format
      const formattedData = await this.formatData(data, format, config);

      return {
        success: true,
        data: formattedData,
        metadata: {
          type,
          format,
          recordCount: Array.isArray(data) ? data.length : 1,
          exportDate: new Date().toISOString(),
          filters,
          dateRange
        }
      };
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  /**
   * Export events data
   */
  async exportEvents(config) {
    const { filters, dateRange, includeRelations } = config;

    let query = knex('events')
      .select([
        'events.*',
        'users.first_name as organizer_first_name',
        'users.last_name as organizer_last_name',
        'users.email as organizer_email'
      ])
      .leftJoin('users', 'events.organizer_id', 'users.id');

    // Apply date filters
    if (dateRange.startDate) {
      query = query.where('events.created_at', '>=', dateRange.startDate);
    }
    if (dateRange.endDate) {
      query = query.where('events.created_at', '<=', dateRange.endDate);
    }

    // Apply custom filters
    if (filters.category) {
      query = query.where('events.category', filters.category);
    }
    if (filters.status) {
      query = query.where('events.status', filters.status);
    }
    if (filters.organizerId) {
      query = query.where('events.organizer_id', filters.organizerId);
    }

    // Include related data if requested
    if (includeRelations) {
      const events = await query;
      
      // Get tickets for each event
      for (let event of events) {
        event.tickets = await knex('tickets')
          .where('event_id', event.id)
          .select('*');
        
        event.orders = await knex('orders')
          .where('event_id', event.id)
          .select('*');
      }
      
      return events;
    }

    return await query;
  }

  /**
   * Export users data
   */
  async exportUsers(config) {
    const { filters, dateRange, includeRelations } = config;

    let query = knex('users').select('*');

    // Apply date filters
    if (dateRange.startDate) {
      query = query.where('users.created_at', '>=', dateRange.startDate);
    }
    if (dateRange.endDate) {
      query = query.where('users.created_at', '<=', dateRange.endDate);
    }

    // Apply custom filters
    if (filters.role) {
      query = query.where('users.role', filters.role);
    }
    if (filters.status) {
      query = query.where('users.status', filters.status);
    }

    // Include related data if requested
    if (includeRelations) {
      const users = await query;
      
      for (let user of users) {
        user.orders = await knex('orders')
          .where('user_id', user.id)
          .select('*');
        
        user.tickets = await knex('user_tickets')
          .where('user_id', user.id)
          .select('*');
        
        user.events = await knex('events')
          .where('organizer_id', user.id)
          .select('*');
      }
      
      return users;
    }

    return await query;
  }

  /**
   * Export orders data
   */
  async exportOrders(config) {
    const { filters, dateRange, includeRelations } = config;

    let query = knex('orders')
      .select([
        'orders.*',
        'users.first_name as customer_first_name',
        'users.last_name as customer_last_name',
        'users.email as customer_email',
        'events.title as event_title'
      ])
      .leftJoin('users', 'orders.user_id', 'users.id')
      .leftJoin('events', 'orders.event_id', 'events.id');

    // Apply date filters
    if (dateRange.startDate) {
      query = query.where('orders.created_at', '>=', dateRange.startDate);
    }
    if (dateRange.endDate) {
      query = query.where('orders.created_at', '<=', dateRange.endDate);
    }

    // Apply custom filters
    if (filters.status) {
      query = query.where('orders.status', filters.status);
    }
    if (filters.paymentMethod) {
      query = query.where('orders.payment_method', filters.paymentMethod);
    }

    // Include related data if requested
    if (includeRelations) {
      const orders = await query;
      
      for (let order of orders) {
        order.items = await knex('order_items')
          .where('order_id', order.id)
          .select('*');
      }
      
      return orders;
    }

    return await query;
  }

  /**
   * Export tickets data
   */
  async exportTickets(config) {
    const { filters, dateRange, includeRelations } = config;

    let query = knex('tickets')
      .select([
        'tickets.*',
        'events.title as event_title',
        'events.category as event_category'
      ])
      .leftJoin('events', 'tickets.event_id', 'events.id');

    // Apply date filters
    if (dateRange.startDate) {
      query = query.where('tickets.created_at', '>=', dateRange.startDate);
    }
    if (dateRange.endDate) {
      query = query.where('tickets.created_at', '<=', dateRange.endDate);
    }

    // Apply custom filters
    if (filters.eventId) {
      query = query.where('tickets.event_id', filters.eventId);
    }
    if (filters.status) {
      query = query.where('tickets.status', filters.status);
    }

    return await query;
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(config) {
    const { filters, dateRange } = config;

    // Get analytics data from tracking tables
    const analyticsData = await knex('user_activity_tracking')
      .select('*')
      .where('created_at', '>=', dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .where('created_at', '<=', dateRange.endDate || new Date())
      .orderBy('created_at', 'desc');

    return analyticsData;
  }

  /**
   * Export tracking data
   */
  async exportTracking(config) {
    const { filters, dateRange } = config;

    const trackingData = await knex('user_activity_tracking')
      .select('*')
      .where('created_at', '>=', dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .where('created_at', '<=', dateRange.endDate || new Date())
      .orderBy('created_at', 'desc');

    return trackingData;
  }

  /**
   * Export financial data
   */
  async exportFinancial(config) {
    const { filters, dateRange } = config;

    const financialData = await knex('orders')
      .select([
        'orders.*',
        'users.first_name as customer_first_name',
        'users.last_name as customer_last_name',
        'events.title as event_title'
      ])
      .leftJoin('users', 'orders.user_id', 'users.id')
      .leftJoin('events', 'orders.event_id', 'events.id')
      .where('orders.status', 'completed')
      .where('orders.created_at', '>=', dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .where('orders.created_at', '<=', dateRange.endDate || new Date())
      .orderBy('orders.created_at', 'desc');

    return financialData;
  }

  /**
   * Format data based on requested format
   */
  async formatData(data, format, config) {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.toCSV(data);
      case 'json':
        return this.toJSON(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert data to CSV format
   */
  toCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Convert data to JSON format
   */
  toJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Save export to file system
   */
  async saveExport(data, filename, format) {
    const exportDir = path.join(__dirname, '../exports');
    
    // Create exports directory if it doesn't exist
    try {
      await mkdirAsync(exportDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const filepath = path.join(exportDir, filename);
    await writeFileAsync(filepath, data, 'utf8');

    return filepath;
  }

  /**
   * Get available export types
   */
  getAvailableTypes() {
    return Object.keys(this.exportTypes);
  }

  /**
   * Get export type metadata
   */
  getExportTypeMetadata() {
    return {
      events: {
        name: 'Events',
        description: 'Export event data with organizer information',
        fields: ['id', 'title', 'description', 'start_date', 'end_date', 'venue_name', 'category', 'status', 'organizer_id'],
        relations: ['tickets', 'orders']
      },
      users: {
        name: 'Users',
        description: 'Export user data with role and activity information',
        fields: ['id', 'first_name', 'last_name', 'email', 'role', 'status', 'created_at'],
        relations: ['orders', 'tickets', 'events']
      },
      orders: {
        name: 'Orders',
        description: 'Export order data with customer and event information',
        fields: ['id', 'user_id', 'event_id', 'total_amount', 'status', 'payment_method', 'created_at'],
        relations: ['items']
      },
      tickets: {
        name: 'Tickets',
        description: 'Export ticket data with event information',
        fields: ['id', 'event_id', 'name', 'price', 'quantity_total', 'quantity_sold', 'status'],
        relations: []
      },
      analytics: {
        name: 'Analytics',
        description: 'Export analytics and tracking data',
        fields: ['id', 'user_id', 'event_type', 'event_data', 'created_at'],
        relations: []
      },
      tracking: {
        name: 'Tracking',
        description: 'Export user activity tracking data',
        fields: ['id', 'user_id', 'session_id', 'event_type', 'page_url', 'created_at'],
        relations: []
      },
      financial: {
        name: 'Financial',
        description: 'Export financial data and revenue information',
        fields: ['id', 'user_id', 'event_id', 'total_amount', 'status', 'payment_method', 'created_at'],
        relations: []
      }
    };
  }
}

module.exports = new ExportService();

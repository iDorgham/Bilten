const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');
const QRGenerator = require('../../utils/qrGenerator');
const crypto = require('crypto');

const router = express.Router();

// GET /tickets/my-tickets - Get user's tickets
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('user_tickets')
      .select([
        'user_tickets.*',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.end_date as event_end_date',
        'events.venue_name',
        'events.venue_address',
        'events.cover_image_url',
        'tickets.name as ticket_type_name',
        'tickets.type as ticket_type',
        'orders.order_number'
      ])
      .leftJoin('events', 'user_tickets.event_id', 'events.id')
      .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
      .leftJoin('orders', 'user_tickets.order_id', 'orders.id')
      .where('user_tickets.user_id', req.user.id)
      .orderBy('user_tickets.created_at', 'desc');

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where('user_tickets.status', status);
    }

    const tickets = await query
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = knex('user_tickets')
      .where('user_id', req.user.id);
    
    if (status && status !== 'all') {
      countQuery = countQuery.where('status', status);
    }

    const total = await countQuery.count('* as count').first();

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /tickets/:id - Get specific ticket details with QR code
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await knex('user_tickets')
      .select([
        'user_tickets.*',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.end_date as event_end_date',
        'events.venue_name',
        'events.venue_address',
        'events.cover_image_url',
        'events.description as event_description',
        'tickets.name as ticket_type_name',
        'tickets.type as ticket_type',
        'tickets.description as ticket_type_description',
        'orders.order_number',
        'orders.total as order_total',
        'orders.status as order_status'
      ])
      .leftJoin('events', 'user_tickets.event_id', 'events.id')
      .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
      .leftJoin('orders', 'user_tickets.order_id', 'orders.id')
      .where('user_tickets.id', req.params.id)
      .where('user_tickets.user_id', req.user.id)
      .first();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Generate QR code for the ticket
    const qrCodeData = {
      ticketId: ticket.id,
      eventId: ticket.event_id,
      userId: ticket.user_id,
      ticketNumber: ticket.ticket_number
    };

    const qrCodeImage = await QRGenerator.generateTicketQR(qrCodeData);

    res.json({
      success: true,
      data: {
        ticket: {
          ...ticket,
          qr_code_image: qrCodeImage
        }
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /tickets/:id/qr - Get QR code for a specific ticket
router.get('/:id/qr', authenticateToken, async (req, res) => {
  try {
    const ticket = await knex('user_tickets')
      .select(['id', 'event_id', 'user_id', 'ticket_number', 'status'])
      .where('id', req.params.id)
      .where('user_id', req.user.id)
      .first();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not active'
      });
    }

    // Generate QR code
    const qrCodeData = {
      ticketId: ticket.id,
      eventId: ticket.event_id,
      userId: ticket.user_id,
      ticketNumber: ticket.ticket_number
    };

    const qrCodeImage = await QRGenerator.generateTicketQR(qrCodeData);

    res.json({
      success: true,
      data: {
        qr_code: qrCodeImage,
        ticket_number: ticket.ticket_number
      }
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /tickets/generate-tickets - Generate individual tickets for an order
router.post('/generate-tickets', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Verify order belongs to user and is completed
    const order = await knex('orders')
      .where('id', orderId)
      .where('user_id', req.user.id)
      .where('status', 'completed')
      .first();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not completed'
      });
    }

    // Get order items
    const orderItems = await knex('order_items')
      .select([
        'order_items.*',
        'tickets.name as ticket_name',
        'tickets.type as ticket_type',
        'tickets.description as ticket_description'
      ])
      .leftJoin('tickets', 'order_items.ticket_id', 'tickets.id')
      .where('order_items.order_id', orderId);

    const generatedTickets = [];

    // Generate individual tickets for each order item
    for (const item of orderItems) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketNumber = QRGenerator.generateTicketNumber(order.event_id, item.ticket_id);
        const qrHash = QRGenerator.generateQRHash(ticketNumber);

        const [ticket] = await knex('user_tickets')
          .insert({
            user_id: req.user.id,
            order_id: orderId,
            order_item_id: item.id,
            event_id: order.event_id,
            ticket_type_id: item.ticket_id,
            ticket_number: ticketNumber,
            qr_code: qrHash,
            ticket_data: {
              name: item.ticket_name,
              type: item.ticket_type,
              description: item.ticket_description,
              unit_price: item.unit_price
            }
          })
          .returning('*');

        generatedTickets.push(ticket);
      }
    }

    res.json({
      success: true,
      message: 'Tickets generated successfully',
      data: {
        tickets: generatedTickets
      }
    });
  } catch (error) {
    console.error('Generate tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /tickets/validate - Validate ticket QR code (for event entry)
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      });
    }

    // Decode QR data
    const decodedData = QRGenerator.decodeQRData(qrData);
    
    if (!decodedData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code'
      });
    }

    // Validate timestamp (prevent replay attacks)
    if (!QRGenerator.validateTimestamp(decodedData.timestamp)) {
      return res.status(400).json({
        success: false,
        message: 'QR code has expired'
      });
    }

    // Find ticket in database
    const ticket = await knex('user_tickets')
      .select([
        'user_tickets.*',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.venue_name',
        'tickets.name as ticket_type_name'
      ])
      .leftJoin('events', 'user_tickets.event_id', 'events.id')
      .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
      .where('user_tickets.id', decodedData.ticketId)
      .where('user_tickets.qr_code', decodedData.signature)
      .first();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket'
      });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Ticket already used',
        data: {
          ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            event_title: ticket.event_title,
            used_at: ticket.used_at
          }
        }
      });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not valid',
        data: {
          ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status
          }
        }
      });
    }

    // Mark ticket as used
    await knex('user_tickets')
      .where('id', ticket.id)
      .update({
        status: 'used',
        used_at: new Date()
      });

    res.json({
      success: true,
      message: 'Ticket validated successfully',
      data: {
        ticket: {
          ...ticket,
          status: 'used',
          used_at: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /tickets/event/:eventId - Get all tickets for an event (organizer only)
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is organizer for this event
    const event = await knex('events')
      .where('id', eventId)
      .where('organizer_id', req.user.id)
      .first();

    if (!event) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the organizer of this event.'
      });
    }

    let query = knex('user_tickets')
      .select([
        'user_tickets.*',
        'users.first_name as attendee_first_name',
        'users.last_name as attendee_last_name',
        'users.email as attendee_email',
        'tickets.name as ticket_type_name',
        'tickets.price as ticket_price',
        'orders.order_number'
      ])
      .leftJoin('users', 'user_tickets.user_id', 'users.id')
      .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
      .leftJoin('orders', 'user_tickets.order_id', 'orders.id')
      .where('user_tickets.event_id', eventId)
      .orderBy('user_tickets.created_at', 'desc');

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where('user_tickets.status', status);
    }

    // Search functionality
    if (search) {
      query = query.where(function() {
        this.where('user_tickets.ticket_number', 'like', `%${search}%`)
          .orWhere('users.first_name', 'like', `%${search}%`)
          .orWhere('users.last_name', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('tickets.name', 'like', `%${search}%`);
      });
    }

    const tickets = await query
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = knex('user_tickets')
      .where('event_id', eventId);
    
    if (status && status !== 'all') {
      countQuery = countQuery.where('status', status);
    }

    if (search) {
      countQuery = countQuery.leftJoin('users', 'user_tickets.user_id', 'users.id')
        .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
        .where(function() {
          this.where('user_tickets.ticket_number', 'like', `%${search}%`)
            .orWhere('users.first_name', 'like', `%${search}%`)
            .orWhere('users.last_name', 'like', `%${search}%`)
            .orWhere('users.email', 'like', `%${search}%`)
            .orWhere('tickets.name', 'like', `%${search}%`);
        });
    }

    const total = await countQuery.count('* as count').first();

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get event tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /tickets/event/:eventId/stats - Get ticket statistics for an event (organizer only)
router.get('/event/:eventId/stats', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user is organizer for this event
    const event = await knex('events')
      .where('id', eventId)
      .where('organizer_id', req.user.id)
      .first();

    if (!event) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the organizer of this event.'
      });
    }

    // Get ticket statistics
    const stats = await knex('user_tickets')
      .select(
        knex.raw('COUNT(*) as total_tickets'),
        knex.raw('SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active_tickets'),
        knex.raw('SUM(CASE WHEN status = "used" THEN 1 ELSE 0 END) as used_tickets'),
        knex.raw('SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_tickets'),
        knex.raw('SUM(CASE WHEN status = "refunded" THEN 1 ELSE 0 END) as refunded_tickets')
      )
      .where('event_id', eventId)
      .first();

    // Get total revenue
    const revenue = await knex('user_tickets')
      .select(knex.raw('SUM(tickets.price) as total_revenue'))
      .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
      .where('user_tickets.event_id', eventId)
      .whereNotIn('user_tickets.status', ['cancelled', 'refunded'])
      .first();

    res.json({
      success: true,
      data: {
        stats: {
          totalTickets: parseInt(stats.total_tickets) || 0,
          activeTickets: parseInt(stats.active_tickets) || 0,
          usedTickets: parseInt(stats.used_tickets) || 0,
          cancelledTickets: parseInt(stats.cancelled_tickets) || 0,
          refundedTickets: parseInt(stats.refunded_tickets) || 0,
          totalRevenue: parseFloat(revenue.total_revenue) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get event ticket stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /tickets/:id/validate - Validate a specific ticket (organizer only)
router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await knex('user_tickets')
      .select([
        'user_tickets.*',
        'events.title as event_title',
        'events.organizer_id'
      ])
      .leftJoin('events', 'user_tickets.event_id', 'events.id')
      .where('user_tickets.id', id)
      .first();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user is organizer for this event
    if (ticket.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the organizer of this event.'
      });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Ticket already used'
      });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not valid'
      });
    }

    // Mark ticket as used
    await knex('user_tickets')
      .where('id', id)
      .update({
        status: 'used',
        used_at: new Date()
      });

    res.json({
      success: true,
      message: 'Ticket validated successfully',
      data: {
        ticket: {
          ...ticket,
          status: 'used',
          used_at: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /tickets/:id/cancel - Cancel a specific ticket (organizer only)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await knex('user_tickets')
      .select([
        'user_tickets.*',
        'events.title as event_title',
        'events.organizer_id'
      ])
      .leftJoin('events', 'user_tickets.event_id', 'events.id')
      .where('user_tickets.id', id)
      .first();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user is organizer for this event
    if (ticket.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the organizer of this event.'
      });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a used ticket'
      });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already cancelled or refunded'
      });
    }

    // Mark ticket as cancelled
    await knex('user_tickets')
      .where('id', id)
      .update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

    res.json({
      success: true,
      message: 'Ticket cancelled successfully',
      data: {
        ticket: {
          ...ticket,
          status: 'cancelled',
          cancelled_at: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
const QRGenerator = require('../utils/qrGenerator');
const knex = require('../utils/database');

/**
 * QR Code Controller
 * Handles QR code generation, validation, and management
 */
class QRController {
  /**
   * Generate QR code for a specific ticket
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async generateTicketQR(req, res) {
    try {
      const { ticketId } = req.params;
      const userId = req.user.id;

      // Get ticket details
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
        .where('user_tickets.id', ticketId)
        .where('user_tickets.user_id', userId)
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
          ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            event_title: ticket.event_title,
            event_start_date: ticket.event_start_date,
            venue_name: ticket.venue_name,
            ticket_type_name: ticket.ticket_type_name,
            status: ticket.status
          }
        }
      });
    } catch (error) {
      console.error('Generate QR code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate QR code'
      });
    }
  }

  /**
   * Validate QR code for event entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async validateQRCode(req, res) {
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
          message: 'Invalid QR code format'
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
          'events.end_date as event_end_date',
          'events.venue_name',
          'events.venue_address',
          'tickets.name as ticket_type_name',
          'tickets.price as ticket_price',
          'users.first_name as attendee_first_name',
          'users.last_name as attendee_last_name',
          'users.email as attendee_email'
        ])
        .leftJoin('events', 'user_tickets.event_id', 'events.id')
        .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
        .leftJoin('users', 'user_tickets.user_id', 'users.id')
        .where('user_tickets.id', decodedData.ticketId)
        .where('user_tickets.qr_code', decodedData.signature)
        .first();

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found in database'
        });
      }

      // Check if event is still valid
      const now = new Date();
      const eventStart = new Date(ticket.event_start_date);
      const eventEnd = new Date(ticket.event_end_date);

      if (now < eventStart) {
        return res.status(400).json({
          success: false,
          message: 'Event has not started yet',
          data: {
            ticket: {
              id: ticket.id,
              ticket_number: ticket.ticket_number,
              event_title: ticket.event_title,
              event_start_date: ticket.event_start_date,
              status: ticket.status
            }
          }
        });
      }

      if (now > eventEnd) {
        return res.status(400).json({
          success: false,
          message: 'Event has already ended',
          data: {
            ticket: {
              id: ticket.id,
              ticket_number: ticket.ticket_number,
              event_title: ticket.event_title,
              event_end_date: ticket.event_end_date,
              status: ticket.status
            }
          }
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
              used_at: ticket.used_at,
              attendee_name: `${ticket.attendee_first_name} ${ticket.attendee_last_name}`
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
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            event_title: ticket.event_title,
            event_start_date: ticket.event_start_date,
            venue_name: ticket.venue_name,
            venue_address: ticket.venue_address,
            ticket_type_name: ticket.ticket_type_name,
            ticket_price: ticket.ticket_price,
            attendee_name: `${ticket.attendee_first_name} ${ticket.attendee_last_name}`,
            attendee_email: ticket.attendee_email,
            status: 'used',
            used_at: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Validate QR code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate QR code'
      });
    }
  }

  /**
   * Generate QR codes for multiple tickets (bulk operation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async generateBulkQRCodes(req, res) {
    try {
      const { ticketIds } = req.body;
      const userId = req.user.id;

      if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Ticket IDs array is required'
        });
      }

      // Get tickets for the user
      const tickets = await knex('user_tickets')
        .select([
          'user_tickets.*',
          'events.title as event_title',
          'events.start_date as event_start_date',
          'events.venue_name',
          'tickets.name as ticket_type_name'
        ])
        .leftJoin('events', 'user_tickets.event_id', 'events.id')
        .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
        .whereIn('user_tickets.id', ticketIds)
        .where('user_tickets.user_id', userId)
        .where('user_tickets.status', 'active');

      if (tickets.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No valid tickets found'
        });
      }

      // Generate QR codes for each ticket
      const qrCodes = [];
      for (const ticket of tickets) {
        const qrCodeData = {
          ticketId: ticket.id,
          eventId: ticket.event_id,
          userId: ticket.user_id,
          ticketNumber: ticket.ticket_number
        };

        const qrCodeImage = await QRGenerator.generateTicketQR(qrCodeData);
        
        qrCodes.push({
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          event_title: ticket.event_title,
          event_start_date: ticket.event_start_date,
          venue_name: ticket.venue_name,
          ticket_type_name: ticket.ticket_type_name,
          qr_code: qrCodeImage
        });
      }

      res.json({
        success: true,
        data: {
          qr_codes: qrCodes,
          total_generated: qrCodes.length
        }
      });
    } catch (error) {
      console.error('Generate bulk QR codes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate QR codes'
      });
    }
  }

  /**
   * Get QR code statistics for an event (organizer only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getQRCodeStats(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;

      // Check if user is organizer for this event
      const event = await knex('events')
        .where('id', eventId)
        .where('organizer_id', userId)
        .first();

      if (!event) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not the organizer of this event.'
        });
      }

      // Get QR code statistics
      const stats = await knex('user_tickets')
        .select('status')
        .count('* as count')
        .where('event_id', eventId)
        .groupBy('status');

      const totalTickets = await knex('user_tickets')
        .where('event_id', eventId)
        .count('* as count')
        .first();

      const usedTickets = await knex('user_tickets')
        .where('event_id', eventId)
        .where('status', 'used')
        .count('* as count')
        .first();

      const activeTickets = await knex('user_tickets')
        .where('event_id', eventId)
        .where('status', 'active')
        .count('* as count')
        .first();

      res.json({
        success: true,
        data: {
          event_id: eventId,
          event_title: event.title,
          total_tickets: parseInt(totalTickets.count),
          used_tickets: parseInt(usedTickets.count),
          active_tickets: parseInt(activeTickets.count),
          usage_rate: totalTickets.count > 0 ? 
            Math.round((usedTickets.count / totalTickets.count) * 100) : 0,
          status_breakdown: stats
        }
      });
    } catch (error) {
      console.error('Get QR code stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get QR code statistics'
      });
    }
  }
}

module.exports = QRController;

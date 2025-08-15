const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');
const EmailService = require('../../services/emailService');

const router = express.Router();

// POST /notifications/event-update
// Send event update notifications to all attendees
router.post('/event-update', authenticateToken, async (req, res) => {
  try {
    const { eventId, updateType, updateDetails } = req.body;

    // Validation
    if (!eventId || !updateType || !updateDetails) {
      return res.status(400).json({
        success: false,
        message: 'Event ID, update type, and update details are required'
      });
    }

    // Validate update type
    const validUpdateTypes = ['cancelled', 'postponed', 'details_changed'];
    if (!validUpdateTypes.includes(updateType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update type. Must be one of: cancelled, postponed, details_changed'
      });
    }

    // Check if user is the event organizer
    const event = await knex('events')
      .where('id', eventId)
      .where('organizer_id', req.user.id)
      .first();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you are not authorized to send notifications for this event'
      });
    }

    // Get all attendees for this event
    const attendees = await knex('user_tickets')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .leftJoin('users', 'user_tickets.user_id', 'users.id')
      .leftJoin('tickets', 'user_tickets.ticket_id', 'tickets.id')
      .where('tickets.event_id', eventId)
      .where('user_tickets.status', 'active')
      .distinct('users.id');

    if (attendees.length === 0) {
      return res.json({
        success: true,
        message: 'No attendees found for this event',
        sentCount: 0
      });
    }

    // Send notifications
    const results = await EmailService.sendEventUpdateNotification(
      event,
      attendees,
      updateType,
      updateDetails
    );

    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Event update notifications sent successfully`,
      sentCount: successCount,
      failureCount: failureCount,
      totalAttendees: attendees.length,
      results: results
    });

  } catch (error) {
    console.error('Error sending event update notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send event update notifications'
    });
  }
});

// POST /notifications/ticket-reminder
// Send ticket reminder emails (typically called by a scheduled job)
router.post('/ticket-reminder', async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Get event details
    const event = await knex('events')
      .where('id', eventId)
      .first();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get all active tickets for this event
    const tickets = await knex('user_tickets')
      .select(
        'user_tickets.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'tickets.ticket_type',
        'tickets.name as ticket_name'
      )
      .leftJoin('users', 'user_tickets.user_id', 'users.id')
      .leftJoin('tickets', 'user_tickets.ticket_id', 'tickets.id')
      .where('tickets.event_id', eventId)
      .where('user_tickets.status', 'active');

    if (tickets.length === 0) {
      return res.json({
        success: true,
        message: 'No active tickets found for this event',
        sentCount: 0
      });
    }

    // Send reminder emails
    const emailPromises = tickets.map(async (ticket) => {
      try {
        const ticketData = {
          user: {
            first_name: ticket.first_name,
            last_name: ticket.last_name,
            email: ticket.email
          },
          event: {
            title: event.title,
            start_date: event.start_date,
            venue_name: event.venue_name,
            venue_address: event.venue_address
          },
          ticket: {
            ticket_type: ticket.ticket_type,
            ticket_number: ticket.ticket_number
          },
          qrCodeUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}/qr`
        };

        await EmailService.sendTicketReminder(ticketData);
        return { success: true, email: ticket.email };
      } catch (error) {
        console.error(`Error sending ticket reminder to ${ticket.email}:`, error);
        return { success: false, email: ticket.email, error: error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(result => result.value?.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Ticket reminder emails sent successfully`,
      sentCount: successCount,
      failureCount: failureCount,
      totalTickets: tickets.length,
      results: results.map(result => result.value || result.reason)
    });

  } catch (error) {
    console.error('Error sending ticket reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send ticket reminders'
    });
  }
});

// POST /notifications/welcome
// Send welcome email to new user
router.post('/welcome', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user details
    const user = await knex('users')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send welcome email
    await EmailService.sendWelcomeEmail(user);

    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email'
    });
  }
});

// POST /notifications/test
// Test email service connectivity
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const isConnected = await EmailService.testConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Email service is working correctly'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email service test failed'
      });
    }
  } catch (error) {
    console.error('Email service test error:', error);
    res.status(500).json({
      success: false,
      message: 'Email service test failed',
      error: error.message
    });
  }
});

// GET /notifications/event-attendees/:eventId
// Get list of attendees for an event (for notification purposes)
router.get('/event-attendees/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user is the event organizer
    const event = await knex('events')
      .where('id', eventId)
      .where('organizer_id', req.user.id)
      .first();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you are not authorized to view attendees'
      });
    }

    // Get attendees
    const attendees = await knex('user_tickets')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'user_tickets.created_at as ticket_purchase_date',
        'tickets.ticket_type',
        'tickets.name as ticket_name'
      )
      .leftJoin('users', 'user_tickets.user_id', 'users.id')
      .leftJoin('tickets', 'user_tickets.ticket_id', 'tickets.id')
      .where('tickets.event_id', eventId)
      .where('user_tickets.status', 'active')
      .orderBy('user_tickets.created_at', 'desc');

    res.json({
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          start_date: event.start_date
        },
        attendees: attendees,
        totalAttendees: attendees.length
      }
    });

  } catch (error) {
    console.error('Error fetching event attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event attendees'
    });
  }
});

module.exports = router;

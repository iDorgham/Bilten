const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken, requireRole } = require('../../middleware/auth');

const router = express.Router();

// GET /events - List all events (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'published', category } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('events')
      .select([
        'events.*',
        'users.first_name as organizer_first_name',
        'users.last_name as organizer_last_name'
      ])
      .leftJoin('users', 'events.organizer_id', 'users.id')
      .where('events.status', status)
      .orderBy('events.start_date', 'asc')
      .limit(limit)
      .offset(offset);

    if (category) {
      query = query.where('events.category', category);
    }

    const events = await query;
    const total = await knex('events').where('status', status).count('* as count').first();

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /events/:id - Get single event (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await knex('events')
      .select([
        'events.*',
        'users.first_name as organizer_first_name',
        'users.last_name as organizer_last_name',
        'users.email as organizer_email'
      ])
      .leftJoin('users', 'events.organizer_id', 'users.id')
      .where('events.id', req.params.id)
      .first();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get tickets for this event
    const tickets = await knex('tickets')
      .where('event_id', req.params.id)
      .where('is_active', true);

    res.json({
      success: true,
      data: {
        event,
        tickets
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /events - Create new event (organizers only)
router.post('/', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
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
      basePrice
    } = req.body;

    // Validation
    if (!title || !description || !category || !venueName || !venueAddress || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingEvent = await knex('events').where('slug', slug).first();
    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: 'Event with similar title already exists'
      });
    }

    const [event] = await knex('events')
      .insert({
        organizer_id: req.user.id,
        title,
        description,
        slug,
        category,
        venue_name: venueName,
        venue_address: venueAddress,
        start_date: startDate,
        end_date: endDate,
        timezone,
        max_attendees: maxAttendees,
        is_free: isFree,
        base_price: basePrice,
        status: 'draft'
      })
      .returning('*');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /events/:id - Update event (organizer/admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Check if event exists and user has permission
    const existingEvent = await knex('events').where('id', eventId).first();
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && existingEvent.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own events'
      });
    }

    const updateData = {};
    const allowedFields = [
      'title', 'description', 'category', 'venue_name', 'venue_address',
      'start_date', 'end_date', 'timezone', 'max_attendees', 'is_free',
      'base_price', 'status', 'cover_image_url'
    ];

    // Only update provided fields
    Object.keys(req.body).forEach(key => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(snakeKey)) {
        updateData[snakeKey] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const [updatedEvent] = await knex('events')
      .where('id', eventId)
      .update(updateData)
      .returning('*');

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /events/:id - Delete event (organizer/admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Check if event exists and user has permission
    const existingEvent = await knex('events').where('id', eventId).first();
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && existingEvent.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own events'
      });
    }

    // Check if event has orders
    const hasOrders = await knex('orders').where('event_id', eventId).first();
    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with existing orders'
      });
    }

    await knex('events').where('id', eventId).del();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
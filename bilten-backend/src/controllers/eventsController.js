const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Joi = require('joi');

// Validation schemas
const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(10).required(),
  category: Joi.string().max(100),
  venueName: Joi.string().min(2).max(255).required(),
  venueAddress: Joi.string().max(500),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  timezone: Joi.string().default('UTC'),
  maxAttendees: Joi.number().integer().min(1),
  isFree: Joi.boolean().default(false),
  basePrice: Joi.number().min(0).when('isFree', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional().default(0),
  }),
  coverImageUrl: Joi.string().uri().optional(),
});

const updateEventSchema = createEventSchema.fork(
  ['title', 'description', 'venueName', 'startDate', 'endDate'],
  (schema) => schema.optional()
);

/**
 * Get all events with filtering and pagination
 */
const getAllEvents = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        search,
        location,
        startDate,
        endDate,
        minPrice,
        maxPrice,
        freeOnly,
        sortBy = 'start_date',
        sortOrder = 'asc',
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const filters = {
        limit: parseInt(limit),
        offset,
        category,
        search,
        location,
        startDate,
        endDate,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        freeOnly: freeOnly === 'true',
        sortBy,
        sortOrder,
      };

      const events = await Event.findAll(filters);

      // Get total count for pagination
      const totalCount = await Event.findAll({ ...filters, limit: undefined, offset: undefined });
      const totalPages = Math.ceil(totalCount.length / parseInt(limit));

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount: totalCount.length,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
          },
        },
      });
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events',
        error: error.message,
      });
    }
  }

/**
 * Get event by ID with tickets
 */
const getEventById = async (req, res) => {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      // Get tickets for this event
      const tickets = await Ticket.findByEvent(id);

      res.json({
        success: true,
        data: {
          event,
          tickets,
        },
      });
    } catch (error) {
      console.error('Get event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch event',
        error: error.message,
      });
    }
  }

/**
 * Create new event (organizers only)
 */
const createEvent = async (req, res) => {
    try {
      const { error, value } = createEventSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => detail.message),
        });
      }

      // Add organizer ID from authenticated user
      value.organizerId = req.user.id;

      // Create event
      const event = await Event.create(value);

      // Create default ticket types
      const tickets = await Ticket.createDefaultTickets(event.id, value);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: {
          event,
          tickets,
        },
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create event',
        error: error.message,
      });
    }
  }

/**
 * Update event (organizers only - own events)
 */
const updateEvent = async (req, res) => {
    try {
      const { id } = req.params;
      const { error, value } = updateEventSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => detail.message),
        });
      }

      // Check if event exists and user owns it
      const existingEvent = await Event.findById(id);
      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      // Check ownership (unless admin)
      if (req.user.role !== 'admin' && existingEvent.organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own events',
        });
      }

      // Update event
      const updatedEvent = await Event.update(id, value);

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: { event: updatedEvent },
      });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update event',
        error: error.message,
      });
    }
  }

/**
 * Delete event (organizers only - own events)
 */
const deleteEvent = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if event exists and user owns it
      const existingEvent = await Event.findById(id);
      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      // Check ownership (unless admin)
      if (req.user.role !== 'admin' && existingEvent.organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own events',
        });
      }

      // Delete event
      const deleted = await Event.delete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete event',
        error: error.message,
      });
    }
  }

/**
 * Publish event (change status to published)
 */
const publishEvent = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if event exists and user owns it
      const existingEvent = await Event.findById(id);
      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      // Check ownership (unless admin)
      if (req.user.role !== 'admin' && existingEvent.organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only publish your own events',
        });
      }

      const publishedEvent = await Event.publish(id);

      res.json({
        success: true,
        message: 'Event published successfully',
        data: { event: publishedEvent },
      });
    } catch (error) {
      console.error('Publish event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to publish event',
        error: error.message,
      });
    }
  }

/**
 * Get events by organizer (organizer's own events)
 */
const getMyEvents = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const filters = {
        limit: parseInt(limit),
        offset,
        status,
        sortBy,
        sortOrder,
        includeAll: true, // Include all statuses for organizer
      };

      const events = await Event.findByOrganizer(req.user.id, filters);

      // Get total count
      const totalCount = await Event.findByOrganizer(req.user.id, { 
        ...filters, 
        limit: undefined, 
        offset: undefined 
      });
      const totalPages = Math.ceil(totalCount.length / parseInt(limit));

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount: totalCount.length,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
          },
        },
      });
    } catch (error) {
      console.error('Get organizer events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organizer events',
        error: error.message,
      });
    }
  }

/**
 * Get event statistics (organizers only - own events)
 */
const getEventStatistics = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if event exists and user owns it
      const existingEvent = await Event.findById(id);
      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      // Check ownership (unless admin)
      if (req.user.role !== 'admin' && existingEvent.organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only view statistics for your own events',
        });
      }

      const statistics = await Event.getStatistics(id);

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      console.error('Get event statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch event statistics',
        error: error.message,
      });
    }
  }

/**
 * Get upcoming events
 */
const getUpcomingEvents = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        search,
        location,
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const filters = {
        limit: parseInt(limit),
        offset,
        category,
        search,
        location,
        sortBy: 'start_date',
        sortOrder: 'asc',
      };

      const events = await Event.getUpcoming(filters);

      res.json({
        success: true,
        data: { events },
      });
    } catch (error) {
      console.error('Get upcoming events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming events',
        error: error.message,
      });
    }
  };

/**
 * Get tickets for an event
 */
const getEventTickets = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const tickets = await Ticket.findByEvent(id);

    res.json({
      success: true,
      data: { tickets },
    });
  } catch (error) {
    console.error('Get event tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event tickets',
      error: error.message,
    });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  getEventTickets,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  getMyEvents,
  getEventStatistics,
  getUpcomingEvents,
};
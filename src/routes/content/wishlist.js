const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// POST /wishlist - Add event to wishlist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Check if event exists
    const event = await knex('events').where('id', eventId).first();
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if already in wishlist
    const existingWishlist = await knex('user_wishlists')
      .where({ user_id: userId, event_id: eventId })
      .first();

    if (existingWishlist) {
      return res.status(409).json({
        success: false,
        message: 'Event already in wishlist'
      });
    }

    // Add to wishlist
    await knex('user_wishlists').insert({
      user_id: userId,
      event_id: eventId
    });

    // Get wishlist count
    const wishlistCount = await knex('user_wishlists')
      .where('user_id', userId)
      .count('* as count')
      .first();

    res.status(201).json({
      success: true,
      message: 'Event added to wishlist',
      data: {
        isWishlisted: true,
        wishlistCount: parseInt(wishlistCount.count)
      }
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /wishlist/:eventId - Remove event from wishlist
router.delete('/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Remove from wishlist
    const deleted = await knex('user_wishlists')
      .where({ user_id: userId, event_id: eventId })
      .del();

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found in wishlist'
      });
    }

    // Get updated wishlist count
    const wishlistCount = await knex('user_wishlists')
      .where('user_id', userId)
      .count('* as count')
      .first();

    res.json({
      success: true,
      message: 'Event removed from wishlist',
      data: {
        isWishlisted: false,
        wishlistCount: parseInt(wishlistCount.count)
      }
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /wishlist - Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Get wishlisted events with full event details
    const wishlistEvents = await knex('user_wishlists')
      .select([
        'user_wishlists.id as wishlist_id',
        'user_wishlists.created_at as wishlisted_at',
        'events.*',
        'users.first_name as organizer_first_name',
        'users.last_name as organizer_last_name'
      ])
      .leftJoin('events', 'user_wishlists.event_id', 'events.id')
      .leftJoin('users', 'events.organizer_id', 'users.id')
      .where('user_wishlists.user_id', userId)
      .orderBy('user_wishlists.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await knex('user_wishlists')
      .where('user_id', userId)
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        wishlist: wishlistEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount.count),
          pages: Math.ceil(totalCount.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /wishlist/check - Check wishlist status for events
router.get('/check', authenticateToken, async (req, res) => {
  try {
    const { eventIds } = req.query;
    const userId = req.user.id;

    if (!eventIds) {
      return res.status(400).json({
        success: false,
        message: 'Event IDs are required'
      });
    }

    // Parse event IDs (can be comma-separated string or array)
    const eventIdArray = Array.isArray(eventIds) 
      ? eventIds 
      : eventIds.split(',').map(id => id.trim());

    // Get wishlist status for all events
    const wishlistStatuses = await knex('user_wishlists')
      .select('event_id')
      .where('user_id', userId)
      .whereIn('event_id', eventIdArray);

    // Create a map of event ID to wishlist status
    const statusMap = {};
    eventIdArray.forEach(eventId => {
      statusMap[eventId] = wishlistStatuses.some(w => w.event_id === eventId);
    });

    res.json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    console.error('Check wishlist status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
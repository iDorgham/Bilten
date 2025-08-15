const express = require('express');
const router = express.Router();
const recommendationService = require('../../services/recommendationService');
const { authenticateToken } = require('../../middleware/auth');
const { validateRecommendationRequest } = require('../../middleware/validation');

/**
 * @route   GET /recommendations
 * @desc    Get personalized event recommendations for authenticated user
 * @access  Private
 */
router.get('/', authenticateToken, validateRecommendationRequest, async (req, res) => {
  try {
    const { limit = 10, includeTrending = true, includeSimilar = true, includePopular = true } = req.query;
    const userId = req.user.id;

    const recommendations = await recommendationService.getRecommendations(
      userId,
      parseInt(limit),
      {
        includeTrending: includeTrending === 'true',
        includeSimilar: includeSimilar === 'true',
        includePopular: includePopular === 'true'
      }
    );

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /recommendations/trending
 * @desc    Get trending events based on recent activity
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user?.id;

    const trendingEvents = await recommendationService.getTrendingEvents(parseInt(limit));

    res.json({
      success: true,
      data: {
        events: trendingEvents,
        total: trendingEvents.length
      }
    });
  } catch (error) {
    console.error('Trending events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending events'
    });
  }
});

/**
 * @route   GET /recommendations/similar/:eventId
 * @desc    Get similar events based on a specific event
 * @access  Public
 */
router.get('/similar/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 6 } = req.query;
    const userId = req.user?.id;

    // Get the reference event
    const referenceEvent = await req.db('events')
      .where('id', eventId)
      .where('status', 'published')
      .first();

    if (!referenceEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find similar events based on category, organizer, and price range
    const similarEvents = await req.db('events')
      .where('status', 'published')
      .where('start_date', '>', new Date())
      .where('id', '!=', eventId)
      .where(function() {
        this.where('category', referenceEvent.category)
          .orWhere('organizer_id', referenceEvent.organizer_id)
          .orWhereBetween('price', [
            referenceEvent.price * 0.7,
            referenceEvent.price * 1.3
          ]);
      })
      .orderBy('start_date', 'asc')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        referenceEvent,
        similarEvents,
        total: similarEvents.length
      }
    });
  } catch (error) {
    console.error('Similar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar events'
    });
  }
});

/**
 * @route   GET /recommendations/preferences
 * @desc    Get user's analyzed preferences
 * @access  Private
 */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await recommendationService.getUserPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('User preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user preferences'
    });
  }
});

/**
 * @route   POST /recommendations/interaction
 * @desc    Track user interaction with recommendations
 * @access  Private
 */
router.post('/interaction', authenticateToken, async (req, res) => {
  try {
    const { eventId, action } = req.body;
    const userId = req.user.id;

    if (!eventId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and action are required'
      });
    }

    // Validate action
    const validActions = ['view', 'click', 'purchase', 'wishlist', 'share'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    await recommendationService.trackRecommendationInteraction(userId, eventId, action);

    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction'
    });
  }
});

/**
 * @route   GET /recommendations/insights
 * @desc    Get recommendation insights for analytics
 * @access  Private
 */
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = await recommendationService.getRecommendationInsights(userId);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Recommendation insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendation insights'
    });
  }
});

/**
 * @route   GET /recommendations/explore
 * @desc    Get diverse event recommendations for exploration
 * @access  Public
 */
router.get('/explore', async (req, res) => {
  try {
    const { limit = 12, category, location } = req.query;
    const userId = req.user?.id;

    let query = req.db('events')
      .where('status', 'published')
      .where('start_date', '>', new Date())
      .select('events.*')
      .orderBy('created_at', 'desc');

    // Apply filters
    if (category) {
      query = query.where('category', category);
    }

    if (location) {
      query = query.where('location', 'like', `%${location}%`);
    }

    // Exclude user's purchased events if authenticated
    if (userId) {
      query = query.whereNotIn('events.id', function() {
        this.select('event_id').from('tickets').where('user_id', userId);
      });
    }

    const events = await query.limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        events,
        total: events.length,
        filters: { category, location }
      }
    });
  } catch (error) {
    console.error('Explore recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exploration recommendations'
    });
  }
});

/**
 * @route   GET /recommendations/categories
 * @desc    Get recommended categories based on user preferences
 * @access  Private
 */
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await recommendationService.getUserPreferences(userId);

    // Get all available categories with event counts
    const categories = await req.db('events')
      .where('status', 'published')
      .where('start_date', '>', new Date())
      .select('category')
      .count('* as event_count')
      .groupBy('category')
      .orderBy('event_count', 'desc');

    // Mark user's preferred categories
    const categoriesWithPreference = categories.map(cat => ({
      ...cat,
      isPreferred: preferences.categories.includes(cat.category)
    }));

    res.json({
      success: true,
      data: {
        categories: categoriesWithPreference,
        userPreferences: preferences.categories
      }
    });
  } catch (error) {
    console.error('Category recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category recommendations'
    });
  }
});

/**
 * @route   GET /recommendations/for-you
 * @desc    Get "For You" personalized recommendations
 * @access  Private
 */
router.get('/for-you', authenticateToken, async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const userId = req.user.id;

    // Get high-confidence personalized recommendations
    const recommendations = await recommendationService.getRecommendations(
      userId,
      parseInt(limit),
      {
        includeTrending: false,
        includeSimilar: true,
        includePopular: false
      }
    );

    // Filter for high confidence recommendations
    const forYouEvents = recommendations.filter(rec => rec.confidence > 0.7);

    res.json({
      success: true,
      data: {
        events: forYouEvents,
        total: forYouEvents.length,
        message: 'Curated just for you based on your preferences'
      }
    });
  } catch (error) {
    console.error('For you recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personalized recommendations'
    });
  }
});

module.exports = router;

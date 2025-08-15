const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const FTSService = require('../../services/ftsService');
const { body, query, param, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /api/v1/fts/search:
 *   get:
 *     summary: Full-Text Search across all content types
 *     tags: [Full-Text Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, events, articles, users]
 *         description: Content type to search
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, date, title, popularity]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', [
  query('q').isString().isLength({ min: 1, max: 200 }),
  query('type').optional().isIn(['all', 'events', 'articles', 'users']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['relevance', 'date', 'title', 'popularity']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      q,
      type = 'all',
      page = 1,
      limit = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      category,
      status,
      startDate,
      endDate,
      role
    } = req.query;

    const searchOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      category,
      status,
      startDate,
      endDate,
      role
    };

    let results;

    if (type === 'all') {
      results = await FTSService.globalSearch(q, searchOptions);
    } else if (type === 'events') {
      results = await FTSService.searchEvents(q, searchOptions);
    } else if (type === 'articles') {
      results = await FTSService.searchArticles(q, searchOptions);
    } else if (type === 'users') {
      results = await FTSService.searchUsers(q, searchOptions);
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('FTS search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

/**
 * @swagger
 * /api/v1/fts/events:
 *   get:
 *     summary: Full-Text Search events
 *     tags: [Full-Text Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Event category filter
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Event search results
 */
router.get('/events', [
  query('q').isString().isLength({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;

    const results = await FTSService.searchEvents(q, {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('FTS events search error:', error);
    res.status(500).json({
      success: false,
      message: 'Events search failed'
    });
  }
});

/**
 * @swagger
 * /api/v1/fts/articles:
 *   get:
 *     summary: Full-Text Search articles
 *     tags: [Full-Text Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Article category filter
 *     responses:
 *       200:
 *         description: Article search results
 */
router.get('/articles', [
  query('q').isString().isLength({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 10,
      category,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;

    const results = await FTSService.searchArticles(q, {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('FTS articles search error:', error);
    res.status(500).json({
      success: false,
      message: 'Articles search failed'
    });
  }
});

/**
 * @swagger
 * /api/v1/fts/users:
 *   get:
 *     summary: Full-Text Search users
 *     tags: [Full-Text Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, organizer, admin]
 *         description: User role filter
 *     responses:
 *       200:
 *         description: User search results
 */
router.get('/users', [
  query('q').isString().isLength({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'organizer', 'admin']),
  handleValidationErrors
], authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 10,
      role,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;

    const results = await FTSService.searchUsers(q, {
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('FTS users search error:', error);
    res.status(500).json({
      success: false,
      message: 'Users search failed'
    });
  }
});

/**
 * @swagger
 * /api/v1/fts/suggestions:
 *   get:
 *     summary: Get search suggestions/autocomplete
 *     tags: [Full-Text Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, events, articles, users]
 *         description: Content type for suggestions
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of suggestions
 *     responses:
 *       200:
 *         description: Search suggestions
 */
router.get('/suggestions', [
  query('q').isString().isLength({ min: 1, max: 100 }),
  query('type').optional().isIn(['all', 'events', 'articles', 'users']),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { q, type = 'all', limit = 5 } = req.query;

    const suggestions = await FTSService.getSearchSuggestions(q, type, parseInt(limit));

    res.json({
      success: true,
      data: {
        query: q,
        suggestions
      }
    });
  } catch (error) {
    console.error('FTS suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions'
    });
  }
});

/**
 * @swagger
 * /api/v1/fts/trending:
 *   get:
 *     summary: Get trending search terms
 *     tags: [Full-Text Search]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d]
 *           default: 7d
 *         description: Time range for trending
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trending terms
 *     responses:
 *       200:
 *         description: Trending search terms
 */
router.get('/trending', [
  query('timeRange').optional().isIn(['1d', '7d', '30d']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { timeRange = '7d', limit = 10 } = req.query;

    const trendingSearches = await FTSService.getTrendingSearches(timeRange, parseInt(limit));

    res.json({
      success: true,
      data: {
        timeRange,
        trendingSearches
      }
    });
  } catch (error) {
    console.error('FTS trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending searches'
    });
  }
});

/**
 * @swagger
 * /api/v1/fts/highlight:
 *   post:
 *     summary: Highlight search terms in text
 *     tags: [Full-Text Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - query
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to highlight
 *               query:
 *                 type: string
 *                 description: Search query
 *     responses:
 *       200:
 *         description: Highlighted text
 */
router.post('/highlight', [
  body('text').isString().isLength({ min: 1 }),
  body('query').isString().isLength({ min: 1 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { text, query } = req.body;

    const highlightedText = FTSService.highlightSearchTerms(text, query);

    res.json({
      success: true,
      data: {
        originalText: text,
        highlightedText,
        query
      }
    });
  } catch (error) {
    console.error('FTS highlight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to highlight text'
    });
  }
});

/**
 * @swagger
 * /api/v1/fts/stats:
 *   get:
 *     summary: Get search statistics
 *     tags: [Full-Text Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search statistics
 */
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get search statistics from database
    const stats = await knex.raw(`
      SELECT 
        'events' as content_type,
        COUNT(*) as total_records,
        COUNT(CASE WHEN fts_title IS NOT NULL THEN 1 END) as indexed_records
      FROM events
      UNION ALL
      SELECT 
        'articles' as content_type,
        COUNT(*) as total_records,
        COUNT(CASE WHEN fts_title IS NOT NULL THEN 1 END) as indexed_records
      FROM articles
      UNION ALL
      SELECT 
        'users' as content_type,
        COUNT(*) as total_records,
        COUNT(CASE WHEN fts_name IS NOT NULL THEN 1 END) as indexed_records
      FROM users
    `);

    res.json({
      success: true,
      data: {
        stats: stats.rows,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('FTS stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search statistics'
    });
  }
});

/**
 * @swagger
 * /api/v1/fts/reindex:
 *   post:
 *     summary: Reindex all content for full-text search
 *     tags: [Full-Text Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reindexing completed
 */
router.post('/reindex', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Trigger reindexing by updating the generated columns
    await knex.raw(`
      UPDATE events SET title = title WHERE 1=1;
      UPDATE articles SET title = title WHERE 1=1;
      UPDATE users SET first_name = first_name WHERE 1=1;
    `);

    res.json({
      success: true,
      message: 'Reindexing completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('FTS reindex error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reindex content'
    });
  }
});

module.exports = router;

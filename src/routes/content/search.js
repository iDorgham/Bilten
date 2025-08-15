const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// GET /search - Global search across events, articles, and users
router.get('/', async (req, res) => {
  try {
    const {
      q = '', // search query
      type = 'all', // 'events', 'articles', 'users', 'all'
      category,
      page = 1,
      limit = 10,
      sortBy = 'relevance', // 'relevance', 'date', 'title', 'popularity'
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const searchTerm = q.trim();

    if (!searchTerm) {
      return res.json({
        success: true,
        data: {
          events: [],
          articles: [],
          users: [],
          totalResults: 0,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }

    const results = {
      events: [],
      articles: [],
      users: [],
      totalResults: 0
    };

    // Search Events
    if (type === 'all' || type === 'events') {
      let eventsQuery = knex('events')
        .select([
          'events.id',
          'events.title',
          'events.description',
          'events.slug',
          'events.category',
          'events.venue_name',
          'events.venue_address',
          'events.start_date',
          'events.end_date',
          'events.cover_image_url',
          'events.status',
          'events.is_free',
          'events.base_price',
          'users.first_name as organizer_first_name',
          'users.last_name as organizer_last_name'
        ])
        .leftJoin('users', 'events.organizer_id', 'users.id')
        .where('events.status', 'published')
        .where(function() {
          this.where('events.title', 'ilike', `%${searchTerm}%`)
            .orWhere('events.description', 'ilike', `%${searchTerm}%`)
            .orWhere('events.venue_name', 'ilike', `%${searchTerm}%`)
            .orWhere('events.venue_address', 'ilike', `%${searchTerm}%`)
            .orWhere('events.category', 'ilike', `%${searchTerm}%`)
            .orWhere('users.first_name', 'ilike', `%${searchTerm}%`)
            .orWhere('users.last_name', 'ilike', `%${searchTerm}%`);
        });

      if (category) {
        eventsQuery = eventsQuery.where('events.category', category);
      }

      // Apply sorting
      switch (sortBy) {
        case 'date':
          eventsQuery = eventsQuery.orderBy('events.start_date', sortOrder);
          break;
        case 'title':
          eventsQuery = eventsQuery.orderBy('events.title', sortOrder);
          break;
        case 'popularity':
          // For now, sort by date as popularity metric
          eventsQuery = eventsQuery.orderBy('events.start_date', 'asc');
          break;
        default: // relevance
          eventsQuery = eventsQuery.orderBy('events.start_date', 'asc');
      }

      results.events = await eventsQuery.limit(limit).offset(offset);
    }

    // Search Articles
    if (type === 'all' || type === 'articles') {
      let articlesQuery = knex('articles')
        .select([
          'id',
          'title',
          'excerpt',
          'content',
          'category',
          'featured_image_url',
          'author_name',
          'view_count',
          'read_time',
          'tags',
          'published_at',
          'created_at'
        ])
        .where('status', 'published')
        .where(function() {
          this.where('title', 'ilike', `%${searchTerm}%`)
            .orWhere('excerpt', 'ilike', `%${searchTerm}%`)
            .orWhere('content', 'ilike', `%${searchTerm}%`)
            .orWhere('author_name', 'ilike', `%${searchTerm}%`)
            .orWhere('category', 'ilike', `%${searchTerm}%`);
        });

      if (category) {
        articlesQuery = articlesQuery.where('category', category);
      }

      // Apply sorting
      switch (sortBy) {
        case 'date':
          articlesQuery = articlesQuery.orderBy('published_at', sortOrder);
          break;
        case 'title':
          articlesQuery = articlesQuery.orderBy('title', sortOrder);
          break;
        case 'popularity':
          articlesQuery = articlesQuery.orderBy('view_count', sortOrder);
          break;
        default: // relevance
          articlesQuery = articlesQuery.orderBy('published_at', 'desc');
      }

      results.articles = await articlesQuery.limit(limit).offset(offset);
    }

    // Search Users (limited to public info)
    if (type === 'all' || type === 'users') {
      let usersQuery = knex('users')
        .select([
          'id',
          'first_name',
          'last_name',
          'email',
          'role',
          'profile_image_url',
          'created_at'
        ])
        .where(function() {
          this.where('first_name', 'ilike', `%${searchTerm}%`)
            .orWhere('last_name', 'ilike', `%${searchTerm}%`)
            .orWhere('email', 'ilike', `%${searchTerm}%`);
        })
        .where('role', '!=', 'admin'); // Don't expose admin users

      // Apply sorting
      switch (sortBy) {
        case 'date':
          usersQuery = usersQuery.orderBy('created_at', sortOrder);
          break;
        case 'title':
          usersQuery = usersQuery.orderBy('first_name', sortOrder);
          break;
        case 'popularity':
          usersQuery = usersQuery.orderBy('created_at', 'desc');
          break;
        default: // relevance
          usersQuery = usersQuery.orderBy('first_name', 'asc');
      }

      results.users = await usersQuery.limit(limit).offset(offset);
    }

    // Calculate total results
    results.totalResults = results.events.length + results.articles.length + results.users.length;

    // Process results
    const processedResults = {
      events: results.events.map(event => ({
        ...event,
        type: 'event',
        searchScore: calculateSearchScore(event, searchTerm)
      })),
      articles: results.articles.map(article => ({
        ...article,
        type: 'article',
        tags: Array.isArray(article.tags) ? article.tags : (article.tags ? JSON.parse(article.tags) : []),
        searchScore: calculateSearchScore(article, searchTerm)
      })),
      users: results.users.map(user => ({
        ...user,
        type: 'user',
        displayName: `${user.first_name} ${user.last_name}`,
        searchScore: calculateSearchScore(user, searchTerm)
      }))
    };

    res.json({
      success: true,
      data: {
        ...processedResults,
        query: searchTerm,
        filters: {
          type,
          category
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: results.totalResults,
          pages: Math.ceil(results.totalResults / limit)
        }
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /search/suggestions - Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q = '', limit = 5 } = req.query;
    const searchTerm = q.trim();

    if (!searchTerm || searchTerm.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const suggestions = [];

    // Event title suggestions
    const eventSuggestions = await knex('events')
      .select('title')
      .where('status', 'published')
      .where('title', 'ilike', `%${searchTerm}%`)
      .limit(limit);

    suggestions.push(...eventSuggestions.map(e => ({
      text: e.title,
      type: 'event',
      category: 'Events'
    })));

    // Article title suggestions
    const articleSuggestions = await knex('articles')
      .select('title')
      .where('status', 'published')
      .where('title', 'ilike', `%${searchTerm}%`)
      .limit(limit);

    suggestions.push(...articleSuggestions.map(a => ({
      text: a.title,
      type: 'article',
      category: 'Articles'
    })));

    // Category suggestions
    const eventCategories = await knex('events')
      .select('category')
      .where('status', 'published')
      .where('category', 'ilike', `%${searchTerm}%`)
      .distinct()
      .limit(limit);

    suggestions.push(...eventCategories.map(c => ({
      text: c.category,
      type: 'category',
      category: 'Categories'
    })));

    // Venue suggestions
    const venueSuggestions = await knex('events')
      .select('venue_name')
      .where('status', 'published')
      .where('venue_name', 'ilike', `%${searchTerm}%`)
      .distinct()
      .limit(limit);

    suggestions.push(...venueSuggestions.map(v => ({
      text: v.venue_name,
      type: 'venue',
      category: 'Venues'
    })));

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions
      }
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /search/trending - Get trending search terms
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get trending events (by upcoming dates)
    const trendingEvents = await knex('events')
      .select('title', 'category', 'start_date')
      .where('status', 'published')
      .where('start_date', '>=', new Date())
      .orderBy('start_date', 'asc')
      .limit(limit);

    // Get trending articles (by view count)
    const trendingArticles = await knex('articles')
      .select('title', 'category', 'view_count')
      .where('status', 'published')
      .orderBy('view_count', 'desc')
      .limit(limit);

    // Get popular categories
    const popularCategories = await knex('events')
      .select('category')
      .where('status', 'published')
      .count('* as count')
      .groupBy('category')
      .orderBy('count', 'desc')
      .limit(limit);

    res.json({
      success: true,
      data: {
        trendingEvents: trendingEvents.map(e => ({
          text: e.title,
          type: 'event',
          category: e.category,
          date: e.start_date
        })),
        trendingArticles: trendingArticles.map(a => ({
          text: a.title,
          type: 'article',
          category: a.category,
          views: a.view_count
        })),
        popularCategories: popularCategories.map(c => ({
          text: c.category,
          type: 'category',
          count: c.count
        }))
      }
    });

  } catch (error) {
    console.error('Trending search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to calculate search relevance score
function calculateSearchScore(item, searchTerm) {
  const term = searchTerm.toLowerCase();
  let score = 0;

  // Title matches get highest score
  if (item.title && item.title.toLowerCase().includes(term)) {
    score += 10;
  }

  // Description/excerpt matches
  if (item.description && item.description.toLowerCase().includes(term)) {
    score += 5;
  }

  if (item.excerpt && item.excerpt.toLowerCase().includes(term)) {
    score += 5;
  }

  // Category matches
  if (item.category && item.category.toLowerCase().includes(term)) {
    score += 3;
  }

  // Venue matches
  if (item.venue_name && item.venue_name.toLowerCase().includes(term)) {
    score += 3;
  }

  // Author/organizer matches
  if (item.author_name && item.author_name.toLowerCase().includes(term)) {
    score += 2;
  }

  if (item.organizer_first_name && item.organizer_first_name.toLowerCase().includes(term)) {
    score += 2;
  }

  if (item.organizer_last_name && item.organizer_last_name.toLowerCase().includes(term)) {
    score += 2;
  }

  // Exact matches get bonus
  if (item.title && item.title.toLowerCase() === term) {
    score += 5;
  }

  return score;
}

module.exports = router;

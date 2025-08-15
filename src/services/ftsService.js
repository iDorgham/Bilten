const knex = require('../utils/database');

class FTSService {
  /**
   * Search events using PostgreSQL Full-Text Search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  static async searchEvents(query, options = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'published',
      startDate,
      endDate,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const searchQuery = this.buildSearchQuery(query);

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
        'users.last_name as organizer_last_name',
        knex.raw(`
          ts_rank_cd(
            events.fts_title || events.fts_description || events.fts_venue,
            ${searchQuery}
          ) as relevance_score
        `)
      ])
      .leftJoin('users', 'events.organizer_id', 'users.id')
      .where('events.status', status)
      .whereRaw(`
        events.fts_title || events.fts_description || events.fts_venue @@ ${searchQuery}
      `);

    // Apply filters
    if (category) {
      eventsQuery = eventsQuery.where('events.category', category);
    }

    if (startDate) {
      eventsQuery = eventsQuery.where('events.start_date', '>=', startDate);
    }

    if (endDate) {
      eventsQuery = eventsQuery.where('events.end_date', '<=', endDate);
    }

    // Apply sorting
    switch (sortBy) {
      case 'relevance':
        eventsQuery = eventsQuery.orderBy('relevance_score', sortOrder);
        break;
      case 'date':
        eventsQuery = eventsQuery.orderBy('events.start_date', sortOrder);
        break;
      case 'title':
        eventsQuery = eventsQuery.orderBy('events.title', sortOrder);
        break;
      default:
        eventsQuery = eventsQuery.orderBy('relevance_score', 'desc');
    }

    const events = await eventsQuery
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = knex('events')
      .where('status', status)
      .whereRaw(`
        fts_title || fts_description || fts_venue @@ ${searchQuery}
      `);

    if (category) {
      countQuery.where('category', category);
    }

    const [{ count }] = await countQuery.count('* as count');

    return {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Search articles using PostgreSQL Full-Text Search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  static async searchArticles(query, options = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'published',
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const searchQuery = this.buildSearchQuery(query);

    let articlesQuery = knex('articles')
      .select([
        'articles.id',
        'articles.title',
        'articles.content',
        'articles.excerpt',
        'articles.featured_image_url',
        'articles.author_name',
        'articles.category',
        'articles.status',
        'articles.view_count',
        'articles.read_time',
        'articles.tags',
        'articles.published_at',
        'articles.created_at',
        knex.raw(`
          ts_rank_cd(
            articles.fts_title || articles.fts_content || articles.fts_excerpt,
            ${searchQuery}
          ) as relevance_score
        `)
      ])
      .where('articles.status', status)
      .whereRaw(`
        articles.fts_title || articles.fts_content || articles.fts_excerpt @@ ${searchQuery}
      `);

    // Apply filters
    if (category) {
      articlesQuery = articlesQuery.where('articles.category', category);
    }

    // Apply sorting
    switch (sortBy) {
      case 'relevance':
        articlesQuery = articlesQuery.orderBy('relevance_score', sortOrder);
        break;
      case 'date':
        articlesQuery = articlesQuery.orderBy('articles.published_at', sortOrder);
        break;
      case 'title':
        articlesQuery = articlesQuery.orderBy('articles.title', sortOrder);
        break;
      case 'popularity':
        articlesQuery = articlesQuery.orderBy('articles.view_count', sortOrder);
        break;
      default:
        articlesQuery = articlesQuery.orderBy('relevance_score', 'desc');
    }

    const articles = await articlesQuery
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = knex('articles')
      .where('status', status)
      .whereRaw(`
        fts_title || fts_content || fts_excerpt @@ ${searchQuery}
      `);

    if (category) {
      countQuery.where('category', category);
    }

    const [{ count }] = await countQuery.count('* as count');

    return {
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Search users using PostgreSQL Full-Text Search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  static async searchUsers(query, options = {}) {
    const {
      page = 1,
      limit = 10,
      role,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const searchQuery = this.buildSearchQuery(query);

    let usersQuery = knex('users')
      .select([
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.bio',
        'users.profile_image_url',
        'users.role',
        'users.created_at',
        knex.raw(`
          ts_rank_cd(
            users.fts_name || users.fts_bio,
            ${searchQuery}
          ) as relevance_score
        `)
      ])
      .whereRaw(`
        users.fts_name || users.fts_bio @@ ${searchQuery}
      `);

    // Apply filters
    if (role) {
      usersQuery = usersQuery.where('users.role', role);
    }

    // Apply sorting
    switch (sortBy) {
      case 'relevance':
        usersQuery = usersQuery.orderBy('relevance_score', sortOrder);
        break;
      case 'name':
        usersQuery = usersQuery.orderBy('users.first_name', sortOrder);
        break;
      case 'date':
        usersQuery = usersQuery.orderBy('users.created_at', sortOrder);
        break;
      default:
        usersQuery = usersQuery.orderBy('relevance_score', 'desc');
    }

    const users = await usersQuery
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = knex('users')
      .whereRaw(`
        fts_name || fts_bio @@ ${searchQuery}
      `);

    if (role) {
      countQuery.where('role', role);
    }

    const [{ count }] = await countQuery.count('* as count');

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Global search across all content types
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Combined search results
   */
  static async globalSearch(query, options = {}) {
    const {
      types = ['events', 'articles', 'users'],
      page = 1,
      limit = 10,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    const results = {};
    const promises = [];

    // Search each content type
    if (types.includes('events')) {
      promises.push(
        this.searchEvents(query, { ...options, page, limit: Math.ceil(limit / types.length) })
          .then(result => { results.events = result; })
      );
    }

    if (types.includes('articles')) {
      promises.push(
        this.searchArticles(query, { ...options, page, limit: Math.ceil(limit / types.length) })
          .then(result => { results.articles = result; })
      );
    }

    if (types.includes('users')) {
      promises.push(
        this.searchUsers(query, { ...options, page, limit: Math.ceil(limit / types.length) })
          .then(result => { results.users = result; })
      );
    }

    await Promise.all(promises);

    // Calculate total results
    const totalResults = Object.values(results).reduce((total, result) => {
      return total + (result.pagination?.total || 0);
    }, 0);

    return {
      ...results,
      totalResults,
      query,
      searchOptions: options
    };
  }

  /**
   * Get search suggestions/autocomplete
   * @param {string} query - Partial search query
   * @param {string} type - Content type
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Array>} Search suggestions
   */
  static async getSearchSuggestions(query, type = 'all', limit = 5) {
    const searchQuery = this.buildSearchQuery(query + ':*');
    const suggestions = [];

    if (type === 'all' || type === 'events') {
      const eventSuggestions = await knex('events')
        .select('title', 'category', 'venue_name')
        .where('status', 'published')
        .whereRaw(`fts_title @@ ${searchQuery}`)
        .limit(limit)
        .orderByRaw(`ts_rank_cd(fts_title, ${searchQuery}) DESC`);

      suggestions.push(...eventSuggestions.map(item => ({
        type: 'event',
        text: item.title,
        category: item.category,
        venue: item.venue_name
      })));
    }

    if (type === 'all' || type === 'articles') {
      const articleSuggestions = await knex('articles')
        .select('title', 'category', 'author_name')
        .where('status', 'published')
        .whereRaw(`fts_title @@ ${searchQuery}`)
        .limit(limit)
        .orderByRaw(`ts_rank_cd(fts_title, ${searchQuery}) DESC`);

      suggestions.push(...articleSuggestions.map(item => ({
        type: 'article',
        text: item.title,
        category: item.category,
        author: item.author_name
      })));
    }

    if (type === 'all' || type === 'users') {
      const userSuggestions = await knex('users')
        .select('first_name', 'last_name', 'role')
        .whereRaw(`fts_name @@ ${searchQuery}`)
        .limit(limit)
        .orderByRaw(`ts_rank_cd(fts_name, ${searchQuery}) DESC`);

      suggestions.push(...userSuggestions.map(item => ({
        type: 'user',
        text: `${item.first_name} ${item.last_name}`,
        role: item.role
      })));
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Get trending search terms
   * @param {string} timeRange - Time range for trending (1d, 7d, 30d)
   * @param {number} limit - Number of trending terms
   * @returns {Promise<Array>} Trending search terms
   */
  static async getTrendingSearches(timeRange = '7d', limit = 10) {
    // This would typically query a search_logs table
    // For now, return mock data
    const mockTrendingSearches = [
      { term: 'music festival', count: 156 },
      { term: 'tech conference', count: 89 },
      { term: 'art exhibition', count: 67 },
      { term: 'food tasting', count: 45 },
      { term: 'workshop', count: 34 }
    ];

    return mockTrendingSearches.slice(0, limit);
  }

  /**
   * Build PostgreSQL search query with proper escaping
   * @param {string} query - Raw search query
   * @returns {string} Escaped search query
   */
  static buildSearchQuery(query) {
    if (!query || typeof query !== 'string') {
      return "''";
    }

    // Clean and escape the query
    const cleanQuery = query
      .trim()
      .replace(/[&|!(){}[\]^"~*?:\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => `${word}:*`)
      .join(' & ');

    return `to_tsquery('english', '${cleanQuery}')`;
  }

  /**
   * Highlight search terms in text
   * @param {string} text - Text to highlight
   * @param {string} query - Search query
   * @returns {string} Highlighted text
   */
  static highlightSearchTerms(text, query) {
    if (!text || !query) return text;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    let highlightedText = text;

    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
  }
}

module.exports = FTSService;

const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// GET /articles - Get all published articles with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'published_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build query
    let query = knex('articles')
      .where('status', 'published')
      .select([
        'id',
        'title',
        'excerpt',
        'featured_image_url',
        'author_name',
        'category',
        'view_count',
        'read_time',
        'tags',
        'published_at',
        'created_at'
      ]);

    // Apply filters
    if (category && category !== 'all') {
      query = query.where('category', category);
    }

    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('excerpt', 'ilike', `%${search}%`)
          .orWhere('content', 'ilike', `%${search}%`);
      });
    }

    // Apply sorting
    const validSortFields = ['published_at', 'created_at', 'view_count', 'title', 'read_time'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'published_at';
    const sortDirection = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';
    
    query = query.orderBy(sortField, sortDirection);

    // Get total count for pagination
    const countQuery = knex('articles')
      .where('status', 'published');
    
    // Apply the same filters to count query
    if (category && category !== 'all') {
      countQuery.where('category', category);
    }

    if (search) {
      countQuery.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('excerpt', 'ilike', `%${search}%`)
          .orWhere('content', 'ilike', `%${search}%`);
      });
    }
    
    const totalCount = await countQuery.count('* as total').first();

    // Apply pagination
    const articles = await query.limit(limit).offset(offset);

    // Get categories for filter options
    const categoriesResult = await knex('articles')
      .where('status', 'published')
      .select('category')
      .distinct();
    const categories = categoriesResult.map(row => row.category);

    res.json({
      success: true,
      data: {
        articles: articles.map(article => ({
          ...article,
          tags: Array.isArray(article.tags) ? article.tags : (article.tags ? JSON.parse(article.tags) : [])
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount.total / limit),
          totalItems: totalCount.total,
          itemsPerPage: parseInt(limit)
        },
        categories: ['all', ...categories]
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /articles/categories - Get all article categories
router.get('/categories', async (req, res) => {
  try {
    const categoriesResult = await knex('articles')
      .where('status', 'published')
      .select('category')
      .distinct();
    const categories = categoriesResult.map(row => row.category);

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /articles/search - Search articles
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const offset = (page - 1) * limit;

    // Build search query
    let query = knex('articles')
      .where('status', 'published')
      .where(function() {
        this.where('title', 'ilike', `%${q}%`)
          .orWhere('excerpt', 'ilike', `%${q}%`)
          .orWhere('content', 'ilike', `%${q}%`)
          .orWhere('author_name', 'ilike', `%${q}%`);
      })
      .select([
        'id',
        'title',
        'excerpt',
        'featured_image_url',
        'author_name',
        'category',
        'view_count',
        'read_time',
        'tags',
        'published_at'
      ])
      .orderBy('published_at', 'desc');

    // Get total count
    const countQuery = knex('articles')
      .where('status', 'published')
      .where(function() {
        this.where('title', 'ilike', `%${q}%`)
          .orWhere('excerpt', 'ilike', `%${q}%`)
          .orWhere('content', 'ilike', `%${q}%`)
          .orWhere('author_name', 'ilike', `%${q}%`);
      });
    const totalCount = await countQuery.count('* as total').first();

    // Apply pagination
    const articles = await query.limit(limit).offset(offset);

    res.json({
      success: true,
      data: {
        articles: articles.map(article => ({
          ...article,
          tags: Array.isArray(article.tags) ? article.tags : (article.tags ? JSON.parse(article.tags) : [])
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount.total / limit),
          totalItems: totalCount.total,
          itemsPerPage: parseInt(limit)
        },
        searchQuery: q
      }
    });
  } catch (error) {
    console.error('Search articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /articles/:id - Get a specific article by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the article
    const article = await knex('articles')
      .where('id', id)
      .where('status', 'published')
      .first();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Increment view count
    await knex('articles')
      .where('id', id)
      .increment('view_count', 1);

    // Get related articles (same category, excluding current article)
    const relatedArticles = await knex('articles')
      .where('category', article.category)
      .where('id', '!=', id)
      .where('status', 'published')
      .select([
        'id',
        'title',
        'excerpt',
        'featured_image_url',
        'author_name',
        'category',
        'view_count',
        'read_time',
        'published_at'
      ])
      .orderBy('published_at', 'desc')
      .limit(3);

    res.json({
      success: true,
      data: {
        article: {
          ...article,
          tags: JSON.parse(article.tags || '[]'),
          view_count: article.view_count + 1 // Show updated count immediately
        },
        relatedArticles
      }
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /articles - Create a new article (admin/organizer only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    // Check if user has permission to create articles
    if (user.role !== 'admin' && user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create articles'
      });
    }

    const {
      title,
      content,
      excerpt,
      featured_image_url,
      category = 'general',
      status = 'draft',
      read_time = 5,
      tags = []
    } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Create article
    const [article] = await knex('articles')
      .insert({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        featured_image_url,
        author_name: `${user.firstName} ${user.lastName}`,
        author_id: user.id,
        category,
        status,
        read_time,
        tags: JSON.stringify(tags),
        published_at: status === 'published' ? new Date() : null
      })
      .returning('*');

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: { article }
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /articles/:id - Update an article (admin/organizer only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    
    // Check if user has permission to update articles
    if (user.role !== 'admin' && user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update articles'
      });
    }

    // Check if article exists
    const existingArticle = await knex('articles').where('id', id).first();
    if (!existingArticle) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const {
      title,
      content,
      excerpt,
      featured_image_url,
      category,
      status,
      read_time,
      tags
    } = req.body;

    const updateData = {};
    
    // Only update provided fields
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (read_time !== undefined) updateData.read_time = read_time;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);

    // Set published_at if status is changing to published
    if (status === 'published' && existingArticle.status !== 'published') {
      updateData.published_at = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const [updatedArticle] = await knex('articles')
      .where('id', id)
      .update(updateData)
      .returning('*');

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: { article: updatedArticle }
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /articles/:id - Delete an article (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    
    // Only admins can delete articles
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete articles'
      });
    }

    // Check if article exists
    const existingArticle = await knex('articles').where('id', id).first();
    if (!existingArticle) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    await knex('articles').where('id', id).del();

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();

// Mock articles data for now
const mockArticles = [
  {
    id: 1,
    title: 'Welcome to Bilten: The Future of Event Management',
    slug: 'welcome-to-bilten',
    excerpt: 'Discover how Bilten is revolutionizing the way events are organized and managed.',
    content: 'Bilten is a comprehensive event management platform that brings together organizers and attendees in a seamless digital experience. Our platform offers advanced features for event creation, ticket management, and real-time analytics.',
    author: 'Bilten Team',
    published_at: '2025-01-15T10:00:00Z',
    category: 'platform',
    featured_image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop',
    read_time: 3,
    view_count: 1250,
    tags: ['event management', 'platform', 'technology']
  },
  {
    id: 2,
    title: 'Top 10 Tips for Successful Event Planning',
    slug: 'event-planning-tips',
    excerpt: 'Learn the essential strategies that every event organizer should know.',
    content: 'Successful event planning requires careful attention to detail, effective communication, and strategic thinking. From venue selection to marketing strategies, every aspect plays a crucial role in creating memorable experiences.',
    author: 'Event Expert',
    published_at: '2025-01-10T14:30:00Z',
    category: 'tips',
    featured_image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
    read_time: 5,
    view_count: 890,
    tags: ['event planning', 'tips', 'strategy']
  },
  {
    id: 3,
    title: 'The Rise of Digital Ticketing: What You Need to Know',
    slug: 'digital-ticketing-trends',
    excerpt: 'Explore the latest trends in digital ticketing and how they\'re changing the industry.',
    content: 'Digital ticketing has transformed the way we think about event access. With QR codes, mobile apps, and blockchain technology, the future of ticketing is more secure and convenient than ever before.',
    author: 'Tech Analyst',
    published_at: '2025-01-05T09:15:00Z',
    category: 'technology',
    featured_image_url: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop',
    read_time: 4,
    view_count: 1100,
    tags: ['digital ticketing', 'technology', 'QR codes']
  },
  {
    id: 4,
    title: 'Maximizing Event Revenue with Smart Pricing Strategies',
    slug: 'event-revenue-strategies',
    excerpt: 'Discover proven pricing strategies that can significantly boost your event revenue.',
    content: 'Pricing is one of the most critical factors in event success. From early bird discounts to dynamic pricing models, understanding how to price your events can make the difference between profit and loss.',
    author: 'Revenue Specialist',
    published_at: '2024-12-28T16:45:00Z',
    category: 'business',
    featured_image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop',
    read_time: 6,
    view_count: 750,
    tags: ['revenue', 'pricing', 'business']
  },
  {
    id: 5,
    title: 'Building Community Through Events: A Guide for Organizers',
    slug: 'community-building-events',
    excerpt: 'Learn how to create events that foster meaningful connections and build lasting communities.',
    content: 'Great events do more than just entertain—they bring people together and create communities. Whether it\'s a local meetup or a large conference, the right approach can turn attendees into advocates.',
    author: 'Community Builder',
    published_at: '2024-12-20T11:20:00Z',
    category: 'community',
    featured_image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
    read_time: 7,
    view_count: 620,
    tags: ['community', 'networking', 'engagement']
  },
  {
    id: 6,
    title: 'Sustainability in Event Management: Going Green',
    slug: 'sustainable-events',
    excerpt: 'Explore eco-friendly practices that can make your events more sustainable and appealing.',
    content: 'Sustainability is no longer optional—it\'s essential. From reducing waste to choosing eco-friendly venues, there are countless ways to make your events more environmentally responsible.',
    author: 'Green Events Expert',
    published_at: '2024-12-15T13:10:00Z',
    category: 'sustainability',
    featured_image_url: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop',
    read_time: 5,
    view_count: 480,
    tags: ['sustainability', 'eco-friendly', 'green events']
  }
];

const categories = [
  { id: 'all', name: 'All Categories', count: mockArticles.length },
  { id: 'platform', name: 'Platform Updates', count: 1 },
  { id: 'tips', name: 'Event Tips', count: 1 },
  { id: 'technology', name: 'Technology', count: 1 },
  { id: 'business', name: 'Business', count: 1 },
  { id: 'community', name: 'Community', count: 1 },
  { id: 'sustainability', name: 'Sustainability', count: 1 }
];

// GET /api/v1/articles - Get all articles with pagination and filtering
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'published_at';
    const sortOrder = req.query.sortOrder || 'desc';
    const search = req.query.search;

    let filteredArticles = [...mockArticles];

    // Filter by category
    if (category && category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower)
      );
    }

    // Sort articles
    filteredArticles.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'published_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    const totalArticles = filteredArticles.length;
    const totalPages = Math.ceil(totalArticles / limit);

    res.json({
      success: true,
      data: {
        articles: paginatedArticles,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalArticles,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles'
    });
  }
});

// GET /api/v1/articles/categories - Get article categories
router.get('/categories', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// GET /api/v1/articles/search - Search articles
router.get('/search', (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchLower = query.toLowerCase();
    const searchResults = mockArticles.filter(article =>
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.content.toLowerCase().includes(searchLower)
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = searchResults.slice(startIndex, endIndex);

    const totalResults = searchResults.length;
    const totalPages = Math.ceil(totalResults / limit);

    res.json({
      success: true,
      data: {
        articles: paginatedResults,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalResults,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        },
        search_query: query
      }
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search articles'
    });
  }
});

// GET /api/v1/articles/:id - Get article by ID (must be last to avoid conflicts)
router.get('/:id', (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const article = mockArticles.find(a => a.id === articleId);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Get related articles (same category, excluding current article)
    const relatedArticles = mockArticles
      .filter(a => a.id !== articleId && a.category === article.category)
      .slice(0, 3);

    res.json({
      success: true,
      data: {
        article,
        relatedArticles
      }
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article'
    });
  }
});

module.exports = router;

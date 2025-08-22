const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const eventsRoutes = require('./events');
const ticketsRoutes = require('./tickets');
const usersRoutes = require('./users');
const articlesRoutes = require('./articles');
const exportRoutes = require('./export');
const uploadsRoutes = require('./uploads');

// API documentation
router.get('/', (req, res) => {
  res.json({
    message: 'Bilten API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      events: '/events',
      tickets: '/tickets',
      users: '/users',
      articles: '/articles',
      export: '/export',
      uploads: '/uploads'
    },
    documentation: 'Coming soon...'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/users', usersRoutes);
router.use('/articles', articlesRoutes);
router.use('/export', exportRoutes);
router.use('/uploads', uploadsRoutes);

module.exports = router;

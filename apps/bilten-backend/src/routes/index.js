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
const paymentRoutes = require('./payment');
const mfaRoutes = require('./mfa');
const oauthRoutes = require('./oauth');
const analyticsRoutes = require('./analytics');
const rbacRoutes = require('./rbac');

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
      uploads: '/uploads',
      payment: '/payment',
      mfa: '/mfa',
      oauth: '/auth/oauth',
      analytics: '/analytics',
      rbac: '/rbac'
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
router.use('/payment', paymentRoutes);
router.use('/mfa', mfaRoutes);
router.use('/auth/oauth', oauthRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/rbac', rbacRoutes);

module.exports = router;

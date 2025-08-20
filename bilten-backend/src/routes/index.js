const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const eventsRoutes = require('./events');
const ticketsRoutes = require('./tickets');
const usersRoutes = require('./users');

// API documentation
router.get('/', (req, res) => {
  res.json({
    message: 'Bilten API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      events: '/events',
      tickets: '/tickets',
      users: '/users'
    },
    documentation: 'Coming soon...'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/users', usersRoutes);

module.exports = router;

const express = require('express');
const router = express.Router();

// Import core route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const eventRoutes = require('./events');
const ticketRoutes = require('./tickets');

// Mount core routes
console.log('Mounting auth routes...');
router.use('/auth', authRoutes);
console.log('Auth routes mounted');
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);

module.exports = router;

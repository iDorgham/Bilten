const express = require('express');
const router = express.Router();

// Import system route modules
const analyticsRoutes = require('./analytics');
const monitoringRoutes = require('./monitoring');
const trackingRoutes = require('./tracking');
const webhookRoutes = require('./webhooks');
const webhookManagementRoutes = require('./webhook-management');

// Mount system routes
router.use('/analytics', analyticsRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/tracking', trackingRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/webhook-management', webhookManagementRoutes);

module.exports = router;

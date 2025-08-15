const express = require('express');
const router = express.Router();

// Import utility route modules
const uploadRoutes = require('./uploads');
const uploadMockRoutes = require('./uploads-mock');
const imageOptimizationRoutes = require('./imageOptimization');
const qrRoutes = require('./qr');
const exportRoutes = require('./export');
const ftsRoutes = require('./fts');
const notificationRoutes = require('./notifications');

// Mount utility routes
router.use('/uploads', uploadRoutes);
router.use('/uploads-mock', uploadMockRoutes);
router.use('/image-optimization', imageOptimizationRoutes);
router.use('/qr', qrRoutes);
router.use('/export', exportRoutes);
router.use('/fts', ftsRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

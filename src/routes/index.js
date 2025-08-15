const express = require('express');
const router = express.Router();

// Import organized route modules
const coreRoutes = require('./core');
const businessRoutes = require('./business');
const contentRoutes = require('./content');
const systemRoutes = require('./system');
const utilityRoutes = require('./utility');

// Mount organized routes
router.use('/', coreRoutes);
// router.use('/', businessRoutes);
// router.use('/', contentRoutes);
// router.use('/', systemRoutes);
// router.use('/', utilityRoutes);

// Add a test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'API router is working!' });
});

module.exports = router;
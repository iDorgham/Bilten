const express = require('express');
const router = express.Router();

// Import content route modules
const articleRoutes = require('./articles');
const searchRoutes = require('./search');
const recommendationRoutes = require('./recommendations');
const wishlistRoutes = require('./wishlist');

// Mount content routes
router.use('/articles', articleRoutes);
router.use('/search', searchRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/wishlist', wishlistRoutes);

module.exports = router;

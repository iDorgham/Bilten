const express = require('express');
const router = express.Router();

// Import business route modules
const paymentRoutes = require('./payments');
const paymentTestRoutes = require('./payments-test');
const promoCodeRoutes = require('./promo-codes');

// Mount business routes
router.use('/payments', paymentRoutes);
router.use('/payments-test', paymentTestRoutes);
router.use('/promo-codes', promoCodeRoutes);

module.exports = router;

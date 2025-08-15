const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');
const auth = require('../middleware/auth');
const router = express.Router();

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  next();
};

// Validation middleware for order creation
const validateOrder = [
  body('eventId')
    .isUUID()
    .withMessage('Event ID must be a valid UUID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.ticketType')
    .isString()
    .withMessage('Ticket type must be a string'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('totalAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Total amount must be a positive number'),
  body('promoCode')
    .optional()
    .isString()
    .withMessage('Promo code must be a string')
];

/**
 * Create a new order
 */
// router.post('/', auth, validateOrder, handleValidationErrors, async (req, res) => {
//   try {
//     const {
//       eventId,
//       items,
//       promoCode,
//       totalAmount
//     } = req.body;

//     let promoCodeId = null;
//     let discountAmount = 0;
//     let promoCodeUsed = null;

//     // Validate and apply promo code if provided
//     if (promoCode) {
//       const promoCodeData = await PromoCode.findByCode(promoCode);
//       if (!promoCodeData) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid promo code'
//         });
//       }

//       // Validate promo code for this order
//       const validation = await PromoCode.validateForOrder(
//         promoCode,
//         req.user.id,
//         eventId,
//         items.map(item => item.ticketType),
//         totalAmount
//       );

//       if (!validation.isValid) {
//         return res.status(400).json({
//           success: false,
//           message: validation.message
//         });
//       }

//       promoCodeId = promoCodeData.id;
//       discountAmount = validation.discountAmount;
//       promoCodeUsed = promoCode;
//     }

//     // Create order data
//     const orderData = {
//       userId: req.user.id,
//       eventId,
//       totalAmount,
//       paymentIntentId: `pi_test_${Date.now()}`,
//       items: items.map(item => ({
//         ticketId: `ticket_${Date.now()}_${Math.random()}`,
//         ticketType: item.ticketType,
//         quantity: item.quantity,
//         price: item.price
//       })),
//       promoCodeId,
//       discountAmount,
//       promoCodeUsed
//     };

//     const order = await Order.create(orderData);

//     res.status(201).json({
//       success: true,
//       message: 'Order created successfully',
//       order
//     });
//   } catch (error) {
//     console.error('Error creating order:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create order'
//     });
//   }
// });

/**
 * Get orders for the authenticated user
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, limit = 10, offset = 0 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const orders = await Order.findByUser(req.user.id, filters);

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

/**
 * Get order by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

module.exports = router;

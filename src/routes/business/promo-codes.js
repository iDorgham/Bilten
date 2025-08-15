const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { body, param, query } = require('express-validator');

const router = express.Router();

// Validation middleware
const validatePromoCode = [
  body('code')
    .isString()
    .isLength({ min: 3, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Code must be 3-20 characters, uppercase letters and numbers only'),
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('discountType')
    .isIn(['percentage', 'fixed_amount'])
    .withMessage('Discount type must be percentage or fixed_amount'),
  body('discountValue')
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be a positive number'),
  body('minimumOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be a non-negative number'),
  body('maximumDiscountAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Maximum discount amount must be a positive number'),
  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),
  body('maxUsesPerUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max uses per user must be a positive integer'),
  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('Valid from must be a valid date'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),
  body('applicableEvents')
    .optional()
    .isArray()
    .withMessage('Applicable events must be an array'),
  body('applicableTicketTypes')
    .optional()
    .isArray()
    .withMessage('Applicable ticket types must be an array')
];

/**
 * @swagger
 * /api/v1/promo-codes:
 *   post:
 *     summary: Create a new promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - discountType
 *               - discountValue
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique promo code
 *               name:
 *                 type: string
 *                 description: Display name
 *               description:
 *                 type: string
 *                 description: Optional description
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed_amount]
 *               discountValue:
 *                 type: number
 *                 description: Discount amount or percentage
 *     responses:
 *       201:
 *         description: Promo code created successfully
 *       400:
 *         description: Validation error or code already exists
 */
router.post('/', authenticateToken, requireRole(['organizer', 'admin']), validatePromoCode, async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minimumOrderAmount = 0,
      maximumDiscountAmount,
      maxUses,
      maxUsesPerUser = 1,
      validFrom = new Date(),
      validUntil,
      applicableEvents,
      applicableTicketTypes
    } = req.body;

    // Check if promo code already exists
    const existingCode = await knex('promo_codes')
      .where('code', code.toUpperCase())
      .first();

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists'
      });
    }

    const [promoCode] = await knex('promo_codes')
      .insert({
        code: code.toUpperCase(),
        name,
        description,
        discount_type: discountType,
        discount_value: discountValue,
        minimum_order_amount: minimumOrderAmount,
        maximum_discount_amount: maximumDiscountAmount,
        max_uses: maxUses,
        max_uses_per_user: maxUsesPerUser,
        valid_from: validFrom,
        valid_until: validUntil,
        applicable_events: applicableEvents ? JSON.stringify(applicableEvents) : null,
        applicable_ticket_types: applicableTicketTypes ? JSON.stringify(applicableTicketTypes) : null,
        created_by: req.user.id
      })
      .returning('*');

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      data: {
        promoCode
      }
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create promo code'
    });
  }
});

/**
 * @swagger
 * /api/v1/promo-codes:
 *   get:
 *     summary: Get all promo codes with optional filters
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Filter by applicable events
 *     responses:
 *       200:
 *         description: List of promo codes
 */
router.get('/', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, eventId } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('promo_codes')
      .select('*')
      .orderBy('created_at', 'desc');

    // Apply filters
    if (isActive !== undefined) {
      query = query.where('is_active', isActive === 'true');
    }

    if (eventId) {
      query = query.where(function() {
        this.whereNull('applicable_events')
          .orWhereRaw("applicable_events::text LIKE ?", [`%${eventId}%`]);
      });
    }

    const promoCodes = await query
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = knex('promo_codes');
    
    if (isActive !== undefined) {
      countQuery = countQuery.where('is_active', isActive === 'true');
    }

    if (eventId) {
      countQuery = countQuery.where(function() {
        this.whereNull('applicable_events')
          .orWhereRaw("applicable_events::text LIKE ?", [`%${eventId}%`]);
      });
    }

    const total = await countQuery.count('* as count').first();

    res.json({
      success: true,
      data: {
        promoCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting promo codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get promo codes'
    });
  }
});

/**
 * @swagger
 * /api/v1/promo-codes/{code}/validate:
 *   post:
 *     summary: Validate a promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code to validate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - orderAmount
 *             properties:
 *               eventId:
 *                 type: string
 *               ticketTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               orderAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/:code/validate', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { eventId, ticketTypes = [], orderAmount } = req.body;

    if (!eventId || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and order amount are required'
      });
    }

    // Find promo code
    const promoCode = await knex('promo_codes')
      .where('code', code.toUpperCase())
      .where('is_active', true)
      .first();

    if (!promoCode) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'Promo code not found'
        }
      });
    }

    // Check validity period
    const now = new Date();
    if (now < new Date(promoCode.valid_from)) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'Promo code is not yet active'
        }
      });
    }

    if (promoCode.valid_until && now > new Date(promoCode.valid_until)) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'Promo code has expired'
        }
      });
    }

    // Check minimum order amount
    if (orderAmount < promoCode.minimum_order_amount) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: `Minimum order amount of $${promoCode.minimum_order_amount} required`
        }
      });
    }

    // Check applicable events
    if (promoCode.applicable_events) {
      const applicableEvents = JSON.parse(promoCode.applicable_events);
      if (!applicableEvents.includes(eventId)) {
        return res.json({
          success: true,
          data: {
            valid: false,
            error: 'Promo code is not applicable to this event'
          }
        });
      }
    }

    // Check applicable ticket types
    if (promoCode.applicable_ticket_types && ticketTypes.length > 0) {
      const applicableTicketTypes = JSON.parse(promoCode.applicable_ticket_types);
      const hasApplicableTicket = ticketTypes.some(type => applicableTicketTypes.includes(type));
      if (!hasApplicableTicket) {
        return res.json({
          success: true,
          data: {
            valid: false,
            error: 'Promo code is not applicable to selected ticket types'
          }
        });
      }
    }

    // Check usage limits
    if (promoCode.max_uses && promoCode.used_count >= promoCode.max_uses) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'Promo code usage limit reached'
        }
      });
    }

    // Check per-user usage limit
    const userUsageCount = await knex('promo_code_usage')
      .where('promo_code_id', promoCode.id)
      .where('user_id', req.user.id)
      .count('* as count')
      .first();

    if (parseInt(userUsageCount.count) >= promoCode.max_uses_per_user) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'You have already used this promo code the maximum number of times'
        }
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discount_type === 'percentage') {
      discountAmount = (orderAmount * promoCode.discount_value) / 100;
    } else {
      discountAmount = promoCode.discount_value;
    }

    // Apply maximum discount cap
    if (promoCode.maximum_discount_amount && discountAmount > promoCode.maximum_discount_amount) {
      discountAmount = promoCode.maximum_discount_amount;
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    res.json({
      success: true,
      data: {
        valid: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          name: promoCode.name,
          discount_type: promoCode.discount_type,
          discount_value: promoCode.discount_value
        },
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate promo code'
    });
  }
});

/**
 * @swagger
 * /api/v1/promo-codes/{id}:
 *   get:
 *     summary: Get promo code by ID
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *     responses:
 *       200:
 *         description: Promo code details
 */
router.get('/:id', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await knex('promo_codes')
      .where('id', id)
      .first();

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    // Get usage statistics
    const usageStats = await knex('promo_code_usage')
      .where('promo_code_id', id)
      .select(
        knex.raw('COUNT(*) as total_uses'),
        knex.raw('COUNT(DISTINCT user_id) as unique_users'),
        knex.raw('SUM(discount_amount) as total_discount_given')
      )
      .first();

    res.json({
      success: true,
      data: {
        promoCode,
        usageStats: {
          total_uses: parseInt(usageStats.total_uses),
          unique_users: parseInt(usageStats.unique_users),
          total_discount_given: parseFloat(usageStats.total_discount_given || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error getting promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get promo code'
    });
  }
});

/**
 * @swagger
 * /api/v1/promo-codes/{id}:
 *   put:
 *     summary: Update promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *     responses:
 *       200:
 *         description: Promo code updated successfully
 */
router.put('/:id', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.code;
    delete updateData.created_by;
    delete updateData.created_at;

    const [updatedPromoCode] = await knex('promo_codes')
      .where('id', id)
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');

    if (!updatedPromoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    res.json({
      success: true,
      message: 'Promo code updated successfully',
      data: {
        promoCode: updatedPromoCode
      }
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update promo code'
    });
  }
});

/**
 * @swagger
 * /api/v1/promo-codes/{id}:
 *   delete:
 *     summary: Delete promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *     responses:
 *       200:
 *         description: Promo code deleted successfully
 */
router.delete('/:id', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCount = await knex('promo_codes')
      .where('id', id)
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    res.json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete promo code'
    });
  }
});

/**
 * @swagger
 * /api/v1/promo-codes/validate-checkout:
 *   post:
 *     summary: Validate promo code for checkout
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - eventId
 *               - orderAmount
 *             properties:
 *               code:
 *                 type: string
 *               eventId:
 *                 type: string
 *               ticketTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               orderAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/validate-checkout', authenticateToken, async (req, res) => {
  try {
    const { code, eventId, ticketTypes = [], orderAmount } = req.body;

    if (!code || !eventId || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Code, event ID, and order amount are required'
      });
    }

    // Find promo code
    const promoCode = await knex('promo_codes')
      .where('code', code.toUpperCase())
      .where('is_active', true)
      .first();

    if (!promoCode) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'Promo code not found'
        }
      });
    }

    // Check validity period
    const now = new Date();
    if (now < new Date(promoCode.valid_from)) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'Promo code is not yet active'
        }
      });
    }

    if (promoCode.valid_until && now > new Date(promoCode.valid_until)) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'Promo code has expired'
        }
      });
    }

    // Check minimum order amount
    if (orderAmount < promoCode.minimum_order_amount) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: `Minimum order amount of $${promoCode.minimum_order_amount} required`
        }
      });
    }

    // Check applicable events
    if (promoCode.applicable_events) {
      const applicableEvents = JSON.parse(promoCode.applicable_events);
      if (!applicableEvents.includes(eventId)) {
        return res.json({
          success: true,
          data: {
            valid: false,
            error: 'Promo code is not applicable to this event'
          }
        });
      }
    }

    // Check applicable ticket types
    if (promoCode.applicable_ticket_types && ticketTypes.length > 0) {
      const applicableTicketTypes = JSON.parse(promoCode.applicable_ticket_types);
      const hasApplicableTicket = ticketTypes.some(type => applicableTicketTypes.includes(type));
      if (!hasApplicableTicket) {
        return res.json({
          success: true,
          data: {
            valid: false,
            error: 'Promo code is not applicable to selected ticket types'
          }
        });
      }
    }

    // Check usage limits
    if (promoCode.max_uses && promoCode.used_count >= promoCode.max_uses) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'Promo code usage limit reached'
        }
      });
    }

    // Check per-user usage limit
    const userUsageCount = await knex('promo_code_usage')
      .where('promo_code_id', promoCode.id)
      .where('user_id', req.user.id)
      .count('* as count')
      .first();

    if (parseInt(userUsageCount.count) >= promoCode.max_uses_per_user) {
      return res.json({
        success: true,
        data: {
          valid: false,
          error: 'You have already used this promo code the maximum number of times'
        }
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discount_type === 'percentage') {
      discountAmount = (orderAmount * promoCode.discount_value) / 100;
    } else {
      discountAmount = promoCode.discount_value;
    }

    // Apply maximum discount cap
    if (promoCode.maximum_discount_amount && discountAmount > promoCode.maximum_discount_amount) {
      discountAmount = promoCode.maximum_discount_amount;
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    res.json({
      success: true,
      data: {
        valid: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          name: promoCode.name,
          discount_type: promoCode.discount_type,
          discount_value: promoCode.discount_value
        },
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error validating promo code for checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate promo code'
    });
  }
});

/**
 * @swagger
 * /api/v1/promo-codes/event/{eventId}/active:
 *   get:
 *     summary: Get active promo codes for an event
 *     tags: [Promo Codes]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of active promo codes
 */
router.get('/event/:eventId/active', async (req, res) => {
  try {
    const { eventId } = req.params;
    const now = new Date();

    const promoCodes = await knex('promo_codes')
      .where('is_active', true)
      .where('valid_from', '<=', now)
      .where(function() {
        this.whereNull('valid_until')
          .orWhere('valid_until', '>=', now);
      })
      .where(function() {
        this.whereNull('applicable_events')
          .orWhereRaw("applicable_events::text LIKE ?", [`%${eventId}%`]);
      })
      .where(function() {
        this.whereNull('max_uses')
          .orWhereRaw('used_count < max_uses');
      })
      .select('id', 'code', 'name', 'description', 'discount_type', 'discount_value', 'minimum_order_amount', 'maximum_discount_amount')
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: {
        promoCodes
      }
    });
  } catch (error) {
    console.error('Error getting active promo codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active promo codes'
    });
  }
});

/**
 * @swagger
 * /api/v1/promo-codes/{id}/usage-history:
 *   get:
 *     summary: Get usage history for a promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time range for usage history
 *     responses:
 *       200:
 *         description: Usage history retrieved successfully
 */
router.get('/:id/usage-history', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get usage history with user and order details
    const usageHistory = await knex('promo_code_usage')
      .select(
        'promo_code_usage.*',
        'users.email as user_email',
        'orders.id as order_id'
      )
      .leftJoin('users', 'promo_code_usage.user_id', 'users.id')
      .leftJoin('orders', 'promo_code_usage.order_id', 'orders.id')
      .where('promo_code_usage.promo_code_id', id)
      .where('promo_code_usage.used_at', '>=', startDate)
      .orderBy('promo_code_usage.used_at', 'desc')
      .limit(100);

    res.json({
      success: true,
      data: {
        usageHistory
      }
    });
  } catch (error) {
    console.error('Error getting usage history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage history'
    });
  }
});

module.exports = router;

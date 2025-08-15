const PromoCode = require('../models/PromoCode');
const db = require('../models');
const { validationResult } = require('express-validator');

class PromoCodeController {
  /**
   * Create a new promo code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        code,
        name,
        description,
        discountType,
        discountValue,
        minimumOrderAmount,
        maximumDiscountAmount,
        maxUses,
        maxUsesPerUser,
        validFrom,
        validUntil,
        applicableEvents,
        applicableTicketTypes
      } = req.body;

      // Check if promo code already exists
      const existingCode = await PromoCode.findByCode(code);
      if (existingCode) {
        return res.status(400).json({ error: 'Promo code already exists' });
      }

      const promoCodeData = {
        code,
        name,
        description,
        discountType,
        discountValue,
        minimumOrderAmount: minimumOrderAmount || 0,
        maximumDiscountAmount,
        maxUses,
        maxUsesPerUser: maxUsesPerUser || 1,
        validFrom: validFrom || new Date(),
        validUntil,
        applicableEvents,
        applicableTicketTypes,
        createdBy: req.user.id
      };

      const promoCode = await PromoCode.create(promoCodeData);

      res.status(201).json({
        message: 'Promo code created successfully',
        promoCode
      });
    } catch (error) {
      console.error('Error creating promo code:', error);
      res.status(500).json({ error: 'Failed to create promo code' });
    }
  }

  /**
   * Get all promo codes with optional filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, isActive, eventId } = req.query;
      const offset = (page - 1) * limit;

      let query = PromoCode.tableName;

      // Apply filters
      if (isActive !== undefined) {
        query = query.where('is_active', isActive === 'true');
      }

      if (eventId) {
        query = query.where(function() {
          this.whereNull('applicable_events')
            .orWhereRaw("applicable_events::jsonb @> ?", [JSON.stringify([eventId])]);
        });
      }

      const promoCodes = await db(query)
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db(query).count('* as count').first();

      res.json({
        promoCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total.count,
          pages: Math.ceil(total.count / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      res.status(500).json({ error: 'Failed to fetch promo codes' });
    }
  }

  /**
   * Get promo code by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const promoCode = await PromoCode.findById(id);

      if (!promoCode) {
        return res.status(404).json({ error: 'Promo code not found' });
      }

      // Get usage statistics
      const usageStats = await PromoCode.getUsageStats(id);

      res.json({
        promoCode,
        usageStats
      });
    } catch (error) {
      console.error('Error fetching promo code:', error);
      res.status(500).json({ error: 'Failed to fetch promo code' });
    }
  }

  /**
   * Validate promo code for an order
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async validate(req, res) {
    try {
      const { code } = req.params;
      const { eventId, ticketTypes, orderAmount } = req.body;
      const userId = req.user.id;

      const validation = await PromoCode.validate(
        code,
        userId,
        eventId,
        ticketTypes || [],
        orderAmount || 0
      );

      if (!validation.valid) {
        return res.status(400).json({
          valid: false,
          error: validation.error
        });
      }

      // Calculate discount amount
      const discountAmount = PromoCode.calculateDiscount(
        validation.promoCode,
        orderAmount || 0
      );

      res.json({
        valid: true,
        promoCode: validation.promoCode,
        discountAmount,
        finalAmount: (orderAmount || 0) - discountAmount
      });
    } catch (error) {
      console.error('Error validating promo code:', error);
      res.status(500).json({ error: 'Failed to validate promo code' });
    }
  }

  /**
   * Update promo code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Check if promo code exists
      const existingCode = await PromoCode.findById(id);
      if (!existingCode) {
        return res.status(404).json({ error: 'Promo code not found' });
      }

      // If code is being updated, check for duplicates
      if (updateData.code && updateData.code !== existingCode.code) {
        const duplicateCode = await PromoCode.findByCode(updateData.code);
        if (duplicateCode) {
          return res.status(400).json({ error: 'Promo code already exists' });
        }
      }

      const promoCode = await PromoCode.update(id, updateData);

      res.json({
        message: 'Promo code updated successfully',
        promoCode
      });
    } catch (error) {
      console.error('Error updating promo code:', error);
      res.status(500).json({ error: 'Failed to update promo code' });
    }
  }

  /**
   * Delete promo code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if promo code exists
      const existingCode = await PromoCode.findById(id);
      if (!existingCode) {
        return res.status(404).json({ error: 'Promo code not found' });
      }

      const deleted = await PromoCode.delete(id);

      if (!deleted) {
        return res.status(500).json({ error: 'Failed to delete promo code' });
      }

      res.json({ message: 'Promo code deleted successfully' });
    } catch (error) {
      console.error('Error deleting promo code:', error);
      res.status(500).json({ error: 'Failed to delete promo code' });
    }
  }

  /**
   * Get promo codes created by the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMyPromoCodes(req, res) {
    try {
      const userId = req.user.id;
      const promoCodes = await PromoCode.findByCreator(userId);

      res.json({ promoCodes });
    } catch (error) {
      console.error('Error fetching user promo codes:', error);
      res.status(500).json({ error: 'Failed to fetch promo codes' });
    }
  }

  /**
   * Get active promo codes for an event
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getActiveForEvent(req, res) {
    try {
      const { eventId } = req.params;
      const promoCodes = await PromoCode.findActive({ eventId });

      res.json({ promoCodes });
    } catch (error) {
      console.error('Error fetching active promo codes:', error);
      res.status(500).json({ error: 'Failed to fetch active promo codes' });
    }
  }

  /**
   * Get usage statistics for a promo code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUsageStats(req, res) {
    try {
      const { id } = req.params;
      
      // Check if promo code exists
      const existingCode = await PromoCode.findById(id);
      if (!existingCode) {
        return res.status(404).json({ error: 'Promo code not found' });
      }

      const usageStats = await PromoCode.getUsageStats(id);

      res.json({ usageStats });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({ error: 'Failed to fetch usage statistics' });
    }
  }
}

module.exports = PromoCodeController;

const db = require('./index');

class PromoCode {
  static get tableName() {
    return 'promo_codes';
  }

  /**
   * Create a new promo code
   * @param {Object} promoCodeData - Promo code data
   * @returns {Promise<Object>} Created promo code
   */
  static async create(promoCodeData) {
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
      validFrom,
      validUntil,
      applicableEvents,
      applicableTicketTypes,
      createdBy
    } = promoCodeData;

    const [promoCode] = await db(this.tableName)
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
        created_by: createdBy
      })
      .returning('*');

    return promoCode;
  }

  /**
   * Find promo code by code
   * @param {string} code - Promo code
   * @returns {Promise<Object|null>} Promo code object or null
   */
  static async findByCode(code) {
    return await db(this.tableName)
      .where('code', code.toUpperCase())
      .first();
  }

  /**
   * Find promo code by ID
   * @param {string} id - Promo code ID
   * @returns {Promise<Object|null>} Promo code object or null
   */
  static async findById(id) {
    return await db(this.tableName)
      .where('id', id)
      .first();
  }

  /**
   * Get all active promo codes
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of promo codes
   */
  static async findActive(filters = {}) {
    let query = db(this.tableName)
      .where('is_active', true)
      .where('valid_from', '<=', db.fn.now());

    if (filters.validUntil) {
      query = query.where(function() {
        this.whereNull('valid_until')
          .orWhere('valid_until', '>=', db.fn.now());
      });
    }

    if (filters.eventId) {
      query = query.where(function() {
        this.whereNull('applicable_events')
          .orWhereRaw("applicable_events::jsonb @> ?", [JSON.stringify([filters.eventId])]);
      });
    }

    return await query.orderBy('created_at', 'desc');
  }

  /**
   * Validate promo code for a specific order
   * @param {string} code - Promo code
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @param {Array} ticketTypes - Array of ticket types
   * @param {number} orderAmount - Order subtotal
   * @returns {Promise<Object>} Validation result
   */
  static async validate(code, userId, eventId, ticketTypes = [], orderAmount = 0) {
    const promoCode = await this.findByCode(code);
    
    if (!promoCode) {
      return { valid: false, error: 'Promo code not found' };
    }

    if (!promoCode.is_active) {
      return { valid: false, error: 'Promo code is inactive' };
    }

    // Check validity period
    const now = new Date();
    if (new Date(promoCode.valid_from) > now) {
      return { valid: false, error: 'Promo code is not yet valid' };
    }

    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      return { valid: false, error: 'Promo code has expired' };
    }

    // Check usage limits
    if (promoCode.max_uses && promoCode.used_count >= promoCode.max_uses) {
      return { valid: false, error: 'Promo code usage limit exceeded' };
    }

    // Check minimum order amount
    if (orderAmount < promoCode.minimum_order_amount) {
      return { 
        valid: false, 
        error: `Minimum order amount of $${promoCode.minimum_order_amount} required` 
      };
    }

    // Check event applicability
    if (promoCode.applicable_events) {
      const applicableEvents = JSON.parse(promoCode.applicable_events);
      if (!applicableEvents.includes(eventId)) {
        return { valid: false, error: 'Promo code not applicable to this event' };
      }
    }

    // Check ticket type applicability
    if (promoCode.applicable_ticket_types && ticketTypes.length > 0) {
      const applicableTicketTypes = JSON.parse(promoCode.applicable_ticket_types);
      const hasApplicableTicket = ticketTypes.some(type => applicableTicketTypes.includes(type));
      if (!hasApplicableTicket) {
        return { valid: false, error: 'Promo code not applicable to selected ticket types' };
      }
    }

    // Check per-user usage limit
    const userUsageCount = await db('promo_code_usage')
      .where({ promo_code_id: promoCode.id, user_id: userId })
      .count('* as count')
      .first();

    if (userUsageCount.count >= promoCode.max_uses_per_user) {
      return { valid: false, error: 'You have already used this promo code the maximum number of times' };
    }

    return { valid: true, promoCode };
  }

  /**
   * Calculate discount amount for an order
   * @param {Object} promoCode - Promo code object
   * @param {number} orderAmount - Order subtotal
   * @returns {number} Discount amount
   */
  static calculateDiscount(promoCode, orderAmount) {
    let discountAmount = 0;

    if (promoCode.discount_type === 'percentage') {
      discountAmount = (orderAmount * promoCode.discount_value) / 100;
    } else if (promoCode.discount_type === 'fixed_amount') {
      discountAmount = promoCode.discount_value;
    }

    // Apply maximum discount limit
    if (promoCode.maximum_discount_amount && discountAmount > promoCode.maximum_discount_amount) {
      discountAmount = promoCode.maximum_discount_amount;
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Record promo code usage
   * @param {string} promoCodeId - Promo code ID
   * @param {string} userId - User ID
   * @param {string} orderId - Order ID
   * @param {number} discountAmount - Discount amount applied
   * @returns {Promise<Object>} Usage record
   */
  static async recordUsage(promoCodeId, userId, orderId, discountAmount) {
    const trx = await db.transaction();

    try {
      // Create usage record
      const [usage] = await trx('promo_code_usage')
        .insert({
          promo_code_id: promoCodeId,
          user_id: userId,
          order_id: orderId,
          discount_amount: discountAmount
        })
        .returning('*');

      // Increment usage count
      await trx(this.tableName)
        .where('id', promoCodeId)
        .increment('used_count', 1);

      await trx.commit();
      return usage;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Get usage statistics for a promo code
   * @param {string} promoCodeId - Promo code ID
   * @returns {Promise<Object>} Usage statistics
   */
  static async getUsageStats(promoCodeId) {
    const stats = await db('promo_code_usage')
      .where('promo_code_id', promoCodeId)
      .select(
        db.raw('COUNT(*) as total_uses'),
        db.raw('COUNT(DISTINCT user_id) as unique_users'),
        db.raw('SUM(discount_amount) as total_discount_given')
      )
      .first();

    return stats;
  }

  /**
   * Update promo code
   * @param {string} id - Promo code ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated promo code
   */
  static async update(id, updateData) {
    const [promoCode] = await db(this.tableName)
      .where('id', id)
      .update(updateData)
      .returning('*');

    return promoCode;
  }

  /**
   * Delete promo code
   * @param {string} id - Promo code ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const deleted = await db(this.tableName)
      .where('id', id)
      .del();

    return deleted > 0;
  }

  /**
   * Get promo codes created by a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of promo codes
   */
  static async findByCreator(userId) {
    return await db(this.tableName)
      .where('created_by', userId)
      .orderBy('created_at', 'desc');
  }
}

module.exports = PromoCode;

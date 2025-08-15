const knex = require('./database');

/**
 * Promo Code Service Utility
 * Handles promo code validation, calculation, and usage tracking
 */
class PromoCodeService {
  /**
   * Validate a promo code for a specific order
   * @param {string} code - Promo code
   * @param {string} userId - User ID
   * @param {string} eventId - Event ID
   * @param {Array} ticketTypes - Array of ticket types
   * @param {number} orderAmount - Order amount
   * @returns {Promise<Object>} Validation result
   */
  static async validatePromoCode(code, userId, eventId, ticketTypes = [], orderAmount) {
    try {
      // Find promo code
      const promoCode = await knex('promo_codes')
        .where('code', code.toUpperCase())
        .where('is_active', true)
        .first();

      if (!promoCode) {
        return {
          valid: false,
          error: 'Promo code not found'
        };
      }

      // Check validity period
      const now = new Date();
      if (now < new Date(promoCode.valid_from)) {
        return {
          valid: false,
          error: 'Promo code is not yet active'
        };
      }

      if (promoCode.valid_until && now > new Date(promoCode.valid_until)) {
        return {
          valid: false,
          error: 'Promo code has expired'
        };
      }

      // Check minimum order amount
      if (orderAmount < promoCode.minimum_order_amount) {
        return {
          valid: false,
          error: `Minimum order amount of $${promoCode.minimum_order_amount} required`
        };
      }

      // Check applicable events
      if (promoCode.applicable_events) {
        const applicableEvents = JSON.parse(promoCode.applicable_events);
        if (!applicableEvents.includes(eventId)) {
          return {
            valid: false,
            error: 'Promo code is not applicable to this event'
          };
        }
      }

      // Check applicable ticket types
      if (promoCode.applicable_ticket_types && ticketTypes.length > 0) {
        const applicableTicketTypes = JSON.parse(promoCode.applicable_ticket_types);
        const hasApplicableTicket = ticketTypes.some(type => applicableTicketTypes.includes(type));
        if (!hasApplicableTicket) {
          return {
            valid: false,
            error: 'Promo code is not applicable to selected ticket types'
          };
        }
      }

      // Check usage limits
      if (promoCode.max_uses && promoCode.used_count >= promoCode.max_uses) {
        return {
          valid: false,
          error: 'Promo code usage limit reached'
        };
      }

      // Check per-user usage limit
      const userUsageCount = await knex('promo_code_usage')
        .where('promo_code_id', promoCode.id)
        .where('user_id', userId)
        .count('* as count')
        .first();

      if (parseInt(userUsageCount.count) >= promoCode.max_uses_per_user) {
        return {
          valid: false,
          error: 'You have already used this promo code the maximum number of times'
        };
      }

      // Calculate discount
      const discountAmount = this.calculateDiscount(promoCode, orderAmount);
      const finalAmount = Math.max(0, orderAmount - discountAmount);

      return {
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
      };
    } catch (error) {
      console.error('Error validating promo code:', error);
      return {
        valid: false,
        error: 'Failed to validate promo code'
      };
    }
  }

  /**
   * Calculate discount amount for a promo code
   * @param {Object} promoCode - Promo code object
   * @param {number} orderAmount - Order amount
   * @returns {number} Discount amount
   */
  static calculateDiscount(promoCode, orderAmount) {
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

    return Math.min(discountAmount, orderAmount); // Don't discount more than order amount
  }

  /**
   * Apply promo code to an order and track usage
   * @param {string} promoCodeId - Promo code ID
   * @param {string} userId - User ID
   * @param {string} orderId - Order ID
   * @param {number} discountAmount - Discount amount applied
   * @returns {Promise<boolean>} Success status
   */
  static async applyPromoCode(promoCodeId, userId, orderId, discountAmount) {
    try {
      await knex.transaction(async (trx) => {
        // Record usage
        await trx('promo_code_usage').insert({
          promo_code_id: promoCodeId,
          user_id: userId,
          order_id: orderId,
          discount_amount: discountAmount
        });

        // Update promo code usage count
        await trx('promo_codes')
          .where('id', promoCodeId)
          .increment('used_count', 1);
      });

      return true;
    } catch (error) {
      console.error('Error applying promo code:', error);
      return false;
    }
  }

  /**
   * Get active promo codes for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Array>} Array of active promo codes
   */
  static async getActivePromoCodes(eventId) {
    try {
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

      return promoCodes;
    } catch (error) {
      console.error('Error getting active promo codes:', error);
      return [];
    }
  }

  /**
   * Get promo code usage statistics
   * @param {string} promoCodeId - Promo code ID
   * @returns {Promise<Object>} Usage statistics
   */
  static async getUsageStats(promoCodeId) {
    try {
      const stats = await knex('promo_code_usage')
        .where('promo_code_id', promoCodeId)
        .select(
          knex.raw('COUNT(*) as total_uses'),
          knex.raw('COUNT(DISTINCT user_id) as unique_users'),
          knex.raw('SUM(discount_amount) as total_discount_given')
        )
        .first();

      return {
        total_uses: parseInt(stats.total_uses),
        unique_users: parseInt(stats.unique_users),
        total_discount_given: parseFloat(stats.total_discount_given || 0)
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        total_uses: 0,
        unique_users: 0,
        total_discount_given: 0
      };
    }
  }

  /**
   * Check if a promo code exists and is active
   * @param {string} code - Promo code
   * @returns {Promise<boolean>} Exists and active
   */
  static async isPromoCodeActive(code) {
    try {
      const promoCode = await knex('promo_codes')
        .where('code', code.toUpperCase())
        .where('is_active', true)
        .first();

      if (!promoCode) {
        return false;
      }

      const now = new Date();
      if (now < new Date(promoCode.valid_from)) {
        return false;
      }

      if (promoCode.valid_until && now > new Date(promoCode.valid_until)) {
        return false;
      }

      if (promoCode.max_uses && promoCode.used_count >= promoCode.max_uses) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking promo code status:', error);
      return false;
    }
  }

  /**
   * Get user's promo code usage history
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Usage history
   */
  static async getUserUsageHistory(userId, limit = 10) {
    try {
      const history = await knex('promo_code_usage')
        .select([
          'promo_code_usage.*',
          'promo_codes.code as promo_code',
          'promo_codes.name as promo_name',
          'orders.order_number'
        ])
        .leftJoin('promo_codes', 'promo_code_usage.promo_code_id', 'promo_codes.id')
        .leftJoin('orders', 'promo_code_usage.order_id', 'orders.id')
        .where('promo_code_usage.user_id', userId)
        .orderBy('promo_code_usage.used_at', 'desc')
        .limit(limit);

      return history;
    } catch (error) {
      console.error('Error getting user usage history:', error);
      return [];
    }
  }
}

module.exports = PromoCodeService;

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');
const { createIdempotencyMiddleware, validateIdempotencyKey } = require('../../middleware/idempotency');

const router = express.Router();

// Apply idempotency middleware to payment endpoints
const idempotencyMiddleware = createIdempotencyMiddleware({
  ttl: 60 * 60 * 1000, // 1 hour for payment operations
  required: true
});

// POST /payments/create-payment-intent - Create payment intent for ticket purchase
router.post('/create-payment-intent', authenticateToken, validateIdempotencyKey, idempotencyMiddleware, async (req, res) => {
  try {
    const { eventId, tickets, promoCode } = req.body;

    // Validation
    if (!eventId || !tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and tickets array are required'
      });
    }

    // Verify event exists and is published
    const event = await knex('events')
      .where('id', eventId)
      .where('status', 'published')
      .first();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not available for purchase'
      });
    }

    // Calculate total amount and validate tickets
    let subtotal = 0;
    const orderItems = [];

    for (const item of tickets) {
      const { ticketId, quantity } = item;

      if (!ticketId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket data'
        });
      }

      // Get ticket details
      const ticket = await knex('tickets')
        .where('id', ticketId)
        .where('event_id', eventId)
        .where('is_active', true)
        .first();

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: `Ticket not found: ${ticketId}`
        });
      }

      // Check availability
      const availableQuantity = ticket.quantity_total - ticket.quantity_sold;
      if (quantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough tickets available. Only ${availableQuantity} left for ${ticket.name}`
        });
      }

      // Check max per order
      if (quantity > ticket.max_per_order) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${ticket.max_per_order} tickets allowed per order for ${ticket.name}`
        });
      }

      const itemTotal = parseFloat(ticket.price) * quantity;
      subtotal += itemTotal;

      orderItems.push({
        ticketId: ticket.id,
        ticketName: ticket.name,
        quantity,
        unitPrice: parseFloat(ticket.price),
        totalPrice: itemTotal
      });
    }

    // Validate and apply promo code if provided
    let discountAmount = 0;
    let appliedPromoCode = null;
    
    if (promoCode) {
      // Find promo code
      const promoCodeData = await knex('promo_codes')
        .where('code', promoCode.toUpperCase())
        .where('is_active', true)
        .first();

      if (promoCodeData) {
        // Check validity period
        const now = new Date();
        if (now >= new Date(promoCodeData.valid_from) && 
            (!promoCodeData.valid_until || now <= new Date(promoCodeData.valid_until))) {
          
          // Check minimum order amount
          if (subtotal >= promoCodeData.minimum_order_amount) {
            
            // Check applicable events
            let isApplicable = true;
            if (promoCodeData.applicable_events) {
              const applicableEvents = JSON.parse(promoCodeData.applicable_events);
              isApplicable = applicableEvents.includes(eventId);
            }
            
            // Check applicable ticket types
            if (isApplicable && promoCodeData.applicable_ticket_types) {
              const applicableTicketTypes = JSON.parse(promoCodeData.applicable_ticket_types);
              const ticketTypes = orderItems.map(item => item.ticketId);
              isApplicable = ticketTypes.some(type => applicableTicketTypes.includes(type));
            }
            
            // Check usage limits
            if (isApplicable && (!promoCodeData.max_uses || promoCodeData.used_count < promoCodeData.max_uses)) {
              
              // Check per-user usage limit
              const userUsageCount = await knex('promo_code_usage')
                .where('promo_code_id', promoCodeData.id)
                .where('user_id', req.user.id)
                .count('* as count')
                .first();

              if (parseInt(userUsageCount.count) < promoCodeData.max_uses_per_user) {
                // Calculate discount
                if (promoCodeData.discount_type === 'percentage') {
                  discountAmount = (subtotal * promoCodeData.discount_value) / 100;
                } else {
                  discountAmount = promoCodeData.discount_value;
                }

                // Apply maximum discount cap
                if (promoCodeData.maximum_discount_amount && discountAmount > promoCodeData.maximum_discount_amount) {
                  discountAmount = promoCodeData.maximum_discount_amount;
                }

                discountAmount = Math.min(discountAmount, subtotal); // Don't discount more than subtotal
                appliedPromoCode = {
                  id: promoCodeData.id,
                  code: promoCodeData.code,
                  name: promoCodeData.name,
                  discount_type: promoCodeData.discount_type,
                  discount_value: promoCodeData.discount_value
                };
              }
            }
          }
        }
      }
    }

    // Calculate fees (2.9% + $0.30 Stripe fee) on subtotal before discount
    const fees = Math.round((subtotal * 0.029 + 0.30) * 100) / 100;
    const total = subtotal - discountAmount + fees;

    // Generate order number
    const orderNumber = `BLT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in database
    const [order] = await knex('orders')
      .insert({
        user_id: req.user.id,
        event_id: eventId,
        order_number: orderNumber,
        status: 'pending',
        subtotal: subtotal,
        discount_amount: discountAmount,
        fees: fees,
        total: total,
        promo_code_id: appliedPromoCode ? appliedPromoCode.id : null
      })
      .returning('*');

    // Create order items
    const orderItemsData = orderItems.map(item => ({
      order_id: order.id,
      ticket_id: item.ticketId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice
    }));

    await knex('order_items').insert(orderItemsData);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Stripe expects cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        eventId: eventId,
        userId: req.user.id
      }
    });

    // Update order with Stripe payment intent ID
    await knex('orders')
      .where('id', order.id)
      .update({ stripe_payment_intent_id: paymentIntent.id });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
        orderNumber: order.order_number,
        subtotal: subtotal,
        discountAmount: discountAmount,
        fees: fees,
        total: total,
        items: orderItems,
        appliedPromoCode: appliedPromoCode
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /payments/confirm - Confirm payment and complete order
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Find order by payment intent ID
    const order = await knex('orders')
      .where('stripe_payment_intent_id', paymentIntentId)
      .where('user_id', req.user.id)
      .first();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order already completed'
      });
    }

    // Start transaction
    await knex.transaction(async (trx) => {
      // Update order status
      await trx('orders')
        .where('id', order.id)
        .update({
          status: 'completed',
          stripe_charge_id: paymentIntent.latest_charge
        });

      // Update ticket quantities
      const orderItems = await trx('order_items')
        .where('order_id', order.id);

      for (const item of orderItems) {
        await trx('tickets')
          .where('id', item.ticket_id)
          .increment('quantity_sold', item.quantity);
      }

      // Track promo code usage if applicable
      if (order.promo_code_id) {
        await trx('promo_code_usage').insert({
          promo_code_id: order.promo_code_id,
          user_id: req.user.id,
          order_id: order.id,
          discount_amount: order.discount_amount,
          used_at: new Date()
        });

        // Increment usage count on promo code
        await trx('promo_codes')
          .where('id', order.promo_code_id)
          .increment('used_count', 1);
      }
    });

    // Get complete order details
    const completedOrder = await knex('orders')
      .select([
        'orders.*',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.venue_name',
        'events.venue_address',
        'promo_codes.code as promo_code',
        'promo_codes.name as promo_code_name'
      ])
      .leftJoin('events', 'orders.event_id', 'events.id')
      .leftJoin('promo_codes', 'orders.promo_code_id', 'promo_codes.id')
      .where('orders.id', order.id)
      .first();

    const items = await knex('order_items')
      .select([
        'order_items.*',
        'tickets.name as ticket_name',
        'tickets.type as ticket_type'
      ])
      .leftJoin('tickets', 'order_items.ticket_id', 'tickets.id')
      .where('order_items.order_id', order.id);

    res.json({
      success: true,
      message: 'Payment confirmed and order completed',
      data: {
        order: completedOrder,
        items: items
      }
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /payments/orders - Get user's orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const orders = await knex('orders')
      .select([
        'orders.*',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.venue_name',
        'events.cover_image_url'
      ])
      .leftJoin('events', 'orders.event_id', 'events.id')
      .where('orders.user_id', req.user.id)
      .orderBy('orders.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await knex('orders')
      .where('user_id', req.user.id)
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /payments/orders/:id - Get specific order details
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await knex('orders')
      .select([
        'orders.*',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.venue_name',
        'events.venue_address',
        'events.cover_image_url',
        'promo_codes.code as promo_code',
        'promo_codes.name as promo_code_name'
      ])
      .leftJoin('events', 'orders.event_id', 'events.id')
      .leftJoin('promo_codes', 'orders.promo_code_id', 'promo_codes.id')
      .where('orders.id', req.params.id)
      .where('orders.user_id', req.user.id)
      .first();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const items = await knex('order_items')
      .select([
        'order_items.*',
        'tickets.name as ticket_name',
        'tickets.type as ticket_type',
        'tickets.description as ticket_description'
      ])
      .leftJoin('tickets', 'order_items.ticket_id', 'tickets.id')
      .where('order_items.order_id', order.id);

    res.json({
      success: true,
      data: {
        order,
        items
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
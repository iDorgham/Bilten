const express = require('express');
const knex = require('../../utils/database');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// POST /payments-test/create-payment-intent - Test version without Stripe
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { eventId, tickets } = req.body;

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

    // Calculate fees (2.9% + $0.30 Stripe fee)
    const fees = Math.round((subtotal * 0.029 + 0.30) * 100) / 100;
    const total = subtotal + fees;

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
        fees: fees,
        total: total,
        stripe_payment_intent_id: 'test_pi_' + Math.random().toString(36).substr(2, 9)
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

    res.json({
      success: true,
      message: 'Test payment intent created successfully',
      data: {
        clientSecret: 'test_client_secret_' + Math.random().toString(36).substr(2, 9),
        orderId: order.id,
        orderNumber: order.order_number,
        subtotal: subtotal,
        fees: fees,
        total: total,
        items: orderItems
      }
    });
  } catch (error) {
    console.error('Create test payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
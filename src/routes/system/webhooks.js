const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const WebhookService = require('../../services/webhookService');
const { createIdempotencyMiddleware } = require('../../middleware/idempotency');

const router = express.Router();

// Apply idempotency middleware to webhook endpoints
const idempotencyMiddleware = createIdempotencyMiddleware({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  required: false // Webhooks can be retried
});

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), idempotencyMiddleware, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Process webhook event using the webhook service
    await WebhookService.processWebhookEvent(event.type, event.data.object, 'stripe');
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const { orderId, orderNumber, eventId, userId } = paymentIntent.metadata;

    // Find the order
    const order = await knex('orders')
      .where('id', orderId)
      .where('stripe_payment_intent_id', paymentIntent.id)
      .first();

    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    if (order.status === 'completed') {
      console.log('Order already completed:', orderId);
      return;
    }

    // Start transaction to update order and create tickets
    await knex.transaction(async (trx) => {
      // Update order status
      await trx('orders')
        .where('id', orderId)
        .update({
          status: 'completed',
          stripe_charge_id: paymentIntent.latest_charge,
          updated_at: new Date()
        });

      // Get order items
      const orderItems = await trx('order_items')
        .where('order_id', orderId);

      // Update ticket quantities and create user tickets
      for (const item of orderItems) {
        // Update ticket quantities
        await trx('tickets')
          .where('id', item.ticket_id)
          .increment('quantity_sold', item.quantity);

        // Create individual tickets for each purchase
        for (let i = 0; i < item.quantity; i++) {
          const ticketNumber = `${orderNumber}-${item.ticket_id}-${i + 1}`;
          
          await trx('user_tickets').insert({
            user_id: userId,
            order_id: orderId,
            ticket_id: item.ticket_id,
            ticket_number: ticketNumber,
            status: 'active',
            qr_code: generateQRCode(ticketNumber),
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    });

    console.log('Payment succeeded and order completed:', orderId);
    
    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(orderId);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Don't fail the webhook if email fails
    }
    
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  try {
    const { orderId } = paymentIntent.metadata;

    // Update order status to failed
    await knex('orders')
      .where('id', orderId)
      .where('stripe_payment_intent_id', paymentIntent.id)
      .update({
        status: 'failed',
        updated_at: new Date()
      });

    console.log('Payment failed for order:', orderId);
    
    // TODO: Send failure notification to user
    // await sendPaymentFailureEmail(userId, orderId);
    
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent) {
  try {
    const { orderId } = paymentIntent.metadata;

    // Update order status to canceled
    await knex('orders')
      .where('id', orderId)
      .where('stripe_payment_intent_id', paymentIntent.id)
      .update({
        status: 'cancelled',
        updated_at: new Date()
      });

    console.log('Payment canceled for order:', orderId);
    
  } catch (error) {
    console.error('Error handling payment canceled:', error);
    throw error;
  }
}

// Handle charge refunded
async function handleChargeRefunded(charge) {
  try {
    const paymentIntentId = charge.payment_intent;
    
    // Find order by payment intent ID
    const order = await knex('orders')
      .where('stripe_payment_intent_id', paymentIntentId)
      .first();

    if (!order) {
      console.error('Order not found for refunded charge:', charge.id);
      return;
    }

    // Update order status to refunded
    await knex('orders')
      .where('id', order.id)
      .update({
        status: 'refunded',
        updated_at: new Date()
      });

    // Update user tickets status
    await knex('user_tickets')
      .where('order_id', order.id)
      .update({
        status: 'refunded',
        updated_at: new Date()
      });

    console.log('Charge refunded for order:', order.id);
    
  } catch (error) {
    console.error('Error handling charge refunded:', error);
    throw error;
  }
}

// Handle dispute created
async function handleDisputeCreated(charge) {
  try {
    const paymentIntentId = charge.payment_intent;
    
    // Find order by payment intent ID
    const order = await knex('orders')
      .where('stripe_payment_intent_id', paymentIntentId)
      .first();

    if (!order) {
      console.error('Order not found for disputed charge:', charge.id);
      return;
    }

    // Update order status to disputed
    await knex('orders')
      .where('id', order.id)
      .update({
        status: 'disputed',
        updated_at: new Date()
      });

    console.log('Dispute created for order:', order.id);
    
    // TODO: Send notification to admin/organizer
    // await sendDisputeNotification(order.id);
    
  } catch (error) {
    console.error('Error handling dispute created:', error);
    throw error;
  }
}

// Generate QR code for ticket
function generateQRCode(ticketNumber) {
  // Simple QR code generation - in production, use a proper QR library
  return `BLT-${ticketNumber}-${Date.now()}`;
}

// Send order confirmation email
async function sendOrderConfirmationEmail(orderId) {
  try {
    // Get order with user and event information
    const order = await knex('orders')
      .select(
        'orders.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'events.title as event_title',
        'events.start_date as event_start_date',
        'events.venue_name as event_venue_name',
        'events.venue_address as event_venue_address',
        'promo_codes.name as promo_code_name',
        'promo_codes.code as promo_code_code'
      )
      .leftJoin('users', 'orders.user_id', 'users.id')
      .leftJoin('events', 'orders.event_id', 'events.id')
      .leftJoin('promo_codes', 'orders.promo_code_id', 'promo_codes.id')
      .where('orders.id', orderId)
      .first();

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Get order items
    const items = await knex('order_items')
      .select(
        'order_items.*',
        'tickets.ticket_type',
        'tickets.name as ticket_name'
      )
      .leftJoin('tickets', 'order_items.ticket_id', 'tickets.id')
      .where('order_items.order_id', orderId);

    // Prepare data for email service
    const orderData = {
      user: {
        first_name: order.first_name,
        last_name: order.last_name,
        email: order.email
      },
      order: {
        order_number: order.order_number,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        total: order.total,
        created_at: order.created_at
      },
      event: {
        title: order.event_title,
        start_date: order.event_start_date,
        venue_name: order.event_venue_name,
        venue_address: order.event_venue_address
      },
      items: items.map(item => ({
        ticket_type: item.ticket_type,
        quantity: item.quantity,
        price: item.price,
        total_price: item.total_price
      })),
      promoCode: order.promo_code_code ? {
        code: order.promo_code_code,
        name: order.promo_code_name
      } : null
    };

    // Send email
    await EmailService.sendOrderConfirmation(orderData);
    console.log(`Order confirmation email sent for order: ${orderId}`);
  } catch (error) {
    console.error(`Error sending order confirmation email for order ${orderId}:`, error);
    throw error;
  }
}

// Health check endpoint for webhooks
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    webhooks: {
      stripe: 'active'
    }
  });
});

module.exports = router;

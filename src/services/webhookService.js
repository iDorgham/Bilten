const crypto = require('crypto');
const axios = require('axios');
const knex = require('../utils/database');
const EmailService = require('./emailService');

/**
 * Webhook Service for managing webhook delivery and processing
 */
class WebhookService {
  constructor() {
    this.maxRetries = 5;
    this.retryDelays = [1000, 5000, 15000, 60000, 300000];
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, secret) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(eventType, eventData, source = 'stripe') {
    try {
      // Store webhook event
      const [webhookEvent] = await knex('webhook_events').insert({
        event_type: eventType,
        source: source,
        event_data: JSON.stringify(eventData),
        status: 'processing',
        created_at: new Date()
      }).returning('*');

      // Process based on event type
      let result;
      switch (eventType) {
        case 'payment_intent.succeeded':
          result = await this.handlePaymentSucceeded(eventData);
          break;
        case 'payment_intent.payment_failed':
          result = await this.handlePaymentFailed(eventData);
          break;
        case 'payment_intent.canceled':
          result = await this.handlePaymentCanceled(eventData);
          break;
        case 'charge.refunded':
          result = await this.handleChargeRefunded(eventData);
          break;
        default:
          result = { success: true, message: 'Event type not handled' };
      }

      // Update webhook event status
      await knex('webhook_events')
        .where('id', webhookEvent.id)
        .update({
          status: 'completed',
          processed_at: new Date(),
          result: JSON.stringify(result)
        });

      return result;

    } catch (error) {
      console.error('Webhook event processing error:', error);
      throw error;
    }
  }

  /**
   * Send webhook to external endpoints
   */
  async sendWebhook(endpoint, payload, headers = {}) {
    const webhookId = crypto.randomUUID();
    
    try {
      // Store webhook delivery attempt
      const [delivery] = await knex('webhook_deliveries').insert({
        webhook_id: webhookId,
        endpoint: endpoint,
        payload: JSON.stringify(payload),
        headers: JSON.stringify(headers),
        status: 'pending',
        created_at: new Date()
      }).returning('*');

      // Send webhook
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Bilten-Webhooks/1.0',
          'X-Webhook-ID': webhookId,
          'X-Webhook-Timestamp': Date.now(),
          ...headers
        },
        timeout: 30000
      });

      // Update delivery status
      await knex('webhook_deliveries')
        .where('id', delivery.id)
        .update({
          status: 'delivered',
          response_status: response.status,
          response_data: JSON.stringify(response.data),
          delivered_at: new Date()
        });

      return {
        success: true,
        webhookId,
        status: response.status,
        data: response.data
      };

    } catch (error) {
      console.error('Webhook delivery failed:', error);

      // Update delivery status
      await knex('webhook_deliveries')
        .where('webhook_id', webhookId)
        .update({
          status: 'failed',
          error_message: error.message,
          response_status: error.response?.status,
          response_data: error.response?.data ? JSON.stringify(error.response.data) : null,
          delivered_at: new Date()
        });

      throw error;
    }
  }

  /**
   * Handle payment succeeded event
   */
  async handlePaymentSucceeded(paymentIntent) {
    try {
      const { orderId, orderNumber, eventId, userId } = paymentIntent.metadata;

      // Find the order
      const order = await knex('orders')
        .where('id', orderId)
        .where('stripe_payment_intent_id', paymentIntent.id)
        .first();

      if (!order) {
        throw new Error(`Order not found for payment intent: ${paymentIntent.id}`);
      }

      if (order.status === 'completed') {
        return { success: true, message: 'Order already completed' };
      }

      // Process order completion
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
              qr_code: this.generateQRCode(ticketNumber),
              status: 'active',
              created_at: new Date()
            });
          }
        }
      });

      // Send confirmation email
      await EmailService.sendOrderConfirmation(orderId);

      // Send webhooks to external systems
      await this.sendOrderWebhooks(orderId, 'order.completed');

      return { success: true, message: 'Payment processed successfully' };

    } catch (error) {
      console.error('Payment succeeded handling error:', error);
      throw error;
    }
  }

  /**
   * Handle payment failed event
   */
  async handlePaymentFailed(paymentIntent) {
    try {
      const { orderId, userId } = paymentIntent.metadata;

      // Update order status
      await knex('orders')
        .where('id', orderId)
        .update({
          status: 'failed',
          updated_at: new Date()
        });

      // Send failure notification
      await EmailService.sendPaymentFailedNotification(orderId);

      // Send webhooks
      await this.sendOrderWebhooks(orderId, 'order.payment_failed');

      return { success: true, message: 'Payment failure processed' };

    } catch (error) {
      console.error('Payment failed handling error:', error);
      throw error;
    }
  }

  /**
   * Handle payment canceled event
   */
  async handlePaymentCanceled(paymentIntent) {
    try {
      const { orderId } = paymentIntent.metadata;

      // Update order status
      await knex('orders')
        .where('id', orderId)
        .update({
          status: 'canceled',
          updated_at: new Date()
        });

      // Send webhooks
      await this.sendOrderWebhooks(orderId, 'order.canceled');

      return { success: true, message: 'Payment cancellation processed' };

    } catch (error) {
      console.error('Payment canceled handling error:', error);
      throw error;
    }
  }

  /**
   * Handle charge refunded event
   */
  async handleChargeRefunded(charge) {
    try {
      const orderId = charge.metadata?.orderId;

      if (orderId) {
        // Update order status
        await knex('orders')
          .where('id', orderId)
          .update({
            status: 'refunded',
            updated_at: new Date()
          });

        // Send refund notification
        await EmailService.sendRefundNotification(orderId);

        // Send webhooks
        await this.sendOrderWebhooks(orderId, 'order.refunded');
      }

      return { success: true, message: 'Refund processed' };

    } catch (error) {
      console.error('Charge refunded handling error:', error);
      throw error;
    }
  }

  /**
   * Send order-related webhooks
   */
  async sendOrderWebhooks(orderId, eventType) {
    try {
      const order = await knex('orders')
        .where('id', orderId)
        .first();

      if (!order) return;

      const webhookEndpoints = await knex('webhook_endpoints')
        .where('event_types', 'like', `%${eventType}%`)
        .where('is_active', true);

      const payload = {
        event_type: eventType,
        order_id: orderId,
        order_data: order,
        timestamp: new Date().toISOString()
      };

      for (const endpoint of webhookEndpoints) {
        try {
          await this.sendWebhook(endpoint.url, payload, {
            'Authorization': `Bearer ${endpoint.secret_key}`,
            'X-Webhook-Source': 'bilten'
          });
        } catch (error) {
          console.error(`Failed to send webhook to ${endpoint.url}:`, error);
        }
      }

    } catch (error) {
      console.error('Failed to send order webhooks:', error);
    }
  }

  /**
   * Generate QR code for ticket
   */
  generateQRCode(ticketNumber) {
    return crypto.createHash('sha256').update(ticketNumber).digest('hex');
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryFailedWebhooks() {
    try {
      const failedDeliveries = await knex('webhook_deliveries')
        .where('status', 'failed')
        .where('retry_count', '<', this.maxRetries)
        .orderBy('created_at', 'asc');

      for (const delivery of failedDeliveries) {
        await this.retryWebhookDelivery(delivery);
      }

      return failedDeliveries.length;
    } catch (error) {
      console.error('Failed to retry webhooks:', error);
      throw error;
    }
  }

  /**
   * Retry specific webhook delivery
   */
  async retryWebhookDelivery(delivery) {
    try {
      const retryCount = delivery.retry_count + 1;
      const delay = this.retryDelays[retryCount - 1] || this.retryDelays[this.retryDelays.length - 1];

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Update retry count
      await knex('webhook_deliveries')
        .where('id', delivery.id)
        .update({
          retry_count: retryCount,
          last_retry_at: new Date()
        });

      // Attempt delivery again
      const payload = JSON.parse(delivery.payload);
      const headers = JSON.parse(delivery.headers);

      const response = await axios.post(delivery.endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Bilten-Webhooks/1.0',
          'X-Webhook-ID': delivery.webhook_id,
          'X-Webhook-Timestamp': Date.now(),
          'X-Webhook-Retry': retryCount,
          ...headers
        },
        timeout: 30000
      });

      // Update delivery status
      await knex('webhook_deliveries')
        .where('id', delivery.id)
        .update({
          status: 'delivered',
          response_status: response.status,
          response_data: JSON.stringify(response.data),
          delivered_at: new Date()
        });

      console.log(`Successfully retried webhook delivery ${delivery.id} after ${retryCount} attempts`);

    } catch (error) {
      console.error(`Failed to retry webhook delivery ${delivery.id}:`, error);

      // Update delivery status
      await knex('webhook_deliveries')
        .where('id', delivery.id)
        .update({
          status: 'failed',
          error_message: error.message,
          response_status: error.response?.status,
          response_data: error.response?.data ? JSON.stringify(error.response.data) : null
        });
    }
  }
}

module.exports = new WebhookService();


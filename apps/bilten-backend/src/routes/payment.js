const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

/**
 * @route POST /api/v1/payment/create-payment-intent
 * @desc Create a payment intent with Stripe
 * @access Private
 */
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'Payment amount must be greater than zero'
      });
    }

    // Add user ID to metadata
    const paymentMetadata = {
      ...metadata,
      userId: req.user.id
    };

    const paymentIntent = await PaymentService.createStripePaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      metadata: paymentMetadata
    });

    res.status(200).json(paymentIntent);
  } catch (error) {
    logger.error('Error creating payment intent', { error: error.message });
    res.status(500).json({ 
      error: 'Payment processing error',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/v1/payment/payment-intent/:id
 * @desc Retrieve a payment intent
 * @access Private
 */
router.get('/payment-intent/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Missing payment intent ID',
        message: 'Payment intent ID is required'
      });
    }

    const paymentIntent = await PaymentService.retrieveStripePaymentIntent(id);
    
    res.status(200).json(paymentIntent);
  } catch (error) {
    logger.error('Error retrieving payment intent', { error: error.message });
    res.status(500).json({ 
      error: 'Payment processing error',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/payment/refund
 * @desc Process a refund
 * @access Private
 */
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ 
        error: 'Missing payment intent ID',
        message: 'Payment intent ID is required'
      });
    }

    const refund = await PaymentService.processStripeRefund({
      paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if provided
      reason
    });
    
    res.status(200).json(refund);
  } catch (error) {
    logger.error('Error processing refund', { error: error.message });
    res.status(500).json({ 
      error: 'Refund processing error',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/payment/webhook
 * @desc Handle Stripe webhook events
 * @access Public
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      logger.warn('Stripe webhook secret not configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    let event;
    
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err.message });
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });
        
        // Process successful payment
        try {
          await PaymentService.updateTransactionStatus(
            paymentIntent.id, 
            'completed',
            { completedAt: new Date().toISOString() }
          );
          
          // Generate receipt
          const transaction = await PaymentService.processTransaction({
            userId: paymentIntent.metadata.userId,
            eventId: paymentIntent.metadata.eventId,
            orderId: paymentIntent.metadata.orderId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paymentMethod: 'stripe',
            gatewayTransactionId: paymentIntent.id,
            status: 'completed',
            metadata: paymentIntent.metadata
          });
          
          logger.info('Payment processed successfully', { 
            transactionId: transaction.id,
            paymentIntentId: paymentIntent.id 
          });
        } catch (error) {
          logger.error('Error processing successful payment', { 
            error: error.message,
            paymentIntentId: paymentIntent.id 
          });
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        logger.warn('Payment failed', { 
          paymentIntentId: failedPayment.id,
          error: failedPayment.last_payment_error?.message 
        });
        
        // Update transaction status to failed
        try {
          await PaymentService.updateTransactionStatus(
            failedPayment.id, 
            'failed',
            { 
              errorMessage: failedPayment.last_payment_error?.message,
              failedAt: new Date().toISOString()
            }
          );
        } catch (error) {
          logger.error('Error updating failed payment status', { 
            error: error.message,
            paymentIntentId: failedPayment.id 
          });
        }
        break;
        
      case 'charge.refunded':
        const refund = event.data.object;
        logger.info('Charge refunded', { chargeId: refund.id });
        
        // Process refund
        try {
          // Update transaction status to refunded
          await PaymentService.updateTransactionStatus(
            refund.payment_intent,
            'refunded',
            { 
              refundId: refund.id,
              refundedAt: new Date().toISOString()
            }
          );
        } catch (error) {
          logger.error('Error processing refund', { 
            error: error.message,
            chargeId: refund.id 
          });
        }
        break;
        
      case 'payment_intent.canceled':
        const canceledPayment = event.data.object;
        logger.info('Payment canceled', { paymentIntentId: canceledPayment.id });
        
        // Update transaction status to canceled
        try {
          await PaymentService.updateTransactionStatus(
            canceledPayment.id, 
            'canceled',
            { canceledAt: new Date().toISOString() }
          );
        } catch (error) {
          logger.error('Error updating canceled payment status', { 
            error: error.message,
            paymentIntentId: canceledPayment.id 
          });
        }
        break;
        
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook', { error: error.message });
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

/**
 * @route GET /api/v1/payment/transactions
 * @desc Get user's transaction history
 * @access Private
 */
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    const userId = req.user.id;
    
    const transactions = await PaymentService.getTransactionHistory(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status
    });
    
    res.status(200).json({
      transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: transactions.length
      }
    });
  } catch (error) {
    logger.error('Error getting transaction history', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to retrieve transaction history',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/v1/payment/transactions/:id
 * @desc Get specific transaction details
 * @access Private
 */
router.get('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const transaction = await Transaction.getById(id);
    
    // Verify user owns this transaction
    if (transaction.userId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only view your own transactions' 
      });
    }
    
    // Enhance with Stripe data
    const paymentIntent = await PaymentService.retrieveStripePaymentIntent(transaction.gatewayTransactionId);
    const enhancedTransaction = {
      ...transaction,
      stripeStatus: paymentIntent.status,
      stripeCharges: paymentIntent.charges
    };
    
    res.status(200).json(enhancedTransaction);
  } catch (error) {
    logger.error('Error getting transaction details', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to retrieve transaction details',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/payment/receipt/:transactionId
 * @desc Generate payment receipt
 * @access Private
 */
router.post('/receipt/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;
    
    // Verify transaction belongs to user
    const transaction = await Transaction.getById(transactionId);
    if (transaction.userId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only generate receipts for your own transactions' 
      });
    }
    
    const receipt = await PaymentService.generateReceipt(transactionId);
    
    res.status(200).json(receipt);
  } catch (error) {
    logger.error('Error generating receipt', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to generate receipt',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/v1/payment/confirm-payment
 * @desc Confirm a payment intent (for 3D Secure)
 * @access Private
 */
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ 
        error: 'Missing payment intent ID',
        message: 'Payment intent ID is required' 
      });
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: process.env.STRIPE_RETURN_URL || 'http://localhost:3000/payment/success'
    });
    
    res.status(200).json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action
    });
  } catch (error) {
    logger.error('Error confirming payment', { error: error.message });
    res.status(500).json({ 
      error: 'Payment confirmation failed',
      message: error.message 
    });
  }
});

module.exports = router;
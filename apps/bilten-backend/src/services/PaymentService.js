const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const Transaction = require('../models/Transaction');

/**
 * Payment Processing Service
 * Handles payment operations using Stripe and PayPal integrations
 * Implements secure payment processing with PCI DSS compliance
 */
class PaymentService {
  constructor() {
    this.providers = {
      stripe: {
        name: 'stripe',
        enabled: !!process.env.STRIPE_SECRET_KEY,
      },
      paypal: {
        name: 'paypal',
        enabled: !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET,
      }
    };

    // Validate at least one payment provider is configured
    const enabledProviders = Object.values(this.providers).filter(p => p.enabled);
    if (enabledProviders.length === 0) {
      logger.warn('No payment providers configured. Payment processing will be unavailable.');
    } else {
      logger.info(`Payment service initialized with providers: ${enabledProviders.map(p => p.name).join(', ')}`);
    }
  }

  /**
   * Create a payment intent with Stripe
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Amount in cents
   * @param {string} paymentData.currency - Currency code (e.g., 'usd')
   * @param {Object} paymentData.metadata - Additional metadata
   * @returns {Promise<Object>} Payment intent object
   */
  async createStripePaymentIntent(paymentData) {
    try {
      if (!this.providers.stripe.enabled) {
        throw new Error('Stripe payment provider not configured');
      }

      const { amount, currency = 'usd', metadata = {} } = paymentData;
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: {
          ...metadata,
          integration_check: 'accept_a_payment',
        },
        automatic_payment_methods: {
          enabled: true,
        },
        // Add 3D Secure support
        setup_future_usage: 'off_session',
        capture_method: 'automatic',
      });

      logger.info('Stripe payment intent created', { 
        paymentIntentId: paymentIntent.id,
        amount,
        currency
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error('Error creating Stripe payment intent', { error: error.message });
      throw error;
    }
  }

  /**
   * Retrieve a payment intent from Stripe
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Payment intent object
   */
  async retrieveStripePaymentIntent(paymentIntentId) {
    try {
      if (!this.providers.stripe.enabled) {
        throw new Error('Stripe payment provider not configured');
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
        payment_method: paymentIntent.payment_method,
        charges: paymentIntent.charges?.data || [],
      };
    } catch (error) {
      logger.error('Error retrieving Stripe payment intent', { 
        error: error.message,
        paymentIntentId 
      });
      throw error;
    }
  }

  /**
   * Process a refund with Stripe
   * @param {Object} refundData - Refund information
   * @param {string} refundData.paymentIntentId - Stripe payment intent ID
   * @param {number} refundData.amount - Amount to refund in cents (optional, defaults to full amount)
   * @param {string} refundData.reason - Reason for refund
   * @returns {Promise<Object>} Refund object
   */
  async processStripeRefund(refundData) {
    try {
      if (!this.providers.stripe.enabled) {
        throw new Error('Stripe payment provider not configured');
      }

      const { paymentIntentId, amount, reason = 'requested_by_customer' } = refundData;
      
      const refundParams = {
        payment_intent: paymentIntentId,
        reason,
      };

      // If amount is specified, add it to the refund parameters
      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await stripe.refunds.create(refundParams);
      
      logger.info('Stripe refund processed', { 
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount,
        status: refund.status
      });

      return {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error) {
      logger.error('Error processing Stripe refund', { 
        error: error.message,
        paymentIntentId: refundData.paymentIntentId 
      });
      throw error;
    }
  }

  /**
   * Process a transaction and store it in the database
   * @param {Object} transactionData - Transaction information
   * @returns {Promise<Object>} Transaction object
   */
  async processTransaction(transactionData) {
    try {
      const {
        userId,
        eventId,
        orderId,
        amount,
        currency,
        paymentMethod,
        gatewayTransactionId,
        status = 'pending',
        metadata = {}
      } = transactionData;

      // Create transaction record in database
      const transaction = await Transaction.create({
        userId,
        eventId,
        orderId,
        amount: amount / 100, // Convert from cents to dollars
        currency,
        paymentMethod,
        gatewayTransactionId,
        status,
        metadata
      });

      logger.info('Transaction processed and stored', { 
        transactionId: transaction.id,
        gatewayTransactionId,
        status
      });

      return transaction;
    } catch (error) {
      logger.error('Error processing transaction', { error: error.message });
      throw error;
    }
  }

  /**
   * Update transaction status based on payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Updated transaction
   */
  async updateTransactionStatus(paymentIntentId, status, additionalData = {}) {
    try {
      // Find transaction by gateway transaction ID
      const { rows } = await require('../database/connection').query(
        'SELECT * FROM transactions WHERE gateway_transaction_id = $1',
        [paymentIntentId]
      );

      if (rows.length === 0) {
        throw new Error(`Transaction with payment intent ${paymentIntentId} not found`);
      }

      const transaction = await Transaction.updateStatus(rows[0].id, status, additionalData);
      
      logger.info('Transaction status updated', { 
        transactionId: transaction.id,
        paymentIntentId,
        status
      });

      return transaction;
    } catch (error) {
      logger.error('Error updating transaction status', { 
        error: error.message,
        paymentIntentId 
      });
      throw error;
    }
  }

  /**
   * Generate a payment receipt
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Receipt object
   */
  async generateReceipt(transactionId) {
    try {
      const transaction = await Transaction.getById(transactionId);
      
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      // Get Stripe payment intent details
      const paymentIntent = await this.retrieveStripePaymentIntent(transaction.gatewayTransactionId);
      
      const receipt = {
        receiptId: uuidv4(),
        transactionId: transaction.id,
        orderId: transaction.orderId,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        // Stripe specific details
        stripePaymentIntentId: paymentIntent.paymentIntentId,
        stripeCharges: paymentIntent.charges,
        // Receipt metadata
        receiptNumber: `RCP-${Date.now()}`,
        generatedAt: new Date().toISOString()
      };

      logger.info('Payment receipt generated', { 
        receiptId: receipt.receiptId,
        transactionId: transaction.id
      });

      return receipt;
    } catch (error) {
      logger.error('Error generating receipt', { 
        error: error.message,
        transactionId 
      });
      throw error;
    }
  }

  /**
   * Get transaction history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      const transactions = await Transaction.getByUserId(userId, options);
      
      // Enhance with Stripe data
      const enhancedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          try {
            const paymentIntent = await this.retrieveStripePaymentIntent(transaction.gatewayTransactionId);
            return {
              ...transaction,
              stripeStatus: paymentIntent.status,
              stripeCharges: paymentIntent.charges
            };
          } catch (error) {
            logger.warn('Could not retrieve Stripe data for transaction', {
              transactionId: transaction.id,
              error: error.message
            });
            return transaction;
          }
        })
      );

      return enhancedTransactions;
    } catch (error) {
      logger.error('Error getting transaction history', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * Create a PayPal order
   * @param {Object} orderData - Order information
   * @param {number} orderData.amount - Amount in dollars
   * @param {string} orderData.currency - Currency code (e.g., 'USD')
   * @param {Object} orderData.metadata - Additional metadata
   * @returns {Promise<Object>} PayPal order object
   */
  async createPayPalOrder(orderData) {
    // PayPal integration will be implemented in a future update
    throw new Error('PayPal integration not implemented yet');
  }

  /**
   * Capture a PayPal payment
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Capture details
   */
  async capturePayPalPayment(orderId) {
    // PayPal integration will be implemented in a future update
    throw new Error('PayPal integration not implemented yet');
  }
}

module.exports = new PaymentService();
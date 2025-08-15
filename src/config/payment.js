const paymentConfig = {
  // Stripe Configuration
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: 'usd',
    supportedCurrencies: ['usd', 'eur', 'gbp', 'cad', 'aud'],
  },

  // Fee Structure
  fees: {
    // Platform fees (percentage + fixed amount)
    standard: {
      percentage: 0.029, // 2.9%
      fixed: 0.30, // $0.30
      description: 'Standard processing fee'
    },
    premium: {
      percentage: 0.024, // 2.4%
      fixed: 0.30, // $0.30
      description: 'Premium event processing fee'
    },
    enterprise: {
      percentage: 0.019, // 1.9%
      fixed: 0.30, // $0.30
      description: 'Enterprise processing fee'
    }
  },

  // Payment Methods
  paymentMethods: {
    cards: {
      visa: { name: 'Visa', supported: true },
      mastercard: { name: 'Mastercard', supported: true },
      amex: { name: 'American Express', supported: true },
      discover: { name: 'Discover', supported: true },
      diners: { name: 'Diners Club', supported: true },
      jcb: { name: 'JCB', supported: true },
      unionpay: { name: 'UnionPay', supported: true }
    },
    digitalWallets: {
      applePay: { name: 'Apple Pay', supported: true },
      googlePay: { name: 'Google Pay', supported: true },
      paypal: { name: 'PayPal', supported: false } // Not implemented yet
    },
    bankTransfers: {
      ach: { name: 'ACH', supported: false }, // Not implemented yet
      sepa: { name: 'SEPA', supported: false } // Not implemented yet
    }
  },

  // Order Configuration
  order: {
    numberPrefix: 'BLT',
    maxTicketsPerOrder: 10,
    maxAmountPerOrder: 10000, // $10,000
    autoCancelMinutes: 30, // Cancel pending orders after 30 minutes
  },

  // Refund Policy
  refund: {
    allowed: true,
    timeLimit: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    partialRefunds: true,
    refundFees: false, // Don't refund processing fees
  },

  // Security
  security: {
    requireAuthentication: true,
    requireEmailVerification: true,
    maxFailedAttempts: 3,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    requireCVC: true,
    requireBillingAddress: false, // Optional for now
  },

  // Testing
  test: {
    enabled: process.env.NODE_ENV === 'development',
    testCards: {
      visa: '4242424242424242',
      visa_debit: '4000056655665556',
      mastercard: '5555555555554444',
      mastercard_debit: '5200828282828210',
      amex: '378282246310005',
      discover: '6011111111111117',
      diners: '3056930009020004',
      jcb: '3566002020360505',
      unionpay: '6200000000000005'
    },
    testCVC: '123',
    testExpiry: {
      month: '12',
      year: '2025'
    }
  },

  // Webhook Events
  webhookEvents: {
    payment: [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.canceled',
      'payment_intent.requires_action'
    ],
    refund: [
      'charge.refunded',
      'charge.refund.updated'
    ],
    dispute: [
      'charge.dispute.created',
      'charge.dispute.closed',
      'charge.dispute.funds_reinstated',
      'charge.dispute.funds_withdrawn'
    ],
    payout: [
      'payout.created',
      'payout.paid',
      'payout.failed'
    ]
  },

  // Error Messages
  errorMessages: {
    card_declined: 'Your card was declined. Please try a different card.',
    expired_card: 'Your card has expired. Please use a different card.',
    incorrect_cvc: 'The security code (CVC) is incorrect.',
    processing_error: 'An error occurred while processing your card. Please try again.',
    insufficient_funds: 'Your card has insufficient funds.',
    invalid_expiry_month: 'The expiration month is invalid.',
    invalid_expiry_year: 'The expiration year is invalid.',
    invalid_number: 'The card number is invalid.',
    invalid_cvc: 'The security code (CVC) is invalid.',
    card_not_supported: 'This card type is not supported.',
    currency_not_supported: 'This currency is not supported.',
    authentication_required: 'Your card requires authentication. Please try again.',
    setup_intent_authentication_failure: 'Authentication failed. Please try again.',
    setup_intent_canceled: 'The payment was canceled.',
    setup_intent_failed: 'The payment failed. Please try again.',
    generic_error: 'An unexpected error occurred. Please try again.'
  },

  // Status Colors and Icons
  statusConfig: {
    pending: {
      color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
      icon: 'ClockIcon',
      label: 'Pending'
    },
    completed: {
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
      icon: 'CheckCircleIcon',
      label: 'Completed'
    },
    cancelled: {
      color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
      icon: 'XCircleIcon',
      label: 'Cancelled'
    },
    refunded: {
      color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700',
      icon: 'ArrowPathIcon',
      label: 'Refunded'
    },
    failed: {
      color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
      icon: 'ExclamationTriangleIcon',
      label: 'Failed'
    },
    disputed: {
      color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20',
      icon: 'ExclamationTriangleIcon',
      label: 'Disputed'
    }
  }
};

// Helper functions
const paymentHelpers = {
  // Calculate fees based on amount and event type
  calculateFees: (amount, eventType = 'standard') => {
    const feeConfig = paymentConfig.fees[eventType] || paymentConfig.fees.standard;
    const percentageFee = amount * feeConfig.percentage;
    const totalFee = percentageFee + feeConfig.fixed;
    return Math.round(totalFee * 100) / 100;
  },

  // Format currency
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  },

  // Generate order number
  generateOrderNumber: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `${paymentConfig.order.numberPrefix}-${timestamp}-${random}`;
  },

  // Validate card number using Luhn algorithm
  validateCardNumber: (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(cleaned)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },

  // Get card type from number
  getCardType: (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    if (/^3[0-9]/.test(cleaned)) return 'diners';
    if (/^2/.test(cleaned)) return 'mastercard'; // Mastercard 2-series
    
    return 'unknown';
  },

  // Parse Stripe error
  parseStripeError: (error) => {
    return paymentConfig.errorMessages[error.code] || 
           error.message || 
           paymentConfig.errorMessages.generic_error;
  },

  // Check if payment is in test mode
  isTestMode: () => {
    return process.env.NODE_ENV === 'development' || 
           process.env.STRIPE_PUBLISHABLE_KEY?.includes('pk_test');
  },

  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Get status configuration
  getStatusConfig: (status) => {
    return paymentConfig.statusConfig[status] || paymentConfig.statusConfig.pending;
  }
};

module.exports = {
  config: paymentConfig,
  helpers: paymentHelpers
};

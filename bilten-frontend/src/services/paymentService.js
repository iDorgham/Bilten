import { paymentsAPI } from './api';

class PaymentService {
  // Create payment intent for ticket purchase
  async createPaymentIntent(eventId, tickets) {
    try {
      const response = await paymentsAPI.createPaymentIntent({
        eventId,
        tickets
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      console.error('Create payment intent error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create payment intent'
      };
    }
  }

  // Confirm payment after successful Stripe payment
  async confirmPayment(paymentIntentId) {
    try {
      const response = await paymentsAPI.confirmPayment({ paymentIntentId });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      console.error('Confirm payment error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to confirm payment'
      };
    }
  }

  // Get user's order history
  async getOrders(params = {}) {
    try {
      const response = await paymentsAPI.getOrders(params);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch orders'
      };
    }
  }

  // Get specific order details
  async getOrder(orderId) {
    try {
      const response = await paymentsAPI.getOrder(orderId);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error) {
      console.error('Get order error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch order details'
      };
    }
  }

  // Calculate fees based on subtotal
  calculateFees(subtotal) {
    // Stripe fee: 2.9% + $0.30
    const percentageFee = subtotal * 0.029;
    const fixedFee = 0.30;
    return Math.round((percentageFee + fixedFee) * 100) / 100;
  }

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Validate card number (basic Luhn algorithm)
  validateCardNumber(cardNumber) {
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
  }

  // Get card type from number
  getCardType(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    if (/^3[0-9]/.test(cleaned)) return 'diners';
    if (/^2/.test(cleaned)) return 'mastercard'; // Mastercard 2-series
    
    return 'unknown';
  }

  // Mask card number for display
  maskCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 4) return cleaned;
    
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4);
    return masked + lastFour;
  }

  // Generate order number
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `BLT-${timestamp}-${random}`;
  }

  // Parse Stripe error messages
  parseStripeError(error) {
    const errorMessages = {
      'card_declined': 'Your card was declined. Please try a different card.',
      'expired_card': 'Your card has expired. Please use a different card.',
      'incorrect_cvc': 'The security code (CVC) is incorrect.',
      'processing_error': 'An error occurred while processing your card. Please try again.',
      'insufficient_funds': 'Your card has insufficient funds.',
      'invalid_expiry_month': 'The expiration month is invalid.',
      'invalid_expiry_year': 'The expiration year is invalid.',
      'invalid_number': 'The card number is invalid.',
      'invalid_cvc': 'The security code (CVC) is invalid.',
      'card_not_supported': 'This card type is not supported.',
      'currency_not_supported': 'This currency is not supported.',
      'authentication_required': 'Your card requires authentication. Please try again.',
      'setup_intent_authentication_failure': 'Authentication failed. Please try again.',
      'setup_intent_canceled': 'The payment was canceled.',
      'setup_intent_failed': 'The payment failed. Please try again.'
    };

    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  }

  // Check if payment is in test mode
  isTestMode() {
    return process.env.NODE_ENV === 'development' || 
           process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.includes('pk_test');
  }

  // Get test card numbers for development
  getTestCardNumbers() {
    return {
      visa: '4242424242424242',
      visa_debit: '4000056655665556',
      mastercard: '5555555555554444',
      mastercard_debit: '5200828282828210',
      amex: '378282246310005',
      discover: '6011111111111117',
      diners: '3056930009020004',
      jcb: '3566002020360505',
      unionpay: '6200000000000005'
    };
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number format
  validatePhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  // Format phone number for display
  formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  // Get payment status color
  getStatusColor(status) {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
      completed: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
      cancelled: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
      refunded: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700',
      failed: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
    };
    return colors[status] || colors.pending;
  }

  // Get payment status icon
  getStatusIcon(status) {
    const icons = {
      pending: 'ClockIcon',
      completed: 'CheckCircleIcon',
      cancelled: 'XCircleIcon',
      refunded: 'ArrowPathIcon',
      failed: 'ExclamationTriangleIcon'
    };
    return icons[status] || icons.pending;
  }
}

export default new PaymentService();

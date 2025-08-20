import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsAPI, eventsAPI, promoCodeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBasket } from '../hooks/useBasket';
import { 
  CreditCardIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TicketIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { getThemeClasses } from '../styles/theme';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key');

// Step indicators
const steps = [
  { id: 1, name: 'Review Cart', icon: ShoppingBagIcon },
  { id: 2, name: 'Payment', icon: CreditCardIcon },
  { id: 3, name: 'Confirmation', icon: CheckCircleIcon }
];

// Step Indicator Component
const StepIndicator = ({ currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isActive 
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <ChevronRightIcon className="w-5 h-5 text-gray-400 mx-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Payment Form Component
const PaymentForm = ({ orderData, onSuccess, onError, onValidationError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!cardComplete) {
      onValidationError('Please complete your card details');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        orderData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: orderData.customerName || 'Event Attendee',
              email: orderData.customerEmail || 'attendee@example.com',
            },
          },
        }
      );

      if (paymentError) {
        setError(paymentError.message);
        onError(paymentError.message);
      } else if (paymentIntent.status === 'succeeded') {
        await paymentsAPI.confirmPayment({ paymentIntentId: paymentIntent.id });
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: '"Poppins", sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`${getThemeClasses('card')} p-6`}>
        <div className="flex items-center mb-6">
          <CreditCardIcon className="w-6 h-6 text-primary-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Information
          </h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Card Details
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
              <CardElement 
                options={cardElementOptions} 
                onChange={handleCardChange}
              />
            </div>
            {!cardComplete && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Please enter your complete card information
              </p>
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <LockClosedIcon className="w-4 h-4 mr-2 text-blue-600" />
            <span>Your payment information is secure and encrypted with SSL</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || !cardComplete}
        className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
          loading || !cardComplete
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <ShieldCheckIcon className="w-5 h-5 mr-3" />
            Pay ${orderData.total.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
};

// Main Checkout Flow Component
const CheckoutFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { clearBasket } = useBasket();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState(null);
  const [event, setEvent] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeValidation, setPromoCodeValidation] = useState(null);
  const [validatingPromoCode, setValidatingPromoCode] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const checkoutData = location.state?.checkoutData;
    if (!checkoutData) {
      navigate('/pasket');
      return;
    }

    initializeCheckout(checkoutData);
  }, [isAuthenticated, location.state]);

  const initializeCheckout = async (checkoutData) => {
    try {
      setLoading(true);
      
      // Set cart items from checkout data
      setCartItems(checkoutData.tickets || []);
      setEvent(checkoutData.event);
      
      // Create payment intent
      const paymentResponse = await paymentsAPI.createPaymentIntent({
        eventId: checkoutData.eventId,
        tickets: checkoutData.tickets,
        promoCode: promoCode.trim() || null
      });

      if (paymentResponse.data.success) {
        setOrderData(paymentResponse.data.data);
      } else {
        setError(paymentResponse.data.message);
      }
    } catch (err) {
      console.error('Checkout initialization error:', err);
      setError(err.response?.data?.message || 'Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    setPaymentSuccess(true);
    setCurrentStep(3);
    
    // Clear the basket after successful payment
    try {
      await clearBasket();
    } catch (err) {
      console.error('Error clearing basket:', err);
    }
    
    // Redirect to order confirmation after a short delay
    setTimeout(() => {
      navigate(`/orders/${orderData.orderId}`);
    }, 3000);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleValidationError = (errorMessage) => {
    setValidationError(errorMessage);
    setTimeout(() => setValidationError(''), 5000);
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim() || !orderData) return;

    try {
      setValidatingPromoCode(true);
      setPromoCodeValidation(null);

      const response = await promoCodeAPI.validateCheckout({
        code: promoCode.trim(),
        eventId: orderData.eventId,
        orderAmount: orderData.subtotal,
        ticketTypes: orderData.items.map(item => item.ticketId)
      });

      if (response.data.success) {
        setPromoCodeValidation(response.data.data);
        
        if (response.data.data.valid) {
          const updatedOrderData = {
            ...orderData,
            discountAmount: response.data.data.discountAmount,
            total: response.data.data.finalAmount + orderData.fees,
            appliedPromoCode: response.data.data.promoCode
          };
          setOrderData(updatedOrderData);
        }
      }
    } catch (err) {
      console.error('Promo code validation error:', err);
      setPromoCodeValidation({
        valid: false,
        error: 'Failed to validate promo code'
      });
    } finally {
      setValidatingPromoCode(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoCodeValidation(null);
    
    if (orderData) {
      const updatedOrderData = {
        ...orderData,
        discountAmount: 0,
        total: orderData.subtotal + orderData.fees,
        appliedPromoCode: null
      };
      setOrderData(updatedOrderData);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Initializing checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Checkout Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/pasket')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/pasket')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complete Your Purchase
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review your order and enter payment details to complete your purchase
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {validationError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{validationError}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Summary and Promo Code */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className={`${getThemeClasses('card')} p-6`}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <ShoppingBagIcon className="w-6 h-6 mr-3 text-primary-600" />
                Order Summary
              </h2>
              
              {event && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {event.title}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-4 h-4 mr-2" />
                      {new Date(event.start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      {event.venue_name}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      {new Date(event.start_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}

              {orderData && (
                <div className="space-y-4">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.ticketName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="text-gray-900 dark:text-white font-medium">${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    {orderData.discountAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Discount</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">-${orderData.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Processing Fee</span>
                      <span className="text-gray-900 dark:text-white font-medium">${orderData.fees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-primary-600 dark:text-blue-300">${orderData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Promo Code Section */}
            <div className={`${getThemeClasses('card')} p-6`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TicketIcon className="w-5 h-5 mr-2 text-primary-600" />
                Promo Code
              </h3>
              
              {!orderData?.appliedPromoCode ? (
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className={`flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        validatingPromoCode ? 'opacity-50' : ''
                      }`}
                      disabled={validatingPromoCode}
                    />
                    <button
                      onClick={validatePromoCode}
                      disabled={!promoCode.trim() || validatingPromoCode}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        !promoCode.trim() || validatingPromoCode
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {validatingPromoCode ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                  
                  {promoCodeValidation && !promoCodeValidation.valid && (
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      {promoCodeValidation.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-semibold text-green-800 dark:text-green-200">
                        {orderData.appliedPromoCode.name}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {orderData.appliedPromoCode.discount_type === 'percentage' 
                          ? `${orderData.appliedPromoCode.discount_value}% off`
                          : `$${orderData.appliedPromoCode.discount_value} off`
                        }
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className={`${getThemeClasses('card')} p-6`}>
              <div className="flex items-center mb-4">
                <UserIcon className="w-6 h-6 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Customer Information
                </h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{user?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{orderData?.orderNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Step Content */}
          <div>
            {currentStep === 1 && (
              <div className={`${getThemeClasses('card')} p-6`}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Review Your Order
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please review your order details above. If everything looks correct, proceed to payment.
                </p>
                <button
                  onClick={nextStep}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Proceed to Payment
                </button>
              </div>
            )}

            {currentStep === 2 && orderData && (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  orderData={orderData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onValidationError={handleValidationError}
                />
              </Elements>
            )}

            {currentStep === 3 && paymentSuccess && (
              <div className={`${getThemeClasses('card')} p-6 text-center`}>
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your tickets have been purchased successfully. You will receive a confirmation email shortly.
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Redirecting to order details...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        {currentStep > 1 && currentStep < 3 && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={prevStep}
              className="flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Previous
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutFlow;

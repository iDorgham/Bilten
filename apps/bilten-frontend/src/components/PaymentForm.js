import React, { useState, useEffect, useCallback } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const PaymentForm = ({ amount, currency = 'usd', eventId, orderId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  const feeAmount = Math.round((amount * 2.9 / 100) + 30);
  const totalAmount = amount + feeAmount;

  const createPaymentIntent = useCallback(async () => {
    try {
      const response = await axios.post('/api/v1/payment/create-payment-intent', {
        amount: totalAmount,
        currency,
        metadata: { eventId, orderId }
      });
      setClientSecret(response.data.clientSecret);
    } catch (err) {
      setError('Failed to create payment intent');
    }
  }, [totalAmount, currency, eventId, orderId]);

  useEffect(() => {
    createPaymentIntent();
  }, [createPaymentIntent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message);
        onError?.(confirmError);
      } else {
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      setError('Payment failed');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Payment Details</h2>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span>Amount:</span>
          <span>${(amount / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Fee:</span>
          <span>${(feeAmount / 100).toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Total:</span>
          <span>${(totalAmount / 100).toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Card Information</label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md font-medium disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : `Pay $${(totalAmount / 100).toFixed(2)}`}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;

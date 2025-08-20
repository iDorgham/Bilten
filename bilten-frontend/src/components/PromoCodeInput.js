import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';

/**
 * PromoCodeInput Component
 * Allows users to enter and validate promo codes during checkout
 */
const PromoCodeInput = ({ 
  eventId, 
  ticketTypes = [], 
  orderAmount, 
  onPromoCodeApplied, 
  onPromoCodeRemoved,
  className = '' 
}) => {
  const { token } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Validate and apply promo code
   */
  const handleApplyCode = async () => {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_CONFIG.BASE_URL}/promo-codes/validate-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          eventId,
          ticketTypes,
          orderAmount
        })
      });

      const result = await response.json();

      if (result.success && result.data.valid) {
        setAppliedCode(result.data);
        setSuccess(`Promo code "${promoCode.toUpperCase()}" applied successfully!`);
        setPromoCode('');
        onPromoCodeApplied?.(result.data);
      } else {
        setError(result.data?.error || 'Invalid promo code');
      }
    } catch (err) {
      setError('Failed to validate promo code');
      console.error('Error validating promo code:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove applied promo code
   */
  const handleRemoveCode = () => {
    setAppliedCode(null);
    setSuccess(null);
    setError(null);
    onPromoCodeRemoved?.();
  };

  /**
   * Handle promo code input change
   */
  const handleInputChange = (e) => {
    setPromoCode(e.target.value.toUpperCase());
    setError(null);
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCode();
    }
  };

  /**
   * Format discount amount
   */
  const formatDiscount = (discountAmount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(discountAmount);
  };

  /**
   * Format final amount
   */
  const formatFinalAmount = (finalAmount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(finalAmount);
  };

  return (
    <div className={`promo-code-input ${className}`}>
      {/* Applied Promo Code Display */}
      {appliedCode && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Promo Code Applied
                </h4>
              </div>
              <div className="mt-2">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <span className="font-medium">{appliedCode.promoCode.code}</span> - {appliedCode.promoCode.name}
                </p>
                <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                  <span className="font-medium">Discount:</span> {formatDiscount(appliedCode.discountAmount)}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  <span className="font-medium">Final Amount:</span> {formatFinalAmount(appliedCode.finalAmount)}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveCode}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              title="Remove promo code"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Promo Code Input */}
      {!appliedCode && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Have a promo code?
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={promoCode}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter promo code"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              maxLength={20}
              disabled={loading}
            />
            <button
              onClick={handleApplyCode}
              disabled={loading || !promoCode.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Applying...</span>
                </div>
              ) : (
                'Apply'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 rounded">
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Promo Code Info */}
      {!appliedCode && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Enter your promo code to get a discount on your order.</p>
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput;

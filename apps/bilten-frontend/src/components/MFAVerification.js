import React, { useState } from 'react';

const MFAVerification = ({ userId, onVerificationComplete, onCancel }) => {
  const [method, setMethod] = useState('totp');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerification = async () => {
    if (!token.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/v1/auth/verify-mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          method,
          token: token.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        if (onVerificationComplete) {
          onVerificationComplete(data.data);
        }
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    setToken('');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
        Two-Factor Authentication
      </h3>
      
      <p className="text-sm text-gray-600 mb-6 text-center">
        Please verify your identity to continue
      </p>

      {/* Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="totp"
              checked={method === 'totp'}
              onChange={() => handleMethodChange('totp')}
              className="mr-2"
            />
            <span className="text-sm">Authenticator App (TOTP)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="sms"
              checked={method === 'sms'}
              onChange={() => handleMethodChange('sms')}
              className="mr-2"
            />
            <span className="text-sm">SMS Code</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="backup"
              checked={method === 'backup'}
              onChange={() => handleMethodChange('backup')}
              className="mr-2"
            />
            <span className="text-sm">Backup Code</span>
          </label>
        </div>
      </div>

      {/* Verification Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {method === 'totp' && 'Authenticator Code'}
          {method === 'sms' && 'SMS Code'}
          {method === 'backup' && 'Backup Code'}
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => {
            const value = e.target.value;
            if (method === 'totp' || method === 'sms') {
              // Only allow 6 digits for TOTP/SMS
              setToken(value.replace(/\D/g, '').slice(0, 6));
            } else {
              // Allow 8 characters for backup codes
              setToken(value.slice(0, 8));
            }
          }}
          placeholder={
            method === 'totp' ? 'Enter 6-digit code' :
            method === 'sms' ? 'Enter 6-digit SMS code' :
            'Enter 8-character backup code'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={method === 'backup' ? 8 : 6}
        />
        <p className="mt-1 text-xs text-gray-500">
          {method === 'totp' && 'Enter the 6-digit code from your authenticator app'}
          {method === 'sms' && 'Enter the 6-digit code sent to your phone'}
          {method === 'backup' && 'Enter one of your backup codes'}
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleVerification}
          disabled={loading || !token.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {method === 'totp' && 'Open your authenticator app to get the current code'}
        {method === 'sms' && 'Check your phone for the SMS with the verification code'}
        {method === 'backup' && 'Use one of the backup codes you saved during setup'}
      </div>
    </div>
  );
};

export default MFAVerification;

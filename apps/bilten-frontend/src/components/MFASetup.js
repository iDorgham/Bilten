import React, { useState } from 'react';

const MFASetup = ({ onSetupComplete }) => {
  const [step, setStep] = useState('setup');
  const [totpData, setTotpData] = useState(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateTOTPSecret = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/v1/mfa/setup/totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setTotpData(data.data);
        setStep('verify');
      } else {
        setError(data.message || 'Failed to setup TOTP');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const enableTOTP = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/v1/mfa/enable/totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ token: verificationToken })
      });

      const data = await response.json();
      
      if (response.ok) {
        setStep('complete');
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        setError(data.message || 'Failed to enable TOTP');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'setup') {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Set Up Two-Factor Authentication
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Enhance your account security by enabling two-factor authentication.
        </p>
        
        {loading ? (
          <div>Loading...</div>
        ) : (
          <button
            onClick={generateTOTPSecret}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue Setup
          </button>
        )}
      </div>
    );
  }

  if (step === 'verify' && totpData) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
          Scan QR Code
        </h3>
        
        <div className="space-y-4">
          {/* QR Code */}
          <div className="text-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpData.qrCodeUrl)}`}
              alt="TOTP QR Code"
              className="mx-auto"
            />
          </div>

          {/* Manual Entry */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Manual Entry</h4>
            <code className="text-sm font-mono bg-white p-2 rounded border block">{totpData.secret}</code>
          </div>

          {/* Verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('setup')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md"
            >
              Back
            </button>
            <button
              onClick={enableTOTP}
              disabled={loading || verificationToken.length !== 6}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Enable 2FA'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Two-Factor Authentication Enabled!
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Your account is now protected with two-factor authentication.
        </p>
        
        <button
          onClick={() => onSetupComplete && onSetupComplete()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Continue
        </button>
      </div>
    );
  }

  return null;
};

export default MFASetup;

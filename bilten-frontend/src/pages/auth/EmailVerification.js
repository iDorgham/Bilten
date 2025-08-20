import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyEmail(tokenFromUrl);
    }
  }, [searchParams]);

  const verifyEmail = async (verificationToken) => {
    setLoading(true);
    setError('');

    try {
      await authAPI.verifyEmail(verificationToken);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    setError('');

    try {
      await authAPI.resendVerification(resendEmail);
      setResendSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Verifying your email...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-500 mb-4">
              <CheckCircleIcon className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Email verified successfully!
            </h2>
            <p className="text-gray-600 mb-8">
              Your email address has been verified. You can now access all features of your account.
            </p>
            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Sign in
              </Link>
              <Link
                to="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resendSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-500 mb-4">
              <EnvelopeIcon className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Verification email sent!
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent a new verification email to <strong>{resendEmail}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Check your inbox and click the verification link. The link will expire in 24 hours.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowResendForm(false);
                  setResendSuccess(false);
                  setResendEmail('');
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Try another email
              </button>
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to login
          </Link>
          
          {error ? (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-500 mb-4">
                <ExclamationTriangleIcon className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              
              {!showResendForm ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowResendForm(true)}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Resend Verification Email
                  </button>
                  <Link
                    to="/login"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Back to Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleResendVerification} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter your email"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : 'Send Verification Email'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowResendForm(false)}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                Email Verification
              </h2>
              <p className="text-gray-600 mb-8">
                Please check your email and click the verification link to activate your account.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setShowResendForm(true)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Resend Verification Email
                </button>
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;

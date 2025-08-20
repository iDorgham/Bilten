import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon, ArrowPathIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const ServerError = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              500
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Server Error
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Something went wrong on our end. We're working to fix the issue. Please try again in a few moments.
        </p>

        {/* Status Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Service Temporarily Unavailable
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Our technical team has been notified and is working to resolve this issue as quickly as possible.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Try Again
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-300 dark:border-gray-600"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
        </div>

        {/* What You Can Do */}
        <div className="mt-12">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            What you can do:
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Wait a few minutes and try refreshing the page
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Check your internet connection
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Try accessing the page from a different browser
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Contact support if the problem persists
              </p>
            </div>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Alternative Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/events"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Browse Events
            </Link>
            <Link
              to="/news"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Read News
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center mb-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400 mr-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need immediate assistance?
            </p>
          </div>
          <Link
            to="/contact"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
          >
            Contact our support team
          </Link>
        </div>

        {/* Status Page Link */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Check our{' '}
            <a
              href="#"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
            >
              status page
            </a>{' '}
            for real-time updates
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerError;

import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              404
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Search Suggestion */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center mb-4">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Try searching for what you're looking for
            </h3>
          </div>
          <div className="flex">
            <input
              type="text"
              placeholder="Search events, articles, or pages..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 transition-colors duration-200 text-sm">
              Search
            </button>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-300 dark:border-gray-600"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Popular Pages */}
        <div className="mt-12">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/events"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Events
            </Link>
            <Link
              to="/news"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              News
            </Link>
            <Link
              to="/contact"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Contact
            </Link>
            <Link
              to="/about"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              About
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Still can't find what you're looking for?
          </p>
          <Link
            to="/contact"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
          >
            Contact our support team
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

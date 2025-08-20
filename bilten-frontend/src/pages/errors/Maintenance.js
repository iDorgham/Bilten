import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WrenchScrewdriverIcon, ClockIcon, ChatBubbleLeftRightIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const Maintenance = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 30,
    seconds: 0
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const totalSeconds = prevTime.hours * 3600 + prevTime.minutes * 60 + prevTime.seconds - 1;
        
        if (totalSeconds <= 0) {
          clearInterval(timer);
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Maintenance Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <WrenchScrewdriverIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          We're Making Things Better
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Bilten is currently undergoing scheduled maintenance to improve your experience.
        </p>

        {/* Countdown Timer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-center justify-center mb-4">
            <ClockIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Estimated Completion Time
            </h2>
          </div>
          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {timeLeft.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Hours</div>
            </div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Minutes</div>
            </div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Seconds</div>
            </div>
          </div>
        </div>

        {/* What We're Doing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            What We're Working On
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Performance Improvements</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Faster loading times</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Security Updates</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enhanced protection</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">New Features</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Exciting updates coming</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Database Optimization</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Better data handling</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Maintenance Progress</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">65%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: '65%' }}
            ></div>
          </div>
        </div>

        {/* What You Can Do */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            What You Can Do
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Check back in a few minutes - we're working as fast as we can
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Follow us on social media for real-time updates
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Contact support if you have urgent questions
              </p>
            </div>
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/contact"
            className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Contact Support
          </Link>
          
          <a
            href="mailto:support@bilten.com"
            className="flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-300 dark:border-gray-600"
          >
            <EnvelopeIcon className="w-5 h-5 mr-2" />
            Email Us
          </a>
        </div>

        {/* Social Media Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Stay Updated
          </h3>
          <div className="flex justify-center space-x-4">
            <a
              href="#"
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              title="Twitter"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              title="Facebook"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              title="Instagram"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.928-.796-1.418-1.947-1.418-3.244s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Auto-refresh Notice */}
        <div className="mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This page will automatically refresh when maintenance is complete
          </p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

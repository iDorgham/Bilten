import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, EyeIcon, LockClosedIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldCheckIcon className="w-12 h-12 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          
          {/* Information We Collect */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <EyeIcon className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Information We Collect
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Personal Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name, email address, and phone number</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely by our payment partners)</li>
                  <li>Profile information and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Usage Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Event browsing and search history</li>
                  <li>Ticket purchases and order history</li>
                  <li>Website usage patterns and interactions</li>
                  <li>Device information and IP addresses</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <DocumentTextIcon className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                How We Use Your Information
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and fulfill your ticket purchases</li>
                <li>Send order confirmations and event updates</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our services and user experience</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Comply with legal obligations and prevent fraud</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <LockClosedIcon className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Information Sharing
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With event organizers to fulfill your ticket purchases</li>
                <li>With payment processors to complete transactions</li>
                <li>With service providers who assist in our operations</li>
                <li>When required by law or to protect our rights</li>
                <li>With your explicit consent</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Data Security
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure payment processing through trusted partners</li>
                <li>Employee training on data protection practices</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Your Rights
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Update or correct inaccurate information</li>
                <li>Request deletion of your personal data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request data portability</li>
                <li>Lodge a complaint with supervisory authorities</li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Cookies and Tracking
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Essential cookies for website functionality</li>
                <li>Analytics cookies to understand usage patterns</li>
                <li>Marketing cookies for personalized content</li>
                <li>Preference cookies to remember your settings</li>
              </ul>
              <p className="mt-4">
                You can control cookie settings through your browser preferences.
              </p>
            </div>
          </section>

          {/* Related Policies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Related Policies
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                to="/terms-of-service" 
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Terms of Service</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Complete terms and conditions for using our platform.</p>
              </Link>
              <Link 
                to="/cookie-policy" 
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cookie Policy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Detailed information about cookies and tracking.</p>
              </Link>
              <Link 
                to="/refund-policy" 
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Refund Policy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Our refund terms and conditions for event tickets.</p>
              </Link>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Contact Us
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p><strong>Email:</strong> privacy@bilten.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Address:</strong> 123 Event Street, City, State 12345</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, InformationCircleIcon, CogIcon } from '@heroicons/react/24/outline';

const CookiePolicy = () => {
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
              Cookie Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Learn how we use cookies and similar technologies to enhance your experience on Bilten.
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
          
          {/* What Are Cookies */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <InformationCircleIcon className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                What Are Cookies?
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Remembering your preferences and settings</li>
                <li>Understanding how you use our website</li>
                <li>Providing personalized content and advertisements</li>
                <li>Ensuring the website functions properly</li>
                <li>Improving our services based on usage patterns</li>
              </ul>
            </div>
          </section>

          {/* Types of Cookies We Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Types of Cookies We Use
            </h2>
            <div className="space-y-8">
              
              {/* Essential Cookies */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Essential Cookies
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  These cookies are necessary for the website to function properly. They cannot be disabled.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>Authentication and security cookies</li>
                  <li>Session management cookies</li>
                  <li>Shopping cart functionality</li>
                  <li>Load balancing and performance cookies</li>
                </ul>
              </div>

              {/* Functional Cookies */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CogIcon className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Functional Cookies
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  These cookies enhance your experience by remembering your preferences and choices.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>Language and region preferences</li>
                  <li>Theme and display settings</li>
                  <li>Form data and user inputs</li>
                  <li>Personalized recommendations</li>
                </ul>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Analytics Cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  These cookies help us understand how visitors interact with our website.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>Page views and navigation patterns</li>
                  <li>Time spent on pages</li>
                  <li>Error tracking and performance monitoring</li>
                  <li>User journey analysis</li>
                </ul>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Marketing Cookies
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  These cookies are used to deliver relevant advertisements and track marketing campaign performance.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>Ad targeting and personalization</li>
                  <li>Campaign effectiveness tracking</li>
                  <li>Social media integration</li>
                  <li>Retargeting and remarketing</li>
                </ul>
              </div>

            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Third-Party Cookies
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                We may use third-party services that place their own cookies on your device. These services include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Google Analytics:</strong> Website analytics and performance tracking</li>
                <li><strong>Stripe:</strong> Payment processing and security</li>
                <li><strong>Social Media Platforms:</strong> Social sharing and authentication</li>
                <li><strong>Advertising Networks:</strong> Targeted advertising and campaign tracking</li>
              </ul>
              <p className="mt-4">
                These third-party services have their own privacy policies and cookie practices. We recommend reviewing their policies for more information.
              </p>
            </div>
          </section>

          {/* Cookie Management */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Managing Your Cookie Preferences
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                You have several options for managing cookies:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Browser Settings
                </h3>
                <p className="mb-3">
                  Most web browsers allow you to control cookies through their settings:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Block all cookies</li>
                  <li>Block third-party cookies only</li>
                  <li>Delete existing cookies</li>
                  <li>Set cookie expiration times</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cookie Consent
                </h3>
                <p className="mb-3">
                  When you first visit our website, you'll see a cookie consent banner that allows you to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Accept all cookies</li>
                  <li>Customize your cookie preferences</li>
                  <li>Reject non-essential cookies</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Opt-Out Links
                </h3>
                <p className="mb-3">
                  For specific third-party services, you can opt out directly:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
                  <li>Digital Advertising Alliance: <a href="https://optout.aboutads.info/" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">DAA Opt-out</a></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Impact of Disabling Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Impact of Disabling Cookies
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                If you choose to disable cookies, please be aware that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Some website features may not work properly</li>
                <li>You may need to re-enter information repeatedly</li>
                <li>Personalized content and recommendations may not be available</li>
                <li>Security features may be limited</li>
                <li>Payment processing may be affected</li>
              </ul>
            </div>
          </section>

          {/* Updates to Cookie Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Updates to This Policy
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posting the updated policy on our website</li>
                <li>Updating the "Last updated" date at the top of this policy</li>
                <li>Sending email notifications for significant changes</li>
              </ul>
            </div>
          </section>

          {/* Related Policies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Related Policies
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                to="/privacy-policy" 
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy Policy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">How we collect, use, and protect your personal information.</p>
              </Link>
              <Link 
                to="/terms-of-service" 
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Terms of Service</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Complete terms and conditions for using our platform.</p>
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
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
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

export default CookiePolicy;

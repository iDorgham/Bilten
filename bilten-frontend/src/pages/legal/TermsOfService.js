import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <DocumentTextIcon className="w-12 h-12 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Please read these terms carefully before using our services. By using Bilten, you agree to these terms.
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
          
          {/* Acceptance of Terms */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <CheckCircleIcon className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Acceptance of Terms
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                By accessing and using Bilten ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p>
                These terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </div>
          </section>

          {/* Description of Service */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Description of Service
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Bilten is an event ticketing platform that allows users to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Browse and discover events</li>
                <li>Purchase tickets for events</li>
                <li>Create and manage events (for organizers)</li>
                <li>Manage ticket inventory and sales</li>
                <li>Access event information and updates</li>
              </ul>
            </div>
          </section>

          {/* User Accounts */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <UserIcon className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                User Accounts
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintaining the security of your account and password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your account information is up to date</li>
              </ul>
              <p className="mt-4">
                You may not use as a username the name of another person or entity that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity, or a name that is offensive, vulgar, or obscene.
              </p>
            </div>
          </section>

          {/* Ticket Purchases */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Ticket Purchases
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                By purchasing tickets through our platform, you agree to the following terms:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All sales are final unless otherwise specified by the event organizer</li>
                <li>Tickets are non-refundable unless the event is cancelled or postponed</li>
                <li>You must provide accurate billing and contact information</li>
                <li>Service fees and taxes may apply to ticket purchases</li>
                <li>Tickets may not be resold above face value without organizer permission</li>
                <li>Event organizers may have additional terms and conditions</li>
              </ul>
            </div>
          </section>

          {/* Event Organizers */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Event Organizers
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Event organizers using our platform must comply with the following:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete event information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Honor all ticket sales and refund policies</li>
                <li>Maintain appropriate insurance coverage</li>
                <li>Provide adequate customer support for their events</li>
                <li>Pay all applicable fees and commissions</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Prohibited Uses
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                You may not use the Service for any unlawful purpose or to solicit others to perform unlawful acts. You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon or violate our intellectual property rights</li>
                <li>Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>Submit false or misleading information</li>
                <li>Upload viruses or any other type of malicious code</li>
                <li>Collect or track the personal information of others</li>
                <li>Spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                <li>Interfere with or circumvent the security features of the Service</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Intellectual Property
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of Bilten and its licensors. The Service is protected by copyright, trademark, and other laws.
              </p>
              <p>
                Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Limitation of Liability
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                In no event shall Bilten, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to or use of our servers</li>
                <li>Any interruption or cessation of transmission to or from the Service</li>
                <li>Any bugs, viruses, or other harmful code that may be transmitted</li>
                <li>Any errors or omissions in any content or for any loss or damage incurred</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Termination
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
              <p>
                If you wish to terminate your account, you may simply discontinue using the Service.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Changes to Terms
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
              <p>
                What constitutes a material change will be determined at our sole discretion.
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
                to="/privacy-policy" 
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy Policy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">How we collect, use, and protect your personal information.</p>
              </Link>
              <Link 
                to="/cookie-policy" 
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cookie Policy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Information about cookies and how we use them.</p>
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
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p><strong>Email:</strong> legal@bilten.com</p>
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

export default TermsOfService;

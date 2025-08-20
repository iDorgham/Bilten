import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const RefundPolicy = () => {
  const refundScenarios = [
    {
      scenario: 'Event Cancelled by Organizer',
      refundable: true,
      timeframe: '5-10 business days',
      description: 'Full refund automatically processed when an event is cancelled by the organizer.',
      icon: CheckCircleIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      scenario: 'Event Postponed',
      refundable: true,
      timeframe: '5-10 business days',
      description: 'Full refund available if you cannot attend the new date, or transfer to new date.',
      icon: CheckCircleIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      scenario: 'Event Venue Changed',
      refundable: true,
      timeframe: '5-10 business days',
      description: 'Full refund if the new venue is not accessible or suitable for you.',
      icon: CheckCircleIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      scenario: 'Cannot Attend (Personal Reasons)',
      refundable: 'Conditional',
      timeframe: '24-48 hours before event',
      description: 'Refund depends on organizer\'s policy. Check event details for specific terms.',
      icon: InformationCircleIcon,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      scenario: 'Technical Issues',
      refundable: true,
      timeframe: '5-10 business days',
      description: 'Full refund if technical issues prevent you from attending or accessing the event.',
      icon: CheckCircleIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      scenario: 'Duplicate Purchase',
      refundable: true,
      timeframe: '5-10 business days',
      description: 'Full refund for accidental duplicate ticket purchases.',
      icon: CheckCircleIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      scenario: 'Event Already Started',
      refundable: false,
      timeframe: 'N/A',
      description: 'No refunds available once the event has started.',
      icon: XCircleIcon,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20'
    },
    {
      scenario: 'Change of Mind',
      refundable: false,
      timeframe: 'N/A',
      description: 'No refunds for change of mind unless specified in organizer\'s policy.',
      icon: XCircleIcon,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20'
    }
  ];

  const refundProcess = [
    {
      step: 1,
      title: 'Request Refund',
      description: 'Contact the event organizer or our support team to request a refund.',
      icon: EnvelopeIcon
    },
    {
      step: 2,
      title: 'Review Request',
      description: 'We review your refund request based on our policy and event terms.',
      icon: InformationCircleIcon
    },
    {
      step: 3,
      title: 'Process Refund',
      description: 'If approved, refund is processed to your original payment method.',
      icon: CreditCardIcon
    },
    {
      step: 4,
      title: 'Confirmation',
      description: 'You receive confirmation email with refund details and timeline.',
      icon: CheckCircleIcon
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Animated Background Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link 
                to="/help" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-6"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Help Center
              </Link>
            </div>
            
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-poppins">
                Refund <span className="text-blue-400">Policy</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                We understand that sometimes plans change. Our refund policy is designed to be fair 
                to both attendees and event organizers while ensuring a positive experience for everyone.
              </p>
            </div>

            {/* Quick Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">Fair & Transparent</div>
                <div className="text-gray-300">Clear refund terms for all scenarios</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">5-10 Days</div>
                <div className="text-gray-300">Standard refund processing time</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CreditCardIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">Original Method</div>
                <div className="text-gray-300">Refunds to original payment method</div>
              </div>
            </div>
          </div>
        </section>

        {/* Refund Scenarios */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-6 font-poppins">
                Refund Scenarios
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Understand when refunds are available and the conditions that apply.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {refundScenarios.map((scenario, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${scenario.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <scenario.icon className={`w-6 h-6 ${scenario.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{scenario.scenario}</h3>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          scenario.refundable === true 
                            ? 'bg-green-500/20 text-green-400' 
                            : scenario.refundable === false
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {scenario.refundable === true ? 'Refundable' : 
                           scenario.refundable === false ? 'Non-Refundable' : 'Conditional'}
                        </span>
                        {scenario.timeframe !== 'N/A' && (
                          <span className="text-gray-400 text-sm">
                            {scenario.timeframe}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Refund Process */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-6 font-poppins">
                How to Request a Refund
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Follow these simple steps to request a refund for your ticket.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {refundProcess.map((step, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-blue-400">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Important Information */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4 font-poppins">
                      Important Information
                    </h3>
                    <div className="space-y-4 text-gray-200">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Refund policies may vary by event. Always check the specific event details for organizer-specific refund terms.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Service fees are typically non-refundable unless the event is cancelled by the organizer.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Refunds are processed to the original payment method used for the purchase.</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Processing times may vary depending on your bank or payment provider.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6 font-poppins">
                Need Help with a Refund?
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Our support team is here to help you with any refund-related questions or issues.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <EnvelopeIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Email Support</h3>
                <p className="text-gray-300 mb-6">
                  Send us an email with your refund request and we'll respond within 24 hours.
                </p>
                <a 
                  href="mailto:support@bilten.com?subject=Refund%20Request" 
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Email
                </a>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PhoneIcon className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Phone Support</h3>
                <p className="text-gray-300 mb-6">
                  Call us during business hours for immediate assistance with refund requests.
                </p>
                <a 
                  href="tel:+902125550123" 
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Related Policies */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-6 font-poppins">
                Related Policies
              </h2>
              <p className="text-gray-300">
                Review our other policies for complete information about using Bilten.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link 
                to="/terms-of-service" 
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Terms of Service</h3>
                <p className="text-gray-300 text-sm">Complete terms and conditions for using our platform.</p>
              </Link>
              
              <Link 
                to="/privacy-policy" 
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Privacy Policy</h3>
                <p className="text-gray-300 text-sm">How we collect, use, and protect your personal information.</p>
              </Link>
              
              <Link 
                to="/cookie-policy" 
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Cookie Policy</h3>
                <p className="text-gray-300 text-sm">Information about cookies and how we use them.</p>
              </Link>
              
              <Link 
                to="/help" 
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Help Center</h3>
                <p className="text-gray-300 text-sm">Find answers to common questions and get support.</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;

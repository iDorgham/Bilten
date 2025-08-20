import React, { useState } from 'react';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setMessage('Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
      setMessageType('success');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setMessage('Sorry, there was an error sending your message. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      question: "How do I create an event?",
      answer: "To create an event, you need to have an organizer account. Once logged in, click on 'Create Event' in your dashboard and fill out the event details form."
    },
    {
      question: "Can I get a refund for my ticket?",
      answer: "Refund policies vary by event. Please check the specific event's refund policy or contact the event organizer directly for refund requests."
    },
    {
      question: "How do I contact an event organizer?",
      answer: "You can contact event organizers through the event details page. Look for the 'Contact Organizer' button or use the contact information provided on the event page."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, we use industry-standard encryption and security measures to protect your payment information. We never store your full credit card details on our servers."
    },
    {
      question: "How do I report an issue with an event?",
      answer: "If you encounter any issues with an event, please contact our support team through this contact form or email us directly at support@bilten.com."
    },
    {
      question: "Can I transfer my ticket to someone else?",
      answer: "Ticket transfer policies are set by individual event organizers. Please check the event details or contact the organizer for specific transfer policies."
    }
  ];

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: "Email Us",
      details: ["info@bilten.com", "support@bilten.com"],
      description: "We typically respond within 24 hours"
    },
    {
      icon: PhoneIcon,
      title: "Call Us",
      details: ["+1 (555) 123-4567", "+1 (555) 987-6543"],
      description: "Monday - Friday, 9:00 AM - 6:00 PM EST"
    },
    {
      icon: MapPinIcon,
      title: "Visit Us",
      details: ["123 Event Street", "Tech City, TC 12345"],
      description: "By appointment only"
    },
    {
      icon: ClockIcon,
      title: "Business Hours",
      details: ["Mon-Fri: 9:00 AM - 6:00 PM", "Sat: 10:00 AM - 4:00 PM"],
      description: "Closed on Sundays and holidays"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="py-24 text-center">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-white">Contact Us</h1>
        <p className="text-gray-600 dark:text-white mt-1">Get in touch with our team. We're here to help!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Form Card */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-blue-300" />
              Send us a Message
            </h2>

                         <form onSubmit={handleSubmit} className="space-y-6">
               {/* Name Fields */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     First Name *
                   </label>
                   <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                     <div className="flex items-center px-4 py-3">
                       <UserIcon className="w-4 h-4 text-gray-400 dark:text-white/80 mr-3" />
                       <input
                         type="text"
                         name="firstName"
                         value={formData.firstName}
                         onChange={handleInputChange}
                         required
                         className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                         placeholder="Your first name"
                       />
                     </div>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Last Name *
                   </label>
                   <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                     <div className="flex items-center px-4 py-3">
                       <UserIcon className="w-4 h-4 text-gray-400 dark:text-white/80 mr-3" />
                       <input
                         type="text"
                         name="lastName"
                         value={formData.lastName}
                         onChange={handleInputChange}
                         required
                         className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                         placeholder="Your last name"
                       />
                     </div>
                   </div>
                 </div>
               </div>

               {/* Email and Phone Fields */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Email *
                   </label>
                   <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                     <div className="flex items-center px-4 py-3">
                       <EnvelopeIcon className="w-4 h-4 text-gray-400 dark:text-white/80 mr-3" />
                       <input
                         type="email"
                         name="email"
                         value={formData.email}
                         onChange={handleInputChange}
                         required
                         className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                         placeholder="your.email@example.com"
                       />
                     </div>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Phone
                   </label>
                   <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                     <div className="flex items-center px-4 py-3">
                       <PhoneIcon className="w-4 h-4 text-gray-400 dark:text-white/80 mr-3" />
                       <input
                         type="tel"
                         name="phone"
                         value={formData.phone}
                         onChange={handleInputChange}
                         className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                         placeholder="+1 (555) 123-4567"
                       />
                     </div>
                   </div>
                 </div>
               </div>

               {/* Subject Field */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Subject *
                 </label>
                 <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                   <div className="flex items-center px-4 py-3">
                     <DocumentTextIcon className="w-4 h-4 text-gray-400 dark:text-white/80 mr-3" />
                     <select
                       name="subject"
                       value={formData.subject}
                       onChange={handleInputChange}
                       required
                       className="flex-1 outline-none text-gray-900 dark:text-white bg-transparent text-sm"
                     >
                       <option value="">Select a subject</option>
                       <option value="general">General Inquiry</option>
                       <option value="support">Technical Support</option>
                       <option value="billing">Billing & Payments</option>
                       <option value="events">Event Management</option>
                       <option value="partnership">Partnership</option>
                       <option value="feedback">Feedback & Suggestions</option>
                       <option value="other">Other</option>
                     </select>
                   </div>
                 </div>
               </div>

               {/* Message Field */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Message *
                 </label>
                 <div className="bg-white dark:bg-white/10 rounded-2xl shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                   <div className="flex items-start px-4 py-3">
                     <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400 dark:text-white/80 mr-3 mt-1" />
                     <textarea
                       name="message"
                       value={formData.message}
                       onChange={handleInputChange}
                       required
                       rows={6}
                       className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm resize-none"
                       placeholder="Tell us how we can help you..."
                     />
                   </div>
                 </div>
               </div>

               {/* Submit Button */}
               <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                 <div className="flex items-center">
                   <div className="flex-1 flex items-center px-4 py-3">
                     <PaperAirplaneIcon className="w-4 h-4 text-gray-400 dark:text-white/80 mr-3" />
                     <span className="text-gray-500 dark:text-white/80 text-sm">
                       {loading ? 'Sending your message...' : 'Ready to send your message'}
                     </span>
                   </div>
                   <button
                     type="submit"
                     disabled={loading}
                     className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 m-1.5 transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {loading ? (
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                     ) : (
                       <PaperAirplaneIcon className="w-5 h-5" />
                     )}
                   </button>
                 </div>
               </div>
             </form>
          </div>

          {/* FAQ Section */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <DocumentTextIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-blue-300" />
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Information */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <BuildingOfficeIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-blue-300" />
              Contact Information
            </h2>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <info.icon className="w-5 h-5 text-primary-600 dark:text-blue-300" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {info.title}
                    </h3>
                    {info.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-gray-600 dark:text-gray-300 text-sm">
                        {detail}
                      </p>
                    ))}
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      {info.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <GlobeAltIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-blue-300" />
              Quick Links
            </h2>

            <div className="space-y-3">
              <a href="/help" className="block p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="font-medium">Help Center</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Find answers to common questions</div>
              </a>
              <a href="/events" className="block p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="font-medium">Browse Events</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Discover upcoming events</div>
              </a>
              <a href="/create-event" className="block p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="font-medium">Create Event</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Start organizing your event</div>
              </a>
              <a href="/register" className="block p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="font-medium">Sign Up</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Join our community</div>
              </a>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-700/50 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Fast Response Time
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                We typically respond to all inquiries within 24 hours during business days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-md ${
          messageType === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-start">
            {messageType === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div className="font-medium">
                {messageType === 'success' ? 'Success!' : 'Error'}
              </div>
              <div className="text-sm mt-1">{message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;

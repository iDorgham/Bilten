import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  UserIcon,
  CreditCardIcon,
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  CogIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const HelpCenter = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  // Help Categories specifically for event attendees
  const helpCategories = [
    {
      id: 'getting-started',
      title: t('help.categories.gettingStarted'),
      icon: <BookOpenIcon className="h-6 w-6" />,
      description: t('help.categories.gettingStartedDesc'),
      color: 'bg-green-500'
    },
    {
      id: 'account-management',
      title: t('help.categories.accountManagement'),
      icon: <UserIcon className="h-6 w-6" />,
      description: t('help.categories.accountManagementDesc'),
      color: 'bg-blue-500'
    },
    {
      id: 'event-discovery',
      title: t('help.categories.eventDiscovery'),
      icon: <CalendarIcon className="h-6 w-6" />,
      description: t('help.categories.eventDiscoveryDesc'),
      color: 'bg-purple-500'
    },
    {
      id: 'tickets',
      title: t('help.categories.tickets'),
      icon: <TicketIcon className="h-6 w-6" />,
      description: t('help.categories.ticketsDesc'),
      color: 'bg-red-500'
    },
    {
      id: 'payments',
      title: t('help.categories.payments'),
      icon: <CreditCardIcon className="h-6 w-6" />,
      description: t('help.categories.paymentsDesc'),
      color: 'bg-emerald-500'
    },
    {
      id: 'favorites',
      title: t('help.categories.favorites'),
      icon: <HeartIcon className="h-6 w-6" />,
      description: t('help.categories.favoritesDesc'),
      color: 'bg-pink-500'
    },
    {
      id: 'order-history',
      title: t('help.categories.orderHistory'),
      icon: <ShoppingBagIcon className="h-6 w-6" />,
      description: t('help.categories.orderHistoryDesc'),
      color: 'bg-orange-500'
    },
    {
      id: 'mobile-app',
      title: t('help.categories.mobileApp'),
      icon: <DevicePhoneMobileIcon className="h-6 w-6" />,
      description: t('help.categories.mobileAppDesc'),
      color: 'bg-indigo-500'
    }
  ];



  // Contact Methods
  const contactMethods = [
    {
      title: t('help.contact.liveChat.title'),
      description: t('help.contact.liveChat.description'),
      icon: <ChatBubbleLeftRightIcon className="h-8 w-8" />,
      action: t('help.contact.liveChat.action'),
      color: 'bg-blue-500 hover:bg-blue-600',
      available: true
    },
    {
      title: t('help.contact.email.title'),
      description: t('help.contact.email.description'),
      icon: <EnvelopeIcon className="h-8 w-8" />,
      action: t('help.contact.email.action'),
      color: 'bg-green-500 hover:bg-green-600',
      available: true
    },
    {
      title: t('help.contact.phone.title'),
      description: t('help.contact.phone.description'),
      icon: <PhoneIcon className="h-8 w-8" />,
      action: t('help.contact.phone.action'),
      color: 'bg-purple-500 hover:bg-purple-600',
      available: true
    }
  ];

  const toggleQuestion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const filteredCategories = helpCategories.filter(category => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      category.title.toLowerCase().includes(searchLower) ||
      category.description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900">
      {/* Animated Background Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8 text-center pt-[100px]">
            <h1 className="text-4xl md:text-5xl title-primary text-gray-900 dark:text-white mb-4">
              {t('help.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('help.subtitle')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto" style={{ marginBottom: '100px' }}>
            <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
              <div className="flex items-center">
                <div className="flex-1 flex items-center px-4 py-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-white/80 mr-3" />
                  <input
                    type="text"
                    placeholder={t('help.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                  />
                </div>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 m-1.5 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>



          {/* Help Categories */}
          <div className="mb-12">
            <h2 className="text-2xl title-secondary text-gray-900 dark:text-white mb-6 text-center">
              {t('help.browseCategories')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl p-6 cursor-pointer transition-all duration-200 border-2 ${
                    activeCategory === category.id
                      ? 'border-blue-500 shadow-lg scale-105'
                      : 'border-gray-200 dark:border-white/20 hover:shadow-md'
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-white mb-4 ${category.color}`}>
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {category.description}
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    {t('help.learnMore')}
                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div className="mb-12">
            <h2 className="text-2xl title-secondary text-gray-900 dark:text-white mb-6 text-center">
              {t('help.contactSupport')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-white/20 p-6 text-center hover:shadow-xl transition-shadow"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-white mb-4 ${method.color}`}>
                    {method.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {method.description}
                  </p>
                  <button className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${method.color}`}>
                    {method.action}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 text-center">
              <h2 className="text-3xl title-primary mb-4">
                {t('help.stillNeedHelp')}
              </h2>
              <p className="text-xl mb-6 opacity-90">
                {t('help.supportTeam')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/faq"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  {t('help.browseFAQ')}
                </Link>
                <Link
                  to="/contact"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
                >
                  {t('help.sendMessage')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;

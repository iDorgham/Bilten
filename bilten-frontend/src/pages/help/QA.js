import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  CogIcon,
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  AcademicCapIcon,
  SparklesIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const QA = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);

  // Comprehensive QA Categories
  const qaCategories = [
    {
      id: 'all',
      title: t('qa.categories.all'),
      icon: <QuestionMarkCircleIcon className="h-6 w-6" />,
      color: 'bg-gray-500',
      count: 0
    },
    {
      id: 'general',
      title: t('qa.categories.general'),
      icon: <BookOpenIcon className="h-6 w-6" />,
      color: 'bg-blue-500',
      count: 0
    },
    {
      id: 'organizers',
      title: t('qa.categories.organizers'),
      icon: <UserIcon className="h-6 w-6" />,
      color: 'bg-green-500',
      count: 0
    },
    {
      id: 'attendees',
      title: t('qa.categories.attendees'),
      icon: <CalendarIcon className="h-6 w-6" />,
      color: 'bg-purple-500',
      count: 0
    },
    {
      id: 'payments',
      title: t('qa.categories.payments'),
      icon: <CreditCardIcon className="h-6 w-6" />,
      color: 'bg-orange-500',
      count: 0
    },
    {
      id: 'technical',
      title: t('qa.categories.technical'),
      icon: <CogIcon className="h-6 w-6" />,
      color: 'bg-red-500',
      count: 0
    },
    {
      id: 'security',
      title: t('qa.categories.security'),
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      color: 'bg-indigo-500',
      count: 0
    },
    {
      id: 'advanced',
      title: t('qa.categories.advanced'),
      icon: <AcademicCapIcon className="h-6 w-6" />,
      color: 'bg-emerald-500',
      count: 0
    }
  ];

  // Comprehensive QA Data
  const qaData = [
    // General Questions
    {
      id: 'gen-1',
      category: 'general',
      question: t('qa.general.whatIsBilten.question'),
      answer: t('qa.general.whatIsBilten.answer'),
      tags: ['platform', 'overview'],
      difficulty: 'beginner',
      helpful: 45,
      views: 1200
    },
    {
      id: 'gen-2',
      category: 'general',
      question: t('qa.general.createAccount.question'),
      answer: t('qa.general.createAccount.answer'),
      tags: ['account', 'registration'],
      difficulty: 'beginner',
      helpful: 67,
      views: 890
    },
    {
      id: 'gen-3',
      category: 'general',
      question: t('qa.general.isFree.question'),
      answer: t('qa.general.isFree.answer'),
      tags: ['pricing', 'features'],
      difficulty: 'beginner',
      helpful: 34,
      views: 756
    },
    {
      id: 'gen-4',
      category: 'general',
      question: t('qa.general.eventTypes.question'),
      answer: t('qa.general.eventTypes.answer'),
      tags: ['events', 'types'],
      difficulty: 'beginner',
      helpful: 28,
      views: 543
    },

    // Organizer Questions
    {
      id: 'org-1',
      category: 'organizers',
      question: t('qa.organizers.createEvent.question'),
      answer: t('qa.organizers.createEvent.answer'),
      tags: ['event-creation', 'organizer'],
      difficulty: 'intermediate',
      helpful: 89,
      views: 2340
    },
    {
      id: 'org-2',
      category: 'organizers',
      question: t('qa.organizers.paymentMethods.question'),
      answer: t('qa.organizers.paymentMethods.answer'),
      tags: ['payments', 'organizer'],
      difficulty: 'intermediate',
      helpful: 56,
      views: 1234
    },
    {
      id: 'org-3',
      category: 'organizers',
      question: t('qa.organizers.manageSales.question'),
      answer: t('qa.organizers.manageSales.answer'),
      tags: ['sales', 'management'],
      difficulty: 'intermediate',
      helpful: 78,
      views: 987
    },
    {
      id: 'org-4',
      category: 'organizers',
      question: t('qa.organizers.cancelEvent.question'),
      answer: t('qa.organizers.cancelEvent.answer'),
      tags: ['cancellation', 'refunds'],
      difficulty: 'intermediate',
      helpful: 45,
      views: 654
    },
    {
      id: 'org-5',
      category: 'organizers',
      question: t('qa.organizers.promoteEvent.question'),
      answer: t('qa.organizers.promoteEvent.answer'),
      tags: ['marketing', 'promotion'],
      difficulty: 'advanced',
      helpful: 67,
      views: 876
    },

    // Attendee Questions
    {
      id: 'att-1',
      category: 'attendees',
      question: t('qa.attendees.findEvents.question'),
      answer: t('qa.attendees.findEvents.answer'),
      tags: ['discovery', 'search'],
      difficulty: 'beginner',
      helpful: 92,
      views: 3456
    },
    {
      id: 'att-2',
      category: 'attendees',
      question: t('qa.attendees.purchaseTickets.question'),
      answer: t('qa.attendees.purchaseTickets.answer'),
      tags: ['tickets', 'purchase'],
      difficulty: 'beginner',
      helpful: 134,
      views: 5678
    },
    {
      id: 'att-3',
      category: 'attendees',
      question: t('qa.attendees.refunds.question'),
      answer: t('qa.attendees.refunds.answer'),
      tags: ['refunds', 'cancellation'],
      difficulty: 'intermediate',
      helpful: 78,
      views: 2345
    },
    {
      id: 'att-4',
      category: 'attendees',
      question: t('qa.attendees.accessTickets.question'),
      answer: t('qa.attendees.accessTickets.answer'),
      tags: ['tickets', 'access'],
      difficulty: 'beginner',
      helpful: 89,
      views: 3456
    },
    {
      id: 'att-5',
      category: 'attendees',
      question: t('qa.attendees.eventCancelled.question'),
      answer: t('qa.attendees.eventCancelled.answer'),
      tags: ['cancellation', 'refunds'],
      difficulty: 'intermediate',
      helpful: 67,
      views: 1234
    },

    // Payment Questions
    {
      id: 'pay-1',
      category: 'payments',
      question: t('qa.payments.security.question'),
      answer: t('qa.payments.security.answer'),
      tags: ['security', 'payments'],
      difficulty: 'intermediate',
      helpful: 156,
      views: 4567
    },
    {
      id: 'pay-2',
      category: 'payments',
      question: t('qa.payments.fees.question'),
      answer: t('qa.payments.fees.answer'),
      tags: ['fees', 'pricing'],
      difficulty: 'intermediate',
      helpful: 89,
      views: 2345
    },
    {
      id: 'pay-3',
      category: 'payments',
      question: t('qa.payments.payouts.question'),
      answer: t('qa.payments.payouts.answer'),
      tags: ['payouts', 'organizer'],
      difficulty: 'advanced',
      helpful: 45,
      views: 987
    },
    {
      id: 'pay-4',
      category: 'payments',
      question: t('qa.payments.paymentPlans.question'),
      answer: t('qa.payments.paymentPlans.answer'),
      tags: ['payment-plans', 'installments'],
      difficulty: 'intermediate',
      helpful: 67,
      views: 1234
    },

    // Technical Questions
    {
      id: 'tech-1',
      category: 'technical',
      question: t('qa.technical.browsers.question'),
      answer: t('qa.technical.browsers.answer'),
      tags: ['browsers', 'compatibility'],
      difficulty: 'beginner',
      helpful: 78,
      views: 2345
    },
    {
      id: 'tech-2',
      category: 'technical',
      question: t('qa.technical.mobileApp.question'),
      answer: t('qa.technical.mobileApp.answer'),
      tags: ['mobile', 'app'],
      difficulty: 'beginner',
      helpful: 92,
      views: 3456
    },
    {
      id: 'tech-3',
      category: 'technical',
      question: t('qa.technical.resetPassword.question'),
      answer: t('qa.technical.resetPassword.answer'),
      tags: ['password', 'security'],
      difficulty: 'beginner',
      helpful: 134,
      views: 5678
    },
    {
      id: 'tech-4',
      category: 'technical',
      question: t('qa.technical.integration.question'),
      answer: t('qa.technical.integration.answer'),
      tags: ['api', 'integration'],
      difficulty: 'advanced',
      helpful: 34,
      views: 567
    },

    // Security Questions
    {
      id: 'sec-1',
      category: 'security',
      question: t('qa.security.privacy.question'),
      answer: t('qa.security.privacy.answer'),
      tags: ['privacy', 'data'],
      difficulty: 'intermediate',
      helpful: 89,
      views: 2345
    },
    {
      id: 'sec-2',
      category: 'security',
      question: t('qa.security.deleteAccount.question'),
      answer: t('qa.security.deleteAccount.answer'),
      tags: ['account', 'deletion'],
      difficulty: 'intermediate',
      helpful: 45,
      views: 987
    },
    {
      id: 'sec-3',
      category: 'security',
      question: t('qa.security.dataBreach.question'),
      answer: t('qa.security.dataBreach.answer'),
      tags: ['security', 'breach'],
      difficulty: 'advanced',
      helpful: 23,
      views: 456
    },

    // Advanced Questions
    {
      id: 'adv-1',
      category: 'advanced',
      question: t('qa.advanced.analytics.question'),
      answer: t('qa.advanced.analytics.answer'),
      tags: ['analytics', 'data'],
      difficulty: 'advanced',
      helpful: 34,
      views: 678
    },
    {
      id: 'adv-2',
      category: 'advanced',
      question: t('qa.advanced.customization.question'),
      answer: t('qa.advanced.customization.answer'),
      tags: ['customization', 'branding'],
      difficulty: 'advanced',
      helpful: 28,
      views: 543
    },
    {
      id: 'adv-3',
      category: 'advanced',
      question: t('qa.advanced.bulkOperations.question'),
      answer: t('qa.advanced.bulkOperations.answer'),
      tags: ['bulk', 'operations'],
      difficulty: 'advanced',
      helpful: 19,
      views: 345
    }
  ];

  // Contact Methods
  const contactMethods = [
    {
      title: t('qa.contact.liveChat.title'),
      description: t('qa.contact.liveChat.description'),
      icon: <ChatBubbleLeftRightIcon className="h-8 w-8" />,
      action: t('qa.contact.liveChat.action'),
      color: 'bg-blue-500 hover:bg-blue-600',
      available: true
    },
    {
      title: t('qa.contact.email.title'),
      description: t('qa.contact.email.description'),
      icon: <EnvelopeIcon className="h-8 w-8" />,
      action: t('qa.contact.email.action'),
      color: 'bg-green-500 hover:bg-green-600',
      available: true
    },
    {
      title: t('qa.contact.phone.title'),
      description: t('qa.contact.phone.description'),
      icon: <PhoneIcon className="h-8 w-8" />,
      action: t('qa.contact.phone.action'),
      color: 'bg-purple-500 hover:bg-purple-600',
      available: true
    }
  ];

  const toggleItem = (questionId) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(questionId)) {
      newExpandedItems.delete(questionId);
    } else {
      newExpandedItems.add(questionId);
    }
    setExpandedItems(newExpandedItems);
  };

  const markHelpful = (questionId) => {
    // In a real app, this would update the database
    console.log(`Marked question ${questionId} as helpful`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return <CheckCircleIcon className="h-4 w-4" />;
      case 'intermediate': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'advanced': return <StarIcon className="h-4 w-4" />;
      default: return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  // Filter questions based on search term and category
  useEffect(() => {
    let filtered = qaData;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchLower) ||
        q.answer.toLowerCase().includes(searchLower) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredQuestions(filtered);

    // Update category counts
    const updatedCategories = qaCategories.map(cat => ({
      ...cat,
      count: cat.id === 'all' ? qaData.length : qaData.filter(q => q.category === cat.id).length
    }));
  }, [searchTerm, selectedCategory]);

  // Get recent questions (most viewed in the last 30 days)
  useEffect(() => {
    const recent = qaData
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    setRecentQuestions(recent);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900">
      {/* Animated Background Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-poppins">
                {t('qa.title')} <span className="text-blue-600 dark:text-blue-400">{t('qa.answers')}</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                {t('qa.subtitle')}
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('qa.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-lg"
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-white/20 shadow-lg">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{qaData.length}+</div>
                  <div className="text-gray-600 dark:text-gray-300">{t('qa.stats.questions')}</div>
                </div>
                <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-white/20 shadow-lg">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">8</div>
                  <div className="text-gray-600 dark:text-gray-300">{t('qa.stats.categories')}</div>
                </div>
                <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-white/20 shadow-lg">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">24/7</div>
                  <div className="text-gray-600 dark:text-gray-300">{t('qa.stats.support')}</div>
                </div>
                <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-white/20 shadow-lg">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">98%</div>
                  <div className="text-gray-600 dark:text-gray-300">{t('qa.stats.satisfaction')}</div>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-poppins">
                {t('qa.browseByCategory')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {qaCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 backdrop-blur-sm hover:shadow-md'
                    }`}
                  >
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white mb-2 ${category.color}`}>
                      {category.icon}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {category.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {category.count} {t('qa.questions')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Questions */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-poppins">
                {t('qa.recentQuestions')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-white/20 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => toggleItem(question.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyIcon(question.difficulty)}
                        <span className="ml-1 capitalize">{question.difficulty}</span>
                      </span>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {question.views} {t('qa.views')}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {question.question}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {question.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <StarIcon className="w-4 h-4 mr-1" />
                        {question.helpful} {t('qa.helpful')}
                      </div>
                      {expandedItems.has(question.id) ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    {expandedItems.has(question.id) && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {question.answer}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markHelpful(question.id);
                          }}
                          className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                        >
                          {t('qa.markHelpful')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* All Questions */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {t('qa.allQuestions')}
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredQuestions.length} {t('qa.of')} {qaData.length} {t('qa.questions')}
                </div>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <QuestionMarkCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('qa.noResults.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{t('qa.noResults.subtitle')}</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('qa.noResults.clearFilters')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                {getDifficultyIcon(question.difficulty)}
                                <span className="ml-1 capitalize">{question.difficulty}</span>
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {question.views} {t('qa.views')}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {question.question}
                            </h3>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {question.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleItem(question.id)}
                            className="ml-4 flex-shrink-0"
                          >
                            {expandedItems.has(question.id) ? (
                              <ChevronUpIcon className="w-6 h-6 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        {expandedItems.has(question.id) && (
                          <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                              {question.answer}
                            </p>
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => markHelpful(question.id)}
                                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                              >
                                {t('qa.markHelpful')} ({question.helpful})
                              </button>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {t('qa.lastUpdated')}: {t('qa.recently')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Support */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-poppins">
                {t('qa.needMoreHelp')}
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

            {/* Quick Links */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10 text-center">
                <h2 className="text-3xl font-bold text-white mb-6 font-poppins">
                  {t('qa.getStarted.title')}
                </h2>
                <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                  {t('qa.getStarted.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/help" 
                    className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {t('qa.getStarted.helpCenter')}
                  </Link>
                  <Link 
                    to="/contact" 
                    className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    {t('qa.getStarted.contactUs')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default QA;

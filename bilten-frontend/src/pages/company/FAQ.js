import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  CogIcon,
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../context/LanguageContext';

const FAQ = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const faqCategories = [
    {
      id: 'general',
      title: t('faq.general.title'),
      icon: QuestionMarkCircleIcon,
      questions: [
        {
          question: t('faq.general.whatIsBilten.question'),
          answer: t('faq.general.whatIsBilten.answer')
        },
        {
          question: t('faq.general.createAccount.question'),
          answer: t('faq.general.createAccount.answer')
        },
        {
          question: t('faq.general.isFree.question'),
          answer: t('faq.general.isFree.answer')
        },
        {
          question: t('faq.general.eventTypes.question'),
          answer: t('faq.general.eventTypes.answer')
        }
      ]
    },
    {
      id: 'organizers',
      title: t('faq.organizers.title'),
      icon: UserIcon,
      questions: [
        {
          question: t('faq.organizers.createEvent.question'),
          answer: t('faq.organizers.createEvent.answer')
        },
        {
          question: t('faq.organizers.paymentMethods.question'),
          answer: t('faq.organizers.paymentMethods.answer')
        },
        {
          question: t('faq.organizers.manageSales.question'),
          answer: t('faq.organizers.manageSales.answer')
        },
        {
          question: t('faq.organizers.cancelEvent.question'),
          answer: t('faq.organizers.cancelEvent.answer')
        },
        {
          question: t('faq.organizers.promoteEvent.question'),
          answer: t('faq.organizers.promoteEvent.answer')
        }
      ]
    },
    {
      id: 'attendees',
      title: t('faq.attendees.title'),
      icon: CalendarIcon,
      questions: [
        {
          question: t('faq.attendees.findEvents.question'),
          answer: t('faq.attendees.findEvents.answer')
        },
        {
          question: t('faq.attendees.purchaseTickets.question'),
          answer: t('faq.attendees.purchaseTickets.answer')
        },
        {
          question: t('faq.attendees.refunds.question'),
          answer: t('faq.attendees.refunds.answer')
        },
        {
          question: t('faq.attendees.accessTickets.question'),
          answer: t('faq.attendees.accessTickets.answer')
        },
        {
          question: t('faq.attendees.eventCancelled.question'),
          answer: t('faq.attendees.eventCancelled.answer')
        }
      ]
    },
    {
      id: 'payments',
      title: t('faq.payments.title'),
      icon: CreditCardIcon,
      questions: [
        {
          question: t('faq.payments.security.question'),
          answer: t('faq.payments.security.answer')
        },
        {
          question: t('faq.payments.fees.question'),
          answer: t('faq.payments.fees.answer')
        },
        {
          question: t('faq.payments.payouts.question'),
          answer: t('faq.payments.payouts.answer')
        },
        {
          question: t('faq.payments.paymentPlans.question'),
          answer: t('faq.payments.paymentPlans.answer')
        }
      ]
    },
    {
      id: 'technical',
      title: t('faq.technical.title'),
      icon: CogIcon,
      questions: [
        {
          question: t('faq.technical.browsers.question'),
          answer: t('faq.technical.browsers.answer')
        },
        {
          question: t('faq.technical.mobileApp.question'),
          answer: t('faq.technical.mobileApp.answer')
        },
        {
          question: t('faq.technical.resetPassword.question'),
          answer: t('faq.technical.resetPassword.answer')
        },
        {
          question: t('faq.technical.integration.question'),
          answer: t('faq.technical.integration.answer')
        }
      ]
    },
    {
      id: 'security',
      title: t('faq.security.title'),
      icon: ShieldCheckIcon,
      questions: [
        {
          question: t('faq.security.privacy.question'),
          answer: t('faq.security.privacy.answer')
        },
        {
          question: t('faq.security.deleteAccount.question'),
          answer: t('faq.security.deleteAccount.answer')
        },
        {
          question: t('faq.security.dataBreach.question'),
          answer: t('faq.security.dataBreach.answer')
        }
      ]
    }
  ];

  const toggleItem = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    const newExpandedItems = new Set(expandedItems);
    
    if (newExpandedItems.has(key)) {
      newExpandedItems.delete(key);
    } else {
      newExpandedItems.add(key);
    }
    
    setExpandedItems(newExpandedItems);
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

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
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl title-primary text-gray-900 dark:text-white mb-6">
              {t('faq.title')} <span className="text-blue-600 dark:text-blue-400">{t('faq.questions')}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              {t('faq.subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-12">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('faq.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-white/20 shadow-lg">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50+</div>
                <div className="text-gray-600 dark:text-gray-300">{t('faq.stats.questions')}</div>
              </div>
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-white/20 shadow-lg">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">24/7</div>
                <div className="text-gray-600 dark:text-gray-300">{t('faq.stats.support')}</div>
              </div>
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-white/20 shadow-lg">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">6</div>
                <div className="text-gray-600 dark:text-gray-300">{t('faq.stats.categories')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <QuestionMarkCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('faq.noResults.title')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{t('faq.noResults.subtitle')}</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('faq.noResults.clearSearch')}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/20 overflow-hidden shadow-lg">
                    <div className="p-6 border-b border-gray-200 dark:border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <category.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl title-secondary text-gray-900 dark:text-white">{category.title}</h2>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-white/10">
                      {category.questions.map((item, index) => {
                        const key = `${category.id}-${index}`;
                        const isExpanded = expandedItems.has(key);
                        
                        return (
                          <div key={index} className="p-6">
                            <button
                              onClick={() => toggleItem(category.id, index)}
                              className="w-full flex items-center justify-between text-left focus:outline-none group"
                            >
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-4">
                                {item.question}
                              </h3>
                              {isExpanded ? (
                                <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                                {item.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Help Resources */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl title-primary text-gray-900 dark:text-white mb-6">
                {t('faq.help.title')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t('faq.help.subtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-white/20 text-center shadow-lg">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <EnvelopeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('faq.help.email.title')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t('faq.help.email.description')}
                </p>
                <a 
                  href="mailto:support@bilten.com" 
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('faq.help.email.button')}
                </a>
              </div>
              
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-white/20 text-center shadow-lg">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PhoneIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('faq.help.phone.title')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t('faq.help.phone.description')}
                </p>
                <a 
                  href="tel:+902125550123" 
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('faq.help.phone.button')}
                </a>
              </div>
              
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-white/20 text-center shadow-lg">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <QuestionMarkCircleIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('faq.help.center.title')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t('faq.help.center.description')}
                </p>
                <Link 
                  to="/help" 
                  className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('faq.help.center.button')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10 text-center">
                <h2 className="text-3xl title-primary text-white mb-6">
                  {t('faq.getStarted.title')}
                </h2>
                <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                  {t('faq.getStarted.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/events" 
                    className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {t('faq.getStarted.browseEvents')}
                  </Link>
                  <Link 
                    to="/create-event" 
                    className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    {t('faq.getStarted.createEvent')}
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

export default FAQ;

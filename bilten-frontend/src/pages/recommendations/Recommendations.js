import React, { useState } from 'react';
import { SparklesIcon, ArrowTrendingUpIcon, HeartIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import RecommendationsSection from '../../components/RecommendationsSection';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const Recommendations = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const sections = [
    {
      id: 'all',
      title: t('recommendations.all.title') || 'All Recommendations',
      description: t('recommendations.all.description') || 'Discover a mix of personalized, trending, and curated events',
      icon: <SparklesIcon className="w-6 h-6" />
    },
    {
      id: 'personalized',
      title: t('recommendations.personalized.title') || 'Personalized for You',
      description: t('recommendations.personalized.description') || 'Events tailored to your preferences and behavior',
      icon: <HeartIcon className="w-6 h-6" />
    },
    {
      id: 'trending',
      title: t('recommendations.trending.title') || 'Trending Now',
      description: t('recommendations.trending.description') || 'Events that are gaining popularity right now',
              icon: <ArrowTrendingUpIcon className="w-6 h-6" />
    }
  ];

  const getCurrentSection = () => {
    return sections.find(section => section.id === activeSection) || sections[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('recommendations.page.title') || 'AI-Powered Recommendations'}
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {t('recommendations.page.subtitle') || 'Discover events that match your interests and preferences'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                {t('common.filter') || 'Filter'}
              </button>
              
              {isAuthenticated && (
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                  <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                  {t('recommendations.preferences') || 'Preferences'}
                </button>
              )}
            </div>
          </div>

          {/* Section Navigation */}
          <div className="mt-8">
            <nav className="flex space-x-8">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeSection === section.id
                      ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.category') || 'Category'}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">{t('common.all') || 'All Categories'}</option>
                  <option value="techno">Techno</option>
                  <option value="melodic-techno">Melodic Techno</option>
                  <option value="afro-house">Afro House</option>
                  <option value="organic-house">Organic House</option>
                  <option value="concert">Concert</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.priceRange') || 'Price Range'}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">{t('common.all') || 'All Prices'}</option>
                  <option value="free">Free</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100+">$100+</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.date') || 'Date'}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">{t('common.all') || 'All Dates'}</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.location') || 'Location'}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">{t('common.all') || 'All Locations'}</option>
                  <option value="cairo">Cairo</option>
                  <option value="alexandria">Alexandria</option>
                  <option value="giza">Giza</option>
                  <option value="sharm-el-sheikh">Sharm El Sheikh</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Section Info */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            {getCurrentSection().icon}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getCurrentSection().title}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {getCurrentSection().description}
          </p>
        </div>

        {/* Recommendations Grid */}
        <div className="space-y-8">
          {activeSection === 'all' ? (
            <>
              {/* Personalized Recommendations */}
              <RecommendationsSection
                type="personalized"
                limit={6}
                showTitle={true}
                className="mb-8"
              />

              {/* Trending Recommendations */}
              <RecommendationsSection
                type="trending"
                limit={6}
                showTitle={true}
                className="mb-8"
              />

              {/* For You Recommendations */}
              {isAuthenticated && (
                <RecommendationsSection
                  type="for-you"
                  limit={6}
                  showTitle={true}
                  className="mb-8"
                />
              )}
            </>
          ) : (
            <RecommendationsSection
              type={activeSection}
              limit={12}
              showTitle={false}
            />
          )}
        </div>

        {/* AI Insights Section */}
        {isAuthenticated && (
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-8">
            <div className="text-center">
              <SparklesIcon className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('recommendations.aiInsights.title') || 'How AI Works'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                {t('recommendations.aiInsights.description') || 'Our AI analyzes your preferences, past events, and similar users to provide personalized recommendations that match your interests.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <HeartIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {t('recommendations.aiInsights.preferences.title') || 'Your Preferences'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('recommendations.aiInsights.preferences.description') || 'Based on your event history and wishlist'}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {t('recommendations.aiInsights.trending.title') || 'Trending Events'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('recommendations.aiInsights.trending.description') || 'Popular events gaining momentum'}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {t('recommendations.aiInsights.similar.title') || 'Similar Users'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('recommendations.aiInsights.similar.description') || 'Events liked by users with similar tastes'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;

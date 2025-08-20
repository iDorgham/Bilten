import React, { useState } from 'react';
import { ArrowPathIcon, SparklesIcon, ArrowTrendingUpIcon, HeartIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useRecommendations, useTrendingEvents, useForYouRecommendations } from '../hooks/useRecommendations';
import RecommendationCard from './RecommendationCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const RecommendationsSection = ({ 
  type = 'personalized', 
  limit = 8, 
  showTitle = true, 
  showRefresh = true,
  className = '' 
}) => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(type);

  // Hooks for different recommendation types
  const {
    recommendations: personalizedRecommendations,
    loading: personalizedLoading,
    error: personalizedError,
    refreshRecommendations
  } = useRecommendations({ limit });

  const {
    trendingEvents,
    loading: trendingLoading,
    error: trendingError,
    refresh: refreshTrending
  } = useTrendingEvents(limit);

  const {
    forYouEvents,
    loading: forYouLoading,
    error: forYouError,
    refresh: refreshForYou
  } = useForYouRecommendations(limit);

  const getCurrentData = () => {
    switch (activeTab) {
      case 'personalized':
        return {
          events: personalizedRecommendations,
          loading: personalizedLoading,
          error: personalizedError,
          refresh: refreshRecommendations
        };
      case 'trending':
        return {
          events: trendingEvents,
          loading: trendingLoading,
          error: trendingError,
          refresh: refreshTrending
        };
      case 'for-you':
        return {
          events: forYouEvents,
          loading: forYouLoading,
          error: forYouError,
          refresh: refreshForYou
        };
      default:
        return {
          events: personalizedRecommendations,
          loading: personalizedLoading,
          error: personalizedError,
          refresh: refreshRecommendations
        };
    }
  };

  const { events, loading, error, refresh } = getCurrentData();

  const getTabIcon = (tabType) => {
    switch (tabType) {
      case 'personalized':
        return <SparklesIcon className="w-5 h-5" />;
      case 'trending':
        return <ArrowTrendingUpIcon className="w-5 h-5" />;
      case 'for-you':
        return <HeartIcon className="w-5 h-5" />;
      default:
        return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getTabTitle = (tabType) => {
    switch (tabType) {
      case 'personalized':
        return t('recommendations.personalized.title') || 'Personalized for You';
      case 'trending':
        return t('recommendations.trending.title') || 'Trending Now';
      case 'for-you':
        return t('recommendations.forYou.title') || 'Curated for You';
      default:
        return t('recommendations.title') || 'Recommended Events';
    }
  };

  const getTabDescription = (tabType) => {
    switch (tabType) {
      case 'personalized':
        return t('recommendations.personalized.description') || 'Events tailored to your preferences and behavior';
      case 'trending':
        return t('recommendations.trending.description') || 'Events that are gaining popularity right now';
      case 'for-you':
        return t('recommendations.forYou.description') || 'Hand-picked events we think you\'ll love';
      default:
        return t('recommendations.description') || 'Discover amazing events just for you';
    }
  };

  const handleWishlistToggle = (eventId) => {
    // This would typically update the wishlist state
    console.log('Toggle wishlist for event:', eventId);
  };

  if (!isAuthenticated && type === 'personalized') {
    return (
      <div className={`bg-gray-50 dark:bg-gray-900 rounded-xl p-8 text-center ${className}`}>
        <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('recommendations.loginRequired.title') || 'Sign in for Personalized Recommendations'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('recommendations.loginRequired.description') || 'Create an account to get personalized event recommendations based on your interests and behavior.'}
        </p>
        <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
          {t('auth.signin') || 'Sign In'}
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getTabIcon(activeTab)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getTabTitle(activeTab)}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {getTabDescription(activeTab)}
                </p>
              </div>
            </div>
            
            {showRefresh && (
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                title={t('common.refresh') || 'Refresh'}
              >
                <ArrowPathIcon className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* Tab Navigation for Multiple Types */}
          {type === 'all' && (
            <div className="flex space-x-1 mt-4">
              {[
                { key: 'personalized', label: t('recommendations.tabs.personalized') || 'Personalized' },
                { key: 'trending', label: t('recommendations.tabs.trending') || 'Trending' },
                { key: 'for-you', label: t('recommendations.tabs.forYou') || 'For You' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.key
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(limit)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-t-xl"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-b-xl"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('recommendations.error.title') || 'Unable to Load Recommendations'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={refresh}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
                              <ArrowPathIcon className="w-4 h-4 mr-2" />
              {t('common.tryAgain') || 'Try Again'}
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <MapPinIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('recommendations.empty.title') || 'No Recommendations Available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('recommendations.empty.description') || 'Check back later for personalized event recommendations.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
              <RecommendationCard
                key={event.id}
                event={event}
                onWishlistToggle={handleWishlistToggle}
                showConfidence={activeTab === 'personalized' || activeTab === 'for-you'}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        {events.length > 0 && (
          <div className="mt-8 text-center">
            <button className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
              {t('recommendations.viewAll') || 'View All Recommendations'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsSection;

import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, ShareIcon, CalendarIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useRecommendationTracking } from '../hooks/useRecommendations';
import { useLanguage } from '../context/LanguageContext';

const RecommendationCard = ({ event, onWishlistToggle, isWishlisted = false, showConfidence = true }) => {
  const { t } = useLanguage();
  const { trackEventClick, trackEventWishlist, trackEventShare } = useRecommendationTracking();

  const handleEventClick = () => {
    trackEventClick(event.id, 'recommendation_card');
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    trackEventWishlist(event.id, 'recommendation_card');
    onWishlistToggle?.(event.id);
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    trackEventShare(event.id, 'recommendation_card');
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: `${window.location.origin}/events/${event.id}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    if (confidence >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'High Match';
    if (confidence >= 0.6) return 'Good Match';
    if (confidence >= 0.4) return 'Fair Match';
    return 'Low Match';
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Confidence Indicator */}
      {showConfidence && event.confidence && (
        <div className="absolute top-3 left-3 z-10">
          <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getConfidenceColor(event.confidence)}`}>
            {getConfidenceText(event.confidence)}
          </div>
        </div>
      )}

      {/* Recommendation Type Badge */}
      {event.typeLabel && (
        <div className="absolute top-3 right-3 z-10">
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
            {event.typeLabel}
          </div>
        </div>
      )}

      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image_url || '/images/default-event.jpg'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '/images/default-event.jpg';
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <button
            onClick={handleWishlistToggle}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-200"
          >
            {isWishlisted ? (
              <HeartSolidIcon className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-200"
          >
            <ShareIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Event Content */}
      <div className="p-4">
        {/* Category */}
        {event.category && (
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {event.category}
            </span>
          </div>
        )}

        {/* Title */}
        <Link
          to={`/events/${event.id}`}
          onClick={handleEventClick}
          className="block mb-2"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
            {event.title}
          </h3>
        </Link>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Event Details */}
        <div className="space-y-2">
          {/* Date */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>{event.formattedDate}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="w-4 h-4 mr-2" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              <span className="font-medium text-green-600 dark:text-green-400">
                {event.formattedPrice}
              </span>
            </div>

            {/* Confidence Score */}
            {showConfidence && event.confidence && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(event.confidence * 100)}% match
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View Details Button */}
        <Link
          to={`/events/${event.id}`}
          onClick={handleEventClick}
          className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          {t('common.view')} {t('common.details')}
        </Link>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 border-2 border-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default RecommendationCard;

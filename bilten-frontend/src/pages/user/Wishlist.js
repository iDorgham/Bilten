import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../hooks/useWishlist';
import WishlistButton from '../../components/WishlistButton';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  UserIcon,
  HeartIcon 
} from '@heroicons/react/24/outline';

const Wishlist = () => {
  const { isAuthenticated, user } = useAuth();
  const { 
    wishlist, 
    loading, 
    error, 
    fetchWishlist, 
    isWishlisted, 
    toggleWishlist 
  } = useWishlist();
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist(1);
    }
  }, [isAuthenticated]);

  const loadWishlist = async (page = 1) => {
    const result = await fetchWishlist(page, 12);
    if (result.success) {
      setPagination(result.data.pagination);
      setCurrentPage(page);
    }
  };

  const handlePageChange = (page) => {
    loadWishlist(page);
  };

  // Function to get placeholder image based on event category
  const getPlaceholderImage = (category) => {
    const placeholders = {
      technology: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
      business: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop',
      arts: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      sports: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop',
      education: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop',
      networking: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=300&fit=crop',
      default: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop'
    };
    return placeholders[category] || placeholders.default;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view your wishlist</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Save events you're interested in and access them anytime.
          </p>
          <Link
            to="/login"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading && wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => loadWishlist(currentPage)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="py-24 text-center">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-white">My Favorites</h1>
        <p className="text-gray-600 dark:text-white mt-1">
          {wishlist.length > 0 
            ? `${pagination?.total || wishlist.length} saved event${(pagination?.total || wishlist.length) !== 1 ? 's' : ''}`
            : 'Events you save will appear here'
          }
        </p>
      </div>

      {/* Empty State */}
      {wishlist.length === 0 && !loading ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💖</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No saved events yet
          </h2>
          <p className="text-gray-500 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Start exploring events and click the heart icon to save events you're interested in.
          </p>
          <Link
            to="/events"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <>
          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {wishlist.map((event) => (
              <div key={event.id} className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 overflow-hidden hover:shadow-lg hover:bg-white/80 dark:hover:bg-blue-600/90 transition-all duration-200">
                {/* Event Image */}
                <div className="relative aspect-[16/9] bg-gray-100">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getPlaceholderImage(event.category);
                      }}
                    />
                  ) : (
                    <img
                      src={getPlaceholderImage(event.category)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Wishlist Button */}
                  <div className="absolute top-3 left-3">
                    <WishlistButton
                      eventId={event.id}
                      isWishlisted={isWishlisted(event.id)}
                      onToggle={toggleWishlist}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200 mb-4">
                    {/* Date */}
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-5 h-5 mr-2 text-primary-600 dark:text-blue-300" />
                      <span className="font-medium">
                        {new Date(event.start_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {/* Venue */}
                    <div className="flex items-center">
                      <MapPinIcon className="w-5 h-5 mr-2 text-primary-600 dark:text-blue-300" />
                      <span className="truncate">{event.venue_name}</span>
                    </div>
                    {/* Organizer */}
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-primary-600 dark:text-blue-300" />
                      <span className="truncate">
                        {event.organizer_first_name} {event.organizer_last_name}
                      </span>
                    </div>
                  </div>
                  
                  <button className="w-full border border-blue-500 text-blue-600 dark:border-white dark:text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    page === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Wishlist;
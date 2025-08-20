import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBasket } from '../../hooks/useBasket';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  UserIcon,
  TrashIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Pasket = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { 
    basketItems, 
    loading, 
    error, 
    removeFromBasket, 
    updateQuantity, 
    getTotalPrice, 
    clearBasket 
  } = useBasket();
  const [isClearing, setIsClearing] = useState(false);

  const handleCheckout = () => {
    if (basketItems.length === 0) return;
    
    // Prepare checkout data
    const checkoutData = {
      eventId: basketItems[0].event.id, // For single event checkout
      tickets: basketItems.map(item => ({
        ticketId: item.ticket_type_id || item.id,
        quantity: item.quantity,
        price: item.price_per_ticket
      }))
    };
    
    navigate('/checkout', { state: { checkoutData } });
  };

  const handleClearBasket = async () => {
    setIsClearing(true);
    try {
      await clearBasket();
    } catch (err) {
      console.error('Error clearing basket:', err);
    } finally {
      setIsClearing(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6 animate-bounce">🛒</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view your pasket
          </h1>
          <p className="text-gray-600 dark:text-gray-200 mb-8 text-lg">
            Add events to your pasket and complete your purchase with our secure checkout.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 bg-white/10 dark:bg-white/20 backdrop-blur-md border border-white/20 dark:border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 dark:hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-white mx-auto mb-6"></div>
          <p className="text-gray-600 dark:text-white text-lg font-medium">Loading your pasket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8">
            <p className="text-red-800 dark:text-red-200 mb-6 text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="py-16 text-center">
          <div className="flex items-center justify-center mb-6">
            <ShoppingBagIcon className="w-12 h-12 text-blue-600 dark:text-white mr-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              My Pasket
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-200 text-lg">
            {basketItems.length > 0 
              ? `${basketItems.length} item${basketItems.length !== 1 ? 's' : ''} in your pasket`
              : 'Your pasket is empty'
            }
          </p>
        </div>

        {/* Empty State */}
        {basketItems.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-8 animate-pulse">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Your pasket is empty
            </h2>
            <p className="text-gray-500 dark:text-gray-300 mb-8 max-w-md mx-auto text-lg">
              Start exploring events and add tickets to your pasket to get started.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center px-8 py-4 bg-white/10 dark:bg-white/20 backdrop-blur-md border border-white/20 dark:border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 dark:hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {basketItems.map((item) => (
                  <div key={item.id} className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 overflow-hidden hover:shadow-2xl hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="flex">
                      {/* Event Image */}
                      <div className="relative w-40 h-32 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        {item.event.cover_image_url ? (
                          <img
                            src={item.event.cover_image_url}
                            alt={item.event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = getPlaceholderImage(item.event.category);
                            }}
                          />
                        ) : (
                          <img
                            src={getPlaceholderImage(item.event.category)}
                            alt={item.event.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                            {item.event.title}
                          </h3>
                          <button
                            onClick={() => removeFromBasket(item.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200 mb-4">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-3 text-blue-600 dark:text-blue-300" />
                            <span className="font-medium">
                              {new Date(item.event.start_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-3 text-blue-600 dark:text-blue-300" />
                            <span className="truncate font-medium">{item.event.venue_name}</span>
                          </div>
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-3 text-blue-600 dark:text-blue-300" />
                            <span className="truncate font-medium">
                              {item.event.organizer_first_name} {item.event.organizer_last_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Qty:</span>
                              <div className="flex items-center bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/20 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/20 transition-colors"
                                >
                                  <MinusIcon className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-white bg-white/30 dark:bg-white/20">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/20 transition-colors"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                              {item.ticket_type}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              ${item.price_per_ticket.toFixed(2)} each
                            </div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              ${item.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear Basket Button */}
              {basketItems.length > 0 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleClearBasket}
                    disabled={isClearing}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors disabled:opacity-50"
                  >
                    {isClearing ? 'Clearing...' : 'Clear All Items'}
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/20 p-8 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <ShoppingBagIcon className="w-7 h-7 mr-3 text-blue-600 dark:text-blue-300" />
                  Order Summary
                </h2>

                <div className="space-y-4 mb-8">
                  {basketItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-200/50 dark:border-white/20 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                          {item.event.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {item.ticket_type} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        ${item.total_price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200/50 dark:border-white/20 pt-6 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={basketItems.length === 0}
                  className="w-full bg-white/10 dark:bg-white/20 backdrop-blur-md border border-white/20 dark:border-white/30 text-white font-bold py-4 px-6 rounded-xl hover:bg-white/20 dark:hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <CreditCardIcon className="w-6 h-6 mr-3" />
                  Proceed to Checkout
                </button>

                <div className="mt-6 text-center">
                  <Link
                    to="/events"
                    className="text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors font-medium"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pasket;

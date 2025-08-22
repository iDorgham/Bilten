import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../hooks/useWishlist';
import { useBasket } from '../hooks/useBasket';
import { useNotifications } from '../hooks/useNotifications';
import {
  ChevronDownIcon,
  Bars3Icon,
  ShoppingCartIcon,
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  LifebuoyIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  TicketIcon,
  ClockIcon,
  HeartIcon,
  CreditCardIcon,
  Squares2X2Icon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  LockClosedIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  BuildingOffice2Icon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import MobileMenu from './MobileMenu';
import SocialButton from './SocialButton';

const Navbar = () => {
  const { user, logout, isAuthenticated, isOrganizer } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const basketRef = useRef(null);
  const notificationsRef = useRef(null);
  const { wishlist, fetchWishlist } = useWishlist();
  const { basketItems, getTotalItems, removeFromBasket, updateQuantity } = useBasket();
  const { notifications, getUnreadCount, getRecentNotifications, markAsRead, deleteNotification } = useNotifications();
  const [isBasketDropdownOpen, setIsBasketDropdownOpen] = useState(false);
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  const handleSocialLogin = async (provider) => {
    try {
      // TODO: Implement actual social login logic
      console.log(`Logging in with ${provider}`);
      
      // For now, just simulate a delay and navigate to login page
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to login page (replace with actual social login logic)
      navigate('/login');
      setIsDropdownOpen(false);
    } catch (error) {
      console.error(`Failed to sign in with ${provider}:`, error);
    }
  };

  // Handle scroll events for floating header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (basketRef.current && !basketRef.current.contains(event.target)) {
        setIsBasketDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard events for notifications panel
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isNotificationsPanelOpen) {
        setIsNotificationsPanelOpen(false);
      }
    };

    if (isNotificationsPanelOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isNotificationsPanelOpen]);

  // Load wishlist for badge count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  // Add padding to body to account for fixed header
  useEffect(() => {
    document.body.style.paddingTop = '48px'; // 12 * 4 = 48px (h-12)
    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, []);

  // Check if a navigation link is active
  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'G';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  // Get role display name
  const getRoleDisplayName = () => {
    if (!user) return t('user.guest');
    switch (user.role) {
      case 'admin':
        return t('user.platformAdmin');
      case 'organizer':
        return t('user.eventOrganizer');
      case 'user':
        return t('user.customer');
      default:
        return t('user.user');
    }
  };

  // Format timestamp for notifications
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return t('common.justNow');
    if (minutes < 60) return `${minutes}${t('common.minutesAgo')}`;
    if (hours < 24) return `${hours}${t('common.hoursAgo')}`;
    if (days < 7) return `${days}${t('common.daysAgo')}`;
    return timestamp.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_reminder':
        return <CalendarIcon className="h-4 w-4 text-blue-500" />;
      case 'ticket_purchase':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'event_update':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'payment_success':
        return <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />;
      case 'event_cancelled':
        return <ExclamationTriangleIcon className="h-4 w-4 text-blue-500" />;
      case 'welcome':
        return <BellIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <BellIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  // Role-based menu items
  const getMenuItems = () => {
    if (!isAuthenticated) {
      return [
        { label: t('menu.signIn'), icon: ArrowRightOnRectangleIcon, action: () => navigate('/login') },
        { label: t('menu.signUp'), icon: UserPlusIcon, action: () => navigate('/register') },
      ];
    }

         const commonItems = [
       { label: t('menu.myPasket'), icon: ShoppingCartIcon, action: () => navigate('/pasket') },
       { type: 'divider' },
      { label: t('menu.myProfile'), icon: UserIcon, action: () => navigate('/profile') },
      { label: t('menu.accountSettings'), icon: Cog6ToothIcon, action: () => navigate('/settings') },
      { label: t('menu.notificationPreferences'), icon: BellIcon, action: () => navigate('/notifications') },
      { type: 'divider' },
      { label: t('menu.faq'), icon: QuestionMarkCircleIcon, action: () => navigate('/faq') },
      { label: t('menu.qa'), icon: QuestionMarkCircleIcon, action: () => navigate('/qa') },
      { label: t('menu.helpSupport'), icon: LifebuoyIcon, action: () => navigate('/help') },
      { type: 'divider' },
      { label: t('menu.logout'), icon: ArrowRightOnRectangleIcon, action: handleLogout },
    ];

    switch (user?.role) {
      case 'admin':
        // Admin users get the same menu as regular users (no admin features in main navbar)
        // Admin features are accessible through the dedicated admin interface
        return [
          { label: t('menu.myTickets'), icon: TicketIcon, action: () => navigate('/my-tickets') },
          { label: t('menu.orderHistory'), icon: ClockIcon, action: () => navigate('/orders') },
          { label: t('menu.favoriteEvents'), icon: HeartIcon, action: () => navigate('/favorites') },
          { label: t('menu.paymentMethods'), icon: CreditCardIcon, action: () => navigate('/payment-methods') },
          { type: 'divider' },
          { label: 'Admin Panel', icon: ShieldCheckIcon, action: () => navigate('/admin/dashboard'), highlight: true },
          ...commonItems,
        ];

      case 'organizer':
        return [
          { label: t('menu.dashboard'), icon: Squares2X2Icon, action: () => navigate('/organizer/dashboard') },
          { label: t('menu.eventsManagement'), icon: ClipboardDocumentListIcon, action: () => navigate('/organizer/events') },
          { label: t('menu.createEvent'), icon: PlusCircleIcon, action: () => navigate('/create-event') },
          { label: t('menu.ticketManagement'), icon: TicketIcon, action: () => navigate('/organizer/events/1/tickets') },
          { label: t('menu.organization'), icon: BuildingOffice2Icon, action: () => navigate('/organizer/organization') },
          { label: t('menu.financial'), icon: BanknotesIcon, action: () => navigate('/organizer/financial') },
          { label: t('menu.analyticsInsights'), icon: ChartBarIcon, action: () => navigate('/organizer/analytics') },
          { label: t('menu.realTimeAnalytics'), icon: ChartBarIcon, action: () => navigate('/analytics/realtime') },
          { label: t('menu.dataExport'), icon: DocumentArrowDownIcon, action: () => navigate('/export') },
          { label: t('menu.marketing'), icon: MegaphoneIcon, action: () => navigate('/organizer/marketing') },
          { label: t('menu.customerSupport'), icon: LifebuoyIcon, action: () => navigate('/organizer/support') },
          ...commonItems,
        ];

      case 'user':
      default:
        return [
          { label: t('menu.myTickets'), icon: TicketIcon, action: () => navigate('/my-tickets') },
          { label: t('menu.orderHistory'), icon: ClockIcon, action: () => navigate('/orders') },
          { label: t('menu.favoriteEvents'), icon: HeartIcon, action: () => navigate('/favorites') },
          { label: t('menu.paymentMethods'), icon: CreditCardIcon, action: () => navigate('/payment-methods') },
          ...commonItems,
        ];
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInFromRight {
            0% {
              opacity: 0;
              transform: translateX(100%);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes fadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.95);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
          : 'bg-white dark:bg-gray-900/90 backdrop-blur-sm shadow-lg'
      }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 relative">
              <h1 className="text-xl brand-bilten text-primary-600 dark:text-primary-400">Bilten</h1>
              <div 
                className={`absolute -bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-300 ease-in-out ${
                  isActiveLink('/') ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              ></div>
            </Link>
          </div>

          {/* Centered Main Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-6 main-navigation">
            <Link
              to="/events"
              className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isActiveLink('/events')
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-white hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              {t('nav.events')}
              <div 
                className={`absolute -bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-300 ease-in-out ${
                  isActiveLink('/events') ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              ></div>
            </Link>
            <Link
              to="/news"
              className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isActiveLink('/news')
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-white hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              {t('nav.news')}
              <div 
                className={`absolute -bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-300 ease-in-out ${
                  isActiveLink('/news') ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              ></div>
            </Link>

            <Link
              to="/help"
              className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isActiveLink('/help')
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-white hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              {t('nav.help')}
              <div 
                className={`absolute -bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-300 ease-in-out ${
                  isActiveLink('/help') ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              ></div>
            </Link>
          </div>

          {/* Mobile menu button, Theme Toggle, Basket, and Avatar Dropdown */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse rtl:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* Notifications icon with dropdown - Only show for authenticated users (LTR position) */}
            {isAuthenticated && (
              <div className="relative block rtl:hidden" ref={notificationsRef}>
                <button
                  onMouseEnter={() => setIsNotificationsDropdownOpen(true)}
                  onMouseLeave={() => setIsNotificationsDropdownOpen(false)}
                  onClick={() => {
                    if (isCartPanelOpen) {
                      setIsCartPanelOpen(false);
                    }
                    setIsNotificationsPanelOpen(!isNotificationsPanelOpen);
                  }}
                  className="relative p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                  title={t('nav.notifications')}
                >
                  <BellIcon className="w-5 h-5" />
                  {getUnreadCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] leading-none rounded-full px-1 py-0.5 min-w-[16px] text-center">
                      {Math.min(getUnreadCount(), 99)}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 focus:outline-none z-50 notifications-dropdown-rtl"
                    onMouseEnter={() => setIsNotificationsDropdownOpen(true)}
                    onMouseLeave={() => setIsNotificationsDropdownOpen(false)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('nav.notifications')}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getUnreadCount()} {getUnreadCount() !== 1 ? t('nav.unreadNotifications') : t('nav.unreadNotification')}
                        </span>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="text-center py-6">
                          <BellIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.noNotifications')}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {getRecentNotifications(3).map((notification) => (
                            <div key={notification.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                              {/* Notification Icon */}
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>

                              {/* Notification Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col items-end space-y-1">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    title={t('nav.markAsRead')}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                  title={t('nav.deleteNotification')}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {notifications.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => navigate('/notifications')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                          >
                            {t('nav.viewAllNotifications')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Basket icon with dropdown - Only show for authenticated users (LTR position) */}
            {isAuthenticated && (
              <div className="relative block rtl:hidden" ref={basketRef}>
                <button
                  onMouseEnter={() => setIsBasketDropdownOpen(true)}
                  onMouseLeave={() => setIsBasketDropdownOpen(false)}
                  onClick={() => {
                    if (isNotificationsPanelOpen) {
                      setIsNotificationsPanelOpen(false);
                    }
                    setIsCartPanelOpen(!isCartPanelOpen);
                  }}
                  className="relative p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                  title={t('nav.basket')}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[9px] leading-none rounded-full px-1 py-0.5 min-w-[16px] text-center">
                      {Math.min(getTotalItems(), 99)}
                    </span>
                  )}
                </button>

                {/* Basket Dropdown */}
                {isBasketDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 focus:outline-none z-50 basket-dropdown-rtl"
                    onMouseEnter={() => setIsBasketDropdownOpen(true)}
                    onMouseLeave={() => setIsBasketDropdownOpen(false)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('nav.basket')}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getTotalItems()} {getTotalItems() !== 1 ? t('nav.basketItemsPlural') : t('nav.basketItems')}
                        </span>
                      </div>

                      {basketItems.length === 0 ? (
                        <div className="text-center py-6">
                          <ShoppingCartIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.basketEmpty')}</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {basketItems.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                              {/* Event Image */}
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-md flex-shrink-0 overflow-hidden">
                                <img
                                  src={item.event.cover_image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop'}
                                  alt={item.event.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop';
                                  }}
                                />
                              </div>

                              {/* Event Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.event.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.ticket_type} • {t('nav.quantity')}: {item.quantity}
                                </p>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  ${item.total_price.toFixed(2)}
                                </p>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromBasket(item.id);
                                }}
                                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                title={t('nav.removeFromBasket')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}

                          {basketItems.length > 3 && (
                            <div className="text-center py-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                +{basketItems.length - 3} {basketItems.length - 3 !== 1 ? t('nav.moreItemsPlural') : t('nav.moreItems')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {basketItems.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{t('nav.total')}</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              ${basketItems.reduce((total, item) => total + item.total_price, 0).toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={() => navigate('/pasket')}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                          >
                            {t('nav.viewBasket')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => !isAuthenticated ? null : setIsDropdownOpen(!isDropdownOpen)}
                onMouseEnter={() => !isAuthenticated ? setIsDropdownOpen(true) : null}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md p-1.5 transition-colors"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {/* Avatar */}
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span>{getUserInitials()}</span>
                  )}
                </div>
                
                {/* Role Badge and Name */}
                <div className="hidden md:block text-left">
                  <div className="text-[10px] text-gray-500 dark:text-white/80">{getRoleDisplayName()}</div>
                  {isAuthenticated && (
                    <div className="text-xs font-medium">{user.firstName}</div>
                  )}
                </div>
                
                {/* Dropdown Arrow */}
                <ChevronDownIcon
                  className={`w-3 h-3 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 focus:outline-none z-50 dropdown-menu-rtl"
                  onMouseEnter={() => !isAuthenticated ? setIsDropdownOpen(true) : null}
                  onMouseLeave={() => !isAuthenticated ? setIsDropdownOpen(false) : null}
                >
                  <div className="py-0.5" role="menu" aria-orientation="vertical">
                    {isAuthenticated ? (
                      <>
                        {/* User Info Header */}
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {user?.profileImageUrl ? (
                                <img
                                  src={user.profileImageUrl}
                                  alt="Profile"
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span>{getUserInitials()}</span>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">{getRoleDisplayName()}</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        {getMenuItems().map((item, index) => {
                          if (item.type === 'divider') {
                            return (
                              <div key={index} className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
                            );
                          }

                          return (
                            <button
                              key={index}
                              onClick={item.action}
                              className={`flex items-center gap-2.5 w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                item.highlight 
                                  ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium' 
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }`}
                              role="menuitem"
                            >
                              {item.icon && <item.icon className={`w-4 h-4 ${
                                item.highlight 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-400 dark:text-gray-500'
                              }`} />}
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {/* Social Login Header */}
                        <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {t('social.signInToBilten')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('social.chooseLoginMethod')}
                            </div>
                          </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="p-3 space-y-2">
                          <SocialButton
                            social="google"
                            onClick={() => handleSocialLogin('google')}
                            className="text-sm"
                          >
                            {t('social.continueWithGoogle')}
                          </SocialButton>
                          
                          <SocialButton
                            social="facebook"
                            onClick={() => handleSocialLogin('facebook')}
                            className="text-sm"
                          >
                            {t('social.continueWithFacebook')}
                          </SocialButton>
                          
                          <SocialButton
                            social="apple"
                            onClick={() => handleSocialLogin('apple')}
                            className="text-sm"
                          >
                            {t('social.continueWithApple')}
                          </SocialButton>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                        {/* Alternative Login Options */}
                        <div className="p-3">
                          <button
                            onClick={() => {
                              navigate('/login');
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-center text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            {t('social.orSignInWithEmail')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications icon with dropdown - Only show for authenticated users (RTL position) */}
            {isAuthenticated && (
              <div className="relative hidden rtl:block" ref={notificationsRef}>
                <button
                  onMouseEnter={() => setIsNotificationsDropdownOpen(true)}
                  onMouseLeave={() => setIsNotificationsDropdownOpen(false)}
                  onClick={() => {
                    if (isCartPanelOpen) {
                      setIsCartPanelOpen(false);
                    }
                    setIsNotificationsPanelOpen(!isNotificationsPanelOpen);
                  }}
                  className="relative p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                  title={t('nav.notifications')}
                >
                  <BellIcon className="w-5 h-5" />
                  {getUnreadCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] leading-none rounded-full px-1 py-0.5 min-w-[16px] text-center">
                      {Math.min(getUnreadCount(), 99)}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 focus:outline-none z-50 notifications-dropdown-rtl"
                    onMouseEnter={() => setIsNotificationsDropdownOpen(true)}
                    onMouseLeave={() => setIsNotificationsDropdownOpen(false)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('nav.notifications')}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getUnreadCount()} {getUnreadCount() !== 1 ? t('nav.unreadNotifications') : t('nav.unreadNotification')}
                        </span>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="text-center py-6">
                          <BellIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.noNotifications')}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {getRecentNotifications(3).map((notification) => (
                            <div key={notification.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                              {/* Notification Icon */}
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>

                              {/* Notification Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col items-end space-y-1">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    title={t('nav.markAsRead')}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                  title={t('nav.deleteNotification')}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {notifications.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => navigate('/notifications')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                          >
                            {t('nav.viewAllNotifications')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Basket icon with dropdown - Only show for authenticated users (RTL position) */}
            {isAuthenticated && (
              <div className="relative hidden rtl:block" ref={basketRef}>
                <button
                  onMouseEnter={() => setIsBasketDropdownOpen(true)}
                  onMouseLeave={() => setIsBasketDropdownOpen(false)}
                  onClick={() => {
                    if (isNotificationsPanelOpen) {
                      setIsNotificationsPanelOpen(false);
                    }
                    setIsCartPanelOpen(!isCartPanelOpen);
                  }}
                  className="relative p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                  title={t('nav.basket')}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[9px] leading-none rounded-full px-1 py-0.5 min-w-[16px] text-center">
                      {Math.min(getTotalItems(), 99)}
                    </span>
                  )}
                </button>

                {/* Basket Dropdown */}
                {isBasketDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10 focus:outline-none z-50 basket-dropdown-rtl"
                    onMouseEnter={() => setIsBasketDropdownOpen(true)}
                    onMouseLeave={() => setIsBasketDropdownOpen(false)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('nav.basket')}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getTotalItems()} {getTotalItems() !== 1 ? t('nav.basketItemsPlural') : t('nav.basketItems')}
                        </span>
                      </div>

                      {basketItems.length === 0 ? (
                        <div className="text-center py-6">
                          <ShoppingCartIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.basketEmpty')}</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {basketItems.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                              {/* Event Image */}
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-md flex-shrink-0 overflow-hidden">
                                <img
                                  src={item.event.cover_image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop'}
                                  alt={item.event.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop';
                                  }}
                                />
                              </div>

                              {/* Event Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.event.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.ticket_type} • {t('nav.quantity')}: {item.quantity}
                                </p>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  ${item.total_price.toFixed(2)}
                                </p>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromBasket(item.id);
                                }}
                                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                title={t('nav.removeFromBasket')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}

                          {basketItems.length > 3 && (
                            <div className="text-center py-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                +{basketItems.length - 3} {basketItems.length - 3 !== 1 ? t('nav.moreItemsPlural') : t('nav.moreItems')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {basketItems.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => navigate('/pasket')}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                          >
                            {t('nav.viewBasket')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        isOrganizer={isOrganizer}
      />

      {/* Sliding Notifications Panel */}
      {isNotificationsPanelOpen && (
        <>
                              {/* Backdrop */}
          <div
            className="fixed top-16 right-0 rtl:left-0 rtl:right-auto w-80 max-w-[85vw] h-[calc(100vh-8rem)] bg-black/20 z-40"
            onClick={() => setIsNotificationsPanelOpen(false)}
          />

          {/* Sliding Panel */}
          <div className={`fixed top-16 right-0 rtl:left-0 rtl:right-auto h-[calc(100vh-8rem)] w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out rounded-l-lg rtl:rounded-l-none rtl:rounded-r-lg ${
            isNotificationsPanelOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
          }`}>
            {/* Panel Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <BellIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('nav.notifications')}
                </h2>
                {getUnreadCount() > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {getUnreadCount()}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsNotificationsPanelOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('nav.noNotifications')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    You're all caught up! No notifications at the moment.
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-3 pb-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`bg-white dark:bg-gray-800 rounded-lg border-l-4 shadow-sm ${
                        !notification.read 
                          ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                          : 'border-l-gray-300 dark:border-l-gray-600'
                      }`}
                    >
                      <div className="p-3">
                        {/* Header with Icon and Title */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                          </div>
                          {notification.important && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              Important
                            </span>
                          )}
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {notification.message}
                        </p>
                        
                        {/* Event Details Card */}
                        {notification.eventId && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {notification.eventTitle}
                              </h5>
                              <Link
                                to={`/events/${notification.eventId}`}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View Event
                              </Link>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                <CalendarIcon className="h-3 w-3 mr-2" />
                                <span>{new Date(notification.eventDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                <svg className="h-3 w-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{notification.eventLocation}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Footer with Timestamp and Actions */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-red-500 dark:text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* View All Notifications Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsNotificationsPanelOpen(false);
                        navigate('/notifications');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {getUnreadCount()} unread notifications
                  </span>
                  <button
                    onClick={() => {
                      notifications.forEach(n => !n.read && markAsRead(n.id));
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Sliding Cart Panel */}
      {isCartPanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed top-16 right-0 rtl:left-0 rtl:right-auto w-80 max-w-[85vw] h-[calc(100vh-8rem)] bg-black/20 z-40 transition-all duration-500 ease-out ${
              isCartPanelOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setIsCartPanelOpen(false)}
          />

          {/* Sliding Panel */}
          <div className={`fixed top-16 right-0 rtl:left-0 rtl:right-auto h-[calc(100vh-8rem)] w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-all duration-500 ease-out rounded-l-lg rtl:rounded-l-none rtl:rounded-r-lg ${
            isCartPanelOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full rtl:-translate-x-full opacity-0 scale-95'
          }`}>
            {/* Panel Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('nav.basket')}
                </h2>
                {getTotalItems() > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {getTotalItems()}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCartPanelOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
              {basketItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCartIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('nav.basketEmpty')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Your basket is empty. Start shopping for amazing events!
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-3 pb-4">
                  {basketItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transform transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: isCartPanelOpen ? 'slideInFromRight 0.5s ease-out forwards' : 'none'
                      }}
                    >
                      <div className="p-3">
                        <div className="flex items-start space-x-3">
                          {/* Event Image */}
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-md flex-shrink-0 overflow-hidden">
                            <img
                              src={item.event.cover_image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop'}
                              alt={item.event.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop';
                              }}
                            />
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              {item.event.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {item.ticket_type} • {t('nav.quantity')}: {item.quantity}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                ${item.total_price.toFixed(2)}
                              </span>
                              <button
                                onClick={() => removeFromBasket(item.id)}
                                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                title={t('nav.removeFromBasket')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel Footer */}
            {basketItems.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 pb-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t('nav.total')}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${basketItems.reduce((total, item) => total + item.total_price, 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCartPanelOpen(false);
                    navigate('/pasket');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  {t('nav.proceedToCheckout')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
    </>
  );
};

export default Navbar;
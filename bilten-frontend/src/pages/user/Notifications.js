import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BellIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read', 'important'
  const [showFilters, setShowFilters] = useState(false);

  // Mock notifications data - in a real app, this would come from an API
  const mockNotifications = [
    {
      id: 1,
      type: 'event_reminder',
      title: 'Event Reminder: Tech Conference 2024',
      message: 'Your event "Tech Conference 2024" starts in 2 hours. Don\'t forget to prepare!',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      important: true,
      eventId: 123,
      eventTitle: 'Tech Conference 2024',
      eventDate: '2024-01-15T14:00:00Z',
      eventLocation: 'San Francisco Convention Center'
    },
    {
      id: 2,
      type: 'ticket_purchase',
      title: 'Ticket Purchase Confirmed',
      message: 'Your ticket for "Music Festival 2024" has been successfully purchased.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      important: false,
      eventId: 456,
      eventTitle: 'Music Festival 2024',
      eventDate: '2024-01-20T18:00:00Z',
      eventLocation: 'Central Park'
    },
    {
      id: 3,
      type: 'event_update',
      title: 'Event Update: Business Workshop',
      message: 'The venue for "Business Workshop" has been changed to Downtown Conference Center.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      read: true,
      important: true,
      eventId: 789,
      eventTitle: 'Business Workshop',
      eventDate: '2024-01-18T10:00:00Z',
      eventLocation: 'Downtown Conference Center'
    },
    {
      id: 4,
      type: 'payment_success',
      title: 'Payment Successful',
      message: 'Your payment of $75.00 for "Art Exhibition" has been processed successfully.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      read: true,
      important: false,
      eventId: 101,
      eventTitle: 'Art Exhibition',
      eventDate: '2024-01-25T19:00:00Z',
      eventLocation: 'Modern Art Gallery'
    },
    {
      id: 5,
      type: 'event_cancelled',
      title: 'Event Cancelled: Sports Tournament',
      message: 'Unfortunately, "Sports Tournament" has been cancelled due to weather conditions.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: false,
      important: true,
      eventId: 202,
      eventTitle: 'Sports Tournament',
      eventDate: '2024-01-22T15:00:00Z',
      eventLocation: 'City Stadium'
    },
    {
      id: 6,
      type: 'welcome',
      title: 'Welcome to Bilten!',
      message: 'Thank you for joining Bilten. Start exploring events and create amazing experiences!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      read: true,
      important: false
    }
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotifications(mockNotifications);
      setError('');
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllRead = () => {
    setNotifications(prev => 
      prev.filter(notification => !notification.read)
    );
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      case 'important':
        return notifications.filter(n => n.important);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_reminder':
        return <CalendarIcon className="h-6 w-6 text-blue-500" />;
      case 'ticket_purchase':
        return <CheckCircleIcon className="h-6 w-6 text-blue-500" />;
      case 'event_update':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      case 'payment_success':
        return <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />;
      case 'event_cancelled':
        return <ExclamationTriangleIcon className="h-6 w-6 text-blue-500" />;
      case 'welcome':
        return <BellIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'event_reminder':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'ticket_purchase':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'event_update':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'payment_success':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'event_cancelled':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'welcome':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Stay updated with your events, tickets, and important updates
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                                  <FunnelIcon className="h-5 w-5 mr-2" />
                Filter
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Mark all as read
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {unreadCount} unread
              </span>
              {notifications.filter(n => n.read).length > 0 && (
                <button
                  onClick={clearAllRead}
                  className="flex items-center px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Clear read
                </button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: notifications.length },
                  { key: 'unread', label: 'Unread', count: unreadCount },
                  { key: 'read', label: 'Read', count: notifications.filter(n => n.read).length },
                  { key: 'important', label: 'Important', count: notifications.filter(n => n.important).length }
                ].map(filterOption => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filterOption.label} ({filterOption.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading notifications...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-800 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchNotifications}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'ring-2 ring-blue-100 dark:ring-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {notification.message}
                          </p>
                          
                          {/* Event Details */}
                          {notification.eventId && (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {notification.eventTitle}
                                </h4>
                                <Link
                                  to={`/events/${notification.eventId}`}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View Event
                                </Link>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-2" />
                                  <span>{formatEventDate(notification.eventDate)}</span>
                                </div>
                                <div className="flex items-center">
                                  <MapPinIcon className="h-4 w-4 mr-2" />
                                  <span>{notification.eventLocation}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <div className="flex items-center space-x-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="flex items-center px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                  title="Mark as read"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="flex items-center px-3 py-1 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Delete notification"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex flex-col items-end space-y-2">
                          {notification.important && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              Important
                            </span>
                          )}
                          {!notification.read && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  No notifications
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {filter === 'all' 
                    ? 'You\'re all caught up! No notifications at the moment.'
                    : `No ${filter} notifications found.`
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    }
  ];

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
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

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const getRecentNotifications = (limit = 5) => {
    return notifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    getUnreadCount,
    getRecentNotifications
  };
};

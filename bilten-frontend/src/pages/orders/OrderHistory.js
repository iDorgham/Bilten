import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/outline';

const OrderHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulated order history data - replace with actual API call
    const mockOrders = [
      {
        id: 'ORD-001',
        eventTitle: 'Summer Music Festival',
        eventDate: '2024-07-15',
        eventTime: '18:00',
        eventLocation: 'Central Park',
        tickets: 2,
        totalAmount: 100,
        status: 'completed',
        orderDate: '2024-06-20',
        paymentMethod: 'Credit Card'
      },
      {
        id: 'ORD-002',
        eventTitle: 'Tech Conference 2024',
        eventDate: '2024-08-20',
        eventTime: '09:00',
        eventLocation: 'Convention Center',
        tickets: 1,
        totalAmount: 150,
        status: 'upcoming',
        orderDate: '2024-07-10',
        paymentMethod: 'PayPal'
      },
      {
        id: 'ORD-003',
        eventTitle: 'Food & Wine Festival',
        eventDate: '2024-05-10',
        eventTime: '12:00',
        eventLocation: 'Downtown Plaza',
        tickets: 3,
        totalAmount: 225,
        status: 'cancelled',
        orderDate: '2024-04-15',
        paymentMethod: 'Credit Card'
      }
    ];

    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'upcoming':
        return <ClockIconSolid className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('Order History')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('View your past and upcoming orders')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('All Orders')}
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                filter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('Upcoming')}
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('Completed')}
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                filter === 'cancelled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('Cancelled')}
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('No orders found')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('You haven\'t placed any orders yet')}
            </p>
            <Link
              to="/events"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              {t('Browse Events')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {order.eventTitle}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('Order ID:')} {order.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {t(order.status.charAt(0).toUpperCase() + order.status.slice(1))}
                      </span>
                      <Link
                        to={`/orders/${order.id}`}
                        className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {t('View Details')}
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {new Date(order.eventDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {order.eventTime}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {order.eventLocation}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <TicketIcon className="h-4 w-4 mr-2" />
                      {order.tickets} {t('ticket(s)')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${order.totalAmount}
                      </span>
                      <span className="ml-2">
                        ({t('via')} {order.paymentMethod})
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('Ordered on')} {new Date(order.orderDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;

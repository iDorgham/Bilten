import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../../services/api';
import { 
  ShoppingBagIcon, 
  CalendarDaysIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  TicketIcon,
  CreditCardIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getOrder(id);
      setOrder(response.data.data.order);
      setItems(response.data.data.items);
      setError('');
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(`Failed to load order details: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: ExclamationTriangleIcon,
      completed: CheckCircleIcon,
      cancelled: XCircleIcon,
      refunded: ExclamationTriangleIcon
    };
    return icons[status] || ExclamationTriangleIcon;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400 mb-4">{error || 'Order not found'}</p>
          <div className="space-x-4">
            <button
              onClick={fetchOrderDetails}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/orders"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/orders"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Details</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Order #{order.order_number}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon className="h-5 w-5 text-gray-400" />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 overflow-hidden">
            <img
              src={order.cover_image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop'}
              alt={order.event_title}
              className="w-full h-64 object-cover"
            />
          </div>

          {/* Event Information */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Event Title</p>
                  <p className="text-gray-600 dark:text-gray-300">{order.event_title}</p>
                </div>
              </div>

              <div className="flex items-start">
                <CalendarDaysIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Event Date & Time</p>
                  <p className="text-gray-600 dark:text-gray-300">{formatEventDate(order.event_start_date)}</p>
                </div>
              </div>

              {order.venue_name && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Venue</p>
                    <p className="text-gray-600 dark:text-gray-300">{order.venue_name}</p>
                    {order.venue_address && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{order.venue_address}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    <TicketIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.ticket_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.ticket_type}</p>
                      {item.ticket_description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.ticket_description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">${item.unit_price} × {item.quantity}</p>
                    <p className="text-lg font-semibold text-primary-600 dark:text-blue-400">${item.total_price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">${order.subtotal}</span>
              </div>
              
              {order.fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Fees:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${order.fees}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-primary-600 dark:text-blue-400">${order.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <ShoppingBagIcon className="h-4 w-4 text-primary-600 dark:text-blue-300 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Order Number:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">{order.order_number}</span>
              </div>

              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 text-primary-600 dark:text-blue-300 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Order Date:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">{formatDate(order.created_at)}</span>
              </div>

              <div className="flex items-center">
                <UserIcon className="h-4 w-4 text-primary-600 dark:text-blue-300 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-2 capitalize">{order.status}</span>
              </div>

              {order.stripe_payment_intent_id && (
                <div className="flex items-center">
                  <CreditCardIcon className="h-4 w-4 text-primary-600 dark:text-blue-300 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Payment ID:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white ml-2 font-mono text-xs">{order.stripe_payment_intent_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
            
            <div className="space-y-3">
              {order.status === 'completed' && (
                <>
                  <Link
                    to="/my-tickets"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center block"
                  >
                    View Tickets
                  </Link>
                  <button className="w-full border border-primary-500 text-primary-600 dark:border-white dark:text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-50 dark:hover:bg-primary-700 transition-colors">
                    Download Receipt
                  </button>
                </>
              )}
              
              {order.status === 'pending' && (
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Continue Payment
                </button>
              )}
              
              <Link
                to={`/events/${order.event_id}`}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center block"
              >
                View Event
              </Link>
              
              <Link
                to="/orders"
                className="w-full border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center block"
              >
                Back to Orders
              </Link>
            </div>
          </div>

          {/* Status Information */}
          {order.status !== 'completed' && (
            <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Information</h3>
              
              <div className="space-y-3">
                {order.status === 'pending' && (
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Payment is pending. Please complete your payment to receive your tickets.
                    </span>
                  </div>
                )}
                
                {order.status === 'cancelled' && (
                  <div className="flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      This order has been cancelled.
                    </span>
                  </div>
                )}
                
                {order.status === 'refunded' && (
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      This order has been refunded.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

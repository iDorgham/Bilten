import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../services/api';
import { 
  TicketIcon, 
  CalendarDaysIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  UserIcon,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getTicketDetails(id);
      setTicket(response.data.data.ticket);
      setError('');
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
      setError(`Failed to load ticket details: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      used: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || colors.active;
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: CheckCircleIcon,
      used: CheckCircleIcon,
      cancelled: XCircleIcon,
      refunded: ExclamationTriangleIcon
    };
    return icons[status] || CheckCircleIcon;
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
          <p className="text-gray-600 dark:text-white">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400 mb-4">{error || 'Ticket not found'}</p>
          <div className="space-x-4">
            <button
              onClick={fetchTicketDetails}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/my-tickets"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to My Tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(ticket.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/my-tickets"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to My Tickets
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ticket Details</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {ticket.event_title}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon className="h-5 w-5 text-gray-400" />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
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
              src={ticket.cover_image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop'}
              alt={ticket.event_title}
              className="w-full h-64 object-cover"
            />
          </div>

          {/* Event Information */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <CalendarDaysIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Event Date & Time</p>
                  <p className="text-gray-600 dark:text-gray-300">{formatEventDate(ticket.event_start_date)}</p>
                </div>
              </div>

              {ticket.venue_name && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Venue</p>
                    <p className="text-gray-600 dark:text-gray-300">{ticket.venue_name}</p>
                    {ticket.venue_address && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{ticket.venue_address}</p>
                    )}
                  </div>
                </div>
              )}

              {ticket.event_description && (
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Event Description</p>
                    <p className="text-gray-600 dark:text-gray-300">{ticket.event_description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Information */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ticket Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <TicketIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Ticket Type</p>
                  <p className="text-gray-600 dark:text-gray-300">{ticket.ticket_type_name}</p>
                </div>
              </div>

              <div className="flex items-center">
                <QrCodeIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Ticket Number</p>
                  <p className="text-gray-600 dark:text-gray-300 font-mono">{ticket.ticket_number}</p>
                </div>
              </div>

              <div className="flex items-center">
                <QrCodeIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">QR Code</p>
                  <p className="text-gray-600 dark:text-gray-300 font-mono text-sm">{ticket.qr_code}</p>
                </div>
              </div>

              {ticket.ticket_type_description && (
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-blue-300 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Ticket Description</p>
                    <p className="text-gray-600 dark:text-gray-300">{ticket.ticket_type_description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Purchase Information */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <CreditCardIcon className="h-4 w-4 text-primary-600 dark:text-blue-300 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Order Number:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">{ticket.order_number}</span>
              </div>

              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 text-primary-600 dark:text-blue-300 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Purchased:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">{formatDate(ticket.created_at)}</span>
              </div>

              <div className="flex items-center">
                <UserIcon className="h-4 w-4 text-primary-600 dark:text-blue-300 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Order Status:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-2 capitalize">{ticket.order_status}</span>
              </div>

              <div className="flex items-center">
                <CreditCardIcon className="h-4 w-4 text-primary-600 dark:text-blue-300 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Total Paid:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">${ticket.order_total}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
            
            <div className="space-y-3">
              {ticket.status === 'active' && (
                <>
                  <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Download Ticket
                  </button>
                  <button className="w-full border border-primary-500 text-primary-600 dark:border-white dark:text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-50 dark:hover:bg-primary-700 transition-colors">
                    Add to Wallet
                  </button>
                </>
              )}
              
              <Link
                to={`/events/${ticket.event_id}`}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center block"
              >
                View Event
              </Link>
              
              <Link
                to="/my-tickets"
                className="w-full border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center block"
              >
                Back to My Tickets
              </Link>
            </div>
          </div>

          {/* Status Information */}
          {ticket.status !== 'active' && (
            <div className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Information</h3>
              
              <div className="space-y-3">
                {ticket.status === 'used' && ticket.used_at && (
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Used on {formatDate(ticket.used_at)}
                    </span>
                  </div>
                )}
                
                {ticket.status === 'cancelled' && (
                  <div className="flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      This ticket has been cancelled
                    </span>
                  </div>
                )}
                
                {ticket.status === 'refunded' && (
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      This ticket has been refunded
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

export default TicketDetails;

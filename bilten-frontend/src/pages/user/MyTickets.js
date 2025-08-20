import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ticketsAPI } from '../../services/api';
import { 
  TicketIcon, 
  CalendarDaysIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);

  useEffect(() => {
    fetchTickets();
  }, [currentPage, selectedStatus]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 9,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      };

      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await ticketsAPI.getMyTickets(params);
      const { tickets: ticketsData, pagination: paginationData } = response.data.data;
      
      setTickets(ticketsData);
      setPagination(paginationData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError(`Failed to load tickets: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    setSearchParams({
      status,
      page: '1'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({
      status: selectedStatus,
      page: page.toString()
    });
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
      day: 'numeric'
    });
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchTickets}
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
      <div className="mb-8 text-center pt-[100px]">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Tickets</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage and view all your event tickets
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Tickets</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      {tickets.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {tickets.map((ticket) => {
              const StatusIcon = getStatusIcon(ticket.status);
              return (
                <div
                  key={ticket.id}
                  className="bg-white/70 dark:bg-blue-600/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-blue-500/50 overflow-hidden hover:shadow-lg hover:bg-white/80 dark:hover:bg-blue-600/90 transition-all duration-200"
                >
                  {/* Event Image */}
                  <div className="relative aspect-[16/9] bg-gray-100">
                    <img
                      src={ticket.cover_image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop'}
                      alt={ticket.event_title}
                      className="w-full h-full object-cover"
                    />
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Content */}
                  <div className="p-4">
                    {/* Event Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {ticket.event_title}
                    </h3>

                    {/* Ticket Type */}
                    <div className="flex items-center mb-3">
                      <TicketIcon className="h-4 w-4 mr-2 text-primary-600 dark:text-blue-300" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {ticket.ticket_type_name}
                      </span>
                    </div>

                    {/* Event Date */}
                    <div className="flex items-center mb-2 text-sm text-gray-600 dark:text-gray-300">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      <span>{formatEventDate(ticket.event_start_date)}</span>
                    </div>

                    {/* Venue */}
                    {ticket.venue_name && (
                      <div className="flex items-center mb-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span className="truncate">{ticket.venue_name}</span>
                      </div>
                    )}

                    {/* Ticket Number */}
                    <div className="flex items-center mb-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-mono">#{ticket.ticket_number}</span>
                    </div>

                    {/* Purchase Date */}
                    <div className="flex items-center mb-4 text-xs text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span>Purchased {formatDate(ticket.created_at)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors text-center block"
                      >
                        View Details
                      </Link>
                      {ticket.status === 'active' && (
                        <button
                          className="w-full border border-primary-500 text-primary-600 dark:border-white dark:text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-700 transition-colors"
                        >
                          Download Ticket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <nav className="flex items-center space-x-2">
                {/* Previous Page */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      page === currentPage
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next Page */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No tickets found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {selectedStatus !== 'all' 
              ? `You don't have any ${selectedStatus} tickets.` 
              : "You haven't purchased any tickets yet."}
          </p>
          <Link
            to="/events"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyTickets;

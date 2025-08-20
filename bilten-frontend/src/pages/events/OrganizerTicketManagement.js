import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { eventsAPI, ticketsAPI } from '../../services/api';
import { 
  TicketIcon, 
  CalendarDaysIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  UserIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { QrCodeIcon as QrCodeSolidIcon } from '@heroicons/react/24/solid';

const OrganizerTicketManagement = () => {
  const { t } = useLanguage();
  const { user, isOrganizer } = useAuth();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedTicket, setScannedTicket] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [stats, setStats] = useState({
    totalTickets: 0,
    activeTickets: 0,
    usedTickets: 0,
    cancelledTickets: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (isOrganizer) {
      fetchEventData();
      fetchTicketStats();
    }
  }, [eventId, currentPage, selectedStatus]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const eventResponse = await eventsAPI.getById(eventId);
      const eventData = eventResponse.data.data.event;
      
      // Fetch tickets for this event
      const params = {
        page: currentPage,
        limit: 10,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      };
      
      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
      
      const ticketsResponse = await ticketsAPI.getEventTickets(eventId, params);
      const { tickets: ticketsData, pagination: paginationData } = ticketsResponse.data.data;
      
      setEvent(eventData);
      setTickets(ticketsData);
      setPagination(paginationData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch event data:', err);
      
      // Fallback to mock data if API fails
      const mockEvent = {
        id: eventId,
        title: "Artbat - Deep Techno Journey",
        start_date: "2025-03-15T21:00:00Z",
        venue_name: "Cairo Opera House",
        venue_address: "Gezira Island, Cairo, Egypt",
        cover_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop"
      };
      
      const mockTickets = [
        {
          id: 1,
          ticket_number: "TKT-2025-001",
          status: "active",
          ticket_type_name: "General Admission",
          attendee_name: "Ahmed Hassan",
          attendee_email: "ahmed@example.com",
          purchase_date: "2025-01-15T10:30:00Z",
          price: 1500.00,
          qr_code: "qr-code-data-1"
        },
        {
          id: 2,
          ticket_number: "TKT-2025-002",
          status: "used",
          ticket_type_name: "VIP Standing",
          attendee_name: "Fatima Ali",
          attendee_email: "fatima@example.com",
          purchase_date: "2025-01-14T15:45:00Z",
          used_at: "2025-03-15T22:30:00Z",
          price: 2500.00,
          qr_code: "qr-code-data-2"
        }
      ];

      setEvent(mockEvent);
      setTickets(mockTickets);
      setError('Using demo data - API connection failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketStats = async () => {
    try {
      const response = await ticketsAPI.getEventTicketStats(eventId);
      const statsData = response.data.data.stats;
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch ticket stats:', err);
      // Fallback to mock stats
      const mockStats = {
        totalTickets: 150,
        activeTickets: 120,
        usedTickets: 25,
        cancelledTickets: 5,
        totalRevenue: 225000.00
      };
      setStats(mockStats);
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleQRScan = async (qrCode) => {
    try {
      setShowQRScanner(false);
      setValidationResult(null);
      
      const response = await ticketsAPI.validateTicket(qrCode);
      const validationData = response.data;
      
      setScannedTicket(validationData.data.ticket);
      setValidationResult(validationData);
      
      // Refresh tickets and stats after validation
      fetchEventData();
      fetchTicketStats();
    } catch (err) {
      console.error('QR validation failed:', err);
      setValidationResult({
        success: false,
        message: err.response?.data?.message || "Invalid ticket QR code"
      });
    }
  };

  const validateTicket = async (ticketId) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm('Are you sure you want to validate this ticket? This will mark it as used.');
      if (!confirmed) return;
      
      await ticketsAPI.validateTicketById(ticketId);
      
      // Update local state
      const updatedTickets = tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'used', used_at: new Date().toISOString() }
          : ticket
      );
      setTickets(updatedTickets);
      
      // Refresh stats
      fetchTicketStats();
    } catch (err) {
      console.error('Failed to validate ticket:', err);
      alert(`Failed to validate ticket: ${err.response?.data?.message || err.message}`);
    }
  };

  const cancelTicket = async (ticketId) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm('Are you sure you want to cancel this ticket? This action cannot be undone.');
      if (!confirmed) return;
      
      await ticketsAPI.cancelTicket(ticketId);
      
      // Update local state
      const updatedTickets = tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'cancelled' }
          : ticket
      );
      setTickets(updatedTickets);
      
      // Refresh stats
      fetchTicketStats();
    } catch (err) {
      console.error('Failed to cancel ticket:', err);
      alert(`Failed to cancel ticket: ${err.response?.data?.message || err.message}`);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  if (!isOrganizer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You need organizer permissions to access ticket management.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white">Loading ticket management...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchEventData}
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ticket Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage tickets for your event
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-400">{error}</p>
        </div>
      )}

      {/* Event Info */}
      {event && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {event.title}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span>{event.venue_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TicketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.usedTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelledTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            QR Code Scanner
          </h3>
          <button
            onClick={() => setShowQRScanner(!showQRScanner)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {showQRScanner ? (
              <>
                <EyeSlashIcon className="h-4 w-4" />
                <span>Hide Scanner</span>
              </>
            ) : (
              <>
                <QrCodeIcon className="h-4 w-4" />
                <span>Show Scanner</span>
              </>
            )}
          </button>
        </div>

        {showQRScanner && (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <QrCodeSolidIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Point your camera at a ticket QR code to validate
            </p>
            <button
              onClick={() => handleQRScan("mock-qr-code")}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Simulate QR Scan
            </button>
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            validationResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {validationResult.success ? (
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                  Ticket Validated Successfully
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Ticket Number:</span>
                    <span className="ml-2 font-mono text-green-800 dark:text-green-400">
                      {scannedTicket?.ticket_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Attendee:</span>
                    <span className="ml-2 text-green-800 dark:text-green-400">
                      {scannedTicket?.attendee_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-green-800 dark:text-green-400">
                      {scannedTicket?.ticket_type_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="ml-2 text-green-800 dark:text-green-400">
                      {scannedTicket?.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">
                  Invalid Ticket
                </h4>
                <p className="text-red-700 dark:text-red-300">
                  {validationResult.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Support Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Need Help?
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Get support for ticket management and event operations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Live Chat Support */}
          <div className="text-center group cursor-pointer">
            <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors duration-200">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Live Chat</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Chat with our support team in real-time
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
              Start Chat
            </button>
          </div>

          {/* Phone Support */}
          <div className="text-center group cursor-pointer">
            <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors duration-200">
              <PhoneIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Phone Support</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Call us for immediate assistance
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
              Call Now
            </button>
          </div>

          {/* Help Center */}
          <div className="text-center group cursor-pointer">
            <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors duration-200">
              <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Help Center</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Browse our knowledge base and FAQs
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
              Browse Help
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
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

            {/* Search - Matching News page search style */}
            <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
              <div className="flex items-center">
                {/* Search Input */}
                <div className="flex-1 flex items-center px-4 py-3">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-white/80 mr-3" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => {/* Handle search if needed */}}
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 m-1.5 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2">
            <DocumentTextIcon className="h-4 w-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Attendee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tickets.map((ticket) => {
                const StatusIcon = getStatusIcon(ticket.status);
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <TicketIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {ticket.ticket_number}
                          </div>
                        </div>
                      </div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <div>
                         <div className="text-sm font-medium text-gray-900 dark:text-white">
                           {ticket.attendee_first_name && ticket.attendee_last_name 
                             ? `${ticket.attendee_first_name} ${ticket.attendee_last_name}`
                             : ticket.attendee_name || 'N/A'
                           }
                         </div>
                         <div className="text-sm text-gray-500 dark:text-gray-400">
                           {ticket.attendee_email || 'N/A'}
                         </div>
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {ticket.ticket_type_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(ticket.purchase_date)}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                       {formatCurrency(ticket.ticket_price || ticket.price || 0)}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {ticket.status === 'active' && (
                          <button
                            onClick={() => validateTicket(ticket.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Validate Ticket"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {ticket.status === 'active' && (
                          <button
                            onClick={() => cancelTicket(ticket.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Cancel Ticket"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {tickets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No tickets found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {selectedStatus !== 'all' 
              ? `No ${selectedStatus} tickets for this event.` 
              : "No tickets have been sold for this event yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrganizerTicketManagement;

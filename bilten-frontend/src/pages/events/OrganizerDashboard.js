import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventsAPI } from '../../services/api';
import { 
  CalendarDaysIcon, 
  TargetIcon, 
  TicketIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  TagIcon,
  BuildingOffice2Icon,
  MegaphoneIcon,
  LifebuoyIcon
} from '@heroicons/react/24/outline';
import PromoCodeManagement from '../../components/PromoCodeManagement';
import PromoCodeAnalytics from '../../components/PromoCodeAnalytics';

const OrganizerDashboard = () => {
  const { user, isOrganizer } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOrganizer) {
      fetchDashboardData();
    }
  }, [isOrganizer]);

  const fetchDashboardData = async () => {
    try {
      // Fetch organizer's events
      const eventsResponse = await eventsAPI.getAll();
      const events = eventsResponse.data.data.events || [];
      
      // Calculate stats (mock data for now)
      const upcomingEvents = events.filter(event => 
        new Date(event.start_date) > new Date()
      ).length;
      
      setStats({
        totalEvents: events.length,
        upcomingEvents: upcomingEvents,
        totalTicketsSold: 245, // Mock data
        totalRevenue: 12450.00, // Mock data
      });
      
      setRecentEvents(events.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOrganizer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Access denied. Organizer permissions required.</p>
        </div>
      </div>
    );
  }

  const organizerTabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      description: 'Dashboard overview and key metrics',
      access: ['organizer']
    },
    {
      id: 'events',
      name: 'Events',
      icon: CalendarDaysIcon,
      description: 'Manage your events and event details',
      access: ['organizer']
    },
    {
      id: 'tickets',
      name: 'Tickets',
      icon: TicketIcon,
      description: 'Ticket management and sales tracking',
      access: ['organizer']
    },
    {
      id: 'promo-codes',
      name: 'Promo Codes',
      icon: TagIcon,
      description: 'Create and manage discount codes',
      access: ['organizer']
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartBarIcon,
      description: 'Event performance and insights',
      access: ['organizer']
    },
    {
      id: 'financial',
      name: 'Financial',
      icon: CurrencyDollarIcon,
      description: 'Revenue and financial reports',
      access: ['organizer']
    },
    {
      id: 'organization',
      name: 'Organization',
      icon: BuildingOffice2Icon,
      description: 'Organization settings and branding',
      access: ['organizer']
    },
    {
      id: 'marketing',
      name: 'Marketing',
      icon: MegaphoneIcon,
      description: 'Marketing campaigns and promotions',
      access: ['organizer']
    },
    {
      id: 'support',
      name: 'Support',
      icon: LifebuoyIcon,
      description: 'Customer support and communication',
      access: ['organizer']
    }
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} recentEvents={recentEvents} loading={loading} />;
      case 'events':
        return <EventsTab />;
      case 'tickets':
        return <TicketsTab />;
      case 'promo-codes':
        return <PromoCodesTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'financial':
        return <FinancialTab />;
      case 'organization':
        return <OrganizationTab />;
      case 'marketing':
        return <MarketingTab />;
      case 'support':
        return <SupportTab />;
      default:
        return <OverviewTab stats={stats} recentEvents={recentEvents} loading={loading} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your events and grow your business
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {organizerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {renderActiveComponent()}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, recentEvents, loading }) => {
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTicketsSold}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h2>
        {recentEvents.length > 0 ? (
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(event.start_date).toLocaleDateString()} • {event.venue_name}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/events/${event.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View
                  </Link>
                  <Link
                    to={`/events/${event.id}/edit`}
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No events yet</p>
            <Link
              to="/create-event"
              className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
            >
              Create Your First Event
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/create-event"
            className="block bg-primary-600 text-white text-center py-3 px-4 rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Create New Event
          </Link>
          <Link
            to="/organizer/events"
            className="block bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
          >
            Manage Events
          </Link>
          <Link
            to="/organizer/analytics"
            className="block bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
          >
            View Analytics
          </Link>
          <Link
            to="/organizer/financial"
            className="block bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
          >
            Financial Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

// Events Tab Component
const EventsTab = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">Events Management</h2>
      <Link
        to="/create-event"
        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
      >
        Create New Event
      </Link>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p className="text-yellow-800">Events management interface coming soon...</p>
    </div>
  </div>
);

// Tickets Tab Component
const TicketsTab = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">Ticket Management</h2>
      <Link
        to="/organizer/events/1/tickets"
        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
      >
        Manage Tickets
      </Link>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p className="text-yellow-800">Ticket management interface coming soon...</p>
    </div>
  </div>
);

// Promo Codes Tab Component
const PromoCodesTab = () => (
  <div className="p-8">
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Promo Code Management</h2>
      <p className="text-gray-600">Create and manage discount codes for your events</p>
    </div>
    <PromoCodeManagement />
  </div>
);

// Analytics Tab Component
const AnalyticsTab = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">Analytics & Insights</h2>
      <Link
        to="/organizer/analytics"
        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
      >
        View Full Analytics
      </Link>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p className="text-yellow-800">Analytics interface coming soon...</p>
    </div>
  </div>
);

// Financial Tab Component
const FinancialTab = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">Financial Reports</h2>
      <Link
        to="/organizer/financial"
        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
      >
        View Full Reports
      </Link>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p className="text-yellow-800">Financial reports interface coming soon...</p>
    </div>
  </div>
);

// Organization Tab Component
const OrganizationTab = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">Organization Settings</h2>
      <Link
        to="/organizer/organization"
        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
      >
        Manage Organization
      </Link>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p className="text-yellow-800">Organization settings interface coming soon...</p>
    </div>
  </div>
);

// Marketing Tab Component
const MarketingTab = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">Marketing & Promotions</h2>
      <Link
        to="/organizer/marketing"
        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
      >
        Manage Marketing
      </Link>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p className="text-yellow-800">Marketing interface coming soon...</p>
    </div>
  </div>
);

// Support Tab Component
const SupportTab = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">Customer Support</h2>
      <Link
        to="/organizer/support"
        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
      >
        Manage Support
      </Link>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <p className="text-yellow-800">Customer support interface coming soon...</p>
    </div>
  </div>
);

export default OrganizerDashboard;
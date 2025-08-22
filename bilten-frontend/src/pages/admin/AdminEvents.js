import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';
import {
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const AdminEvents = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentTheme } = useAdminTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchEvents();
  }, [statusFilter, sortBy]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockEvents = [
        { id: 1, title: 'Summer Music Festival', organizer: 'Music Events Co.', date: '2024-07-15', status: 'active', attendees: 1250, revenue: 45000, category: 'Music', image: '🎵' },
        { id: 2, title: 'Tech Conference 2024', organizer: 'Tech Solutions Inc.', date: '2024-08-20', status: 'active', attendees: 890, revenue: 35600, category: 'Technology', image: '💻' },
        { id: 3, title: 'Art Exhibition', organizer: 'Creative Arts', date: '2024-09-05', status: 'pending', attendees: 650, revenue: 19500, category: 'Arts', image: '🎨' },
        { id: 4, title: 'Food Festival', organizer: 'Culinary Events', date: '2024-09-15', status: 'draft', attendees: 420, revenue: 12600, category: 'Food', image: '🍕' },
        { id: 5, title: 'Business Networking', organizer: 'Professional Network', date: '2024-10-01', status: 'cancelled', attendees: 200, revenue: 8000, category: 'Business', image: '🤝' },
      ];

      let filteredEvents = mockEvents;
      if (statusFilter !== 'all') {
        filteredEvents = mockEvents.filter(event => event.status === statusFilter);
      }

      filteredEvents.sort((a, b) => {
        switch (sortBy) {
          case 'date': return new Date(b.date) - new Date(a.date);
          case 'revenue': return b.revenue - a.revenue;
          case 'attendees': return b.attendees - a.attendees;
          case 'title': return a.title.localeCompare(b.title);
          default: return 0;
        }
      });

      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'draft': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const filteredBySearch = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminPageWrapper>
        <div className="animate-pulse">
          <div className={`h-8 ${currentTheme.colors.surface} rounded-xl w-1/4 mb-8`}></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className={`h-48 ${currentTheme.colors.surface} rounded-xl`}></div>)}
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary}`}>Event Management</h1>
            <p className={`${currentTheme.colors.textMuted} mt-1`}>Manage and monitor all platform events.</p>
          </div>
          <Link to="/admin/events/create" className={`${currentTheme.colors.button} text-white px-4 py-2 rounded-xl text-sm flex items-center space-x-2`}>
            <PlusIcon className="w-4 h-4" />
            <span>Create Event</span>
          </Link>
        </div>

        <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 lg:max-w-md">
              <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.colors.textMuted}`} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl ${currentTheme.colors.input} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
            </div>
            <div className="flex items-center space-x-4">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${currentTheme.colors.input} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${currentTheme.colors.input} rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50`}>
                <option value="date">Sort by Date</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="attendees">Sort by Attendees</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBySearch.map(event => <EventCard key={event.id} event={event} getStatusStyle={getStatusStyle} />)}
        </div>

        {filteredBySearch.length === 0 && !loading && (
          <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-12 text-center`}>
            <CalendarIcon className={`w-16 h-16 ${currentTheme.colors.textMuted} mx-auto mb-4`} />
            <h3 className={`${currentTheme.colors.textPrimary} text-lg font-semibold mb-2`}>No Events Found</h3>
            <p className={`${currentTheme.colors.textMuted}`}>No events match your current filters.</p>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
};

const EventCard = ({ event, getStatusStyle }) => {
  const { currentTheme } = useAdminTheme();
  const StatusIcon = {
    active: CheckCircleIcon,
    pending: ClockIcon,
    draft: PencilIcon,
    cancelled: XCircleIcon,
  }[event.status] || ClockIcon;

  return (
    <div className={`${currentTheme.colors.surface} backdrop-blur-sm border ${currentTheme.colors.border} rounded-xl p-6 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{event.image}</div>
          <div>
            <h3 className={`${currentTheme.colors.textPrimary} font-semibold text-lg`}>{event.title}</h3>
            <p className={`${currentTheme.colors.textMuted} text-sm`}>{event.organizer}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs border ${getStatusStyle(event.status)} flex items-center space-x-1`}>
          <StatusIcon className="w-3 h-3" />
          <span className="capitalize">{event.status}</span>
        </div>
      </div>
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2"><CalendarIcon className={`w-4 h-4 ${currentTheme.colors.textMuted}`} /><span className={`${currentTheme.colors.textSecondary} text-sm`}>{new Date(event.date).toLocaleDateString()}</span></div>
        <div className="flex items-center space-x-2"><UsersIcon className={`w-4 h-4 ${currentTheme.colors.textMuted}`} /><span className={`${currentTheme.colors.textSecondary} text-sm`}>{event.attendees} attendees</span></div>
        <div className="flex items-center space-x-2"><CurrencyDollarIcon className={`w-4 h-4 ${currentTheme.colors.textMuted}`} /><span className={`${currentTheme.colors.textSecondary} text-sm`}>${event.revenue.toLocaleString()} revenue</span></div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t ${currentTheme.colors.borderLight}">
        <div className="flex items-center space-x-2">
          <Link to={`/admin/events/${event.id}`} className={`p-2 rounded-lg ${currentTheme.colors.glass} border ${currentTheme.colors.borderLight} hover:${currentTheme.colors.surfaceHover}`}><EyeIcon className="w-4 h-4" /></Link>
          <Link to={`/admin/events/${event.id}/edit`} className={`p-2 rounded-lg ${currentTheme.colors.glass} border ${currentTheme.colors.borderLight} hover:${currentTheme.colors.surfaceHover}`}><PencilIcon className="w-4 h-4" /></Link>
          <button className={`p-2 rounded-lg ${currentTheme.colors.glass} border ${currentTheme.colors.borderLight} hover:${currentTheme.colors.surfaceHover} text-red-500`}><TrashIcon className="w-4 h-4" /></button>
        </div>
        <span className={`${currentTheme.colors.textMuted} text-xs`}>{event.category}</span>
      </div>
    </div>
  );
};

export default AdminEvents;
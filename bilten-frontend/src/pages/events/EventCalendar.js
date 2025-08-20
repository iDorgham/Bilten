import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../../services/api';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const EventCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEventsForMonth();
  }, [events, currentDate, selectedDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll({ limit: 100 });
      const { events: eventsData } = response.data.data;
      setEvents(eventsData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(`Failed to load events: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const filtered = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });

    if (selectedDate) {
      const selectedEvents = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === selectedDate.toDateString();
      });
      setFilteredEvents(selectedEvents);
    } else {
      setFilteredEvents(filtered);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'next') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getCategoryColor = (category) => {
    const colors = {
      technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      business: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      music: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      sports: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      arts: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      food: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      education: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      health: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      fashion: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
      travel: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400'
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const renderCalendarGrid = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add day headers
    dayNames.forEach(day => {
      days.push(
        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          {day}
        </div>
      );
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 min-h-[80px] border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
            isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''
          } ${
            isSelected ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-300 dark:border-primary-600' : ''
          } hover:bg-gray-50 dark:hover:bg-gray-800`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${
              isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
            }`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 px-1 rounded-full">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className="text-xs p-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 truncate"
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Event Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Browse events by month and discover what's happening around you
          </p>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            {/* Month Navigation */}
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {monthName}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading events...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
              <p className="text-red-800 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchEvents}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Calendar Grid */}
          {!loading && !error && viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {renderCalendarGrid()}
            </div>
          )}

          {/* List View */}
          {!loading && !error && viewMode === 'list' && (
            <div className="space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                          <CalendarIcon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {event.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                            {event.category}
                          </span>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 mr-1" />
                              {event.attendee_count || 0}
                            </span>
                            <span className="flex items-center font-semibold text-primary-600 dark:text-primary-400">
                              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                              {event.tickets && event.tickets.length > 0 ? formatPrice(event.tickets[0].price) : 'Free'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    No events this month
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedDate 
                      ? `No events scheduled for ${selectedDate.toLocaleDateString()}`
                      : 'No events scheduled for this month'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Date Events */}
        {selectedDate && filteredEvents.length > 0 && viewMode === 'month' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Events on {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map(event => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {event.title}
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{new Date(event.date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </span>
                        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                          {event.tickets && event.tickets.length > 0 ? formatPrice(event.tickets[0].price) : 'Free'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCalendar;

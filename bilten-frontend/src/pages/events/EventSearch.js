import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../../services/api';
import SearchSuggestions from '../../components/SearchSuggestions';
import { useLanguage } from '../../context/LanguageContext';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const EventSearch = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [dateRange, setDateRange] = useState(searchParams.get('dateRange') || '');
  const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'date');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'asc');

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [searchParams]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        search: searchParams.get('q'),
        category: searchParams.get('category'),
        location: searchParams.get('location'),
        dateRange: searchParams.get('dateRange'),
        priceRange: searchParams.get('priceRange'),
        sortBy: searchParams.get('sortBy') || 'date',
        sortOrder: searchParams.get('sortOrder') || 'asc'
      };

      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await eventsAPI.getAll(params);
      const { events: eventsData, pagination } = response.data.data;
      
      setEvents(eventsData);
      setTotalResults(pagination.totalItems);
      setTotalPages(pagination.totalPages);
      setError('');
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(`Failed to load events: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // This would typically come from an API endpoint
      setCategories([
        'Technology', 'Business', 'Music', 'Sports', 'Arts', 'Food', 'Education', 'Health', 'Fashion', 'Travel'
      ]);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    
    if (searchTerm.trim()) newParams.set('q', searchTerm.trim());
    if (selectedCategory) newParams.set('category', selectedCategory);
    if (selectedLocation) newParams.set('location', selectedLocation);
    if (dateRange) newParams.set('dateRange', dateRange);
    if (priceRange) newParams.set('priceRange', priceRange);
    if (sortBy) newParams.set('sortBy', sortBy);
    if (sortOrder) newParams.set('sortOrder', sortOrder);
    
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'event') {
      setSearchTerm(suggestion.text);
      const newParams = new URLSearchParams();
      newParams.set('q', suggestion.text);
      setSearchParams(newParams);
      setCurrentPage(1);
    } else if (suggestion.type === 'article') {
      // Navigate to news search
      navigate(`/news?search=${encodeURIComponent(suggestion.text)}`);
    } else if (suggestion.type === 'category') {
      setSelectedCategory(suggestion.text);
      const newParams = new URLSearchParams();
      newParams.set('category', suggestion.text);
      setSearchParams(newParams);
      setCurrentPage(1);
    } else if (suggestion.type === 'venue') {
      setSelectedLocation(suggestion.text);
      const newParams = new URLSearchParams();
      newParams.set('location', suggestion.text);
      setSearchParams(newParams);
      setCurrentPage(1);
    } else {
      // For other types, just set the search term
      setSearchTerm(suggestion.text);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLocation('');
    setDateRange('');
    setPriceRange('');
    setSortBy('date');
    setSortOrder('asc');
    setSearchParams({});
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
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
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedLocation || dateRange || priceRange;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Search Events
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover amazing events with advanced search and filters
          </p>
        </div>

        {/* Search Form - Matching News page search style */}
        <div className="mb-6 max-w-2xl mx-auto">
          <SearchSuggestions
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSuggestionSelect={handleSuggestionSelect}
            placeholder={t('search.searchEvents')}
            type="events"
            onSearch={handleSearch}
          />
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Category Filter */}
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Location"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                {/* Date Range Filter */}
                <div className="flex items-center space-x-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Any Date</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="next-month">Next Month</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="flex items-center space-x-2">
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Any Price</option>
                    <option value="free">Free</option>
                    <option value="0-25">$0 - $25</option>
                    <option value="25-50">$25 - $50</option>
                    <option value="50-100">$50 - $100</option>
                    <option value="100+">$100+</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {loading ? 'Searching...' : `${totalResults} events found`}
            </h2>
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
            <button
              onClick={() => {
                const newOrder = sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortBy('date');
                setSortOrder(newOrder);
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sortBy', 'date');
                newParams.set('sortOrder', newOrder);
                setSearchParams(newParams);
              }}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                sortBy === 'date'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => {
                const newOrder = sortBy === 'price' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortBy('price');
                setSortOrder(newOrder);
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sortBy', 'price');
                newParams.set('sortOrder', newOrder);
                setSearchParams(newParams);
              }}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                sortBy === 'price'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => {
                const newOrder = sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortBy('name');
                setSortOrder(newOrder);
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sortBy', 'name');
                newParams.set('sortOrder', newOrder);
                setSearchParams(newParams);
              }}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                sortBy === 'name'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Name
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Searching for events...</p>
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

        {/* Events Grid */}
        {!loading && !error && events.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {events.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Event Image */}
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {event.featured_image_url ? (
                      <img
                        src={event.featured_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        loading="lazy"
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 ${event.featured_image_url ? 'hidden' : ''}`}>
                      <CalendarIcon className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    </div>
                    {event.is_featured && (
                      <div className="absolute top-3 right-3">
                        <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        <span>{event.attendee_count || 0} attending</span>
                      </div>
                      <div className="flex items-center font-semibold text-primary-600 dark:text-primary-400">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        <span>{event.tickets && event.tickets.length > 0 ? formatPrice(event.tickets[0].price) : 'Free'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Try adjusting your search criteria or filters to find more events.
            </p>
            <button
              onClick={clearFilters}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSearch;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import api from '../services/api';

const EventSearch = ({ onResults, onFiltersChange, initialFilters = {} }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    city: '',
    country: '',
    is_free: false,
    is_featured: false,
    price_min: '',
    price_max: '',
    start_date: '',
    end_date: '',
    sort_by: 'start_date',
    sort_order: 'asc',
    ...initialFilters
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    locations: [],
    price_ranges: [],
    date_ranges: []
  });
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery, searchFilters) => {
      if (!searchQuery.trim() && Object.values(searchFilters).every(v => !v || v === 'all' || v === 'start_date' || v === 'asc')) {
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        if (searchQuery.trim()) {
          params.append('q', searchQuery.trim());
        }

        Object.entries(searchFilters).forEach(([key, value]) => {
          if (value && value !== 'all' && value !== '') {
            params.append(key, value);
          }
        });

        const response = await api.get(`/api/events?${params.toString()}`);
        onResults(response.data.data);
      } catch (error) {
        console.error('Search failed:', error);
        onResults({ events: [], pagination: { total: 0 } });
      } finally {
        setLoading(false);
      }
    }, 300),
    [onResults]
  );

  // Debounced autocomplete function
  const debouncedAutocomplete = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await api.get(`/api/events/search/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=8`);
        setSuggestions(response.data.data.suggestions || []);
      } catch (error) {
        console.error('Autocomplete failed:', error);
        setSuggestions([]);
      }
    }, 200),
    []
  );

  // Load available filters on component mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await api.get('/api/events/search/filters');
        setAvailableFilters(response.data.data);
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };

    loadFilters();
  }, []);

  // Handle search query changes
  useEffect(() => {
    debouncedSearch(query, filters);
    if (query.trim()) {
      debouncedAutocomplete(query);
    } else {
      setSuggestions([]);
    }
  }, [query, filters, debouncedSearch, debouncedAutocomplete]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'event') {
      setQuery(suggestion.text);
    } else if (suggestion.type === 'category') {
      handleFilterChange('category', suggestion.text);
      setQuery('');
    } else if (suggestion.type === 'location') {
      handleFilterChange('city', suggestion.text);
      setQuery('');
    }
    setShowSuggestions(false);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      category: 'all',
      city: '',
      country: '',
      is_free: false,
      is_featured: false,
      price_min: '',
      price_max: '',
      start_date: '',
      end_date: '',
      sort_by: 'start_date',
      sort_order: 'asc'
    };
    setFilters(clearedFilters);
    setQuery('');
    onFiltersChange?.(clearedFilters);
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Main Search Bar */}
        <div className="relative mb-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search events, venues, or organizers..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-shrink-0">
                    {suggestion.type === 'event' && (
                      <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {suggestion.type === 'category' && (
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    )}
                    {suggestion.type === 'location' && (
                      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{suggestion.text}</div>
                    <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                  </div>
                  {suggestion.count && (
                    <div className="text-xs text-gray-400">{suggestion.count} events</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {availableFilters.categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </option>
            ))}
          </select>

          <select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Cities</option>
            {availableFilters.locations.map((loc) => (
              <option key={`${loc.city}-${loc.country}`} value={loc.city}>
                {loc.city}, {loc.country} ({loc.count})
              </option>
            ))}
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.is_free}
              onChange={(e) => handleFilterChange('is_free', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Free Events</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.is_featured}
              onChange={(e) => handleFilterChange('is_featured', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Featured</span>
          </label>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAdvancedFilters ? 'Hide' : 'More'} Filters
          </button>

          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.price_min}
                  onChange={(e) => handleFilterChange('price_min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.price_max}
                  onChange={(e) => handleFilterChange('price_max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="start_date">Date</option>
                <option value="base_price">Price</option>
                <option value="popularity_score">Popularity</option>
                <option value="created_at">Newest</option>
                <option value="title">Name</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={filters.sort_order}
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSearch;
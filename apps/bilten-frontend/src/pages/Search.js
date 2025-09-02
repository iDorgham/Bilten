import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import EventSearch from '../components/EventSearch';
import SearchResults from '../components/SearchResults';
import api from '../services/api';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState({ events: [], pagination: { total: 0 } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const initialFilters = {};
    let hasFilters = false;
    
    for (const [key, value] of searchParams.entries()) {
      if (key === 'page') {
        setCurrentPage(parseInt(value) || 1);
      } else {
        initialFilters[key] = value;
        if (value && value !== 'all' && value !== '') {
          hasFilters = true;
        }
      }
    }
    
    setFilters(initialFilters);
    setHasSearched(hasFilters);
    
    // Load trending events if no search has been performed
    if (!hasFilters) {
      loadTrendingEvents();
    }
  }, [searchParams]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  const loadTrendingEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/events/search/trending?limit=12');
      setTrendingEvents(response.data.data.events || []);
    } catch (err) {
      console.error('Error loading trending events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (searchResults) => {
    setResults(searchResults);
    setCurrentPage(searchResults.pagination?.page || 1);
    setError(null);
    setHasSearched(true);
    
    // Save search to recent searches
    const query = searchParams.get('q');
    if (query && query.trim()) {
      saveRecentSearch(query.trim());
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '' && value !== false) {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  };

  const saveRecentSearch = (query) => {
    const searches = recentSearches.filter(s => s !== query);
    const newSearches = [query, ...searches].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  const handleRecentSearchClick = (query) => {
    const params = new URLSearchParams();
    params.set('q', query);
    setSearchParams(params);
  };

  const handleLoadMore = async () => {
    if (loading || !results.pagination?.hasMore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add current filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '' && value !== false) {
          params.set(key, value.toString());
        }
      });
      
      // Add next page
      params.set('page', (currentPage + 1).toString());
      params.set('limit', '20');

      const response = await api.get(`/api/events?${params.toString()}`);
      const newData = response.data.data;
      
      // Append new events to existing results
      setResults(prevResults => ({
        ...newData,
        events: [...prevResults.events, ...newData.events]
      }));
      
      setCurrentPage(currentPage + 1);
    } catch (err) {
      console.error('Error loading more events:', err);
      setError('Failed to load more events');
    } finally {
      setLoading(false);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <EventSearch
        onResults={handleSearchResults}
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasSearched ? (
          // Search Landing Page
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Find Your Perfect Event
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Search through thousands of events, filter by your preferences, and discover amazing experiences near you.
              </p>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Searches</h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Search Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Music & Concerts', category: 'music', icon: '🎵' },
                  { name: 'Technology', category: 'technology', icon: '💻' },
                  { name: 'Business', category: 'business', icon: '💼' },
                  { name: 'Sports & Fitness', category: 'sports', icon: '⚽' },
                  { name: 'Arts & Culture', category: 'arts', icon: '🎨' },
                  { name: 'Food & Drink', category: 'food', icon: '🍽️' },
                  { name: 'Health & Wellness', category: 'health', icon: '🧘' },
                  { name: 'Education', category: 'education', icon: '📚' }
                ].map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('category', cat.category);
                      setSearchParams(params);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Events */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Trending Events</h2>
                <button
                  onClick={() => navigate('/events')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all events →
                </button>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <SearchResults
                  results={{ events: trendingEvents, pagination: { total: trendingEvents.length } }}
                  loading={false}
                  error={null}
                  emptyStateMessage="No trending events available"
                  emptyStateSubMessage="Check back later for popular events"
                />
              )}
            </div>
          </div>
        ) : (
          // Search Results Page
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
              <p className="text-lg text-gray-600">
                Events matching your search criteria
              </p>
            </div>

            <SearchResults
              results={results}
              loading={loading}
              error={error}
              onLoadMore={handleLoadMore}
              emptyStateMessage="No events match your search"
              emptyStateSubMessage="Try adjusting your search criteria or filters"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
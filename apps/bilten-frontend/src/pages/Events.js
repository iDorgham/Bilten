import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EventSearch from '../components/EventSearch';
import SearchResults from '../components/SearchResults';
import api from '../services/api';

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState({ events: [], pagination: { total: 0 } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  // Initialize filters from URL params
  useEffect(() => {
    const initialFilters = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === 'page') {
        setCurrentPage(parseInt(value) || 1);
      } else {
        initialFilters[key] = value;
      }
    }
    setFilters(initialFilters);
  }, [searchParams]);

  // Load initial events on component mount
  useEffect(() => {
    if (Object.keys(filters).length === 0 && currentPage === 1) {
      loadInitialEvents();
    }
  }, []);

  const loadInitialEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/events?status=published&limit=20');
      setResults(response.data.data);
    } catch (err) {
      setError('Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (searchResults) => {
    setResults(searchResults);
    setCurrentPage(searchResults.pagination?.page || 1);
    setError(null);
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {Object.keys(filters).some(key => filters[key] && filters[key] !== 'all' && filters[key] !== '') 
              ? 'Search Results' 
              : 'Discover Events'
            }
          </h1>
          <p className="text-lg text-gray-600">
            {Object.keys(filters).some(key => filters[key] && filters[key] !== 'all' && filters[key] !== '') 
              ? 'Events matching your search criteria'
              : 'Find amazing events happening around you'
            }
          </p>
        </div>

        {/* Search Results */}
        <SearchResults
          results={results}
          loading={loading}
          error={error}
          onLoadMore={handleLoadMore}
          emptyStateMessage={
            Object.keys(filters).some(key => filters[key] && filters[key] !== 'all' && filters[key] !== '')
              ? "No events match your search"
              : "No events available"
          }
          emptyStateSubMessage={
            Object.keys(filters).some(key => filters[key] && filters[key] !== 'all' && filters[key] !== '')
              ? "Try adjusting your search criteria or filters"
              : "Check back later for new events!"
          }
        />
      </div>
    </div>
  );
};

export default Events;

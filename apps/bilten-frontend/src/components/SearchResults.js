import React from 'react';
import EventCard from './EventCard';

const SearchResults = ({ 
  results, 
  loading, 
  error, 
  onLoadMore, 
  showDistance = false,
  emptyStateMessage = "No events found",
  emptyStateSubMessage = "Try adjusting your search criteria or filters"
}) => {
  if (loading && (!results?.events || results.events.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!results?.events || results.events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyStateMessage}</h3>
          <p className="text-gray-600">{emptyStateSubMessage}</p>
        </div>
      </div>
    );
  }

  const { events, pagination, search_metadata, aggregations } = results;

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {pagination?.total ? (
              <>
                {pagination.total.toLocaleString()} event{pagination.total !== 1 ? 's' : ''} found
              </>
            ) : (
              'Search Results'
            )}
          </h2>
          {search_metadata?.query && (
            <p className="text-sm text-gray-600 mt-1">
              Results for "{search_metadata.query}"
              {search_metadata.took && (
                <span className="ml-2">({search_metadata.took}ms)</span>
              )}
            </p>
          )}
        </div>

        {/* Results per page info */}
        {pagination && (
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
        )}
      </div>

      {/* Search Aggregations/Facets */}
      {aggregations && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Refine your search</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aggregations.categories && aggregations.categories.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Categories</h4>
                <div className="space-y-1">
                  {aggregations.categories.slice(0, 5).map((cat) => (
                    <button
                      key={cat.category}
                      className="block text-xs text-blue-600 hover:text-blue-800"
                    >
                      {cat.category} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aggregations.locations && aggregations.locations.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Locations</h4>
                <div className="space-y-1">
                  {aggregations.locations.slice(0, 5).map((loc) => (
                    <button
                      key={loc.city}
                      className="block text-xs text-blue-600 hover:text-blue-800"
                    >
                      {loc.city} ({loc.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aggregations.priceRanges && aggregations.priceRanges.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Price Ranges</h4>
                <div className="space-y-1">
                  {aggregations.priceRanges.map((range) => (
                    <button
                      key={range.range}
                      className="block text-xs text-blue-600 hover:text-blue-800"
                    >
                      {range.range.replace('_', ' ')} ({range.count})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            showDistance={showDistance}
          />
        ))}
      </div>

      {/* Load More / Pagination */}
      {pagination && pagination.hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Load More Events</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {pagination && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </div>
          <div className="text-sm text-gray-600">
            {pagination.total} total results
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
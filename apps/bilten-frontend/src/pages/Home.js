import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AIAssistant from '../components/AIAssistant';

const Home = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsSearching(false);
      // Navigate to events page with search query
      window.location.href = `/events?search=${encodeURIComponent(query)}`;
    }, 1000);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Generate AI suggestions based on input
    if (value.trim()) {
      const mockSuggestions = [
        `Find events about "${value}"`,
        `Show me ${value} events near me`,
        `What ${value} events are happening this weekend?`,
        `Recommend ${value} events for families`,
        `Find ${value} events with tickets available`
      ];
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  const handleAISearch = (aiQuery) => {
    setQuery(aiQuery);
    handleSearch({ preventDefault: () => {} });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex justify-end p-4">
        <nav className="flex items-center space-x-4 text-sm">
          <Link to="/events" className="text-gray-700 hover:text-gray-900">
            Events
          </Link>
          <Link to="/login" className="text-gray-700 hover:text-gray-900">
            Sign in
          </Link>
          <Link 
            to="/register" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-2xl w-full">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-800 mb-2">
              Bilten
            </h1>
            <p className="text-xl text-gray-600">
              AI-Powered Event Discovery
            </p>
          </div>

          {/* Search Box */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder="Ask AI to help you find events..."
                  className="w-full max-w-2xl px-6 py-4 text-lg border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAIAssistant(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    title="AI Assistant"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : (
                    <button
                      type="submit"
                      className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={() => setQuery('Find events near me')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
            >
              Events near me
            </button>
            <button
              onClick={() => setQuery('Show me concerts this weekend')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
            >
              Concerts this weekend
            </button>
            <button
              onClick={() => setQuery('Find family-friendly events')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
            >
              Family events
            </button>
            <button
              onClick={() => setQuery('What events are free today')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
            >
              Free events
            </button>
          </div>

          {/* AI Features */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Powered by AI to understand your preferences and find the perfect events
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Smart Recommendations
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Natural Language Search
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Personalized Results
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-500">
        <div className="flex justify-center space-x-6 mb-2">
          <Link to="/about" className="hover:text-gray-700">About</Link>
          <Link to="/help" className="hover:text-gray-700">Help</Link>
          <Link to="/privacy" className="hover:text-gray-700">Privacy</Link>
          <Link to="/terms" className="hover:text-gray-700">Terms</Link>
        </div>
        <p>&copy; 2024 Bilten. All rights reserved.</p>
      </footer>

      {/* AI Assistant Modal */}
      <AIAssistant
        isVisible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onSearch={handleAISearch}
      />
    </div>
  );
};

export default Home;

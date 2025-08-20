import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { MagnifyingGlassIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';

const SearchSuggestions = ({ 
  searchTerm, 
  onSearchTermChange, 
  onSuggestionSelect, 
  placeholder, 
  type = 'all', // 'events', 'articles', 'all'
  className = '',
  showSuggestions = true,
  onSearch
}) => {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const response = await searchAPI.ftsSuggestions({
          q: searchTerm,
          type: type,
          limit: 8
        });
        
        if (response.data.success) {
          setSuggestions(response.data.data.suggestions);
          setShowDropdown(response.data.data.suggestions.length > 0);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, type]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showDropdown) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else if (searchTerm.trim()) {
            onSearch && onSearch();
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDropdown, suggestions, selectedIndex, searchTerm, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionSelect = (suggestion) => {
    onSuggestionSelect(suggestion);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    onSearchTermChange(value);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  const getSuggestionIcon = (suggestion) => {
    switch (suggestion.type) {
      case 'event':
        return <CalendarIcon className="w-4 h-4 text-blue-500" />;
      case 'article':
        return <DocumentTextIcon className="w-4 h-4 text-green-500" />;
      case 'category':
        return <MagnifyingGlassIcon className="w-4 h-4 text-purple-500" />;
      case 'venue':
        return <MagnifyingGlassIcon className="w-4 h-4 text-orange-500" />;
      default:
        return <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSuggestionTypeLabel = (suggestion) => {
    switch (suggestion.type) {
      case 'event':
        return t('search.suggestionTypes.event');
      case 'article':
        return t('search.suggestionTypes.article');
      case 'category':
        return t('search.suggestionTypes.category');
      case 'venue':
        return t('search.suggestionTypes.venue');
      default:
        return suggestion.category || t('search.suggestionTypes.result');
    }
  };

  const getSuggestionLink = (suggestion) => {
    switch (suggestion.type) {
      case 'event':
        return `/events/search?q=${encodeURIComponent(suggestion.text)}`;
      case 'article':
        return `/news?search=${encodeURIComponent(suggestion.text)}`;
      case 'category':
        return `/events/search?category=${encodeURIComponent(suggestion.text)}`;
      case 'venue':
        return `/events/search?location=${encodeURIComponent(suggestion.text)}`;
      default:
        return '#';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
        <div className="flex items-center">
          <div className="flex-1 flex items-center px-4 py-3">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-white/80 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            onClick={onSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 m-1.5 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                     {loading ? (
             <div className="p-4 text-center">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
               <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('search.loadingSuggestions')}</p>
             </div>
           ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${index}`}
                  className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center space-x-3">
                    {getSuggestionIcon(suggestion)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {suggestion.text}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {getSuggestionTypeLabel(suggestion)}
                        </span>
                      </div>
                      {suggestion.category && suggestion.type === 'event' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {suggestion.category}
                        </p>
                      )}
                      {suggestion.venue && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          📍 {suggestion.venue}
                        </p>
                      )}
                      {suggestion.author && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          👤 {suggestion.author}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
                     ) : searchTerm.length >= 2 ? (
             <div className="p-4 text-center">
               <p className="text-sm text-gray-500 dark:text-gray-400">{t('search.noSuggestions')}</p>
             </div>
           ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;

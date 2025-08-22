import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { articlesAPI } from '../../services/api';
import SearchSuggestions from '../../components/SearchSuggestions';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  EyeIcon,
  TagIcon,
  CalendarDaysIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const News = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filters & search state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'published_at');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, selectedCategory, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 6,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sortBy,
        sortOrder
      };

      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await articlesAPI.getAll(params);
      const { articles: articlesData, pagination: paginationData } = response.data.data;
      

      
      setArticles(articlesData);
      setPagination(paginationData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setError(`Failed to load articles: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await articlesAPI.getCategories();
      setCategories(response.data.data.categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setCurrentPage(1);
      setSearchParams({
        search: searchTerm.trim(),
        page: '1'
      });
      performSearch();
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'article') {
      setSearchTerm(suggestion.text);
      setCurrentPage(1);
      setSearchParams({
        search: suggestion.text,
        page: '1'
      });
      performSearch();
    } else if (suggestion.type === 'event') {
      // Navigate to events search
      navigate(`/events/search?q=${encodeURIComponent(suggestion.text)}`);
    } else {
      // For other types, just set the search term
      setSearchTerm(suggestion.text);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 6
      };

      const response = await articlesAPI.search(searchTerm.trim(), params);
      const { articles: articlesData, pagination: paginationData } = response.data.data;
      
      setArticles(articlesData);
      setPagination(paginationData);
      setCurrentPage(1);
      setError('');
    } catch (err) {
      console.error('Search failed:', err);
      setError(`Search failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setSearchParams({
      category,
      page: '1'
    });
  };

  const handleSortChange = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
    setSearchParams({
      sortBy: field,
      sortOrder: newOrder,
      page: '1'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({
      page: page.toString()
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('published_at');
    setSortOrder('desc');
    setCurrentPage(1);
    setSearchParams({});
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      business: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      design: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[category] || colors.general;
  };

  const getCategoryTranslation = (category) => {
    const categoryTranslations = {
      technology: t('news.categories.technology'),
      business: t('news.categories.business'),
      marketing: t('news.categories.marketing'),
      design: t('news.categories.design'),
      general: t('news.categories.general')
    };
    return categoryTranslations[category] || category;
  };

  if (loading && articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white">{t('news.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400 mb-4">{t('news.error.loadFailed')} {error}</p>
          <button
            onClick={fetchArticles}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            {t('news.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900">
      {/* Animated Background Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 dark:opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center pt-[100px]">
            <h1 className="text-4xl md:text-5xl title-primary text-gray-900 dark:text-white mb-4">
              {t('news.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('news.subtitle')}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-2xl mx-auto" style={{ marginBottom: '100px' }}>
            <SearchSuggestions
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onSuggestionSelect={handleSuggestionSelect}
              placeholder={t('news.searchPlaceholder')}
              type="articles"
              onSearch={handleSearch}
            />
          </div>



      {/* Articles Grid - Matching Events page styling */}
      {articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-white/20 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Article Image */}
                <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={article.featured_image_url || article.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop'}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      console.log('Image failed to load:', e.target.src);
                      // Replace placeholder URLs with working Unsplash images
                      if (e.target.src.includes('via.placeholder.com')) {
                        const fallbackImages = [
                          'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=400&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop'
                        ];
                        const randomIndex = Math.floor(Math.random() * fallbackImages.length);
                        e.target.src = fallbackImages[randomIndex];
                      } else {
                        e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop';
                      }
                      e.target.onerror = null; // Prevent infinite loop
                    }}
                    onLoad={() => console.log('Image loaded successfully:', article.title)}
                    loading="lazy"
                  />
                  {/* Image overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Article Content */}
                <div className="p-4">
                  {/* Category and Read Time */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {getCategoryTranslation(article.category)}
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-300">
                      <ClockIcon className="h-4 w-4" />
                      <span>{article.read_time} {t('news.minRead')}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    <Link to={`/news/${article.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {article.title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-white/80 border border-gray-200 dark:border-white/20"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {/* Date */}
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="truncate">{formatDate(article.published_at)}</span>
                    </div>
                    {/* Views */}
                    <div className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span>{article.view_count || article.views || 0} {t('news.views')}</span>
                    </div>
                  </div>

                  {/* Read More Button */}
                  <Link 
                    to={`/news/${article.id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors text-center block"
                  >
                    {t('news.readMore')}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <nav className="flex items-center space-x-2">
                {/* Previous Page */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 rounded-md hover:bg-gray-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white/80"
                >
                  {t('news.previous')}
                </button>

                {/* Page Numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/20 dark:text-white/80'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next Page */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 rounded-md hover:bg-gray-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white/80"
                >
                  {t('news.next')}
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('news.noArticles')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {searchTerm ? t('news.noArticlesSearch') : t('news.noArticlesSubtitle')}
          </p>
          {searchTerm && (
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('news.clearSearch')}
            </button>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default News;

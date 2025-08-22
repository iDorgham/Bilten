import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { articlesAPI } from '../../services/api';
import { 
  ArrowLeftIcon,
  CalendarDaysIcon,
  EyeIcon,
  ClockIcon,
  TagIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getById(id);
      const { article: articleData, relatedArticles: relatedData } = response.data.data;
      
      setArticle(articleData);
      setRelatedArticles(relatedData || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch article:', err);
      setError(`Failed to load article: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
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
      platform: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      tips: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      community: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
      sustainability: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      music: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[category] || colors.general;
  };

  const renderMarkdown = (content) => {
    // Simple markdown rendering for basic formatting
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-8">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">{line.substring(4)}</h3>;
        }
        
        // Lists
        if (line.startsWith('- ')) {
          return <li key={index} className="text-gray-700 dark:text-gray-300 mb-1 ml-4">{line.substring(2)}</li>;
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />;
        }
        
        // Regular paragraphs
        return <p key={index} className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{line}</p>;
      });
  };

  const shareArticle = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/news')}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Back to News
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article not found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/news')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Back to News
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/news')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to News
      </button>

      {/* Article Header */}
      <header className="mb-8">
        {/* Category */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          <div className="flex items-center space-x-4">
            <button
              onClick={shareArticle}
              className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              <ShareIcon className="h-5 w-5 mr-1" />
              Share
            </button>
            <button className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
              <BookmarkIcon className="h-5 w-5 mr-1" />
              Save
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Excerpt */}
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          {article.excerpt}
        </p>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            <span>{formatDate(article.published_at)}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>{article.read_time} min read</span>
          </div>
          <div className="flex items-center">
            <EyeIcon className="h-4 w-4 mr-2" />
            <span>{article.view_count} views</span>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                <TagIcon className="h-4 w-4 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Featured Image */}
      {(article.featured_image_url || article.image_url) && (
        <div className="mb-8 relative overflow-hidden rounded-lg shadow-lg">
          <img
            src={article.featured_image_url || article.image_url}
            alt={article.title}
            className="w-full h-64 md:h-96 object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              // Replace placeholder URLs with working Unsplash images
              if (e.target.src.includes('via.placeholder.com')) {
                const fallbackImages = [
                  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop'
                ];
                const randomIndex = Math.floor(Math.random() * fallbackImages.length);
                e.target.src = fallbackImages[randomIndex];
              } else {
                e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop';
              }
              e.target.onerror = null; // Prevent infinite loop
            }}
            loading="lazy"
          />
          {/* Image overlay for better visual appeal */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
        </div>
      )}

      {/* Article Content */}
      <article className="prose prose-lg max-w-none dark:prose-invert mb-12">
        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {renderMarkdown(article.content)}
        </div>
      </article>

      {/* Article Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 pt-8 mb-12">
        <div className="flex justify-end">
          <button
            onClick={shareArticle}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Share Article
          </button>
        </div>
      </footer>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <article
                key={relatedArticle.id}
                className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Article Image */}
                <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={relatedArticle.featured_image_url || relatedArticle.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop'}
                    alt={relatedArticle.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
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
                    loading="lazy"
                  />
                </div>

                {/* Article Content */}
                <div className="p-4">
                  {/* Category */}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(relatedArticle.category)}`}>
                    {relatedArticle.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    <Link to={`/news/${relatedArticle.id}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {relatedArticle.title}
                    </Link>
                  </h3>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      <span>{formatDate(relatedArticle.published_at)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ArticleDetail;

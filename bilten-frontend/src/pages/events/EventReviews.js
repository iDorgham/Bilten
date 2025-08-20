import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsAPI } from '../../services/api';
import { 
  StarIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  PhotoIcon,
  FlagIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const EventReviews = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'positive', 'negative', 'recent'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'rating', 'helpful'

  // Review form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Mock data - in a real app, this would come from an API
  const mockEvent = {
    id: eventId,
    title: 'Tech Conference 2024',
    location: 'San Francisco Convention Center',
    date: '2024-01-15T14:00:00Z',
    organizer: 'Tech Events Inc.',
    averageRating: 4.2,
    totalReviews: 156,
    ratingDistribution: {
      5: 89,
      4: 45,
      3: 15,
      2: 5,
      1: 2
    }
  };

  const mockReviews = [
    {
      id: 1,
      userId: 'user1',
      userName: 'Sarah Johnson',
      userAvatar: null,
      rating: 5,
      title: 'Amazing conference experience!',
      comment: 'This was one of the best tech conferences I\'ve ever attended. The speakers were incredible, the networking opportunities were fantastic, and the venue was perfect. Highly recommend!',
      photos: ['https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Event+Photo+1'],
      helpful: 24,
      notHelpful: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      verified: true
    },
    {
      id: 2,
      userId: 'user2',
      userName: 'Michael Chen',
      userAvatar: null,
      rating: 4,
      title: 'Great content, some room for improvement',
      comment: 'Overall a very good conference with excellent speakers and valuable insights. The only downside was that some sessions were overcrowded. The food and coffee were great though!',
      photos: [],
      helpful: 12,
      notHelpful: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      verified: true
    },
    {
      id: 3,
      userId: 'user3',
      userName: 'Emily Rodriguez',
      userAvatar: null,
      rating: 3,
      title: 'Decent but could be better',
      comment: 'The conference was okay. Some sessions were interesting but others felt rushed. The venue was a bit cold and the WiFi was unreliable. Not bad for the price though.',
      photos: [],
      helpful: 8,
      notHelpful: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      verified: false
    },
    {
      id: 4,
      userId: 'user4',
      userName: 'David Kim',
      userAvatar: null,
      rating: 5,
      title: 'Outstanding event!',
      comment: 'Absolutely loved this conference! The keynote speakers were world-class, the breakout sessions were engaging, and I made so many valuable connections. Can\'t wait for next year!',
      photos: ['https://via.placeholder.com/300x200/10B981/FFFFFF?text=Event+Photo+2'],
      helpful: 31,
      notHelpful: 0,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      verified: true
    },
    {
      id: 5,
      userId: 'user5',
      userName: 'Lisa Thompson',
      userAvatar: null,
      rating: 2,
      title: 'Disappointing experience',
      comment: 'I was really looking forward to this conference but it didn\'t meet my expectations. The sessions were too basic, the venue was cramped, and the organization was poor. Would not recommend.',
      photos: [],
      helpful: 5,
      notHelpful: 8,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 days ago
      verified: true
    }
  ];

  useEffect(() => {
    fetchEventAndReviews();
  }, [eventId]);

  const fetchEventAndReviews = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEvent(mockEvent);
      setReviews(mockReviews);
      setError('');
    } catch (err) {
      console.error('Failed to fetch event and reviews:', err);
      setError('Failed to load event and reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => URL.createObjectURL(file));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReview = {
        id: Date.now(),
        userId: 'currentUser',
        userName: 'Current User',
        userAvatar: null,
        rating,
        title,
        comment,
        photos,
        helpful: 0,
        notHelpful: 0,
        timestamp: new Date(),
        verified: true
      };

      setReviews(prev => [newReview, ...prev]);
      setShowReviewForm(false);
      resetForm();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setTitle('');
    setComment('');
    setPhotos([]);
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;

    // Apply filter
    switch (filter) {
      case 'positive':
        filtered = reviews.filter(review => review.rating >= 4);
        break;
      case 'negative':
        filtered = reviews.filter(review => review.rating <= 2);
        break;
      case 'recent':
        filtered = reviews.sort((a, b) => b.timestamp - a.timestamp);
        break;
      default:
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'rating':
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case 'helpful':
        filtered = [...filtered].sort((a, b) => b.helpful - a.helpful);
        break;
      case 'recent':
      default:
        filtered = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
        break;
    }

    return filtered;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingPercentage = (rating) => {
    const total = event.ratingDistribution[5] + event.ratingDistribution[4] + 
                  event.ratingDistribution[3] + event.ratingDistribution[2] + 
                  event.ratingDistribution[1];
    return Math.round((event.ratingDistribution[rating] / total) * 100);
  };

  const filteredReviews = getFilteredAndSortedReviews();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-800 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchEventAndReviews}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/events/${eventId}`}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            ← Back to Event
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Reviews for {event.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            See what attendees are saying about this event
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Event Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  <span>{formatEventDate(event.date)}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <UserIcon className="h-5 w-5 mr-2" />
                  <span>Organized by {event.organizer}</span>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mr-4">
                    {event.averageRating}
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(event.averageRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.totalReviews} reviews
                    </p>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-4">
                        {rating}
                      </span>
                      <div className="flex-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${getRatingPercentage(rating)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                        {event.ratingDistribution[rating]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Write Review Button */}
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Write a Review
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="lg:col-span-2">
            {/* Filters and Sort */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All Reviews' },
                    { key: 'positive', label: 'Positive' },
                    { key: 'negative', label: 'Negative' },
                    { key: 'recent', label: 'Recent' }
                  ].map(filterOption => (
                    <button
                      key={filterOption.key}
                      onClick={() => setFilter(filterOption.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === filterOption.key
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filterOption.label}
                    </button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="rating">Highest Rated</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Write a Review
                  </h3>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={submitReview} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rating *
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(star)}
                          className="focus:outline-none"
                        >
                          <StarIcon
                            className={`h-8 w-8 ${
                              star <= rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            } hover:text-yellow-400 transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Review Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Summarize your experience"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Review *
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this event..."
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    ></textarea>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add Photos (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Choose Photos
                      </label>
                    </div>
                    {photos.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={photo}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || rating === 0}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {filteredReviews.length > 0 ? (
                filteredReviews.map(review => (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                  >
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {review.userName}
                            </h4>
                            {review.verified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                <CheckIcon className="h-3 w-3 mr-1" />
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span>•</span>
                            <span>{formatDate(review.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          <FlagIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="mb-4">
                      {review.title && (
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {review.title}
                        </h5>
                      )}
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>

                    {/* Photos */}
                    {review.photos.length > 0 && (
                      <div className="mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {review.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Review photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          <HandThumbUpIcon className="h-4 w-4" />
                          <span className="text-sm">Helpful ({review.helpful})</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          <HandThumbDownIcon className="h-4 w-4" />
                          <span className="text-sm">Not Helpful ({review.notHelpful})</span>
                        </button>
                      </div>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span className="text-sm">Reply</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Be the first to share your experience with this event!
                  </p>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Write the First Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventReviews;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { generateEventSlug } from '../../utils/slugUtils';
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const Events = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  useEffect(() => {
    // Simulated events data - replace with actual API call
    const mockEvents = [
      {
        id: "550e8400-e29b-41d4-a716-446655440101",
        title: 'Artbat - Deep Techno Journey',
        description: 'Experience the hypnotic deep techno sounds of Artbat in an immersive night of electronic music at Cairo\'s premier venue.',
        date: '2025-03-15',
        time: '21:00',
        location: 'Cairo Opera House',
        price: 1500,
        category: 'deep-techno',
        image: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440102",
        title: 'Amr Diab - The Plateau Concert',
        description: 'The legendary Amr Diab returns with his greatest hits and new songs in an exclusive concert at the iconic venue.',
        date: '2025-02-20',
        time: '20:00',
        location: 'New Administrative Capital Arena',
        price: 800,
        category: 'concert',
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440103",
        title: 'Anyma - Melodic Techno Experience',
        description: 'Join Anyma for a spiritual journey through melodic techno rhythms and organic sounds that will move your soul.',
        date: '2025-02-28',
        time: '22:00',
        location: 'Sahel Beach Club',
        price: 1000,
        category: 'melodic-techno',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440104",
        title: 'Masar Egbari - Alternative Rock Night',
        description: 'Experience the unique sound of Masar Egbari as they blend traditional Egyptian music with modern alternative rock.',
        date: '2025-03-10',
        time: '19:30',
        location: 'El Sawy Culturewheel',
        price: 600,
        category: 'concert',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440105",
        title: 'Organic House Festival',
        description: 'A full day of organic house music featuring local and international DJs in a beautiful outdoor setting.',
        date: '2025-04-05',
        time: '14:00',
        location: 'Al-Azhar Park',
        price: 1200,
        category: 'organic-house',
        image: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440106",
        title: 'Progressive Techno Underground',
        description: 'An underground progressive techno experience featuring cutting-edge electronic music in an intimate venue.',
        date: '2025-03-22',
        time: '23:00',
        location: 'Underground Cairo',
        price: 800,
        category: 'progressive-techno',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440107",
        title: 'Deep House Sunset Session',
        description: 'Relax to the smooth sounds of deep house as the sun sets over the Nile with premium cocktails and great vibes.',
        date: '2025-03-08',
        time: '18:00',
        location: 'Nile Rooftop Lounge',
        price: 900,
        category: 'deep-techno',
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440108",
        title: 'Melodic Techno Beach Party',
        description: 'A beachside melodic techno party with international DJs, stunning ocean views, and an unforgettable atmosphere.',
        date: '2025-04-12',
        time: '16:00',
        location: 'Marina Beach Club',
        price: 1500,
        category: 'melodic-techno',
        image: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440109",
        title: 'Electronic Music Festival',
        description: 'A three-day electronic music festival featuring the best local and international DJs.',
        date: '2025-05-15',
        time: '14:00',
        location: 'Giza Pyramids',
        price: 2000,
        category: 'deep-techno',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440110",
        title: 'Jazz Night at the Opera',
        description: 'An elegant evening of jazz music in the historic Cairo Opera House.',
        date: '2025-03-25',
        time: '20:00',
        location: 'Cairo Opera House',
        price: 1200,
        category: 'concert',
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440111",
        title: 'Rock Concert Under the Stars',
        description: 'A rock concert featuring local bands under the beautiful Egyptian sky.',
        date: '2025-04-20',
        time: '19:00',
        location: 'Al-Azhar Park',
        price: 800,
        category: 'concert',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440112",
        title: 'Classical Music Evening',
        description: 'A classical music performance by the Cairo Symphony Orchestra.',
        date: '2025-05-10',
        time: '19:30',
        location: 'Cairo Opera House',
        price: 1500,
        category: 'concert',
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop'
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesDate = !selectedDate || event.date === selectedDate;
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = [
    { id: 'all', name: t('events.allCategories') },
    { id: 'deep-techno', name: t('events.deepTechno') },
    { id: 'concert', name: t('events.concert') },
    { id: 'melodic-techno', name: t('events.melodicTechno') },
    { id: 'organic-house', name: t('events.organicHouse') },
    { id: 'progressive-techno', name: t('events.progressiveTechno') }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              {t('Discover Events')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('Find amazing events happening near you')}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
              <div className="flex items-center">
                <div className="flex-1 flex items-center px-4 py-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-white/80 mr-3" />
                  <input
                    type="text"
                    placeholder={t('events.searchEvents')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                  />
                </div>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 m-1.5 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Events Count */}
          <div className="mb-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t('events.showing')} {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} {t('events.of')} {filteredEvents.length} {t('events.events')}
            </p>
          </div>

          {/* Events Grid */}
          {currentEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('events.noEventsFound')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('events.tryAdjustingSearch')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentEvents.map(event => (
                  <div key={event.id} className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-white/20 overflow-hidden hover:shadow-xl transition-shadow duration-200">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {event.category.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {event.time}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                          ${event.price}
                        </div>
                      </div>

                      <Link
                        to={`/events/${generateEventSlug(event)}`}
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors duration-200"
                      >
                        {t('events.viewDetails')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white dark:bg-white/10 backdrop-blur-sm text-gray-500 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 dark:border-white/20"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white dark:bg-white/10 backdrop-blur-sm text-gray-500 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 dark:border-white/20"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { generateEventSlug, createSlugToIdMapping } from '../../utils/slugUtils';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  UserIcon,
  UsersIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import WishlistButton from '../../components/WishlistButton';
import { useWishlist } from '../../hooks/useWishlist';
import { 
  pageClasses, 
  cardClasses, 
  buttonClasses, 
  textClasses,
  iconClasses,
  containerClasses,
  loadingSpinnerClasses,
  errorClasses,
  errorTextClasses,
  cn
} from '../../styles/utilities';

const EventDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isWishlisted, toggleWishlist, checkWishlistStatus } = useWishlist();

  // Ticket quantities state
  const [ticketQuantities, setTicketQuantities] = useState({
    standing: 1,
    vipStanding: 0,
    backStage: 0
  });

  // Selected ticket type state
  const [selectedTicketType, setSelectedTicketType] = useState('standing');
  
  // Additional ticket emails state
  const [additionalEmails, setAdditionalEmails] = useState([]);

  // Handle ticket type selection
  const handleTicketTypeSelect = (ticketType) => {
    setSelectedTicketType(ticketType);
    // Reset quantities when selecting a new type and set default to 1
    setTicketQuantities({
      standing: 0,
      vipStanding: 0,
      backStage: 0,
      [ticketType]: 1
    });
    // Reset additional emails
    setAdditionalEmails([]);
  };

  // Handle quantity changes
  const handleQuantityChange = (change) => {
    if (!selectedTicketType) return;
    
    const newQuantity = Math.max(1, ticketQuantities[selectedTicketType] + change);
    
    setTicketQuantities(prev => ({
      ...prev,
      [selectedTicketType]: newQuantity
    }));
    
    // Update additional emails array based on new quantity
    const additionalTicketsNeeded = Math.max(0, newQuantity - 1);
    
    if (additionalTicketsNeeded > additionalEmails.length) {
      // Add more email fields
      const newEmails = [...additionalEmails];
      for (let i = additionalEmails.length; i < additionalTicketsNeeded; i++) {
        newEmails.push('');
      }
      setAdditionalEmails(newEmails);
    } else if (additionalTicketsNeeded < additionalEmails.length) {
      // Remove excess email fields
      setAdditionalEmails(additionalEmails.slice(0, additionalTicketsNeeded));
    }
  };

  // Handle email input changes
  const handleEmailChange = (index, email) => {
    const newEmails = [...additionalEmails];
    newEmails[index] = email;
    setAdditionalEmails(newEmails);
  };

  // Calculate total tickets for selected type only
  const totalTickets = selectedTicketType ? ticketQuantities[selectedTicketType] : 0;

  // Calculate total price based on selected ticket type
  const calculateTotalPrice = () => {
    if (!selectedTicketType) return 0;
    
    const prices = {
      standing: 25,
      vipStanding: 75,
      backStage: 150
    };
    
    return ticketQuantities[selectedTicketType] * prices[selectedTicketType];
  };

  // Handle Get Tickets button click
  const handleGetTickets = () => {
    if (totalTickets === 0) return;
    
    // Validate additional emails if there are extra tickets
    const currentQuantity = ticketQuantities[selectedTicketType];
    if (currentQuantity > 1) {
      const emptyEmails = additionalEmails.filter(email => !email.trim());
      if (emptyEmails.length > 0) {
        alert('Please provide email addresses for all additional tickets.');
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = additionalEmails.filter(email => !emailRegex.test(email.trim()));
      if (invalidEmails.length > 0) {
        alert('Please provide valid email addresses for all additional tickets.');
        return;
      }
    }

    // Prepare checkout data
    const checkoutData = {
      eventId: event.id,
      tickets: [
        {
          ticketId: selectedTicketType,
          quantity: ticketQuantities[selectedTicketType],
          additionalEmails: additionalEmails.filter(email => email.trim())
        }
      ]
    };

    // Navigate to checkout
    navigate('/checkout', { state: { checkoutData } });
  };

  useEffect(() => {
    fetchEventDetails();
  }, [slug]);

  // Parallax scroll effect for event image
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5; // Adjust this value to control parallax speed
      document.documentElement.style.setProperty('--scroll-offset', `${rate}px`);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      
      // For now, we'll use mock data to demonstrate the slug functionality
      // In a real implementation, you would fetch all events and find by slug
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
      
      // Create slug to ID mapping
      const slugToIdMapping = createSlugToIdMapping(mockEvents);
      
      // Find event by slug
      const eventId = slugToIdMapping[slug];
      
      if (!eventId) {
        throw new Error('Event not found');
      }
      
      // Find the event data
      const eventData = mockEvents.find(e => e.id === eventId);
      
      if (!eventData) {
        throw new Error('Event not found');
      }
      
      setEvent(eventData);
      
      // Mock tickets data
      const mockTickets = [
        {
          id: 1,
          type: 'standing',
          name: t('events.ticketTypes.standing'),
          description: t('events.ticketTypes.standingDescription'),
          price: eventData.price,
          available: 50,
          maxPerOrder: 4
        },
        {
          id: 2,
          type: 'vipStanding',
          name: t('events.ticketTypes.vipStanding'),
          description: t('events.ticketTypes.vipStandingDescription'),
          price: eventData.price * 1.5,
          available: 20,
          maxPerOrder: 2
        },
        {
          id: 3,
          type: 'backStage',
          name: t('events.ticketTypes.backStage'),
          description: t('events.ticketTypes.backStageDescription'),
          price: eventData.price * 2,
          available: 10,
          maxPerOrder: 1
        }
      ];
      setTickets(mockTickets);
      
      // Check wishlist status
      try {
        await checkWishlistStatus([eventData.id]);
      } catch (wishlistError) {
        console.warn('Failed to load wishlist status:', wishlistError);
      }
    } catch (err) {
      console.error('Failed to fetch event details:', err);
      setError(`Failed to load event details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to get placeholder image based on event category
  const getPlaceholderImage = (category) => {
    const placeholders = {
      technology: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
      business: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop',
      arts: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
      sports: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop',
      education: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
      networking: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=600&fit=crop',
      default: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop'
    };
    return placeholders[category] || placeholders.default;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString, timezone = 'UTC') => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short'
    });
  };

  if (loading) {
    return (
      <div className={pageClasses()}>
        <div className={containerClasses()}>
          <div className="text-center py-12">
            <div className={cn(loadingSpinnerClasses('lg'), 'mx-auto mb-4')}></div>
            <p className={textClasses('secondary')}>{t('events.loadingEventDetails')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={pageClasses()}>
        <div className={containerClasses()}>
          <div className={cn(errorClasses(), 'text-center')}>
            <p className={cn(errorTextClasses(), 'mb-4')}>{error}</p>
            <button
              onClick={() => navigate('/events')}
              className={buttonClasses('danger', 'md')}
            >
              {t('events.backToEvents')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={pageClasses()}>
        <div className={containerClasses()}>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className={cn('text-xl font-semibold mb-2', textClasses('primary'))}>{t('events.eventNotFound')}</h2>
            <p className={cn(textClasses('muted'), 'mb-6')}>{t('events.eventNotFoundSubtitle')}</p>
            <button
              onClick={() => navigate('/events')}
              className={buttonClasses('primary', 'lg')}
            >
              {t('events.backToEvents')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClasses()}>
      {/* Event Image - Enhanced Hero Section */}
      <div className="relative w-screen h-[60vh] min-h-[400px] max-h-[600px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-700 ease-out hover:scale-100"
              style={{
                transform: 'translateY(var(--scroll-offset, 0px)) scale(1.05)',
              }}
              onError={(e) => {
                e.target.src = getPlaceholderImage(event.category);
              }}
            />
          ) : (
            <img
              src={getPlaceholderImage(event.category)}
              alt={event.title}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-700 ease-out hover:scale-100"
              style={{
                transform: 'translateY(var(--scroll-offset, 0px)) scale(1.05)',
              }}
            />
          )}
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-gray-900"></div>
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className={containerClasses()}>
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-lg">
                <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                  <CalendarDaysIcon className="w-5 h-5 mr-2" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
                <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  <span>{event.venue_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(containerClasses(), 'py-8 -mt-16 relative z-10')}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className={cn(
            'flex items-center mb-6 transition-colors', 
            textClasses('secondary'), 
            'hover:text-gray-900 dark:hover:text-white',
            isRTL ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <ArrowLeftIcon className={cn('w-5 h-5', isRTL ? 'ml-2' : 'mr-2')} />
          {t('common.back')} {t('nav.events')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Wishlist Button */}
            <div className="flex justify-end mb-6">
              <WishlistButton
                eventId={event.id}
                isWishlisted={isWishlisted(event.id)}
                onToggle={toggleWishlist}
                size="lg"
              />
            </div>

            {/* Event Details */}
            <div className="space-y-4 mb-8">
              {/* Date and Time */}
              <div className={cn('flex items-center', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                <CalendarDaysIcon className={cn('w-6 h-6', iconClasses('accent'), isRTL ? 'ml-3' : 'mr-3')} />
                <div className={cn(isRTL ? 'text-right' : 'text-left')}>
                  <div className={cn('font-medium', textClasses('primary'))}>{formatDate(event.start_date)}</div>
                  <div className={cn('text-sm', textClasses('secondary'))}>
                    {formatTime(event.start_date, event.timezone)} - {formatTime(event.end_date, event.timezone)}
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div className={cn('flex items-start', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                <MapPinIcon className={cn('w-6 h-6 mt-0.5', iconClasses('accent'), isRTL ? 'ml-3' : 'mr-3')} />
                <div className={cn(isRTL ? 'text-right' : 'text-left')}>
                  <div className={cn('font-medium', textClasses('primary'))}>{event.venue_name}</div>
                  {event.venue_address && (
                    <div className={cn('text-sm', textClasses('secondary'))}>{event.venue_address}</div>
                  )}
                </div>
              </div>

              {/* Organizer */}
              {(event.organizer_first_name || event.organizer_last_name) && (
                <div className={cn('flex items-center', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                  <UserIcon className={cn('w-6 h-6', iconClasses('accent'), isRTL ? 'ml-3' : 'mr-3')} />
                  <div className={cn(isRTL ? 'text-right' : 'text-left')}>
                    <div className={cn('font-medium', textClasses('primary'))}>
                      {event.organizer_first_name || ''} {event.organizer_last_name || ''}
                    </div>
                    {event.organizer_email && (
                      <div className={cn('text-sm', textClasses('secondary'))}>{event.organizer_email}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Capacity */}
              {typeof event.max_attendees === 'number' && (
                <div className={cn('flex items-center', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                  <UsersIcon className={cn('w-6 h-6', iconClasses('accent'), isRTL ? 'ml-3' : 'mr-3')} />
                  <div className={cn('font-medium', textClasses('primary'), isRTL ? 'text-right' : 'text-left')}>
                    {t('events.maxAttendees')}: {event.max_attendees}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className={cn('text-xl font-semibold mb-4', textClasses('primary'), isRTL ? 'text-right' : 'text-left')}>
                {t('events.aboutThisEvent')}
              </h2>
              <p className={cn('leading-relaxed', textClasses('secondary'), isRTL ? 'text-right' : 'text-left')}>
                {event.description}
              </p>
            </div>
          </div>

          {/* Sidebar - Tickets */}
          <div className="lg:col-span-1">
            <div className={cn(cardClasses(), 'backdrop-blur-sm p-6 sticky top-8')}>
              <h3 className={cn('text-lg font-semibold mb-4', textClasses('primary'), isRTL ? 'text-right' : 'text-left')}>
                {t('events.tickets')}
              </h3>
              
              {/* Ticket Types Accordion */}
              <div className="space-y-2">
                {/* Standing Ticket Accordion */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => handleTicketTypeSelect('standing')}
                    className={cn(
                      'w-full p-3 transition-all flex items-center justify-between',
                      isRTL ? 'text-right' : 'text-left',
                      selectedTicketType === 'standing' 
                        ? 'bg-primary-50 dark:bg-primary-500/20 border-primary-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                  >
                    <div className={cn('flex items-center', isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3')}>
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        selectedTicketType === 'standing' 
                          ? 'border-primary-500 bg-primary-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      )}>
                        {selectedTicketType === 'standing' && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className={cn(isRTL ? 'text-right' : 'text-left')}>
                        <h4 className={cn('font-medium', textClasses('primary'))}>{t('events.ticketTypes.standing')}</h4>
                        <p className={cn('text-xs', textClasses('muted'))}>150 {t('events.available')}</p>
                      </div>
                    </div>
                    <div className={cn(isRTL ? 'text-left' : 'text-right')}>
                      <p className={cn('font-bold text-lg', textClasses('primary'))}>$25.00</p>
                      <p className={cn('text-xs', textClasses('muted'))}>{t('events.popular')}</p>
                    </div>
                  </button>
                  
                  {/* Expanded Content for Standing */}
                  {selectedTicketType === 'standing' && (
                    <div className="px-3 pb-3 bg-primary-50 dark:bg-primary-500/10">
                      <p className={cn('text-sm', textClasses('secondary'), isRTL ? 'text-right' : 'text-left')}>
                        {t('events.ticketTypes.standingDescription')}
                      </p>
                    </div>
                  )}
                </div>

                {/* VIP Standing Ticket Accordion */}
                <div className="border border-white/50 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => handleTicketTypeSelect('vipStanding')}
                    className={cn(
                      'w-full p-3 transition-all flex items-center justify-between',
                      isRTL ? 'text-right' : 'text-left',
                      selectedTicketType === 'vipStanding' 
                        ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                  >
                    <div className={cn('flex items-center', isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3')}>
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        selectedTicketType === 'vipStanding' 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      )}>
                        {selectedTicketType === 'vipStanding' && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className={cn(isRTL ? 'text-right' : 'text-left')}>
                        <h4 className={cn('font-medium', textClasses('primary'))}>{t('events.ticketTypes.vipStanding')}</h4>
                        <p className={cn('text-xs', textClasses('muted'))}>50 {t('events.available')}</p>
                      </div>
                    </div>
                    <div className={cn(isRTL ? 'text-left' : 'text-right')}>
                      <p className={cn('font-bold text-lg', textClasses('primary'))}>$75.00</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">VIP</p>
                    </div>
                  </button>
                  
                  {/* Expanded Content for VIP Standing */}
                  {selectedTicketType === 'vipStanding' && (
                    <div className="px-3 pb-3 bg-blue-50 dark:bg-blue-500/10">
                      <p className={cn('text-sm', textClasses('secondary'), isRTL ? 'text-right' : 'text-left')}>
                        {t('events.ticketTypes.vipStandingDescription')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Back Stage Ticket Accordion */}
                <div className="border border-white/50 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => handleTicketTypeSelect('backStage')}
                    className={cn(
                      'w-full p-3 transition-all flex items-center justify-between',
                      isRTL ? 'text-right' : 'text-left',
                      selectedTicketType === 'backStage' 
                        ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                  >
                    <div className={cn('flex items-center', isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3')}>
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        selectedTicketType === 'backStage' 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      )}>
                        {selectedTicketType === 'backStage' && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className={cn(isRTL ? 'text-right' : 'text-left')}>
                        <h4 className={cn('font-medium', textClasses('primary'))}>{t('events.ticketTypes.backStage')}</h4>
                        <p className={cn('text-xs', textClasses('muted'))}>20 {t('events.available')}</p>
                      </div>
                    </div>
                    <div className={cn(isRTL ? 'text-left' : 'text-right')}>
                      <p className={cn('font-bold text-lg', textClasses('primary'))}>$150.00</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Premium</p>
                    </div>
                  </button>
                  
                  {/* Expanded Content for Back Stage */}
                  {selectedTicketType === 'backStage' && (
                    <div className="px-3 pb-3 bg-blue-50 dark:bg-blue-500/10">
                      <p className={cn('text-sm', textClasses('secondary'), isRTL ? 'text-right' : 'text-left')}>
                        {t('events.ticketTypes.backStageDescription')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Single Quantity Selector - Only show when ticket type is selected */}
              {selectedTicketType && (
                <div className="mt-6 pt-4 border-t border-white/50 dark:border-gray-600">
                  <div className={cn('flex items-center justify-between mb-4', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                    <label className={cn('text-sm font-medium', textClasses('secondary'), isRTL ? 'text-right' : 'text-left')}>
                      {t('events.quantityFor')} {selectedTicketType === 'standing' ? t('events.ticketTypes.standing') : 
                                    selectedTicketType === 'vipStanding' ? t('events.ticketTypes.vipStanding') : t('events.ticketTypes.backStage')}:
                    </label>
                    <div className="flex items-center border border-white/50 dark:border-gray-600 rounded-lg">
                      <button 
                        onClick={() => handleQuantityChange(-1)}
                        className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-gray-900 dark:text-white font-medium">
                        {ticketQuantities[selectedTicketType]}
                      </span>
                      <button 
                        onClick={() => handleQuantityChange(1)}
                        className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Additional Email Inputs - Show when quantity > 1 */}
                  {ticketQuantities[selectedTicketType] > 1 && (
                    <div className="mt-4">
                      <label className={cn('text-sm font-medium mb-3 block', textClasses('secondary'), isRTL ? 'text-right' : 'text-left')}>
                        {t('events.additionalEmailsLabel')}:
                      </label>
                      <div className="space-y-2">
                        {additionalEmails.map((email, index) => (
                          <div key={index} className={cn('flex items-center', isRTL ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2')}>
                            <span className={cn('text-xs text-gray-500 dark:text-gray-400 w-16', isRTL ? 'text-right' : 'text-left')}>
                              {t('events.ticket')} {index + 2}:
                            </span>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => handleEmailChange(index, e.target.value)}
                              placeholder={t('events.enterEmailAddress')}
                              className={cn(
                                'flex-1 px-3 py-2 text-sm border border-white/50 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                isRTL ? 'text-right' : 'text-left'
                              )}
                              required
                            />
                          </div>
                        ))}
                      </div>
                      <p className={cn('text-xs text-gray-500 dark:text-gray-400 mt-2', isRTL ? 'text-right' : 'text-left')}>
                        {t('events.additionalEmailsNote')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Total Price Display */}
              <div className="mt-6 pt-4 border-t border-white/50 dark:border-gray-600">
                <div className={cn('flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white mb-4', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                  <span className={cn(isRTL ? 'text-right' : 'text-left')}>{t('events.totalPrice')}:</span>
                  <div className={cn('flex items-center', isRTL ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2')}>
                    <CurrencyDollarIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    <span>${calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
                {/* Single Get Tickets Button */}
                <button 
                  onClick={handleGetTickets}
                  disabled={totalTickets === 0}
                  className={cn(buttonClasses('primary', 'lg'), 'w-full disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  {totalTickets === 0 ? (
                    t('events.selectTicketType')
                  ) : (
                    `${t('events.getTickets')} (${totalTickets}) - $${calculateTotalPrice().toFixed(2)}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

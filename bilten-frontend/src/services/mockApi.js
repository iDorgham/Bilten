/**
 * Mock API service for development when backend is not available
 */

// Mock users data for authentication
const mockUsers = [
  {
    id: 1,
    email: 'admin@bilten.com',
    password: 'admin123', // In real app, this would be hashed
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'user@bilten.com',
    password: 'user123',
    first_name: 'Regular',
    last_name: 'User',
    role: 'user',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    email: 'organizer@bilten.com',
    password: 'organizer123',
    first_name: 'Event',
    last_name: 'Organizer',
    role: 'organizer',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock events data - Techno Events in Egypt featuring international and local artists
const mockEvents = [
  {
    id: "550e8400-e29b-41d4-a716-446655440101",
    title: "Artbat - Deep Techno Journey",
    description: "Experience the hypnotic deep techno sounds of Artbat in an immersive night of electronic music at Cairo's premier venue.",
    category: "deep-techno",
    venue_name: "Cairo Opera House",
    venue_address: "Gezira Island, Cairo, Egypt",
    start_date: "2025-03-15T21:00:00Z",
    end_date: "2025-03-16T03:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 2500,
    is_free: false,
    base_price: 1500.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop",
    organizer_first_name: "Ahmed",
    organizer_last_name: "Hassan"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440102",
    title: "Amr Diab - The Plateau Concert",
    description: "The legendary Amr Diab returns with his greatest hits and new songs in an exclusive concert at the iconic venue.",
    category: "concert",
    venue_name: "New Administrative Capital Arena",
    venue_address: "New Administrative Capital, Cairo, Egypt",
    start_date: "2025-02-20T20:00:00Z",
    end_date: "2025-02-20T23:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 15000,
    is_free: false,
    base_price: 800.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop",
    organizer_first_name: "Rotana",
    organizer_last_name: "Music"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440103",
    title: "Anyma - Melodic Techno Experience",
    description: "Join Anyma for a spiritual journey through melodic techno rhythms and organic sounds that will move your soul.",
    category: "melodic-techno",
    venue_name: "Sahel Beach Club",
    venue_address: "North Coast, Egypt",
    start_date: "2025-02-28T22:00:00Z",
    end_date: "2025-03-01T04:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 1200,
    is_free: false,
    base_price: 1000.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    organizer_first_name: "Cosmic",
    organizer_last_name: "Events"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440104",
    title: "Solomun - Organic House Sunset",
    description: "Experience Solomun's signature organic house sounds as the sun sets over the Red Sea in this magical evening.",
    category: "organic-house",
    venue_name: "El Gouna Marina",
    venue_address: "El Gouna, Red Sea, Egypt",
    start_date: "2025-03-10T18:00:00Z",
    end_date: "2025-03-11T01:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 1500,
    is_free: false,
    base_price: 1200.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop",
    organizer_first_name: "Electronic",
    organizer_last_name: "Nights"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440105",
    title: "Mohamed Hamaki - Live in Alexandria",
    description: "Egypt's beloved superstar Mohamed Hamaki performs his greatest hits in a spectacular concert by the Mediterranean.",
    category: "concert",
    venue_name: "Alexandria Opera House",
    venue_address: "Alexandria, Egypt",
    start_date: "2025-02-15T21:00:00Z",
    end_date: "2025-02-16T00:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 3000,
    is_free: false,
    base_price: 600.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop",
    organizer_first_name: "Culture",
    organizer_last_name: "Wheel"
  },
  {
    id: 6,
    title: "Miss Monique - Progressive Techno Night",
    description: "Miss Monique brings her signature progressive techno sound to Egypt for an unforgettable night of electronic music.",
    category: "progressive-techno",
    venue_name: "Almaza Bay",
    venue_address: "North Coast, Egypt",
    start_date: "2025-03-20T23:00:00Z",
    end_date: "2025-03-21T06:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 2000,
    is_free: false,
    base_price: 900.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop",
    organizer_first_name: "Sunset",
    organizer_last_name: "Sessions"
  },
  {
    id: 7,
    title: "Korolova - Melodic Techno Journey",
    description: "Experience the enchanting melodic techno sounds of Korolova in an intimate setting under the stars.",
    category: "melodic-techno",
    venue_name: "Dahab Beach Resort",
    venue_address: "Dahab, South Sinai, Egypt",
    start_date: "2025-03-25T20:00:00Z",
    end_date: "2025-03-26T02:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 800,
    is_free: false,
    base_price: 700.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    organizer_first_name: "Red Sea",
    organizer_last_name: "Events"
  },
  {
    id: 8,
    title: "Adriatique - Deep House Sunset",
    description: "Adriatique brings their signature deep house sound to the Red Sea for a magical sunset session.",
    category: "deep-house",
    venue_name: "Hurghada Marina",
    venue_address: "Hurghada, Red Sea, Egypt",
    start_date: "2025-04-05T17:00:00Z",
    end_date: "2025-04-05T23:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 1000,
    is_free: false,
    base_price: 800.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop",
    organizer_first_name: "Marina",
    organizer_last_name: "Events"
  },
  {
    id: 9,
    title: "CamelPhat - Progressive House Night",
    description: "CamelPhat delivers their chart-topping progressive house hits in an electrifying performance.",
    category: "progressive-house",
    venue_name: "Cairo Festival City",
    venue_address: "New Cairo, Egypt",
    start_date: "2025-04-12T22:00:00Z",
    end_date: "2025-04-13T04:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 3000,
    is_free: false,
    base_price: 1100.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    organizer_first_name: "Festival",
    organizer_last_name: "City"
  },
  {
    id: 10,
    title: "Monolink - Live Techno Experience",
    description: "Monolink combines live guitar and vocals with melodic techno for a unique and unforgettable performance.",
    category: "live-techno",
    venue_name: "Zamalek Art Center",
    venue_address: "Zamalek, Cairo, Egypt",
    start_date: "2025-04-20T21:00:00Z",
    end_date: "2025-04-21T02:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 1500,
    is_free: false,
    base_price: 950.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop",
    organizer_first_name: "Art",
    organizer_last_name: "Center"
  },
  {
    id: 11,
    title: "Boris Brejcha - High-Tech Minimal",
    description: "Experience Boris Brejcha's signature high-tech minimal sound in an electrifying night of electronic music.",
    category: "minimal-techno",
    venue_name: "Cairo International Conference Center",
    venue_address: "Nasr City, Cairo, Egypt",
    start_date: "2025-04-25T22:00:00Z",
    end_date: "2025-04-26T05:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 3500,
    is_free: false,
    base_price: 1300.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop",
    organizer_first_name: "Minimal",
    organizer_last_name: "Nights"
  },
  {
    id: 12,
    title: "Tale Of Us - Afterlife Experience",
    description: "Tale Of Us brings their iconic Afterlife sound to Egypt for a transcendent musical journey.",
    category: "melodic-techno",
    venue_name: "Pyramids of Giza",
    venue_address: "Giza, Egypt",
    start_date: "2025-05-01T20:00:00Z",
    end_date: "2025-05-02T03:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 5000,
    is_free: false,
    base_price: 1800.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    organizer_first_name: "Afterlife",
    organizer_last_name: "Egypt"
  },
  {
    id: 13,
    title: "Amelie Lens - Industrial Techno",
    description: "Amelie Lens delivers her signature industrial techno sound in an intense night of electronic music.",
    category: "industrial-techno",
    venue_name: "Cairo Industrial Zone",
    venue_address: "Helwan, Cairo, Egypt",
    start_date: "2025-05-08T23:00:00Z",
    end_date: "2025-05-09T06:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 2000,
    is_free: false,
    base_price: 1000.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    organizer_first_name: "Industrial",
    organizer_last_name: "Beats"
  },
  {
    id: 14,
    title: "Charlotte de Witte - Rave on the Nile",
    description: "Charlotte de Witte brings her high-energy techno to the banks of the Nile for an unforgettable rave experience.",
    category: "hard-techno",
    venue_name: "Nile River Cruise",
    venue_address: "Cairo, Egypt",
    start_date: "2025-05-15T21:00:00Z",
    end_date: "2025-05-16T04:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 800,
    is_free: false,
    base_price: 1400.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop",
    organizer_first_name: "Nile",
    organizer_last_name: "Raves"
  },
  {
    id: 15,
    title: "Nina Kraviz - Acid Techno Night",
    description: "Nina Kraviz delivers her signature acid techno sound in an intimate underground setting.",
    category: "acid-techno",
    venue_name: "Cairo Underground",
    venue_address: "Downtown Cairo, Egypt",
    start_date: "2025-05-22T22:00:00Z",
    end_date: "2025-05-23T05:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 600,
    is_free: false,
    base_price: 850.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop",
    organizer_first_name: "Underground",
    organizer_last_name: "Collective"
  },
  {
    id: 16,
    title: "I Hate Models - Industrial Rave",
    description: "I Hate Models brings his industrial techno sound to Egypt for an intense rave experience.",
    category: "industrial-techno",
    venue_name: "Alexandria Port Warehouse",
    venue_address: "Alexandria Port, Egypt",
    start_date: "2025-05-29T23:00:00Z",
    end_date: "2025-05-30T07:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 1200,
    is_free: false,
    base_price: 950.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop",
    organizer_first_name: "Port",
    organizer_last_name: "Raves"
  },
  {
    id: 17,
    title: "Kobosil - Hard Techno Session",
    description: "Kobosil delivers his signature hard techno sound in an intense night of electronic music.",
    category: "hard-techno",
    venue_name: "Luxor Temple Grounds",
    venue_address: "Luxor, Egypt",
    start_date: "2025-06-05T20:00:00Z",
    end_date: "2025-06-06T03:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 1500,
    is_free: false,
    base_price: 1200.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    organizer_first_name: "Ancient",
    organizer_last_name: "Beats"
  },
  {
    id: 18,
    title: "Reinier Zonneveld - Live Techno",
    description: "Reinier Zonneveld performs live techno with his signature hardware setup for an authentic electronic experience.",
    category: "live-techno",
    venue_name: "Aswan Dam",
    venue_address: "Aswan, Egypt",
    start_date: "2025-06-12T21:00:00Z",
    end_date: "2025-06-13T02:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 1000,
    is_free: false,
    base_price: 1100.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    organizer_first_name: "Dam",
    organizer_last_name: "Techno"
  },
  {
    id: 19,
    title: "999999999 - Industrial Hardcore",
    description: "999999999 brings their industrial hardcore sound to Egypt for an intense night of electronic music.",
    category: "industrial-hardcore",
    venue_name: "Suez Canal Zone",
    venue_address: "Suez, Egypt",
    start_date: "2025-06-19T22:00:00Z",
    end_date: "2025-06-20T06:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 800,
    is_free: false,
    base_price: 900.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop",
    organizer_first_name: "Canal",
    organizer_last_name: "Beats"
  },
  {
    id: 20,
    title: "Dax J - Hard Techno Masterclass",
    description: "Dax J delivers his signature hard techno sound in an intense masterclass of electronic music.",
    category: "hard-techno",
    venue_name: "Sharm El Sheikh Beach",
    venue_address: "Sharm El Sheikh, South Sinai, Egypt",
    start_date: "2025-06-26T20:00:00Z",
    end_date: "2025-06-27T03:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 2000,
    is_free: false,
    base_price: 1300.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop",
    organizer_first_name: "Sinai",
    organizer_last_name: "Techno"
  },
  {
    id: 21,
    title: "Klangkuenstler - Hard Techno Night",
    description: "Klangkuenstler brings his hard techno sound to Egypt for an unforgettable night of electronic music.",
    category: "hard-techno",
    venue_name: "Marsa Alam Desert",
    venue_address: "Marsa Alam, Red Sea, Egypt",
    start_date: "2025-07-03T21:00:00Z",
    end_date: "2025-07-04T04:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 1500,
    is_free: false,
    base_price: 1150.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop",
    organizer_first_name: "Desert",
    organizer_last_name: "Raves"
  },
  {
    id: 22,
    title: "Alignment - Hard Techno Experience",
    description: "Alignment delivers his signature hard techno sound in an intense night of electronic music.",
    category: "hard-techno",
    venue_name: "Dahab Canyon",
    venue_address: "Dahab, South Sinai, Egypt",
    start_date: "2025-07-10T22:00:00Z",
    end_date: "2025-07-11T05:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 700,
    is_free: false,
    base_price: 950.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    organizer_first_name: "Canyon",
    organizer_last_name: "Beats"
  },
  {
    id: 23,
    title: "Kobosil - Industrial Techno",
    description: "Kobosil brings his industrial techno sound to Egypt for an intense night of electronic music.",
    category: "industrial-techno",
    venue_name: "Cairo Metro Underground",
    venue_address: "Cairo, Egypt",
    start_date: "2025-07-17T23:00:00Z",
    end_date: "2025-07-18T06:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 500,
    is_free: false,
    base_price: 800.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop",
    organizer_first_name: "Metro",
    organizer_last_name: "Underground"
  },
  {
    id: 24,
    title: "I Hate Models - Acid Techno",
    description: "I Hate Models delivers his acid techno sound in an intimate underground setting.",
    category: "acid-techno",
    venue_name: "Alexandria Catacombs",
    venue_address: "Alexandria, Egypt",
    start_date: "2025-07-24T22:00:00Z",
    end_date: "2025-07-25T05:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 300,
    is_free: false,
    base_price: 750.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop",
    organizer_first_name: "Catacombs",
    organizer_last_name: "Techno"
  },
  {
    id: 25,
    title: "999999999 - Industrial Hardcore Finale",
    description: "999999999 brings their industrial hardcore sound to Egypt for the final night of the techno season.",
    category: "industrial-hardcore",
    venue_name: "Giza Pyramids Sound & Light",
    venue_address: "Giza, Egypt",
    start_date: "2025-07-31T20:00:00Z",
    end_date: "2025-08-01T04:00:00Z",
    timezone: "Africa/Cairo",
    max_attendees: 3000,
    is_free: false,
    base_price: 1600.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    organizer_first_name: "Pyramids",
    organizer_last_name: "Techno"
  }
];

// Mock articles data - Egypt techno music events focused
const mockArticles = [
  {
    id: 1,
    title: "North Coast Summer 2025: The Ultimate Techno Destination",
    excerpt: "Discover why Egypt's North Coast is becoming the hottest spot for techno music festivals and beach parties this summer.",
    content: "The North Coast of Egypt is transforming into a world-class techno music destination. From Sahel to Almaza Bay, venues are hosting international DJs like Artbat, Anyma, Miss Monique, and creating unforgettable experiences. This summer promises to be the biggest yet with confirmed performances from Solomun, Korolova, and many more...",
    category: "music",
    author: "Techno Scene Egypt",
    published_at: "2025-01-10T10:00:00Z",
    featured_image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
    view_count: 2850,
    read_time: 8,
    tags: ["techno", "North Coast", "festivals", "Egypt"]
  },
  {
    id: 2,
    title: "El Gouna: The Red Sea's Rising Techno Hub",
    excerpt: "How El Gouna is establishing itself as Egypt's premier destination for organic house and techno sunset sessions.",
    content: "El Gouna Marina has become synonymous with world-class organic house and techno music. The stunning Red Sea backdrop combined with international DJ talent like Solomun and Adriatique creates magical sunset sessions that attract music lovers from across the region. Upcoming events include...",
    category: "music",
    author: "Red Sea Events",
    published_at: "2025-01-08T14:30:00Z",
    featured_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop",
    view_count: 1890,
    read_time: 6,
    tags: ["El Gouna", "Red Sea", "organic house", "sunset sessions"]
  },
  {
    id: 3,
    title: "Cairo's Techno Renaissance: From Opera House to Underground Venues",
    excerpt: "Exploring Cairo's diverse techno scene from classical venues to cutting-edge electronic music spaces.",
    content: "Cairo's techno scene is experiencing a renaissance. The iconic Cairo Opera House now hosts deep techno artists like Artbat, while underground venues in Zamalek showcase live techno acts like Monolink. The city's rich musical heritage is blending with contemporary electronic sounds...",
    category: "music",
    author: "Cairo Techno Guide",
    published_at: "2025-01-05T16:00:00Z",
    featured_image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=400&fit=crop",
    view_count: 3200,
    read_time: 10,
    tags: ["Cairo", "techno", "Opera House", "underground venues"]
  },
  {
    id: 4,
    title: "Amr Diab's New Administrative Capital Concert: A Historic Moment",
    excerpt: "The Plateau's upcoming concert at Egypt's New Administrative Capital Arena marks a new era for Egyptian entertainment.",
    content: "Amr Diab's announcement of his concert at the New Administrative Capital Arena has sent waves of excitement across Egypt. This historic venue will host one of the country's biggest superstars in what promises to be a landmark event for Egyptian entertainment...",
    category: "music",
    author: "Entertainment Weekly Egypt",
    published_at: "2025-01-03T12:00:00Z",
    featured_image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
    view_count: 4500,
    read_time: 7,
    tags: ["Amr Diab", "New Administrative Capital", "concert", "Egyptian music"]
  },
  {
    id: 5,
    title: "The Rise of Melodic Techno in Egypt: A Cultural Movement",
    excerpt: "How melodic techno music is connecting Egypt with global electronic music culture and creating a new musical identity.",
    content: "Melodic techno music is more than just a genre in Egypt - it's a cultural movement. Artists like Anyma, Korolova, and Monolink are leading the charge, bringing international electronic sounds to Egyptian audiences and creating a bridge between cultures. The North Coast venues have become the epicenter of this movement...",
    category: "music",
    author: "Electronic Rhythms Egypt",
    published_at: "2025-01-01T18:00:00Z",
    featured_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    view_count: 2100,
    read_time: 9,
    tags: ["melodic techno", "electronic music", "cultural movement", "Egypt"]
  },
  {
    id: 6,
    title: "Mohamed Hamaki: Keeping Egyptian Pop Alive",
    excerpt: "How Egypt's beloved superstar continues to captivate audiences and inspire a new generation of musicians.",
    content: "Mohamed Hamaki has become synonymous with Egyptian pop music. His performances at venues like Alexandria Opera House continue to draw passionate crowds. The artist's ability to blend traditional Arabic music with contemporary pop sounds has made him a cultural ambassador for modern Egyptian music...",
    category: "music",
    author: "Pop Scene Egypt",
    published_at: "2024-12-28T20:00:00Z",
    featured_image_url: "https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop",
    view_count: 1750,
    read_time: 8,
    tags: ["Mohamed Hamaki", "Egyptian pop", "Arabic music", "Alexandria"]
  }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockEventsAPI = {
  getAll: async (params = {}) => {
    await delay(500); // Simulate network delay
    
    let filteredEvents = [...mockEvents];
    
    // Apply filters
    if (params.category && params.category !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.category === params.category);
    }
    
    if (params.status) {
      filteredEvents = filteredEvents.filter(event => event.status === params.status);
    }
    
    // Pagination
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const offset = (page - 1) * limit;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);
    
    return {
      data: {
        data: {
          events: paginatedEvents,
          pagination: {
            page,
            limit,
            total: filteredEvents.length,
            pages: Math.ceil(filteredEvents.length / limit)
          }
        }
      }
    };
  },
  
  getById: async (id) => {
    await delay(300);
    // Handle both string and numeric IDs
    const event = mockEvents.find(e => e.id === id || e.id === parseInt(id));
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    return {
      data: {
        data: {
          event,
          tickets: [
            {
              id: 1,
              event_id: event.id,
              name: "General Admission",
              price: event.base_price,
              quantity_available: 100,
              is_active: true
            }
          ]
        }
      }
    };
  },
  
  create: async (eventData) => {
    await delay(800);
    const newEvent = {
      id: mockEvents.length + 1,
      ...eventData,
      status: 'draft',
      organizer_first_name: 'Current',
      organizer_last_name: 'User'
    };
    
    mockEvents.push(newEvent);
    
    return {
      data: {
        data: { event: newEvent }
      }
    };
  }
};

export const mockArticlesAPI = {
  getAll: async (params = {}) => {
    await delay(400);
    
    let filteredArticles = [...mockArticles];
    
    if (params.category && params.category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === params.category);
    }
    
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredArticles = filteredArticles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.excerpt.toLowerCase().includes(searchTerm)
      );
    }
    
    return {
      data: {
        data: {
          articles: filteredArticles,
          pagination: {
            page: 1,
            limit: 10,
            total: filteredArticles.length,
            pages: 1
          }
        }
      }
    };
  },
  
  getById: async (id) => {
    await delay(300);
    const article = mockArticles.find(a => a.id === parseInt(id));
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    // Get related articles (same category, excluding current article)
    const relatedArticles = mockArticles
      .filter(a => a.id !== parseInt(id) && a.category === article.category)
      .slice(0, 3);
    
    return {
      data: {
        data: { 
          article,
          relatedArticles
        }
      }
    };
  }
};

export const mockWishlistAPI = {
  addToWishlist: async (eventId) => {
    await delay(200);
    return { data: { success: true } };
  },
  
  removeFromWishlist: async (eventId) => {
    await delay(200);
    return { data: { success: true } };
  },
  
  getWishlist: async () => {
    await delay(300);
    return {
      data: {
        data: {
          events: mockEvents.slice(0, 2), // Return first 2 events as wishlisted
          pagination: { page: 1, limit: 10, total: 2, pages: 1 }
        }
      }
    };
  },
  
  checkWishlistStatus: async (eventIds) => {
    await delay(200);
    const ids = Array.isArray(eventIds) ? eventIds : [eventIds];
    const status = {};
    ids.forEach(id => {
      status[id] = Math.random() > 0.5; // Random wishlist status
    });
    
    return {
      data: {
        data: { wishlistStatus: status }
      }
    };
  }
};

// Mock Authentication API
export const mockAuthAPI = {
  login: async (credentials) => {
    await delay(800); // Simulate network delay
    
    const { email, password } = credentials;
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw {
        response: {
          data: {
            message: 'Invalid email or password',
            error: 'AUTHENTICATION_FAILED'
          },
          status: 401
        }
      };
    }
    
    // Generate mock JWT token
    const token = `mock_jwt_token_${user.id}_${Date.now()}`;
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      data: {
        data: {
          user: userWithoutPassword,
          token: token
        },
        message: 'Login successful'
      }
    };
  },
  
  register: async (userData) => {
    await delay(1000);
    
    const { email, password, first_name, last_name } = userData;
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw {
        response: {
          data: {
            message: 'User with this email already exists',
            error: 'USER_EXISTS'
          },
          status: 409
        }
      };
    }
    
    // Create new user
    const newUser = {
      id: mockUsers.length + 1,
      email,
      password,
      first_name,
      last_name,
      role: 'user',
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    
    // Generate mock JWT token
    const token = `mock_jwt_token_${newUser.id}_${Date.now()}`;
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = newUser;
    
    return {
      data: {
        data: {
          user: userWithoutPassword,
          token: token
        },
        message: 'Registration successful'
      }
    };
  },
  
  logout: async () => {
    await delay(300);
    return {
      data: {
        message: 'Logout successful'
      }
    };
  },
  
  changePassword: async (passwordData) => {
    await delay(500);
    return {
      data: {
        message: 'Password changed successfully'
      }
    };
  },
  
  forgotPassword: async ({ email }) => {
    await delay(600);
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      throw {
        response: {
          data: {
            message: 'User not found',
            error: 'USER_NOT_FOUND'
          },
          status: 404
        }
      };
    }
    
    return {
      data: {
        message: 'Password reset email sent'
      }
    };
  },
  
  resetPassword: async ({ token, newPassword }) => {
    await delay(500);
    return {
      data: {
        message: 'Password reset successful'
      }
    };
  },
  
  verifyEmail: async ({ token }) => {
    await delay(400);
    return {
      data: {
        message: 'Email verified successfully'
      }
    };
  },
  
  resendVerification: async ({ email }) => {
    await delay(400);
    return {
      data: {
        message: 'Verification email sent'
      }
    };
  }
};

// Export mock APIs
export const mockAPI = {
  events: mockEventsAPI,
  articles: mockArticlesAPI,
  wishlist: mockWishlistAPI,
  auth: mockAuthAPI
};
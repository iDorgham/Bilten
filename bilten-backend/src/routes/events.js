const express = require('express');
const router = express.Router();

// Mock events data
const events = [
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
    id: "live-event-test-001",
    title: "Live Test Event - Electronic Music Night",
    description: "A test event that is currently live for testing the scanner functionality.",
    category: "electronic",
    venue_name: "Test Venue",
    venue_address: "Test Address, Test City",
    start_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Started 2 hours ago
    end_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // Ends in 4 hours
    timezone: "UTC",
    max_attendees: 500,
    is_free: false,
    base_price: 50.00,
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    organizer_first_name: "Test",
    organizer_last_name: "Organizer"
  }
];

// Get all events
router.get('/', (req, res) => {
  const { category, status, page = 1, limit = 10 } = req.query;
  
  let filteredEvents = [...events];
  
  if (category && category !== 'all') {
    filteredEvents = filteredEvents.filter(event => event.category === category);
  }
  
  if (status) {
    filteredEvents = filteredEvents.filter(event => event.status === status);
  }
  
  const offset = (page - 1) * limit;
  const paginatedEvents = filteredEvents.slice(offset, offset + parseInt(limit));
  
  res.json({
    data: {
      events: paginatedEvents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredEvents.length,
        pages: Math.ceil(filteredEvents.length / limit)
      }
    }
  });
});

// Get event by ID
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  
  if (!event) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Event not found'
    });
  }
  
  res.json({
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
  });
});

// Create event
router.post('/', (req, res) => {
  const newEvent = {
    id: `event_${Date.now()}`,
    ...req.body,
    status: 'draft',
    organizer_first_name: 'Current',
    organizer_last_name: 'User'
  };
  
  events.push(newEvent);
  
  res.status(201).json({
    data: { event: newEvent }
  });
});

module.exports = router;

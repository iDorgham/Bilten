const testEvents = {
  published: {
    title: 'Test Published Event',
    description: 'This is a test published event for automated testing',
    category: 'test-category',
    venueName: 'Test Venue',
    venueAddress: 'Test Address, Test City',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 7 days + 3 hours
    timezone: 'UTC',
    maxAttendees: 100,
    isFree: false,
    basePrice: 50.00,
    status: 'published',
  },
  draft: {
    title: 'Test Draft Event',
    description: 'This is a test draft event for automated testing',
    category: 'test-category',
    venueName: 'Test Venue 2',
    venueAddress: 'Test Address 2, Test City',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 14 days + 2 hours
    timezone: 'UTC',
    maxAttendees: 200,
    isFree: true,
    basePrice: 0,
    status: 'draft',
  },
  past: {
    title: 'Test Past Event',
    description: 'This is a test past event for automated testing',
    category: 'test-category',
    venueName: 'Test Venue 3',
    venueAddress: 'Test Address 3, Test City',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 7 days ago + 3 hours
    timezone: 'UTC',
    maxAttendees: 150,
    isFree: false,
    basePrice: 75.00,
    status: 'published',
  },
};

const createTestEvent = (eventData, organizerId) => {
  return {
    title: eventData.title,
    description: eventData.description,
    category: eventData.category,
    venue_name: eventData.venueName,
    venue_address: eventData.venueAddress,
    start_date: eventData.startDate,
    end_date: eventData.endDate,
    timezone: eventData.timezone,
    max_attendees: eventData.maxAttendees,
    is_free: eventData.isFree,
    base_price: eventData.basePrice,
    status: eventData.status,
    organizer_id: organizerId,
    created_at: new Date(),
    updated_at: new Date(),
  };
};

const createAllTestEvents = (organizerId) => {
  const events = {};
  
  for (const [key, eventData] of Object.entries(testEvents)) {
    events[key] = createTestEvent(eventData, organizerId);
  }
  
  return events;
};

module.exports = {
  testEvents,
  createTestEvent,
  createAllTestEvents,
};
/**
 * Utility functions for generating SEO-friendly slugs
 */

/**
 * Generate a slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The slug
 */
export const generateSlug = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate an event slug from event data
 * @param {Object} event - The event object
 * @returns {string} - The event slug
 */
export const generateEventSlug = (event) => {
  if (!event) return '';
  
  const { title, location, date } = event;
  
  // Extract artist name from title (assuming format: "Artist - Event Name")
  const artistName = title.includes(' - ') ? title.split(' - ')[0] : title;
  
  // Generate location slug
  const locationSlug = generateSlug(location);
  
  // Format date as Month-Year
  const eventDate = new Date(date);
  const monthYear = eventDate.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  }).replace(' ', '-');
  
  // Combine all parts
  const eventSlug = `${generateSlug(artistName)}-${locationSlug}-${monthYear}`;
  
  return eventSlug;
};

/**
 * Extract event ID from a slug
 * @param {string} slug - The event slug
 * @returns {string|null} - The event ID if found, null otherwise
 */
export const extractEventIdFromSlug = (slug) => {
  // This function will be used to find the event by slug
  // For now, we'll need to implement a mapping or search function
  return null;
};

/**
 * Create a mapping of slugs to event IDs
 * @param {Array} events - Array of event objects
 * @returns {Object} - Mapping of slugs to event IDs
 */
export const createSlugToIdMapping = (events) => {
  const mapping = {};
  
  events.forEach(event => {
    const slug = generateEventSlug(event);
    mapping[slug] = event.id;
  });
  
  return mapping;
};

/**
 * Test function to demonstrate slug generation
 * This can be removed in production
 */
export const testSlugGeneration = () => {
  const testEvents = [
    {
      id: "550e8400-e29b-41d4-a716-446655440102",
      title: 'Amr Diab - The Plateau Concert',
      date: '2025-02-20',
      location: 'New Administrative Capital Arena'
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440101",
      title: 'Artbat - Deep Techno Journey',
      date: '2025-03-15',
      location: 'Cairo Opera House'
    }
  ];
  
  console.log('Slug generation test:');
  testEvents.forEach(event => {
    const slug = generateEventSlug(event);
    console.log(`${event.title} -> /events/${slug}`);
  });
  
  return testEvents;
};

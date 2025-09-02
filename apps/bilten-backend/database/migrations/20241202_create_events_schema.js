/**
 * Migration: Create Events Schema
 * 
 * This migration creates the events table and related indexes
 * for the event search and filtering functionality.
 */

const up = async (client) => {
  // Create events table
  await client.query(`
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      tags JSONB DEFAULT '[]',
      
      -- Venue information
      venue_name VARCHAR(255) NOT NULL,
      venue_address TEXT NOT NULL,
      location POINT,
      city VARCHAR(100),
      country VARCHAR(100),
      
      -- Date and time
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE,
      timezone VARCHAR(50) DEFAULT 'UTC',
      
      -- Pricing
      base_price DECIMAL(10,2) DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'USD',
      is_free BOOLEAN DEFAULT false,
      
      -- Event details
      max_attendees INTEGER,
      available_tickets INTEGER,
      status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
      is_featured BOOLEAN DEFAULT false,
      
      -- Media
      cover_image_url VARCHAR(500),
      
      -- Organizer
      organizer_id UUID NOT NULL,
      organizer_first_name VARCHAR(100),
      organizer_last_name VARCHAR(100),
      organizer_verified BOOLEAN DEFAULT false,
      
      -- Analytics
      popularity_score FLOAT DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      bookmark_count INTEGER DEFAULT 0,
      registration_count INTEGER DEFAULT 0,
      
      -- Audit fields
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Create indexes for efficient searching and filtering
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);',
    'CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);',
    'CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);',
    'CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);',
    'CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);',
    'CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);',
    'CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);',
    'CREATE INDEX IF NOT EXISTS idx_events_free ON events(is_free);',
    'CREATE INDEX IF NOT EXISTS idx_events_price ON events(base_price);',
    'CREATE INDEX IF NOT EXISTS idx_events_popularity ON events(popularity_score);',
    'CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);',
    'CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST(location);',
    
    // Composite indexes for common query patterns
    'CREATE INDEX IF NOT EXISTS idx_events_status_start_date ON events(status, start_date);',
    'CREATE INDEX IF NOT EXISTS idx_events_category_status ON events(category, status);',
    'CREATE INDEX IF NOT EXISTS idx_events_city_status ON events(city, status);',
    'CREATE INDEX IF NOT EXISTS idx_events_featured_status ON events(is_featured, status);',
    'CREATE INDEX IF NOT EXISTS idx_events_free_status ON events(is_free, status);',
    
    // Full-text search indexes
    'CREATE INDEX IF NOT EXISTS idx_events_title_gin ON events USING GIN(to_tsvector(\'english\', title));',
    'CREATE INDEX IF NOT EXISTS idx_events_description_gin ON events USING GIN(to_tsvector(\'english\', description));',
    'CREATE INDEX IF NOT EXISTS idx_events_venue_gin ON events USING GIN(to_tsvector(\'english\', venue_name));',
    
    // JSONB indexes for tags
    'CREATE INDEX IF NOT EXISTS idx_events_tags_gin ON events USING GIN(tags);'
  ];

  for (const indexQuery of indexes) {
    await client.query(indexQuery);
  }

  // Create updated_at trigger function if it doesn't exist
  await client.query(`
    CREATE OR REPLACE FUNCTION update_events_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Create trigger for updated_at column
  await client.query(`
    DROP TRIGGER IF EXISTS update_events_updated_at ON events;
    CREATE TRIGGER update_events_updated_at
      BEFORE UPDATE ON events
      FOR EACH ROW
      EXECUTE FUNCTION update_events_updated_at();
  `);

  // Insert sample events for testing
  await client.query(`
    INSERT INTO events (
      id, title, description, category, tags,
      venue_name, venue_address, city, country,
      start_date, end_date, timezone,
      base_price, currency, is_free,
      max_attendees, available_tickets, status, is_featured,
      cover_image_url,
      organizer_id, organizer_first_name, organizer_last_name, organizer_verified,
      popularity_score, view_count, bookmark_count, registration_count
    ) VALUES 
    (
      '550e8400-e29b-41d4-a716-446655440101',
      'Artbat - Deep Techno Journey',
      'Experience the hypnotic deep techno sounds of Artbat in an immersive night of electronic music at Cairo''s premier venue.',
      'deep-techno',
      '["electronic", "techno", "dance", "nightlife"]',
      'Cairo Opera House',
      'Gezira Island, Cairo, Egypt',
      'Cairo',
      'Egypt',
      '2025-03-15T21:00:00Z',
      '2025-03-16T03:00:00Z',
      'Africa/Cairo',
      1500.00,
      'EGP',
      false,
      2500,
      2500,
      'published',
      true,
      'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?w=800&h=400&fit=crop',
      'org-001',
      'Ahmed',
      'Hassan',
      true,
      8.5,
      1250,
      89,
      234
    ),
    (
      'live-event-test-001',
      'Live Test Event - Electronic Music Night',
      'A test event that is currently live for testing the scanner functionality.',
      'electronic',
      '["electronic", "test", "live"]',
      'Test Venue',
      'Test Address, Test City, Test Country',
      'Test City',
      'Test Country',
      NOW() - INTERVAL '2 hours',
      NOW() + INTERVAL '4 hours',
      'UTC',
      50.00,
      'USD',
      false,
      500,
      477,
      'published',
      false,
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
      'org-002',
      'Test',
      'Organizer',
      false,
      6.2,
      45,
      12,
      23
    ),
    (
      gen_random_uuid(),
      'Jazz Night at Blue Note',
      'An intimate evening of contemporary jazz featuring local and international artists.',
      'jazz',
      '["jazz", "live-music", "intimate"]',
      'Blue Note Jazz Club',
      '131 W 3rd St, New York, NY 10012, USA',
      'New York',
      'USA',
      '2025-02-20T20:00:00Z',
      '2025-02-20T23:30:00Z',
      'America/New_York',
      75.00,
      'USD',
      false,
      150,
      150,
      'published',
      true,
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
      'org-003',
      'Maria',
      'Rodriguez',
      true,
      7.8,
      320,
      45,
      67
    ),
    (
      gen_random_uuid(),
      'Free Outdoor Concert Series',
      'Join us for a free outdoor concert featuring emerging local artists in the beautiful city park.',
      'indie',
      '["indie", "outdoor", "free", "local-artists"]',
      'Central Park Bandshell',
      'Central Park, New York, NY, USA',
      'New York',
      'USA',
      '2025-02-25T15:00:00Z',
      '2025-02-25T18:00:00Z',
      'America/New_York',
      0.00,
      'USD',
      true,
      1000,
      1000,
      'published',
      false,
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop',
      'org-004',
      'John',
      'Smith',
      false,
      5.5,
      180,
      25,
      89
    )
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('Events schema created successfully with sample data');
};

const down = async (client) => {
  // Drop trigger
  await client.query(`DROP TRIGGER IF EXISTS update_events_updated_at ON events;`);
  
  // Drop function
  await client.query(`DROP FUNCTION IF EXISTS update_events_updated_at() CASCADE;`);
  
  // Drop table
  await client.query(`DROP TABLE IF EXISTS events CASCADE;`);
  
  console.log('Events schema dropped successfully');
};

module.exports = {
  up,
  down,
};
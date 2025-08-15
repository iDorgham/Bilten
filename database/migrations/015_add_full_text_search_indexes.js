exports.up = function(knex) {
  return knex.raw(`
    -- Events FTS
    ALTER TABLE events ADD COLUMN IF NOT EXISTS fts_title tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS fts_description tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', description)) STORED;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS fts_venue tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', venue_name || ' ' || venue_address)) STORED;
    
    CREATE INDEX IF NOT EXISTS events_fts_title_idx ON events USING GIN (fts_title);
    CREATE INDEX IF NOT EXISTS events_fts_description_idx ON events USING GIN (fts_description);
    CREATE INDEX IF NOT EXISTS events_fts_venue_idx ON events USING GIN (fts_venue);
    CREATE INDEX IF NOT EXISTS events_fts_combined_idx ON events USING GIN (
      fts_title || fts_description || fts_venue
    );
    
    -- Articles FTS
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS fts_title tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS fts_content tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS fts_excerpt tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', excerpt)) STORED;
    
    CREATE INDEX IF NOT EXISTS articles_fts_title_idx ON articles USING GIN (fts_title);
    CREATE INDEX IF NOT EXISTS articles_fts_content_idx ON articles USING GIN (fts_content);
    CREATE INDEX IF NOT EXISTS articles_fts_excerpt_idx ON articles USING GIN (fts_excerpt);
    CREATE INDEX IF NOT EXISTS articles_fts_combined_idx ON articles USING GIN (
      fts_title || fts_content || fts_excerpt
    );
    
    -- Users FTS
    ALTER TABLE users ADD COLUMN IF NOT EXISTS fts_name tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', first_name || ' ' || last_name)) STORED;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS fts_bio tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', COALESCE(bio, ''))) STORED;
    
    CREATE INDEX IF NOT EXISTS users_fts_name_idx ON users USING GIN (fts_name);
    CREATE INDEX IF NOT EXISTS users_fts_bio_idx ON users USING GIN (fts_bio);
    CREATE INDEX IF NOT EXISTS users_fts_combined_idx ON users USING GIN (
      fts_name || fts_bio
    );
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    DROP INDEX IF EXISTS events_fts_combined_idx;
    DROP INDEX IF EXISTS events_fts_title_idx;
    DROP INDEX IF EXISTS events_fts_description_idx;
    DROP INDEX IF EXISTS events_fts_venue_idx;
    
    DROP INDEX IF EXISTS articles_fts_combined_idx;
    DROP INDEX IF EXISTS articles_fts_title_idx;
    DROP INDEX IF EXISTS articles_fts_content_idx;
    DROP INDEX IF EXISTS articles_fts_excerpt_idx;
    
    DROP INDEX IF EXISTS users_fts_combined_idx;
    DROP INDEX IF EXISTS users_fts_name_idx;
    DROP INDEX IF EXISTS users_fts_bio_idx;
    
    ALTER TABLE events DROP COLUMN IF EXISTS fts_title;
    ALTER TABLE events DROP COLUMN IF EXISTS fts_description;
    ALTER TABLE events DROP COLUMN IF EXISTS fts_venue;
    
    ALTER TABLE articles DROP COLUMN IF EXISTS fts_title;
    ALTER TABLE articles DROP COLUMN IF EXISTS fts_content;
    ALTER TABLE articles DROP COLUMN IF EXISTS fts_excerpt;
    
    ALTER TABLE users DROP COLUMN IF EXISTS fts_name;
    ALTER TABLE users DROP COLUMN IF EXISTS fts_bio;
  `);
};

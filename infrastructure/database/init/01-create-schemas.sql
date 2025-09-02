-- Bilten Platform Database Schema Initialization
-- Creates all schemas and basic structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas for different domains
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS authentication;
CREATE SCHEMA IF NOT EXISTS events;
CREATE SCHEMA IF NOT EXISTS tickets;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS financial;
CREATE SCHEMA IF NOT EXISTS branding;
CREATE SCHEMA IF NOT EXISTS assets;
CREATE SCHEMA IF NOT EXISTS system;
CREATE SCHEMA IF NOT EXISTS audit;

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'organizer', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'live', 'completed', 'cancelled');
CREATE TYPE event_visibility AS ENUM ('public', 'private', 'unlisted');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE ticket_status AS ENUM ('available', 'reserved', 'sold', 'cancelled', 'refunded');

-- Grant permissions to bilten_user
GRANT USAGE ON SCHEMA users TO bilten_user;
GRANT USAGE ON SCHEMA authentication TO bilten_user;
GRANT USAGE ON SCHEMA events TO bilten_user;
GRANT USAGE ON SCHEMA tickets TO bilten_user;
GRANT USAGE ON SCHEMA payments TO bilten_user;
GRANT USAGE ON SCHEMA financial TO bilten_user;
GRANT USAGE ON SCHEMA branding TO bilten_user;
GRANT USAGE ON SCHEMA assets TO bilten_user;
GRANT USAGE ON SCHEMA system TO bilten_user;
GRANT USAGE ON SCHEMA audit TO bilten_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA users TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA authentication TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA events TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tickets TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA payments TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA financial TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA branding TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA assets TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA system TO bilten_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO bilten_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA users TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA authentication TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA events TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA tickets TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA payments TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA financial TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA branding TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA assets TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA system TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO bilten_user;
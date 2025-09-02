-- Branding and Customization Tables
-- Add branding support to the Bilten application

-- Create organizer branding settings table
CREATE TABLE IF NOT EXISTS organizer_branding (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER REFERENCES users(id) UNIQUE,
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    secondary_color VARCHAR(7) DEFAULT '#1e293b',
    accent_color VARCHAR(7) DEFAULT '#10b981',
    font_family VARCHAR(100) DEFAULT 'Inter, sans-serif',
    custom_css TEXT,
    custom_domain VARCHAR(255),
    domain_verified BOOLEAN DEFAULT FALSE,
    domain_ssl_enabled BOOLEAN DEFAULT FALSE,
    brand_guidelines JSONB DEFAULT '{}',
    apply_to_all_events BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add branding columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS branding_logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS branding_primary_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS branding_secondary_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS branding_accent_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS branding_font_family VARCHAR(100),
ADD COLUMN IF NOT EXISTS branding_custom_css TEXT,
ADD COLUMN IF NOT EXISTS use_organizer_branding BOOLEAN DEFAULT TRUE;

-- Create branding templates table
CREATE TABLE IF NOT EXISTS branding_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create custom domain verification table
CREATE TABLE IF NOT EXISTS domain_verifications (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER REFERENCES users(id),
    domain VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) NOT NULL,
    verification_method VARCHAR(50) DEFAULT 'dns', -- dns, file, meta
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organizer_id, domain)
);

-- Create brand compliance audit table
CREATE TABLE IF NOT EXISTS brand_compliance_audits (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER REFERENCES users(id),
    event_id INTEGER REFERENCES events(id),
    audit_type VARCHAR(50) NOT NULL, -- 'automatic', 'manual', 'scheduled'
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    issues_found JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default branding templates
INSERT INTO branding_templates (name, description, template_data, category) VALUES
(
    'Modern Minimal',
    'Clean, contemporary design with focus on content',
    '{
        "colors": {
            "primary": "#3b82f6",
            "secondary": "#1e293b",
            "accent": "#10b981"
        },
        "fonts": {
            "primary": "Inter, sans-serif",
            "secondary": "Inter, sans-serif"
        },
        "layout": {
            "headerStyle": "minimal",
            "footerStyle": "simple",
            "backgroundStyle": "gradient"
        }
    }',
    'modern'
),
(
    'Corporate Professional',
    'Professional design suitable for business events',
    '{
        "colors": {
            "primary": "#1e293b",
            "secondary": "#475569",
            "accent": "#0ea5e9"
        },
        "fonts": {
            "primary": "Roboto, sans-serif",
            "secondary": "Open Sans, sans-serif"
        },
        "layout": {
            "headerStyle": "corporate",
            "footerStyle": "detailed",
            "backgroundStyle": "solid"
        }
    }',
    'corporate'
),
(
    'Creative Vibrant',
    'Bold, colorful design for creative events',
    '{
        "colors": {
            "primary": "#e11d48",
            "secondary": "#7c2d12",
            "accent": "#f97316"
        },
        "fonts": {
            "primary": "Poppins, sans-serif",
            "secondary": "Montserrat, sans-serif"
        },
        "layout": {
            "headerStyle": "creative",
            "footerStyle": "artistic",
            "backgroundStyle": "pattern"
        }
    }',
    'creative'
),
(
    'Elegant Classic',
    'Sophisticated design with elegant typography',
    '{
        "colors": {
            "primary": "#7c3aed",
            "secondary": "#3730a3",
            "accent": "#a855f7"
        },
        "fonts": {
            "primary": "Playfair Display, serif",
            "secondary": "Merriweather, serif"
        },
        "layout": {
            "headerStyle": "elegant",
            "footerStyle": "classic",
            "backgroundStyle": "texture"
        }
    }',
    'elegant'
)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizer_branding_organizer_id ON organizer_branding(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_branding ON events(organizer_id, use_organizer_branding);
CREATE INDEX IF NOT EXISTS idx_domain_verifications_domain ON domain_verifications(domain);
CREATE INDEX IF NOT EXISTS idx_brand_compliance_organizer ON brand_compliance_audits(organizer_id);

-- Create function to automatically apply branding to new events
CREATE OR REPLACE FUNCTION apply_organizer_branding()
RETURNS TRIGGER AS $$
BEGIN
    -- If the event should use organizer branding, copy the branding settings
    IF NEW.use_organizer_branding = TRUE THEN
        UPDATE events 
        SET 
            branding_logo_url = ob.logo_url,
            branding_primary_color = ob.primary_color,
            branding_secondary_color = ob.secondary_color,
            branding_accent_color = ob.accent_color,
            branding_font_family = ob.font_family,
            branding_custom_css = ob.custom_css
        FROM organizer_branding ob
        WHERE events.id = NEW.id 
        AND ob.organizer_id = NEW.organizer_id
        AND ob.apply_to_all_events = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to apply branding to new events
DROP TRIGGER IF EXISTS trigger_apply_organizer_branding ON events;
CREATE TRIGGER trigger_apply_organizer_branding
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION apply_organizer_branding();
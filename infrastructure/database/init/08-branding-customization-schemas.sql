-- Enhanced Branding and Customization Schemas
-- Task 2.3: Build branding and customization schemas
-- Requirements: 2.1, 5.1, 9.1

-- Additional branding related types
CREATE TYPE asset_category AS ENUM ('logo', 'favicon', 'banner', 'background', 'icon', 'font', 'template', 'theme');
CREATE TYPE domain_status AS ENUM ('pending', 'verifying', 'verified', 'failed', 'expired');
CREATE TYPE ssl_status AS ENUM ('pending', 'provisioning', 'active', 'failed', 'expired', 'revoked');
CREATE TYPE brand_consistency_level AS ENUM ('strict', 'moderate', 'flexible', 'disabled');
CREATE TYPE template_type AS ENUM ('email', 'ticket', 'invoice', 'certificate', 'landing_page');

-- Enhanced brand settings with comprehensive configuration
CREATE TABLE branding.brand_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    brand_description TEXT,
    primary_color VARCHAR(7) NOT NULL DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#666666',
    accent_color VARCHAR(7) DEFAULT '#0066cc',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#333333',
    font_primary VARCHAR(100) DEFAULT 'Arial, sans-serif',
    font_secondary VARCHAR(100) DEFAULT 'Georgia, serif',
    font_size_base INTEGER DEFAULT 16,
    border_radius INTEGER DEFAULT 4,
    spacing_unit INTEGER DEFAULT 8,
    consistency_level brand_consistency_level DEFAULT 'moderate',
    consistency_score INTEGER DEFAULT 0,
    auto_apply_branding BOOLEAN DEFAULT TRUE,
    custom_css TEXT,
    custom_js TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organizer_id)
);

-- Brand asset storage and management
CREATE TABLE branding.brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    brand_config_id UUID REFERENCES branding.brand_configurations(id) ON DELETE CASCADE,
    asset_category asset_category NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    dimensions JSONB DEFAULT '{}', -- width, height for images
    alt_text VARCHAR(255),
    usage_guidelines TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    status asset_status DEFAULT 'active',
    version INTEGER DEFAULT 1,
    parent_asset_id UUID REFERENCES branding.brand_assets(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom domain and SSL certificate management
CREATE TABLE branding.custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    subdomain VARCHAR(100), -- For subdomains like events.example.com
    is_primary BOOLEAN DEFAULT FALSE,
    status domain_status DEFAULT 'pending',
    verification_token VARCHAR(255),
    verification_method VARCHAR(50) DEFAULT 'dns', -- 'dns', 'file', 'email'
    dns_records JSONB DEFAULT '{}',
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    ssl_certificate_id UUID,
    redirect_to_https BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SSL certificate tracking and management
CREATE TABLE branding.ssl_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES branding.custom_domains(id) ON DELETE CASCADE,
    certificate_authority VARCHAR(100),
    certificate_type VARCHAR(50) DEFAULT 'lets_encrypt', -- 'lets_encrypt', 'custom', 'wildcard'
    status ssl_status DEFAULT 'pending',
    issued_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    certificate_data TEXT, -- PEM encoded certificate
    private_key_hash VARCHAR(255), -- Hash of private key for verification
    chain_data TEXT, -- Certificate chain
    renewal_attempts INTEGER DEFAULT 0,
    last_renewal_attempt TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand guidelines and consistency rules
CREATE TABLE branding.brand_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    guideline_name VARCHAR(255) NOT NULL,
    guideline_type VARCHAR(100) NOT NULL, -- 'color', 'typography', 'spacing', 'imagery'
    rules JSONB NOT NULL, -- Specific rules and constraints
    enforcement_level VARCHAR(20) DEFAULT 'warning', -- 'strict', 'warning', 'suggestion'
    is_active BOOLEAN DEFAULT TRUE,
    violation_count INTEGER DEFAULT 0,
    last_violation TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand asset version control system
CREATE TABLE branding.asset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES branding.brand_assets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    checksum VARCHAR(64), -- SHA-256 hash
    change_description TEXT,
    changed_by UUID REFERENCES users.users(id),
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(asset_id, version_number)
);

-- Brand template management
CREATE TABLE branding.brand_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_type template_type NOT NULL,
    template_content TEXT NOT NULL, -- HTML/CSS content
    template_variables JSONB DEFAULT '{}', -- Available variables
    preview_image_url TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand consistency scoring and monitoring
CREATE TABLE branding.consistency_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL, -- 'event', 'email', 'ticket', etc.
    resource_id UUID NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    color_score INTEGER DEFAULT 0,
    typography_score INTEGER DEFAULT 0,
    imagery_score INTEGER DEFAULT 0,
    layout_score INTEGER DEFAULT 0,
    violations JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand usage analytics
CREATE TABLE branding.brand_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    dimensions JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom CSS/JS snippets management
CREATE TABLE branding.custom_code_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    snippet_name VARCHAR(255) NOT NULL,
    snippet_type VARCHAR(20) NOT NULL, -- 'css', 'js', 'html'
    code_content TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    applies_to VARCHAR(100) DEFAULT 'all', -- 'all', 'events', 'tickets', etc.
    load_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand color palette management
CREATE TABLE branding.color_palettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    palette_name VARCHAR(255) NOT NULL,
    colors JSONB NOT NULL, -- Array of color objects with names and hex values
    is_primary BOOLEAN DEFAULT FALSE,
    usage_guidelines TEXT,
    accessibility_score INTEGER DEFAULT 0, -- WCAG compliance score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Typography settings and font management
CREATE TABLE branding.typography_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
    font_family_primary VARCHAR(255) NOT NULL,
    font_family_secondary VARCHAR(255),
    font_family_monospace VARCHAR(255) DEFAULT 'monospace',
    font_weights JSONB DEFAULT '{}', -- Available font weights
    font_sizes JSONB DEFAULT '{}', -- Typography scale
    line_heights JSONB DEFAULT '{}',
    letter_spacing JSONB DEFAULT '{}',
    font_loading_strategy VARCHAR(50) DEFAULT 'swap',
    web_font_urls JSONB DEFAULT '[]',
    fallback_fonts JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organizer_id)
);

-- Create indexes for performance
CREATE INDEX idx_brand_configurations_organizer ON branding.brand_configurations(organizer_id);
CREATE INDEX idx_brand_configurations_active ON branding.brand_configurations(is_active);
CREATE INDEX idx_brand_assets_organizer ON branding.brand_assets(organizer_id);
CREATE INDEX idx_brand_assets_category ON branding.brand_assets(asset_category, is_primary);
CREATE INDEX idx_brand_assets_config ON branding.brand_assets(brand_config_id);
CREATE INDEX idx_custom_domains_organizer ON branding.custom_domains(organizer_id);
CREATE INDEX idx_custom_domains_domain ON branding.custom_domains(domain_name);
CREATE INDEX idx_custom_domains_status ON branding.custom_domains(status, expires_at);
CREATE INDEX idx_ssl_certificates_domain ON branding.ssl_certificates(domain_id);
CREATE INDEX idx_ssl_certificates_status ON branding.ssl_certificates(status, expires_at);
CREATE INDEX idx_ssl_certificates_renewal ON branding.ssl_certificates(auto_renew, expires_at);
CREATE INDEX idx_brand_guidelines_organizer ON branding.brand_guidelines(organizer_id);
CREATE INDEX idx_brand_guidelines_type ON branding.brand_guidelines(guideline_type, is_active);
CREATE INDEX idx_asset_versions_asset ON branding.asset_versions(asset_id);
CREATE INDEX idx_asset_versions_current ON branding.asset_versions(asset_id, is_current);
CREATE INDEX idx_brand_templates_organizer ON branding.brand_templates(organizer_id);
CREATE INDEX idx_brand_templates_type ON branding.brand_templates(template_type, is_active);
CREATE INDEX idx_consistency_scores_organizer ON branding.consistency_scores(organizer_id);
CREATE INDEX idx_consistency_scores_resource ON branding.consistency_scores(resource_type, resource_id);
CREATE INDEX idx_brand_analytics_organizer ON branding.brand_analytics(organizer_id);
CREATE INDEX idx_brand_analytics_metric ON branding.brand_analytics(metric_name, recorded_at);
CREATE INDEX idx_custom_code_organizer ON branding.custom_code_snippets(organizer_id);
CREATE INDEX idx_custom_code_type ON branding.custom_code_snippets(snippet_type, is_active);
CREATE INDEX idx_color_palettes_organizer ON branding.color_palettes(organizer_id);
CREATE INDEX idx_color_palettes_primary ON branding.color_palettes(is_primary);
CREATE INDEX idx_typography_organizer ON branding.typography_settings(organizer_id);

-- Full-text search indexes
CREATE INDEX idx_brand_assets_search ON branding.brand_assets USING GIN(
    to_tsvector('english', asset_name || ' ' || COALESCE(alt_text, ''))
);

CREATE INDEX idx_brand_templates_search ON branding.brand_templates USING GIN(
    to_tsvector('english', template_name)
);

-- Grant permissions on new tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA branding TO bilten_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA branding TO bilten_user;
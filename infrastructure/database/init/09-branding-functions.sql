-- Branding and Customization Functions and Triggers
-- Task 2.3: Supporting functions for branding and customization

-- Function to calculate brand consistency score
CREATE OR REPLACE FUNCTION calculate_brand_consistency_score(
    p_organizer_id UUID,
    p_resource_type VARCHAR(100),
    p_resource_id UUID,
    p_content JSONB
)
RETURNS INTEGER AS $$
DECLARE
    overall_score INTEGER := 100;
    color_score INTEGER := 100;
    typography_score INTEGER := 100;
    imagery_score INTEGER := 100;
    layout_score INTEGER := 100;
    brand_config RECORD;
    guidelines RECORD;
    violations JSONB := '[]'::JSONB;
BEGIN
    -- Get brand configuration
    SELECT * INTO brand_config
    FROM branding.brand_configurations
    WHERE organizer_id = p_organizer_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN 0; -- No brand configuration
    END IF;

    -- Check color consistency
    FOR guidelines IN 
        SELECT * FROM branding.brand_guidelines 
        WHERE organizer_id = p_organizer_id 
        AND guideline_type = 'color' 
        AND is_active = TRUE
    LOOP
        -- Implement color checking logic here
        -- This is a simplified example
        IF p_content ? 'colors' THEN
            -- Check if colors match brand palette
            -- Deduct points for violations
            color_score := color_score - 10;
            violations := violations || jsonb_build_object(
                'type', 'color',
                'message', 'Non-brand colors detected',
                'severity', guidelines.enforcement_level
            );
        END IF;
    END LOOP;

    -- Check typography consistency
    FOR guidelines IN 
        SELECT * FROM branding.brand_guidelines 
        WHERE organizer_id = p_organizer_id 
        AND guideline_type = 'typography' 
        AND is_active = TRUE
    LOOP
        -- Check font usage
        IF p_content ? 'fonts' THEN
            typography_score := typography_score - 5;
            violations := violations || jsonb_build_object(
                'type', 'typography',
                'message', 'Non-brand fonts detected',
                'severity', guidelines.enforcement_level
            );
        END IF;
    END LOOP;

    -- Calculate overall score
    overall_score := (color_score + typography_score + imagery_score + layout_score) / 4;

    -- Insert or update consistency score
    INSERT INTO branding.consistency_scores (
        organizer_id,
        resource_type,
        resource_id,
        overall_score,
        color_score,
        typography_score,
        imagery_score,
        layout_score,
        violations
    ) VALUES (
        p_organizer_id,
        p_resource_type,
        p_resource_id,
        overall_score,
        color_score,
        typography_score,
        imagery_score,
        layout_score,
        violations
    )
    ON CONFLICT (organizer_id, resource_type, resource_id) 
    DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        color_score = EXCLUDED.color_score,
        typography_score = EXCLUDED.typography_score,
        imagery_score = EXCLUDED.imagery_score,
        layout_score = EXCLUDED.layout_score,
        violations = EXCLUDED.violations,
        calculated_at = NOW();

    -- Update brand configuration consistency score
    UPDATE branding.brand_configurations
    SET consistency_score = (
        SELECT AVG(overall_score)::INTEGER
        FROM branding.consistency_scores
        WHERE organizer_id = p_organizer_id
    )
    WHERE organizer_id = p_organizer_id;

    RETURN overall_score;
END;
$$ LANGUAGE plpgsql;

-- Function to create new asset version
CREATE OR REPLACE FUNCTION create_asset_version(
    p_asset_id UUID,
    p_file_path TEXT,
    p_file_size BIGINT,
    p_checksum VARCHAR(64),
    p_change_description TEXT,
    p_changed_by UUID
)
RETURNS UUID AS $$
DECLARE
    new_version INTEGER;
    version_id UUID;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO new_version
    FROM branding.asset_versions
    WHERE asset_id = p_asset_id;

    -- Mark all previous versions as not current
    UPDATE branding.asset_versions
    SET is_current = FALSE
    WHERE asset_id = p_asset_id;

    -- Create new version
    INSERT INTO branding.asset_versions (
        asset_id,
        version_number,
        file_path,
        file_size,
        checksum,
        change_description,
        changed_by,
        is_current
    ) VALUES (
        p_asset_id,
        new_version,
        p_file_path,
        p_file_size,
        p_checksum,
        p_change_description,
        p_changed_by,
        TRUE
    ) RETURNING id INTO version_id;

    -- Update main asset record
    UPDATE branding.brand_assets
    SET file_path = p_file_path,
        file_size = p_file_size,
        version = new_version,
        updated_at = NOW()
    WHERE id = p_asset_id;

    RETURN version_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify domain ownership
CREATE OR REPLACE FUNCTION verify_domain_ownership(
    p_domain_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    domain_rec RECORD;
    verification_success BOOLEAN := FALSE;
BEGIN
    -- Get domain details
    SELECT * INTO domain_rec
    FROM branding.custom_domains
    WHERE id = p_domain_id AND status = 'verifying';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- This would typically involve DNS lookup or file verification
    -- For now, we'll simulate verification logic
    
    -- Simulate DNS verification
    IF domain_rec.verification_method = 'dns' THEN
        -- Check if DNS record exists (simulated)
        verification_success := TRUE;
    ELSIF domain_rec.verification_method = 'file' THEN
        -- Check if verification file exists (simulated)
        verification_success := TRUE;
    END IF;

    IF verification_success THEN
        -- Update domain status
        UPDATE branding.custom_domains
        SET status = 'verified',
            verified_at = NOW()
        WHERE id = p_domain_id;

        -- Record analytics
        INSERT INTO branding.brand_analytics (
            organizer_id,
            metric_name,
            metric_value,
            dimensions
        ) VALUES (
            domain_rec.organizer_id,
            'domain_verified',
            1,
            jsonb_build_object('domain', domain_rec.domain_name)
        );

        RETURN TRUE;
    ELSE
        -- Update failure status
        UPDATE branding.custom_domains
        SET status = 'failed'
        WHERE id = p_domain_id;

        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to provision SSL certificate
CREATE OR REPLACE FUNCTION provision_ssl_certificate(
    p_domain_id UUID
)
RETURNS UUID AS $$
DECLARE
    domain_rec RECORD;
    cert_id UUID;
BEGIN
    -- Get verified domain
    SELECT * INTO domain_rec
    FROM branding.custom_domains
    WHERE id = p_domain_id AND status = 'verified';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Domain not found or not verified';
    END IF;

    -- Create SSL certificate record
    INSERT INTO branding.ssl_certificates (
        domain_id,
        certificate_authority,
        certificate_type,
        status,
        expires_at,
        auto_renew
    ) VALUES (
        p_domain_id,
        'Let''s Encrypt',
        'lets_encrypt',
        'provisioning',
        NOW() + INTERVAL '90 days',
        TRUE
    ) RETURNING id INTO cert_id;

    -- Update domain with SSL certificate reference
    UPDATE branding.custom_domains
    SET ssl_certificate_id = cert_id
    WHERE id = p_domain_id;

    -- This would typically trigger actual SSL provisioning
    -- For now, we'll simulate success
    UPDATE branding.ssl_certificates
    SET status = 'active',
        issued_at = NOW()
    WHERE id = cert_id;

    RETURN cert_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check SSL certificate expiration
CREATE OR REPLACE FUNCTION check_ssl_expiration()
RETURNS INTEGER AS $$
DECLARE
    expiring_count INTEGER := 0;
    cert_rec RECORD;
BEGIN
    -- Find certificates expiring in 30 days
    FOR cert_rec IN
        SELECT * FROM branding.ssl_certificates
        WHERE status = 'active'
        AND auto_renew = TRUE
        AND expires_at <= NOW() + INTERVAL '30 days'
    LOOP
        -- Trigger renewal process
        UPDATE branding.ssl_certificates
        SET renewal_attempts = renewal_attempts + 1,
            last_renewal_attempt = NOW()
        WHERE id = cert_rec.id;

        expiring_count := expiring_count + 1;

        -- This would typically trigger actual renewal process
        -- For now, we'll simulate renewal
        IF cert_rec.renewal_attempts < 3 THEN
            UPDATE branding.ssl_certificates
            SET expires_at = NOW() + INTERVAL '90 days',
                renewal_attempts = 0
            WHERE id = cert_rec.id;
        END IF;
    END LOOP;

    RETURN expiring_count;
END;
$$ LANGUAGE plpgsql;

-- Function to apply brand template
CREATE OR REPLACE FUNCTION apply_brand_template(
    p_organizer_id UUID,
    p_template_type template_type,
    p_resource_id UUID,
    p_variables JSONB DEFAULT '{}'
)
RETURNS TEXT AS $$
DECLARE
    template_rec RECORD;
    rendered_content TEXT;
    brand_config RECORD;
BEGIN
    -- Get brand configuration
    SELECT * INTO brand_config
    FROM branding.brand_configurations
    WHERE organizer_id = p_organizer_id AND is_active = TRUE;

    -- Get template
    SELECT * INTO template_rec
    FROM branding.brand_templates
    WHERE organizer_id = p_organizer_id
    AND template_type = p_template_type
    AND is_active = TRUE
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Simple template variable replacement
    rendered_content := template_rec.template_content;
    
    -- Replace brand variables
    IF brand_config.id IS NOT NULL THEN
        rendered_content := replace(rendered_content, '{{primary_color}}', brand_config.primary_color);
        rendered_content := replace(rendered_content, '{{secondary_color}}', brand_config.secondary_color);
        rendered_content := replace(rendered_content, '{{brand_name}}', brand_config.brand_name);
        rendered_content := replace(rendered_content, '{{font_primary}}', brand_config.font_primary);
    END IF;

    -- Replace custom variables
    -- This is a simplified implementation
    -- In practice, you'd use a proper template engine

    -- Update template usage
    UPDATE branding.brand_templates
    SET usage_count = usage_count + 1,
        last_used = NOW()
    WHERE id = template_rec.id;

    RETURN rendered_content;
END;
$$ LANGUAGE plpgsql;

-- Function to get brand assets by category
CREATE OR REPLACE FUNCTION get_brand_assets(
    p_organizer_id UUID,
    p_category asset_category DEFAULT NULL
)
RETURNS TABLE (
    asset_id UUID,
    asset_name VARCHAR(255),
    file_path TEXT,
    is_primary BOOLEAN,
    dimensions JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ba.id,
        ba.asset_name,
        ba.file_path,
        ba.is_primary,
        ba.dimensions,
        ba.created_at
    FROM branding.brand_assets ba
    WHERE ba.organizer_id = p_organizer_id
    AND ba.status = 'active'
    AND (p_category IS NULL OR ba.asset_category = p_category)
    ORDER BY ba.is_primary DESC, ba.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_brand_configurations_updated_at
    BEFORE UPDATE ON branding.brand_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_brand_assets_updated_at
    BEFORE UPDATE ON branding.brand_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_custom_domains_updated_at
    BEFORE UPDATE ON branding.custom_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ssl_certificates_updated_at
    BEFORE UPDATE ON branding.ssl_certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_brand_guidelines_updated_at
    BEFORE UPDATE ON branding.brand_guidelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_brand_templates_updated_at
    BEFORE UPDATE ON branding.brand_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_custom_code_snippets_updated_at
    BEFORE UPDATE ON branding.custom_code_snippets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_color_palettes_updated_at
    BEFORE UPDATE ON branding.color_palettes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_typography_settings_updated_at
    BEFORE UPDATE ON branding.typography_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically create asset version on update
CREATE OR REPLACE FUNCTION auto_create_asset_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if file_path changed
    IF OLD.file_path IS DISTINCT FROM NEW.file_path THEN
        PERFORM create_asset_version(
            NEW.id,
            NEW.file_path,
            NEW.file_size,
            md5(NEW.file_path), -- Simple checksum
            'Automatic version created on update',
            NULL -- System update
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brand_assets_version
    AFTER UPDATE ON branding.brand_assets
    FOR EACH ROW EXECUTE FUNCTION auto_create_asset_version();

-- Trigger to update brand consistency score when guidelines change
CREATE OR REPLACE FUNCTION update_consistency_scores_on_guideline_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate all consistency scores for this organizer
    -- This is a simplified trigger - in practice you'd queue this for background processing
    
    IF TG_OP = 'UPDATE' AND OLD.rules IS DISTINCT FROM NEW.rules THEN
        -- Mark scores as needing recalculation
        UPDATE branding.consistency_scores
        SET calculated_at = '1970-01-01'::TIMESTAMP WITH TIME ZONE
        WHERE organizer_id = NEW.organizer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_guidelines_consistency_update
    AFTER UPDATE ON branding.brand_guidelines
    FOR EACH ROW EXECUTE FUNCTION update_consistency_scores_on_guideline_change();
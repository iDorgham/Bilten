const pool = require('../config/database');

class BrandingSettings {
  // Create or update organizer branding settings
  static async createOrUpdate(organizerId, brandingData) {
    const {
      logo_url,
      primary_color,
      secondary_color,
      accent_color,
      font_family,
      custom_css,
      custom_domain,
      brand_guidelines,
      apply_to_all_events = true
    } = brandingData;

    const query = `
      INSERT INTO organizer_branding (
        organizer_id, logo_url, primary_color, secondary_color, 
        accent_color, font_family, custom_css, custom_domain,
        brand_guidelines, apply_to_all_events, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      ON CONFLICT (organizer_id) 
      DO UPDATE SET
        logo_url = EXCLUDED.logo_url,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        accent_color = EXCLUDED.accent_color,
        font_family = EXCLUDED.font_family,
        custom_css = EXCLUDED.custom_css,
        custom_domain = EXCLUDED.custom_domain,
        brand_guidelines = EXCLUDED.brand_guidelines,
        apply_to_all_events = EXCLUDED.apply_to_all_events,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      organizerId, logo_url, primary_color, secondary_color,
      accent_color, font_family, custom_css, custom_domain,
      JSON.stringify(brand_guidelines), apply_to_all_events
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get organizer branding settings
  static async getByOrganizerId(organizerId) {
    const query = `
      SELECT * FROM organizer_branding 
      WHERE organizer_id = $1
    `;
    
    const result = await pool.query(query, [organizerId]);
    if (result.rows.length > 0) {
      const branding = result.rows[0];
      // Parse JSON fields
      branding.brand_guidelines = JSON.parse(branding.brand_guidelines || '{}');
      return branding;
    }
    return null;
  }

  // Apply branding to all organizer events
  static async applyToAllEvents(organizerId) {
    const brandingQuery = `
      SELECT * FROM organizer_branding 
      WHERE organizer_id = $1 AND apply_to_all_events = true
    `;
    
    const brandingResult = await pool.query(brandingQuery, [organizerId]);
    if (brandingResult.rows.length === 0) {
      return { applied: 0, message: 'No branding settings found or auto-apply disabled' };
    }

    const branding = brandingResult.rows[0];
    
    const updateQuery = `
      UPDATE events 
      SET 
        branding_logo_url = $2,
        branding_primary_color = $3,
        branding_secondary_color = $4,
        branding_accent_color = $5,
        branding_font_family = $6,
        branding_custom_css = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE organizer_id = $1
      RETURNING id, title
    `;

    const updateValues = [
      organizerId,
      branding.logo_url,
      branding.primary_color,
      branding.secondary_color,
      branding.accent_color,
      branding.font_family,
      branding.custom_css
    ];

    const updateResult = await pool.query(updateQuery, updateValues);
    
    return {
      applied: updateResult.rows.length,
      events: updateResult.rows,
      message: `Branding applied to ${updateResult.rows.length} events`
    };
  }

  // Validate brand guidelines compliance
  static validateBrandCompliance(brandingData) {
    const errors = [];
    const warnings = [];

    // Color contrast validation
    if (brandingData.primary_color && brandingData.secondary_color) {
      const contrastRatio = this.calculateContrastRatio(
        brandingData.primary_color, 
        brandingData.secondary_color
      );
      
      if (contrastRatio < 4.5) {
        warnings.push({
          field: 'colors',
          message: 'Low contrast ratio between primary and secondary colors. Consider improving accessibility.',
          severity: 'warning'
        });
      }
    }

    // Logo validation
    if (brandingData.logo_url) {
      const logoExtension = brandingData.logo_url.split('.').pop().toLowerCase();
      if (!['png', 'svg', 'jpg', 'jpeg'].includes(logoExtension)) {
        errors.push({
          field: 'logo',
          message: 'Logo must be in PNG, SVG, or JPEG format',
          severity: 'error'
        });
      }
    }

    // Font validation
    const allowedFonts = [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
      'Poppins', 'Playfair Display', 'Merriweather'
    ];
    
    if (brandingData.font_family && !allowedFonts.some(font => 
      brandingData.font_family.includes(font)
    )) {
      warnings.push({
        field: 'font',
        message: 'Consider using web-safe fonts for better compatibility',
        severity: 'warning'
      });
    }

    // Custom CSS validation
    if (brandingData.custom_css) {
      const dangerousPatterns = [
        /javascript:/i,
        /expression\(/i,
        /behavior:/i,
        /@import/i
      ];
      
      const hasDangerousCode = dangerousPatterns.some(pattern => 
        pattern.test(brandingData.custom_css)
      );
      
      if (hasDangerousCode) {
        errors.push({
          field: 'custom_css',
          message: 'Custom CSS contains potentially dangerous code',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Calculate color contrast ratio (simplified)
  static calculateContrastRatio(color1, color2) {
    // This is a simplified implementation
    // In production, you'd want a more robust color contrast calculation
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const luminance1 = (0.299 * r1 + 0.587 * g1 + 0.114 * b1) / 255;
    const luminance2 = (0.299 * r2 + 0.587 * g2 + 0.114 * b2) / 255;
    
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Get custom domain settings
  static async getCustomDomain(organizerId) {
    const query = `
      SELECT custom_domain, domain_verified, domain_ssl_enabled
      FROM organizer_branding 
      WHERE organizer_id = $1
    `;
    
    const result = await pool.query(query, [organizerId]);
    return result.rows[0] || null;
  }

  // Update custom domain verification status
  static async updateDomainVerification(organizerId, verified, sslEnabled = false) {
    const query = `
      UPDATE organizer_branding 
      SET 
        domain_verified = $2,
        domain_ssl_enabled = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE organizer_id = $1
      RETURNING custom_domain, domain_verified, domain_ssl_enabled
    `;
    
    const result = await pool.query(query, [organizerId, verified, sslEnabled]);
    return result.rows[0];
  }
}

module.exports = BrandingSettings;
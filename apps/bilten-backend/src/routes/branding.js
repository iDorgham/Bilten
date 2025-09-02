const express = require('express');
const router = express.Router();
const BrandingSettings = require('../models/BrandingSettings');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/branding');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, SVG) are allowed'));
    }
  }
});

// Get organizer branding settings
router.get('/settings', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const branding = await BrandingSettings.getByOrganizerId(req.user.id);
    
    if (!branding) {
      return res.json({
        success: true,
        data: {
          organizer_id: req.user.id,
          logo_url: null,
          primary_color: '#3b82f6',
          secondary_color: '#1e293b',
          accent_color: '#10b981',
          font_family: 'Inter, sans-serif',
          custom_css: '',
          custom_domain: null,
          brand_guidelines: {},
          apply_to_all_events: true
        }
      });
    }

    res.json({
      success: true,
      data: branding
    });
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branding settings'
    });
  }
});

// Create or update branding settings
router.post('/settings', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const brandingData = req.body;
    
    // Validate branding data
    const validation = BrandingSettings.validateBrandCompliance(brandingData);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Branding validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    const branding = await BrandingSettings.createOrUpdate(req.user.id, brandingData);
    
    // If apply_to_all_events is true, update all organizer events
    if (brandingData.apply_to_all_events) {
      const applyResult = await BrandingSettings.applyToAllEvents(req.user.id);
      
      res.json({
        success: true,
        data: branding,
        applied_to_events: applyResult,
        validation: {
          warnings: validation.warnings
        }
      });
    } else {
      res.json({
        success: true,
        data: branding,
        validation: {
          warnings: validation.warnings
        }
      });
    }
  } catch (error) {
    console.error('Error saving branding settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save branding settings'
    });
  }
});

// Upload logo
router.post('/logo', authenticateToken, requireRole(['organizer', 'admin']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file provided'
      });
    }

    const logoUrl = `/uploads/branding/${req.file.filename}`;
    
    // Update branding settings with new logo
    const currentBranding = await BrandingSettings.getByOrganizerId(req.user.id);
    const brandingData = {
      ...currentBranding,
      logo_url: logoUrl
    };

    const updatedBranding = await BrandingSettings.createOrUpdate(req.user.id, brandingData);

    res.json({
      success: true,
      data: {
        logo_url: logoUrl,
        branding: updatedBranding
      }
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
});

// Apply branding to all events
router.post('/apply-to-events', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const result = await BrandingSettings.applyToAllEvents(req.user.id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error applying branding to events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply branding to events'
    });
  }
});

// Validate branding compliance
router.post('/validate', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const brandingData = req.body;
    const validation = BrandingSettings.validateBrandCompliance(brandingData);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating branding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate branding'
    });
  }
});

// Custom domain management
router.get('/domain', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const domainInfo = await BrandingSettings.getCustomDomain(req.user.id);
    
    res.json({
      success: true,
      data: domainInfo
    });
  } catch (error) {
    console.error('Error fetching domain info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch domain information'
    });
  }
});

// Set custom domain
router.post('/domain', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { custom_domain } = req.body;
    
    if (!custom_domain) {
      return res.status(400).json({
        success: false,
        message: 'Custom domain is required'
      });
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(custom_domain)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid domain format'
      });
    }

    const currentBranding = await BrandingSettings.getByOrganizerId(req.user.id) || {};
    const brandingData = {
      ...currentBranding,
      custom_domain,
      domain_verified: false,
      domain_ssl_enabled: false
    };

    const updatedBranding = await BrandingSettings.createOrUpdate(req.user.id, brandingData);

    res.json({
      success: true,
      data: updatedBranding,
      message: 'Custom domain set. Please verify domain ownership.'
    });
  } catch (error) {
    console.error('Error setting custom domain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set custom domain'
    });
  }
});

// Verify custom domain
router.post('/domain/verify', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    // In a real implementation, this would perform actual domain verification
    // For now, we'll simulate the verification process
    
    const domainInfo = await BrandingSettings.getCustomDomain(req.user.id);
    
    if (!domainInfo || !domainInfo.custom_domain) {
      return res.status(400).json({
        success: false,
        message: 'No custom domain configured'
      });
    }

    // Simulate domain verification (in production, check DNS records, etc.)
    const verified = true; // This would be actual verification logic
    const sslEnabled = true; // This would check SSL certificate

    const updatedDomain = await BrandingSettings.updateDomainVerification(
      req.user.id, 
      verified, 
      sslEnabled
    );

    res.json({
      success: true,
      data: updatedDomain,
      message: verified ? 'Domain verified successfully' : 'Domain verification failed'
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify domain'
    });
  }
});

// Get branding templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const pool = require('../config/database');
    const query = `
      SELECT id, name, description, template_data, category, is_premium
      FROM branding_templates
      ORDER BY category, name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching branding templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branding templates'
    });
  }
});

module.exports = router;
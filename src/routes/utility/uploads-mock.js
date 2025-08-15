const express = require('express');
const { upload, deleteFile } = require('../../utils/s3-mock');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const knex = require('../../utils/database');
const path = require('path');

const router = express.Router();

// Mock CloudFront configuration for development
const MOCK_CLOUDFRONT_DOMAIN = process.env.MOCK_CLOUDFRONT_DOMAIN || 'd1234567890abc.cloudfront.net';
const USE_MOCK_CLOUDFRONT = process.env.USE_MOCK_CLOUDFRONT === 'true';

// Generate mock CloudFront-ready URL
const generateMockCloudFrontUrl = (key) => {
  if (USE_MOCK_CLOUDFRONT) {
    return `https://${MOCK_CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `http://localhost:3001/uploads/mock/${key}`;
};

// Generate mock optimized image URL
const generateMockOptimizedImageUrl = (key, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover'
  } = options;

  const baseUrl = generateMockCloudFrontUrl(key);
  const params = new URLSearchParams();
  
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  if (quality) params.append('q', quality);
  if (format) params.append('f', format);
  if (fit) params.append('fit', fit);
  
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
};

// POST /uploads-mock/event-image - Upload event cover image (mock)
router.post('/event-image', authenticateToken, requireRole(['organizer', 'admin']), (req, res) => {
  // Set upload folder for event images
  req.uploadFolder = 'events/images';
  
  const uploadSingle = upload.single('image');
  
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 5MB.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    try {
      // Generate CloudFront-ready URL (mock)
      const cloudFrontUrl = generateMockCloudFrontUrl(`events/images/${req.file.filename}`);
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: cloudFrontUrl,
          key: `events/images/${req.file.filename}`,
          size: req.file.size,
          mimetype: req.file.mimetype,
          originalName: req.file.originalname,
          optimized_urls: {
            thumbnail: generateMockOptimizedImageUrl(`events/images/${req.file.filename}`, { width: 300, height: 200 }),
            medium: generateMockOptimizedImageUrl(`events/images/${req.file.filename}`, { width: 800, height: 600 }),
            large: generateMockOptimizedImageUrl(`events/images/${req.file.filename}`, { width: 1200, height: 800 })
          }
        }
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process uploaded image'
      });
    }
  });
});

// POST /uploads-mock/event-gallery - Upload multiple images for event gallery (mock)
router.post('/event-gallery', authenticateToken, requireRole(['organizer', 'admin']), (req, res) => {
  // Set upload folder for event gallery images
  req.uploadFolder = 'events/gallery';
  
  const uploadMultiple = upload.array('images', 10); // Max 10 images
  
  uploadMultiple(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 5MB per image.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    try {
      const uploadedFiles = req.files.map(file => {
        const cloudFrontUrl = generateMockCloudFrontUrl(`events/gallery/${file.filename}`);
        return {
          url: cloudFrontUrl,
          key: `events/gallery/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
          originalName: file.originalname,
          optimized_urls: {
            thumbnail: generateMockOptimizedImageUrl(`events/gallery/${file.filename}`, { width: 300, height: 200 }),
            medium: generateMockOptimizedImageUrl(`events/gallery/${file.filename}`, { width: 800, height: 600 }),
            large: generateMockOptimizedImageUrl(`events/gallery/${file.filename}`, { width: 1200, height: 800 })
          }
        };
      });
      
      res.json({
        success: true,
        message: `${uploadedFiles.length} images uploaded successfully`,
        data: {
          files: uploadedFiles
        }
      });
    } catch (error) {
      console.error('Error processing uploads:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process uploaded images'
      });
    }
  });
});

// POST /uploads-mock/profile-image - Upload user profile image (mock)
router.post('/profile-image', authenticateToken, (req, res) => {
  // Set upload folder for profile images
  req.uploadFolder = 'users/profiles';
  
  const uploadSingle = upload.single('image');
  
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 5MB.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    try {
      // Generate CloudFront-ready URL (mock)
      const cloudFrontUrl = generateMockCloudFrontUrl(`users/profiles/${req.file.filename}`);
      
      // Get current profile image to delete old one
      const user = await knex('users')
        .select('profile_image_url')
        .where('id', req.user.id)
        .first();
      
      // Update user profile image URL with CloudFront URL
      await knex('users')
        .where('id', req.user.id)
        .update({ profile_image_url: cloudFrontUrl });
      
      // Delete old profile image if exists (mock)
      if (user.profile_image_url) {
        deleteFile(user.profile_image_url);
      }
      
      res.json({
        success: true,
        message: 'Profile image updated successfully',
        data: {
          url: cloudFrontUrl,
          key: `users/profiles/${req.file.filename}`,
          size: req.file.size,
          mimetype: req.file.mimetype,
          originalName: req.file.originalname,
          optimized_urls: {
            thumbnail: generateMockOptimizedImageUrl(`users/profiles/${req.file.filename}`, { width: 150, height: 150 }),
            medium: generateMockOptimizedImageUrl(`users/profiles/${req.file.filename}`, { width: 300, height: 300 }),
            large: generateMockOptimizedImageUrl(`users/profiles/${req.file.filename}`, { width: 600, height: 600 })
          }
        }
      });
    } catch (error) {
      console.error('Database update error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile image'
      });
    }
  });
});

// DELETE /uploads-mock/delete - Delete uploaded file (mock)
router.delete('/delete', authenticateToken, async (req, res) => {
  const { fileUrl } = req.body;
  
  if (!fileUrl) {
    return res.status(400).json({
      success: false,
      message: 'File URL is required'
    });
  }
  
  try {
    const deleted = await deleteFile(fileUrl);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found or could not be deleted'
      });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

// GET /uploads-mock/optimize - Get optimized image URL (mock)
router.get('/optimize', (req, res) => {
  const { url, width, height, quality, format, fit } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'Image URL is required'
    });
  }
  
  try {
    // Extract key from URL
    let key;
    if (url.includes('cloudfront.net') || url.includes('localhost')) {
      const urlParts = url.split('/');
      key = urlParts.slice(-1)[0].split('?')[0]; // Get filename without query params
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL format'
      });
    }
    
    const optimizedUrl = generateMockOptimizedImageUrl(key, {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      quality: quality ? parseInt(quality) : 80,
      format: format || 'auto',
      fit: fit || 'cover'
    });
    
    res.json({
      success: true,
      data: {
        original_url: url,
        optimized_url: optimizedUrl,
        key: key
      }
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimized URL'
    });
  }
});

// GET /uploads-mock/:folder/:subfolder/:filename - Serve uploaded files
router.get('/mock/:folder/:subfolder/:filename', (req, res) => {
  const { folder, subfolder, filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads', folder, subfolder, filename);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving file:', err);
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  });
});

module.exports = router;
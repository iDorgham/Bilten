const express = require('express');
const { 
  upload, 
  deleteFile, 
  generateCloudFrontUrl, 
  generateOptimizedImageUrl,
  invalidateCloudFrontCache 
} = require('../../utils/s3');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const knex = require('../../utils/database');

const router = express.Router();

// POST /uploads/event-image - Upload event cover image
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
      // Generate CloudFront-ready URL
      const cloudFrontUrl = generateCloudFrontUrl(req.file.key);
      
      // Invalidate CloudFront cache for the new file
      await invalidateCloudFrontCache([req.file.key]);
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: cloudFrontUrl,
          key: req.file.key,
          size: req.file.size,
          mimetype: req.file.mimetype,
          optimized_urls: {
            thumbnail: generateOptimizedImageUrl(req.file.key, { width: 300, height: 200 }),
            medium: generateOptimizedImageUrl(req.file.key, { width: 800, height: 600 }),
            large: generateOptimizedImageUrl(req.file.key, { width: 1200, height: 800 })
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

// POST /uploads/event-gallery - Upload multiple images for event gallery
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
        const cloudFrontUrl = generateCloudFrontUrl(file.key);
        return {
          url: cloudFrontUrl,
          key: file.key,
          size: file.size,
          mimetype: file.mimetype,
          originalName: file.originalname,
          optimized_urls: {
            thumbnail: generateOptimizedImageUrl(file.key, { width: 300, height: 200 }),
            medium: generateOptimizedImageUrl(file.key, { width: 800, height: 600 }),
            large: generateOptimizedImageUrl(file.key, { width: 1200, height: 800 })
          }
        };
      });
      
      // Invalidate CloudFront cache for all uploaded files
      const keys = req.files.map(file => file.key);
      await invalidateCloudFrontCache(keys);
      
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

// POST /uploads/profile-image - Upload user profile image
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
      // Generate CloudFront-ready URL
      const cloudFrontUrl = generateCloudFrontUrl(req.file.key);
      
      // Get current profile image to delete old one
      const user = await knex('users')
        .select('profile_image_url')
        .where('id', req.user.id)
        .first();
      
      // Update user profile image URL with CloudFront URL
      await knex('users')
        .where('id', req.user.id)
        .update({ profile_image_url: cloudFrontUrl });
      
      // Delete old profile image if exists
      if (user.profile_image_url) {
        await deleteFile(user.profile_image_url);
      }
      
      // Invalidate CloudFront cache for the new file
      await invalidateCloudFrontCache([req.file.key]);
      
      res.json({
        success: true,
        message: 'Profile image updated successfully',
        data: {
          url: cloudFrontUrl,
          key: req.file.key,
          size: req.file.size,
          mimetype: req.file.mimetype,
          optimized_urls: {
            thumbnail: generateOptimizedImageUrl(req.file.key, { width: 150, height: 150 }),
            medium: generateOptimizedImageUrl(req.file.key, { width: 300, height: 300 }),
            large: generateOptimizedImageUrl(req.file.key, { width: 600, height: 600 })
          }
        }
      });
    } catch (error) {
      console.error('Database update error:', error);
      
      // Delete uploaded file if database update fails
      await deleteFile(req.file.location);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile image'
      });
    }
  });
});

// DELETE /uploads/delete - Delete uploaded file
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
      // Invalidate CloudFront cache for the deleted file
      const key = fileUrl.split('/').pop().split('?')[0]; // Extract key from URL
      await invalidateCloudFrontCache([key]);
      
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

// GET /uploads/optimize - Get optimized image URL
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
    if (url.includes('cloudfront.net') || url.includes('s3.amazonaws.com')) {
      const urlParts = url.split('/');
      key = urlParts.slice(-1)[0].split('?')[0]; // Get filename without query params
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL format'
      });
    }
    
    const optimizedUrl = generateOptimizedImageUrl(key, {
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

module.exports = router;
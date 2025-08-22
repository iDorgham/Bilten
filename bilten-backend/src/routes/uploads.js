const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Authentication middleware
const { authenticateToken } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on upload type
    let uploadPath = uploadsDir;
    if (req.uploadType === 'profile') {
      uploadPath = path.join(uploadsDir, 'profiles');
    } else if (req.uploadType === 'event') {
      uploadPath = path.join(uploadsDir, 'events');
    } else if (req.uploadType === 'gallery') {
      uploadPath = path.join(uploadsDir, 'gallery');
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files for gallery uploads
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Helper function to generate file URLs
const generateFileUrl = (filename, uploadType) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  return `${baseUrl}/uploads/${uploadType}/${filename}`;
};

// Upload profile image
router.post('/profile-image', authenticateToken, (req, res, next) => {
  req.uploadType = 'profile';
  next();
}, upload.single('image'), handleMulterError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const fileUrl = generateFileUrl(req.file.filename, 'profiles');
    
    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        thumbnail_url: fileUrl, // For now, same as original
        optimized_url: fileUrl  // For now, same as original
      }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload event image
router.post('/event-image', authenticateToken, (req, res, next) => {
  req.uploadType = 'event';
  next();
}, upload.single('image'), handleMulterError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const fileUrl = generateFileUrl(req.file.filename, 'events');
    
    res.json({
      success: true,
      message: 'Event image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        cover_image_url: fileUrl,
        featured_image_url: fileUrl,
        thumbnail_url: fileUrl,
        optimized_url: fileUrl
      }
    });
  } catch (error) {
    console.error('Event image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload event gallery images
router.post('/event-gallery', authenticateToken, (req, res, next) => {
  req.uploadType = 'gallery';
  next();
}, upload.array('images', 10), handleMulterError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const uploadedFiles = req.files.map(file => {
      const fileUrl = generateFileUrl(file.filename, 'gallery');
      return {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: fileUrl,
        thumbnail_url: fileUrl,
        optimized_url: fileUrl
      };
    });

    res.json({
      success: true,
      message: 'Gallery images uploaded successfully',
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Image optimization endpoint (placeholder for now)
router.get('/optimize', (req, res) => {
  try {
    const { url, width, height, quality, format, fit } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // For now, return the original URL as "optimized"
    // In production, this would integrate with a real image optimization service
    res.json({
      success: true,
      message: 'Image optimization completed',
      data: {
        original_url: url,
        optimized_url: url,
        width: width || 'auto',
        height: height || 'auto',
        quality: quality || 'auto',
        format: format || 'auto'
      }
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete uploaded file
router.delete('/delete', authenticateToken, (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    // Extract filename from URL
    const urlParts = fileUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Determine upload type from URL path
    let uploadType = 'events'; // default
    if (fileUrl.includes('/profiles/')) {
      uploadType = 'profiles';
    } else if (fileUrl.includes('/gallery/')) {
      uploadType = 'gallery';
    }
    
    const filePath = path.join(uploadsDir, uploadType, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Delete file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Serve uploaded files statically
router.use('/profiles', express.static(path.join(uploadsDir, 'profiles')));
router.use('/events', express.static(path.join(uploadsDir, 'events')));
router.use('/gallery', express.static(path.join(uploadsDir, 'gallery')));

module.exports = router;

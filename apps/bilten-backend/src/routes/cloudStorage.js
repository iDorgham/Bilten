const express = require('express');
const router = express.Router();
const multer = require('multer');
const CloudStorageService = require('../services/CloudStorageService');
const { authenticateJWT } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

/**
 * @route POST /api/v1/storage/upload
 * @desc Upload file to cloud storage
 * @access Private
 */
router.post('/upload', [
  authenticateJWT,
  upload.single('file'),
  body('folder').optional().isString(),
  body('optimizeImages').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select a file to upload'
      });
    }

    const options = {
      folder: req.body.folder || 'uploads',
      optimizeImages: req.body.optimizeImages !== 'false',
      uploadedBy: req.user.userId
    };

    const result = await CloudStorageService.uploadFile(req.file, options);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    logger.error('File upload failed', { error: error.message });
    res.status(400).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/v1/storage/upload-multiple
 * @desc Upload multiple files to cloud storage
 * @access Private
 */
router.post('/upload-multiple', [
  authenticateJWT,
  upload.array('files', 5),
  body('folder').optional().isString()
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please select files to upload'
      });
    }

    const options = {
      folder: req.body.folder || 'uploads',
      uploadedBy: req.user.userId
    };

    const results = [];
    for (const file of req.files) {
      try {
        const result = await CloudStorageService.uploadFile(file, options);
        results.push(result);
      } catch (error) {
        logger.error('File upload failed', { 
          filename: file.originalname, 
          error: error.message 
        });
        results.push({
          success: false,
          filename: file.originalname,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { files: results },
      message: `${results.filter(r => r.success).length} files uploaded successfully`
    });

  } catch (error) {
    logger.error('Multiple file upload failed', { error: error.message });
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/storage/files
 * @desc Get list of uploaded files
 * @access Private
 */
router.get('/files', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, folder, mimetype } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      folder: folder || null,
      mimetype: mimetype || null
    };

    const files = await CloudStorageService.listFiles(options);
    
    res.status(200).json({
      success: true,
      data: { files },
      pagination: {
        page: options.page,
        limit: options.limit,
        total: files.length
      }
    });

  } catch (error) {
    logger.error('Failed to get files', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve files',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/storage/files/:id
 * @desc Get file information by ID
 * @access Private
 */
router.get('/files/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await CloudStorageService.getFileInfo(id);
    
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist'
      });
    }

    res.status(200).json({
      success: true,
      data: { file }
    });

  } catch (error) {
    logger.error('Failed to get file info', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve file information',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/storage/files/:id
 * @desc Delete file from cloud storage
 * @access Private
 */
router.delete('/files/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get file info first
    const file = await CloudStorageService.getFileInfo(id);
    
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist'
      });
    }

    // Check if user owns the file or is admin
    if (file.uploaded_by !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to delete this file'
      });
    }

    const result = await CloudStorageService.deleteFile(file.path);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    logger.error('File deletion failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to delete file',
      message: error.message
    });
  }
});

/**
 * @route GET /api/v1/storage/cdn/:path(*)
 * @desc Get CDN URL for file
 * @access Public
 */
router.get('/cdn/:path(*)', async (req, res) => {
  try {
    const { path } = req.params;
    
    const cdnUrl = CloudStorageService.getPublicUrl(path);
    
    res.status(200).json({
      success: true,
      data: { cdnUrl }
    });

  } catch (error) {
    logger.error('Failed to generate CDN URL', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate CDN URL',
      message: error.message
    });
  }
});

/**
 * @route POST /api/v1/storage/optimize
 * @desc Optimize existing image files
 * @access Private
 */
router.post('/optimize', [
  authenticateJWT,
  body('fileId').isUUID().withMessage('Valid file ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { fileId } = req.body;
    
    const file = await CloudStorageService.getFileInfo(fileId);
    
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist'
      });
    }

    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only image files can be optimized'
      });
    }

    // Re-optimize the image
    const optimizedUrls = await CloudStorageService.processImage(
      { buffer: file.buffer, mimetype: file.mimetype },
      file.folder,
      file.filename
    );

    // Update file record with new URLs
    await query(
      'UPDATE file_storage.files SET urls = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(optimizedUrls), fileId]
    );

    res.status(200).json({
      success: true,
      data: { optimizedUrls },
      message: 'Image optimized successfully'
    });

  } catch (error) {
    logger.error('Image optimization failed', { error: error.message });
    res.status(500).json({
      error: 'Optimization failed',
      message: error.message
    });
  }
});

module.exports = router;

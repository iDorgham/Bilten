const fs = require('fs');
const path = require('path');

/**
 * Media processing middleware for handling file uploads and optimization
 */
class MediaProcessingMiddleware {
  constructor() {
    this.supportedImageFormats = ['jpeg', 'jpg', 'png', 'webp'];
    this.supportedVideoFormats = ['mp4', 'webm', 'mov'];
    this.maxImageSize = 10 * 1024 * 1024; // 10MB
    this.maxVideoSize = 100 * 1024 * 1024; // 100MB
  }

  /**
   * Validate uploaded files
   */
  validateFiles(req, res, next) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const errors = [];
    const validFiles = [];

    req.files.forEach((file, index) => {
      const validation = this.validateSingleFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push({
          fileIndex: index,
          filename: file.originalname,
          errors: validation.errors
        });
      }
    });

    if (validFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid files found',
        errors: errors
      });
    }

    // Replace files array with only valid files
    req.files = validFiles;
    req.fileValidationErrors = errors;

    next();
  }

  /**
   * Validate a single file
   */
  validateSingleFile(file) {
    const errors = [];
    let isValid = true;

    // Check file size
    if (file.mimetype.startsWith('image/') && file.size > this.maxImageSize) {
      errors.push(`Image file size exceeds ${this.maxImageSize / (1024 * 1024)}MB limit`);
      isValid = false;
    } else if (file.mimetype.startsWith('video/') && file.size > this.maxVideoSize) {
      errors.push(`Video file size exceeds ${this.maxVideoSize / (1024 * 1024)}MB limit`);
      isValid = false;
    }

    // Check file type
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    if (file.mimetype.startsWith('image/')) {
      if (!this.supportedImageFormats.includes(fileExtension)) {
        errors.push(`Unsupported image format. Supported formats: ${this.supportedImageFormats.join(', ')}`);
        isValid = false;
      }
    } else if (file.mimetype.startsWith('video/')) {
      if (!this.supportedVideoFormats.includes(fileExtension)) {
        errors.push(`Unsupported video format. Supported formats: ${this.supportedVideoFormats.join(', ')}`);
        isValid = false;
      }
    }

    // Check for malicious files
    if (this.isSuspiciousFile(file)) {
      errors.push('File appears to be suspicious or potentially malicious');
      isValid = false;
    }

    return { isValid, errors };
  }

  /**
   * Basic security check for suspicious files
   */
  isSuspiciousFile(file) {
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'];
    const filename = file.originalname.toLowerCase();
    
    // Check for suspicious extensions
    for (const ext of suspiciousExtensions) {
      if (filename.endsWith(ext)) {
        return true;
      }
    }

    // Check for double extensions (e.g., image.jpg.exe)
    const parts = filename.split('.');
    if (parts.length > 2) {
      const lastTwo = parts.slice(-2);
      if (suspiciousExtensions.some(ext => lastTwo.includes(ext.substring(1)))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate thumbnails for images (placeholder implementation)
   */
  async generateThumbnails(req, res, next) {
    if (!req.files) {
      return next();
    }

    try {
      for (const file of req.files) {
        if (file.mimetype.startsWith('image/')) {
          // Placeholder for thumbnail generation
          // In a real implementation, you would use a library like Sharp or ImageMagick
          file.thumbnailPath = file.path; // For now, use original as thumbnail
          file.optimizedPath = file.path; // For now, use original as optimized
        }
      }
      next();
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      next(); // Continue even if thumbnail generation fails
    }
  }

  /**
   * Add metadata to uploaded files
   */
  addMetadata(req, res, next) {
    if (!req.files) {
      return next();
    }

    req.files.forEach(file => {
      file.uploadedAt = new Date().toISOString();
      file.uploadedBy = req.user ? req.user.id : null;
      
      // Add image-specific metadata
      if (file.mimetype.startsWith('image/')) {
        file.isImage = true;
        // Placeholder for image dimensions - would use image processing library
        file.dimensions = { width: null, height: null };
      }

      // Add video-specific metadata
      if (file.mimetype.startsWith('video/')) {
        file.isVideo = true;
        // Placeholder for video metadata - would use video processing library
        file.duration = null;
        file.resolution = null;
      }
    });

    next();
  }

  /**
   * Clean up failed uploads
   */
  cleanupOnError(req, res, next) {
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(data) {
      if (res.statusCode >= 400 && req.files) {
        // Clean up uploaded files on error
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupError) {
              console.error('Error cleaning up file:', cleanupError);
            }
          }
        });
      }
      originalSend.call(this, data);
    };

    res.json = function(data) {
      if (res.statusCode >= 400 && req.files) {
        // Clean up uploaded files on error
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupError) {
              console.error('Error cleaning up file:', cleanupError);
            }
          }
        });
      }
      originalJson.call(this, data);
    };

    next();
  }

  /**
   * Virus scanning placeholder
   */
  async scanForViruses(req, res, next) {
    // Placeholder for virus scanning
    // In production, integrate with ClamAV or similar
    if (req.files) {
      for (const file of req.files) {
        // Simulate virus scan
        if (file.originalname.toLowerCase().includes('virus')) {
          return res.status(400).json({
            success: false,
            message: 'File failed security scan',
            filename: file.originalname
          });
        }
      }
    }
    next();
  }
}

const mediaProcessing = new MediaProcessingMiddleware();

module.exports = {
  validateFiles: mediaProcessing.validateFiles.bind(mediaProcessing),
  generateThumbnails: mediaProcessing.generateThumbnails.bind(mediaProcessing),
  addMetadata: mediaProcessing.addMetadata.bind(mediaProcessing),
  cleanupOnError: mediaProcessing.cleanupOnError.bind(mediaProcessing),
  scanForViruses: mediaProcessing.scanForViruses.bind(mediaProcessing)
};
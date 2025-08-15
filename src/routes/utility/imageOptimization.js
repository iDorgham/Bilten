const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const ImageOptimizationService = require('../../services/imageOptimizationService');
const ImageStorageService = require('../../services/ImageStorageService');

const router = express.Router();

// Initialize services
const storageService = new ImageStorageService({
  provider: process.env.STORAGE_PROVIDER || 's3',
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET,
  cloudFront: {
    domain: process.env.CLOUDFRONT_DOMAIN,
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID
  }
});

const optimizationService = new ImageOptimizationService({
  enabled: process.env.IMAGE_OPTIMIZATION_ENABLED !== 'false',
  maxConcurrentJobs: parseInt(process.env.IMAGE_OPTIMIZATION_MAX_JOBS) || 5,
  defaultQuality: parseInt(process.env.IMAGE_OPTIMIZATION_QUALITY) || 80,
  storageService
});

// POST /image-optimization/job - Create optimization job
router.post('/job', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { imageKey, profiles, quality, format, priority } = req.body;

    if (!imageKey) {
      return res.status(400).json({
        success: false,
        message: 'Image key is required'
      });
    }

    // Validate image exists
    try {
      await storageService.downloadImage(imageKey);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const job = await optimizationService.addOptimizationJob(imageKey, {
      profiles: profiles || ['thumbnail', 'small', 'medium'],
      quality: quality || 80,
      format: format || 'webp',
      priority
    });

    res.json({
      success: true,
      message: 'Optimization job created successfully',
      data: {
        jobId: job.id,
        status: job.status,
        imageKey: job.imageKey,
        options: job.options
      }
    });

  } catch (error) {
    console.error('Error creating optimization job:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create optimization job'
    });
  }
});

// GET /image-optimization/job/:jobId - Get job status
router.get('/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = optimizationService.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        imageKey: job.imageKey,
        options: job.options,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        failedAt: job.failedAt,
        error: job.error,
        results: job.results
      }
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status'
    });
  }
});

// GET /image-optimization/queue - Get queue status
router.get('/queue', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const queueStatus = optimizationService.getQueueStatus();

    res.json({
      success: true,
      data: queueStatus
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status'
    });
  }
});

// POST /image-optimization/batch - Create multiple optimization jobs
router.post('/batch', authenticateToken, requireRole(['organizer', 'admin']), async (req, res) => {
  try {
    const { imageKeys, options } = req.body;

    if (!imageKeys || !Array.isArray(imageKeys) || imageKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Image keys array is required'
      });
    }

    if (imageKeys.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 images per batch'
      });
    }

    const jobs = [];
    const errors = [];

    for (const imageKey of imageKeys) {
      try {
        // Validate image exists
        await storageService.downloadImage(imageKey);
        
        const job = await optimizationService.addOptimizationJob(imageKey, options);
        jobs.push({
          jobId: job.id,
          imageKey: job.imageKey,
          status: job.status
        });
      } catch (error) {
        errors.push({
          imageKey,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Created ${jobs.length} optimization jobs`,
      data: {
        jobs,
        errors,
        total: imageKeys.length,
        successful: jobs.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error creating batch optimization jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create batch optimization jobs'
    });
  }
});

// DELETE /image-optimization/job/:jobId - Cancel job
router.delete('/job/:jobId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = optimizationService.cancelJob(jobId);

    if (cancelled) {
      res.json({
        success: true,
        message: 'Job cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel job (may be already processing)'
      });
    }

  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel job'
    });
  }
});

// POST /image-optimization/toggle - Enable/disable optimization service
router.post('/toggle', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Enabled flag must be boolean'
      });
    }

    optimizationService.setEnabled(enabled);

    res.json({
      success: true,
      message: `Image optimization ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        enabled: optimizationService.config.enabled
      }
    });

  } catch (error) {
    console.error('Error toggling optimization service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle optimization service'
    });
  }
});

// GET /image-optimization/health - Health check
router.get('/health', async (req, res) => {
  try {
    const health = await optimizationService.healthCheck();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('Error checking optimization service health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check service health'
    });
  }
});

// GET /image-optimization/recommendations - Get optimization recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { imageKey } = req.query;

    if (!imageKey) {
      return res.status(400).json({
        success: false,
        message: 'Image key is required'
      });
    }

    // Download image to analyze
    const image = await storageService.downloadImage(imageKey);
    const recommendations = [];

    // Check file size
    if (image.size > 1024 * 1024) { // > 1MB
      recommendations.push({
        type: 'size',
        message: 'Image is larger than 1MB, consider optimization',
        priority: 'high',
        currentSize: image.size,
        suggestedAction: 'Optimize to reduce file size'
      });
    }

    // Check format
    const format = image.mimetype.split('/')[1];
    if (format === 'png' && image.size > 500 * 1024) { // PNG > 500KB
      recommendations.push({
        type: 'format',
        message: 'Consider converting PNG to WebP for better compression',
        priority: 'medium',
        currentFormat: format,
        suggestedFormat: 'webp',
        estimatedSavings: '30-50%'
      });
    }

    res.json({
      success: true,
      data: {
        imageKey,
        currentSize: image.size,
        currentFormat: format,
        recommendations
      }
    });

  } catch (error) {
    console.error('Error getting optimization recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optimization recommendations'
    });
  }
});

module.exports = router;

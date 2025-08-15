/**
 * Image Optimization Service
 * Provides optional background image optimization jobs
 */

const sharp = require('sharp');
const { EventEmitter } = require('events');

class ImageOptimizationService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      enabled: config.enabled !== false,
      maxConcurrentJobs: config.maxConcurrentJobs || 5,
      defaultQuality: config.defaultQuality || 80,
      storageService: config.storageService,
      ...config
    };
    
    this.jobQueue = [];
    this.activeJobs = new Map();
    this.jobHistory = [];
    this.metrics = {
      jobsProcessed: 0,
      jobsFailed: 0,
      totalBytesSaved: 0
    };
    
    this.isProcessing = false;
  }

  /**
   * Add image optimization job to queue
   */
  async addOptimizationJob(imageKey, options = {}) {
    if (!this.config.enabled) {
      throw new Error('Image optimization is disabled');
    }

    const job = {
      id: this.generateJobId(),
      imageKey,
      options: {
        profiles: options.profiles || ['thumbnail', 'small', 'medium'],
        quality: options.quality || this.config.defaultQuality,
        format: options.format || 'webp',
        ...options
      },
      status: 'queued',
      createdAt: new Date()
    };

    this.jobQueue.push(job);
    this.emit('job:queued', job);

    if (!this.isProcessing) {
      this.processQueue();
    }

    return job;
  }

  /**
   * Process the job queue
   */
  async processQueue() {
    if (this.isProcessing || this.jobQueue.length === 0) return;

    this.isProcessing = true;

    while (this.jobQueue.length > 0 && this.activeJobs.size < this.config.maxConcurrentJobs) {
      const job = this.jobQueue.shift();
      this.processJob(job);
    }

    this.isProcessing = false;
  }

  /**
   * Process a single optimization job
   */
  async processJob(job) {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      this.activeJobs.set(job.id, job);
      this.emit('job:started', job);

      const originalImage = await this.config.storageService.downloadImage(job.imageKey);
      const results = {};
      const originalSize = originalImage.buffer.length;

      for (const profileName of job.options.profiles) {
        const optimizedBuffer = await this.optimizeImage(originalImage.buffer, {
          profile: profileName,
          quality: job.options.quality,
          format: job.options.format
        });

        const optimizedKey = this.generateOptimizedKey(job.imageKey, profileName);
        
        const uploadResult = await this.config.storageService.uploadImage({
          buffer: optimizedBuffer,
          originalname: `${profileName}_${job.imageKey.split('/').pop()}`,
          mimetype: `image/${job.options.format}`,
          size: optimizedBuffer.length
        }, {
          originalKey: job.imageKey,
          profile: profileName,
          optimizationJobId: job.id
        });

        results[profileName] = {
          key: uploadResult.key,
          url: uploadResult.url,
          size: optimizedBuffer.length,
          savings: originalSize - optimizedBuffer.length
        };
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.results = results;
      this.metrics.jobsProcessed++;

      this.activeJobs.delete(job.id);
      this.jobHistory.push(job);
      this.emit('job:completed', job);

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date();
      this.metrics.jobsFailed++;
      this.activeJobs.delete(job.id);
      this.jobHistory.push(job);
      this.emit('job:failed', job, error);
    }

    this.processQueue();
  }

  /**
   * Optimize image using Sharp
   */
  async optimizeImage(buffer, options = {}) {
    const profiles = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 300, height: 300 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 }
    };

    const profile = profiles[options.profile] || {};
    let sharpInstance = sharp(buffer);

    if (profile.width || profile.height) {
      sharpInstance = sharpInstance.resize(profile.width, profile.height, {
        fit: 'cover',
        position: 'center'
      });
    }

    switch (options.format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: options.quality });
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: options.quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: options.quality });
        break;
      default:
        sharpInstance = sharpInstance.webp({ quality: options.quality });
    }

    return await sharpInstance.toBuffer();
  }

  /**
   * Generate optimized image key
   */
  generateOptimizedKey(originalKey, profile) {
    const pathParts = originalKey.split('/');
    const filename = pathParts.pop();
    const nameParts = filename.split('.');
    const extension = nameParts.pop();
    
    return `${pathParts.join('/')}/${nameParts.join('.')}_${profile}.webp`;
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) return activeJob;
    return this.jobHistory.find(job => job.id === jobId);
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.jobQueue.length,
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.config.maxConcurrentJobs,
      isProcessing: this.isProcessing,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Enable/disable optimization service
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    this.emit('service:toggled', { enabled });
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const queueStatus = this.getQueueStatus();
      return {
        status: 'healthy',
        enabled: this.config.enabled,
        queueStatus
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = ImageOptimizationService;

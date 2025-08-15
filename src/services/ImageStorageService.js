/**
 * Image Storage Service - Abstraction Layer
 * Provides a unified interface for image storage across different providers
 */

const { EventEmitter } = require('events');

class ImageStorageService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      provider: config.provider || 's3',
      region: config.region || 'us-east-1',
      bucket: config.bucket,
      cloudFront: config.cloudFront || {},
      local: config.local || {},
      ...config
    };
    
    this.provider = this.createProvider();
    this.metrics = {
      uploads: 0,
      downloads: 0,
      deletions: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Create storage provider based on configuration
   */
  createProvider() {
    const { provider } = this.config;
    
    switch (provider.toLowerCase()) {
      case 's3':
        return new S3Provider(this.config);
      case 'cloudfront':
        return new CloudFrontProvider(this.config);
      case 'local':
        return new LocalProvider(this.config);
      case 'hybrid':
        return new HybridProvider(this.config);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  /**
   * Upload image with metadata
   */
  async uploadImage(file, metadata = {}) {
    try {
      this.emit('upload:start', { file, metadata });
      
      const result = await this.provider.upload(file, metadata);
      
      this.metrics.uploads++;
      this.emit('upload:success', result);
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.emit('upload:error', error);
      throw error;
    }
  }

  /**
   * Download image by key or URL
   */
  async downloadImage(keyOrUrl, options = {}) {
    try {
      this.emit('download:start', { keyOrUrl, options });
      
      const result = await this.provider.download(keyOrUrl, options);
      
      this.metrics.downloads++;
      this.emit('download:success', result);
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.emit('download:error', error);
      throw error;
    }
  }

  /**
   * Delete image by key or URL
   */
  async deleteImage(keyOrUrl) {
    try {
      this.emit('delete:start', { keyOrUrl });
      
      const result = await this.provider.delete(keyOrUrl);
      
      this.metrics.deletions++;
      this.emit('delete:success', result);
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.emit('delete:error', error);
      throw error;
    }
  }

  /**
   * Get optimized URL for image
   */
  async getOptimizedUrl(keyOrUrl, options = {}) {
    try {
      return await this.provider.getOptimizedUrl(keyOrUrl, options);
    } catch (error) {
      this.metrics.errors++;
      this.emit('optimize:error', error);
      throw error;
    }
  }

  /**
   * Generate multiple optimized versions
   */
  async generateOptimizedVersions(keyOrUrl, versions = ['thumbnail', 'small', 'medium', 'large']) {
    try {
      const results = {};
      
      for (const version of versions) {
        const config = this.getVersionConfig(version);
        results[version] = await this.provider.getOptimizedUrl(keyOrUrl, config);
      }
      
      return results;
    } catch (error) {
      this.metrics.errors++;
      this.emit('optimize:error', error);
      throw error;
    }
  }

  /**
   * Get version configuration
   */
  getVersionConfig(version) {
    const configs = {
      thumbnail: { width: 150, height: 150, quality: 80, format: 'webp' },
      small: { width: 300, height: 300, quality: 85, format: 'webp' },
      medium: { width: 600, height: 600, quality: 90, format: 'webp' },
      large: { width: 1200, height: 1200, quality: 95, format: 'webp' }
    };
    
    return configs[version] || configs.thumbnail;
  }

  /**
   * Validate image file
   */
  validateImage(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    const errors = [];
    
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type');
    }
    
    if (file.size > maxSize) {
      errors.push('File too large');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get storage metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      uploads: 0,
      downloads: 0,
      deletions: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      return await this.provider.healthCheck();
    } catch (error) {
      this.emit('health:error', error);
      throw error;
    }
  }

  /**
   * Get provider info
   */
  getProviderInfo() {
    return this.provider.getInfo();
  }
}

/**
 * Base Provider Class
 */
class BaseProvider {
  constructor(config) {
    this.config = config;
  }

  async upload(file, metadata) {
    throw new Error('upload method must be implemented');
  }

  async download(keyOrUrl, options) {
    throw new Error('download method must be implemented');
  }

  async delete(keyOrUrl) {
    throw new Error('delete method must be implemented');
  }

  async getOptimizedUrl(keyOrUrl, options) {
    throw new Error('getOptimizedUrl method must be implemented');
  }

  async healthCheck() {
    throw new Error('healthCheck method must be implemented');
  }

  getInfo() {
    throw new Error('getInfo method must be implemented');
  }
}

/**
 * S3 Provider Implementation
 */
class S3Provider extends BaseProvider {
  constructor(config) {
    super(config);
    const AWS = require('aws-sdk');
    
    AWS.config.update({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    });
    
    this.s3 = new AWS.S3();
    this.bucket = config.bucket;
  }

  async upload(file, metadata = {}) {
    const key = this.generateKey(file.originalname);
    
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: metadata,
      ACL: 'public-read'
    };

    const result = await this.s3.upload(params).promise();
    
    return {
      url: result.Location,
      key: result.Key,
      size: file.size,
      mimetype: file.mimetype,
      metadata: metadata
    };
  }

  async download(keyOrUrl, options = {}) {
    const key = this.extractKey(keyOrUrl);
    
    const params = {
      Bucket: this.bucket,
      Key: key
    };

    const result = await this.s3.getObject(params).promise();
    
    return {
      buffer: result.Body,
      mimetype: result.ContentType,
      size: result.ContentLength,
      metadata: result.Metadata
    };
  }

  async delete(keyOrUrl) {
    const key = this.extractKey(keyOrUrl);
    
    const params = {
      Bucket: this.bucket,
      Key: key
    };

    await this.s3.deleteObject(params).promise();
    
    return { success: true, key };
  }

  async getOptimizedUrl(keyOrUrl, options = {}) {
    const key = this.extractKey(keyOrUrl);
    const baseUrl = `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    
    if (Object.keys(options).length === 0) {
      return baseUrl;
    }
    
    const params = new URLSearchParams();
    Object.entries(options).forEach(([k, v]) => params.append(k, v));
    
    return `${baseUrl}?${params.toString()}`;
  }

  async healthCheck() {
    try {
      await this.s3.headBucket({ Bucket: this.bucket }).promise();
      return { status: 'healthy', provider: 's3' };
    } catch (error) {
      return { status: 'unhealthy', provider: 's3', error: error.message };
    }
  }

  getInfo() {
    return {
      provider: 's3',
      bucket: this.bucket,
      region: this.config.region
    };
  }

  generateKey(filename) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = filename.split('.').pop();
    return `uploads/${timestamp}-${random}.${ext}`;
  }

  extractKey(url) {
    if (url.startsWith('http')) {
      const parts = url.split('/');
      return parts.slice(3).join('/');
    }
    return url;
  }
}

/**
 * CloudFront Provider Implementation
 */
class CloudFrontProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.s3Provider = new S3Provider(config);
    this.cloudFrontDomain = config.cloudFront.domain;
    this.distributionId = config.cloudFront.distributionId;
  }

  async upload(file, metadata = {}) {
    const s3Result = await this.s3Provider.upload(file, metadata);
    
    // Generate CloudFront URL
    const cloudFrontUrl = this.generateCloudFrontUrl(s3Result.key);
    
    return {
      ...s3Result,
      url: cloudFrontUrl,
      s3Url: s3Result.url
    };
  }

  async download(keyOrUrl, options = {}) {
    return await this.s3Provider.download(keyOrUrl, options);
  }

  async delete(keyOrUrl) {
    const result = await this.s3Provider.delete(keyOrUrl);
    
    // Invalidate CloudFront cache
    if (this.distributionId) {
      await this.invalidateCache(keyOrUrl);
    }
    
    return result;
  }

  async getOptimizedUrl(keyOrUrl, options = {}) {
    const key = this.extractKey(keyOrUrl);
    const baseUrl = `https://${this.cloudFrontDomain}/${key}`;
    
    if (Object.keys(options).length === 0) {
      return baseUrl;
    }
    
    const params = new URLSearchParams();
    Object.entries(options).forEach(([k, v]) => params.append(k, v));
    
    return `${baseUrl}?${params.toString()}`;
  }

  async healthCheck() {
    const s3Health = await this.s3Provider.healthCheck();
    
    return {
      ...s3Health,
      provider: 'cloudfront',
      cloudFrontDomain: this.cloudFrontDomain
    };
  }

  getInfo() {
    return {
      provider: 'cloudfront',
      s3Info: this.s3Provider.getInfo(),
      cloudFrontDomain: this.cloudFrontDomain,
      distributionId: this.distributionId
    };
  }

  generateCloudFrontUrl(key) {
    return `https://${this.cloudFrontDomain}/${key}`;
  }

  async invalidateCache(keyOrUrl) {
    if (!this.distributionId) return;
    
    const AWS = require('aws-sdk');
    const cloudfront = new AWS.CloudFront();
    
    const key = this.extractKey(keyOrUrl);
    
    const params = {
      DistributionId: this.distributionId,
      InvalidationBatch: {
        CallerReference: `invalidation-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: [`/${key}`]
        }
      }
    };
    
    await cloudfront.createInvalidation(params).promise();
  }

  extractKey(url) {
    if (url.includes('cloudfront.net')) {
      const parts = url.split('/');
      return parts.slice(3).join('/');
    }
    return this.s3Provider.extractKey(url);
  }
}

/**
 * Local Provider Implementation
 */
class LocalProvider extends BaseProvider {
  constructor(config) {
    super(config);
    const fs = require('fs');
    const path = require('path');
    
    this.fs = fs;
    this.path = path;
    this.uploadDir = config.local.uploadDir || 'uploads';
    
    // Ensure upload directory exists
    if (!this.fs.existsSync(this.uploadDir)) {
      this.fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file, metadata = {}) {
    const key = this.generateKey(file.originalname);
    const filePath = this.path.join(this.uploadDir, key);
    
    // Ensure directory exists
    const dir = this.path.dirname(filePath);
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    this.fs.writeFileSync(filePath, file.buffer);
    
    // Store metadata
    const metadataPath = `${filePath}.meta.json`;
    this.fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    
    return {
      url: `file://${filePath}`,
      key: key,
      size: file.size,
      mimetype: file.mimetype,
      metadata: metadata,
      path: filePath
    };
  }

  async download(keyOrUrl, options = {}) {
    const key = this.extractKey(keyOrUrl);
    const filePath = this.path.join(this.uploadDir, key);
    
    if (!this.fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    const buffer = this.fs.readFileSync(filePath);
    const stats = this.fs.statSync(filePath);
    
    // Read metadata if exists
    let metadata = {};
    const metadataPath = `${filePath}.meta.json`;
    if (this.fs.existsSync(metadataPath)) {
      metadata = JSON.parse(this.fs.readFileSync(metadataPath, 'utf8'));
    }
    
    return {
      buffer,
      size: stats.size,
      metadata
    };
  }

  async delete(keyOrUrl) {
    const key = this.extractKey(keyOrUrl);
    const filePath = this.path.join(this.uploadDir, key);
    
    if (this.fs.existsSync(filePath)) {
      this.fs.unlinkSync(filePath);
      
      // Delete metadata file if exists
      const metadataPath = `${filePath}.meta.json`;
      if (this.fs.existsSync(metadataPath)) {
        this.fs.unlinkSync(metadataPath);
      }
    }
    
    return { success: true, key };
  }

  async getOptimizedUrl(keyOrUrl, options = {}) {
    const key = this.extractKey(keyOrUrl);
    const filePath = this.path.join(this.uploadDir, key);
    
    if (!this.fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    return `file://${filePath}`;
  }

  async healthCheck() {
    try {
      const testPath = this.path.join(this.uploadDir, '.health-check');
      this.fs.writeFileSync(testPath, 'health-check');
      this.fs.unlinkSync(testPath);
      
      return { status: 'healthy', provider: 'local' };
    } catch (error) {
      return { status: 'unhealthy', provider: 'local', error: error.message };
    }
  }

  getInfo() {
    return {
      provider: 'local',
      uploadDir: this.uploadDir
    };
  }

  generateKey(filename) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = filename.split('.').pop();
    return `uploads/${timestamp}-${random}.${ext}`;
  }

  extractKey(url) {
    if (url.startsWith('file://')) {
      return this.path.relative(this.uploadDir, url.replace('file://', ''));
    }
    return url;
  }
}

/**
 * Hybrid Provider Implementation (S3 + CloudFront + Local fallback)
 */
class HybridProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.primaryProvider = new CloudFrontProvider(config);
    this.fallbackProvider = new LocalProvider(config);
    this.useFallback = false;
  }

  async upload(file, metadata = {}) {
    try {
      if (!this.useFallback) {
        return await this.primaryProvider.upload(file, metadata);
      }
    } catch (error) {
      console.warn('Primary provider failed, using fallback:', error.message);
      this.useFallback = true;
    }
    
    return await this.fallbackProvider.upload(file, metadata);
  }

  async download(keyOrUrl, options = {}) {
    try {
      if (!this.useFallback) {
        return await this.primaryProvider.download(keyOrUrl, options);
      }
    } catch (error) {
      console.warn('Primary provider failed, using fallback:', error.message);
      this.useFallback = true;
    }
    
    return await this.fallbackProvider.download(keyOrUrl, options);
  }

  async delete(keyOrUrl) {
    try {
      if (!this.useFallback) {
        return await this.primaryProvider.delete(keyOrUrl);
      }
    } catch (error) {
      console.warn('Primary provider failed, using fallback:', error.message);
      this.useFallback = true;
    }
    
    return await this.fallbackProvider.delete(keyOrUrl);
  }

  async getOptimizedUrl(keyOrUrl, options = {}) {
    try {
      if (!this.useFallback) {
        return await this.primaryProvider.getOptimizedUrl(keyOrUrl, options);
      }
    } catch (error) {
      console.warn('Primary provider failed, using fallback:', error.message);
      this.useFallback = true;
    }
    
    return await this.fallbackProvider.getOptimizedUrl(keyOrUrl, options);
  }

  async healthCheck() {
    const primaryHealth = await this.primaryProvider.healthCheck();
    const fallbackHealth = await this.fallbackProvider.healthCheck();
    
    return {
      status: primaryHealth.status === 'healthy' ? 'healthy' : 'degraded',
      provider: 'hybrid',
      primary: primaryHealth,
      fallback: fallbackHealth,
      useFallback: this.useFallback
    };
  }

  getInfo() {
    return {
      provider: 'hybrid',
      primary: this.primaryProvider.getInfo(),
      fallback: this.fallbackProvider.getInfo(),
      useFallback: this.useFallback
    };
  }
}

module.exports = ImageStorageService;

const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

class CloudStorageService {
  constructor() {
    this.provider = process.env.CLOUD_STORAGE_PROVIDER || 'aws';
    this.bucketName = process.env.CLOUD_STORAGE_BUCKET;
    this.cdnDomain = process.env.CDN_DOMAIN;
    
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider) {
      case 'aws':
        this.initializeAWS();
        break;
      case 'google':
        this.initializeGoogleCloud();
        break;
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  initializeAWS() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  initializeGoogleCloud() {
    this.gcs = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
    });
    this.bucket = this.gcs.bucket(this.bucketName);
  }

  async uploadFile(file, options = {}) {
    try {
      const { folder = 'uploads', optimizeImages = true } = options;
      
      this.validateFile(file);
      const filename = this.generateUniqueFilename(file.originalname);
      const filePath = `${folder}/${filename}`;

      let processedFiles = [];
      
      if (this.isImage(file.mimetype) && optimizeImages) {
        processedFiles = await this.processImage(file, folder, filename);
      } else {
        await this.uploadToCloud(file.buffer, filePath, file.mimetype);
        processedFiles.push({
          size: 'original',
          path: filePath,
          url: this.getPublicUrl(filePath),
          size: file.size
        });
      }

      const fileRecord = await this.storeFileMetadata({
        originalName: file.originalname,
        filename: filename,
        mimetype: file.mimetype,
        size: file.size,
        path: filePath,
        urls: processedFiles
      });

      return { success: true, file: fileRecord, urls: processedFiles };
    } catch (error) {
      logger.error('File upload failed', { error: error.message });
      throw error;
    }
  }

  async uploadToCloud(buffer, key, contentType) {
    if (this.provider === 'aws') {
      return this.uploadToS3(buffer, key, contentType);
    } else {
      return this.uploadToGCS(buffer, key, contentType);
    }
  }

  async uploadToS3(buffer, key, contentType) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    };
    return await this.s3.upload(params).promise();
  }

  async uploadToGCS(buffer, key, contentType) {
    const file = this.bucket.file(key);
    await file.save(buffer, {
      metadata: { contentType },
      public: true
    });
    return { Location: this.getPublicUrl(key) };
  }

  async processImage(file, folder, filename) {
    const results = [];
    const image = sharp(file.buffer);

    // Create optimized versions
    const sizes = [
      { name: 'thumb', width: 150, height: 150 },
      { name: 'small', width: 300, height: 300 },
      { name: 'medium', width: 600, height: 600 }
    ];

    for (const size of sizes) {
      const processedBuffer = await image
        .clone()
        .resize(size.width, size.height, { fit: 'inside' })
        .webp({ quality: 85 })
        .toBuffer();

      const processedPath = `${folder}/${size.name}/${filename.replace(/\.[^/.]+$/, '.webp')}`;
      await this.uploadToCloud(processedBuffer, processedPath, 'image/webp');

      results.push({
        size: size.name,
        path: processedPath,
        url: this.getPublicUrl(processedPath),
        size: processedBuffer.length
      });
    }

    return results;
  }

  async deleteFile(filePath) {
    try {
      if (this.provider === 'aws') {
        await this.s3.deleteObject({ Bucket: this.bucketName, Key: filePath }).promise();
      } else {
        await this.bucket.file(filePath).delete();
      }

      await query('DELETE FROM file_storage.files WHERE path = $1', [filePath]);
      return { success: true };
    } catch (error) {
      logger.error('File deletion failed', { error: error.message });
      throw error;
    }
  }

  getPublicUrl(filePath) {
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${filePath}`;
    }

    if (this.provider === 'aws') {
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filePath}`;
    } else {
      return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
    }
  }

  async storeFileMetadata(fileData) {
    const result = await query(
      `INSERT INTO file_storage.files 
       (original_name, filename, mimetype, size, path, urls, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        fileData.originalName,
        fileData.filename,
        fileData.mimetype,
        fileData.size,
        fileData.path,
        JSON.stringify(fileData.urls)
      ]
    );
    return result.rows[0];
  }

  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }
  }

  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const name = path.basename(originalName, extension);
    return `${name}_${timestamp}_${random}${extension}`;
  }

  isImage(mimetype) {
    return mimetype.startsWith('image/');
  }

  async getFileInfo(fileId) {
    const result = await query('SELECT * FROM file_storage.files WHERE id = $1', [fileId]);
    return result.rows[0];
  }

  async listFiles(options = {}) {
    const { page = 1, limit = 20 } = options;
    const result = await query(
      'SELECT * FROM file_storage.files ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, (page - 1) * limit]
    );
    return result.rows;
  }
}

module.exports = new CloudStorageService();

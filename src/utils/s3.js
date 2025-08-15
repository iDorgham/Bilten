const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// CloudFront configuration
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const USE_CLOUDFRONT = process.env.USE_CLOUDFRONT === 'true' && CLOUDFRONT_DOMAIN;

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'), false);
  }
};

// Generate unique filename
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  return `${timestamp}-${randomString}${extension}`;
};

// Generate CloudFront-ready URL
const generateCloudFrontUrl = (key) => {
  if (!USE_CLOUDFRONT || !CLOUDFRONT_DOMAIN) {
    // Fallback to S3 URL if CloudFront is not configured
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }
  
  // Remove protocol if present and ensure clean domain
  const domain = CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, '');
  return `https://${domain}/${key}`;
};

// Generate optimized image URL with CloudFront
const generateOptimizedImageUrl = (key, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover'
  } = options;

  if (!USE_CLOUDFRONT || !CLOUDFRONT_DOMAIN) {
    // Fallback to S3 URL with query parameters for optimization
    const baseUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    const params = new URLSearchParams();
    
    if (width) params.append('w', width);
    if (height) params.append('h', height);
    if (quality) params.append('q', quality);
    if (format) params.append('f', format);
    if (fit) params.append('fit', fit);
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }

  // CloudFront URL with optimization parameters
  const domain = CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, '');
  const params = new URLSearchParams();
  
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  if (quality) params.append('q', quality);
  if (format) params.append('f', format);
  if (fit) params.append('fit', fit);
  
  const baseUrl = `https://${domain}/${key}`;
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
};

// Multer configuration for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: function (req, file, cb) {
      const folder = req.uploadFolder || 'uploads';
      const fileName = generateFileName(file.originalname);
      cb(null, `${folder}/${fileName}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  }),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Function to delete file from S3
const deleteFile = async (fileUrl) => {
  try {
    // Extract key from URL (supports both S3 and CloudFront URLs)
    let key;
    
    if (USE_CLOUDFRONT && fileUrl.includes(CLOUDFRONT_DOMAIN)) {
      // Extract key from CloudFront URL
      const urlParts = fileUrl.split('/');
      const domainIndex = urlParts.findIndex(part => part.includes(CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, '')));
      key = urlParts.slice(domainIndex + 1).join('/');
      
      // Remove query parameters if present
      key = key.split('?')[0];
    } else {
      // Extract key from S3 URL
      const urlParts = fileUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes(process.env.AWS_S3_BUCKET));
      
      if (bucketIndex === -1) {
        throw new Error('Invalid S3 URL');
      }
      
      key = urlParts.slice(bucketIndex + 1).join('/');
    }
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Function to get signed URL for private files
const getSignedUrl = (key, expires = 3600) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: expires
  };
  
  return s3.getSignedUrl('getObject', params);
};

// Function to invalidate CloudFront cache
const invalidateCloudFrontCache = async (paths = []) => {
  if (!USE_CLOUDFRONT || !CLOUDFRONT_DISTRIBUTION_ID) {
    console.log('CloudFront invalidation skipped: CloudFront not configured');
    return false;
  }

  try {
    const cloudfront = new AWS.CloudFront();
    
    const params = {
      DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `invalidation-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths.map(path => path.startsWith('/') ? path : `/${path}`)
        }
      }
    };
    
    const result = await cloudfront.createInvalidation(params).promise();
    console.log('CloudFront invalidation created:', result.Invalidation.Id);
    return true;
  } catch (error) {
    console.error('Error invalidating CloudFront cache:', error);
    return false;
  }
};

module.exports = {
  s3,
  upload,
  deleteFile,
  getSignedUrl,
  generateFileName,
  generateCloudFrontUrl,
  generateOptimizedImageUrl,
  invalidateCloudFrontCache,
  USE_CLOUDFRONT,
  CLOUDFRONT_DOMAIN
};
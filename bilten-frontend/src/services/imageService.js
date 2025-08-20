import { API_CONFIG } from '../config/api';

/**
 * Image Service for CloudFront-ready image handling
 * Provides utilities for uploading, optimizing, and managing images
 */
class ImageService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Upload profile image
   * @param {File} file - Image file to upload
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Upload result with CloudFront URLs
   */
  async uploadProfileImage(file, token) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${this.baseUrl}/uploads/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.data;
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload event cover image
   * @param {File} file - Image file to upload
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Upload result with CloudFront URLs
   */
  async uploadEventImage(file, token) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${this.baseUrl}/uploads/event-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.data;
    } catch (error) {
      console.error('Event image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple event gallery images
   * @param {File[]} files - Array of image files
   * @param {string} token - Authentication token
   * @returns {Promise<Object[]>} Array of upload results
   */
  async uploadEventGallery(files, token) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${this.baseUrl}/uploads/event-gallery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.data.files;
    } catch (error) {
      console.error('Event gallery upload error:', error);
      throw error;
    }
  }

  /**
   * Get optimized image URL
   * @param {string} imageUrl - Original image URL
   * @param {Object} options - Optimization options
   * @param {number} options.width - Target width
   * @param {number} options.height - Target height
   * @param {number} options.quality - Image quality (1-100)
   * @param {string} options.format - Output format (auto, webp, jpeg, png)
   * @param {string} options.fit - Fit mode (cover, contain, fill)
   * @returns {Promise<string>} Optimized image URL
   */
  async getOptimizedImageUrl(imageUrl, options = {}) {
    try {
      const params = new URLSearchParams();
      params.append('url', imageUrl);

      if (options.width) params.append('width', options.width);
      if (options.height) params.append('height', options.height);
      if (options.quality) params.append('quality', options.quality);
      if (options.format) params.append('format', options.format);
      if (options.fit) params.append('fit', options.fit);

      const response = await fetch(`${this.baseUrl}/uploads/optimize?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        console.warn('Image optimization failed, using original URL:', result.message);
        return imageUrl;
      }

      return result.data.optimized_url;
    } catch (error) {
      console.error('Image optimization error:', error);
      return imageUrl; // Fallback to original URL
    }
  }

  /**
   * Delete uploaded file
   * @param {string} fileUrl - URL of file to delete
   * @param {string} token - Authentication token
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(fileUrl, token) {
    try {
      const response = await fetch(`${this.baseUrl}/uploads/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileUrl })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Delete failed');
      }

      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  /**
   * Generate responsive image URLs for different screen sizes
   * @param {string} imageUrl - Base image URL
   * @param {Object} sizes - Size configurations
   * @returns {Promise<Object>} Object with different size URLs
   */
  async generateResponsiveImages(imageUrl, sizes = {}) {
    const responsiveUrls = {};

    try {
      // Generate thumbnail (150x150)
      if (sizes.thumbnail !== false) {
        responsiveUrls.thumbnail = await this.getOptimizedImageUrl(imageUrl, {
          width: 150,
          height: 150,
          quality: 80,
          format: 'webp'
        });
      }

      // Generate small (300x300)
      if (sizes.small !== false) {
        responsiveUrls.small = await this.getOptimizedImageUrl(imageUrl, {
          width: 300,
          height: 300,
          quality: 85,
          format: 'webp'
        });
      }

      // Generate medium (600x600)
      if (sizes.medium !== false) {
        responsiveUrls.medium = await this.getOptimizedImageUrl(imageUrl, {
          width: 600,
          height: 600,
          quality: 90,
          format: 'webp'
        });
      }

      // Generate large (1200x1200)
      if (sizes.large !== false) {
        responsiveUrls.large = await this.getOptimizedImageUrl(imageUrl, {
          width: 1200,
          height: 1200,
          quality: 95,
          format: 'webp'
        });
      }

      // Generate original size
      responsiveUrls.original = imageUrl;

      return responsiveUrls;
    } catch (error) {
      console.error('Responsive image generation error:', error);
      return { original: imageUrl };
    }
  }

  /**
   * Get image dimensions from URL
   * @param {string} imageUrl - Image URL
   * @returns {Promise<Object>} Image dimensions
   */
  async getImageDimensions(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = imageUrl;
    });
  }

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    const errors = [];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push('File size too large. Maximum size is 5MB.');
    }

    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
      errors.push('Selected file is not an image.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create image preview URL
   * @param {File} file - Image file
   * @returns {string} Preview URL
   */
  createImagePreview(file) {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke image preview URL
   * @param {string} previewUrl - Preview URL to revoke
   */
  revokeImagePreview(previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }

  /**
   * Get optimized URL for specific use case
   * @param {string} imageUrl - Original image URL
   * @param {string} useCase - Use case (profile, event, gallery, etc.)
   * @returns {Promise<string>} Optimized URL
   */
  async getOptimizedUrlForUseCase(imageUrl, useCase) {
    const useCaseConfigs = {
      profile: {
        width: 300,
        height: 300,
        quality: 85,
        format: 'webp'
      },
      event: {
        width: 800,
        height: 600,
        quality: 90,
        format: 'webp'
      },
      gallery: {
        width: 600,
        height: 600,
        quality: 85,
        format: 'webp'
      },
      thumbnail: {
        width: 150,
        height: 150,
        quality: 80,
        format: 'webp'
      }
    };

    const config = useCaseConfigs[useCase] || useCaseConfigs.thumbnail;
    return await this.getOptimizedImageUrl(imageUrl, config);
  }

  /**
   * Check if URL is a CloudFront URL
   * @param {string} url - URL to check
   * @returns {boolean} True if CloudFront URL
   */
  isCloudFrontUrl(url) {
    return url.includes('cloudfront.net');
  }

  /**
   * Extract key from CloudFront or S3 URL
   * @param {string} url - URL to extract key from
   * @returns {string} Extracted key
   */
  extractKeyFromUrl(url) {
    if (this.isCloudFrontUrl(url)) {
      const domainIndex = url.indexOf('cloudfront.net');
      return url.substring(domainIndex + 15); // Remove 'cloudfront.net/'
    } else if (url.includes('s3.amazonaws.com')) {
      const bucketIndex = url.indexOf('.s3.');
      const bucketName = url.substring(8, bucketIndex); // Remove 'https://'
      const keyStart = url.indexOf(bucketName) + bucketName.length + 1;
      return url.substring(keyStart);
    }
    return url;
  }
}

// Create singleton instance
const imageService = new ImageService();

export default imageService;

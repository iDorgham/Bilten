import { useState, useCallback } from 'react';
import imageService from '../services/imageService';

/**
 * React hook for image upload and optimization
 * Provides easy-to-use functions for handling image uploads with CloudFront
 */
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);

  /**
   * Upload profile image
   */
  const uploadProfileImage = useCallback(async (file, token) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate file
      const validation = imageService.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Simulate progress (since we can't track actual upload progress with fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await imageService.uploadProfileImage(file, token);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedImages(prev => [...prev, result]);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  /**
   * Upload event image
   */
  const uploadEventImage = useCallback(async (file, token) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate file
      const validation = imageService.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await imageService.uploadEventImage(file, token);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedImages(prev => [...prev, result]);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  /**
   * Upload multiple gallery images
   */
  const uploadGalleryImages = useCallback(async (files, token) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate all files
      const validations = files.map(file => imageService.validateImageFile(file));
      const invalidFiles = validations.filter(v => !v.isValid);
      
      if (invalidFiles.length > 0) {
        const errors = invalidFiles.flatMap(v => v.errors);
        throw new Error(errors.join(', '));
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      const results = await imageService.uploadEventGallery(files, token);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedImages(prev => [...prev, ...results]);
      
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  /**
   * Delete uploaded image
   */
  const deleteImage = useCallback(async (imageUrl, token) => {
    try {
      await imageService.deleteFile(imageUrl, token);
      
      setUploadedImages(prev => 
        prev.filter(img => img.url !== imageUrl)
      );
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get optimized image URL
   */
  const getOptimizedImage = useCallback(async (imageUrl, options = {}) => {
    try {
      return await imageService.getOptimizedImageUrl(imageUrl, options);
    } catch (err) {
      console.error('Image optimization failed:', err);
      return imageUrl; // Fallback to original
    }
  }, []);

  /**
   * Generate responsive images
   */
  const generateResponsiveImages = useCallback(async (imageUrl, sizes = {}) => {
    try {
      return await imageService.generateResponsiveImages(imageUrl, sizes);
    } catch (err) {
      console.error('Responsive image generation failed:', err);
      return { original: imageUrl };
    }
  }, []);

  /**
   * Clear uploaded images
   */
  const clearUploadedImages = useCallback(() => {
    setUploadedImages([]);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    uploading,
    uploadProgress,
    error,
    uploadedImages,
    
    // Actions
    uploadProfileImage,
    uploadEventImage,
    uploadGalleryImages,
    deleteImage,
    getOptimizedImage,
    generateResponsiveImages,
    clearUploadedImages,
    clearError
  };
};

/**
 * React hook for image optimization
 * Provides utilities for optimizing existing images
 */
export const useImageOptimization = () => {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedUrls, setOptimizedUrls] = useState({});

  /**
   * Optimize image for specific use case
   */
  const optimizeForUseCase = useCallback(async (imageUrl, useCase) => {
    setOptimizing(true);
    
    try {
      const optimizedUrl = await imageService.getOptimizedUrlForUseCase(imageUrl, useCase);
      
      setOptimizedUrls(prev => ({
        ...prev,
        [useCase]: optimizedUrl
      }));
      
      return optimizedUrl;
    } catch (err) {
      console.error('Image optimization failed:', err);
      return imageUrl;
    } finally {
      setOptimizing(false);
    }
  }, []);

  /**
   * Generate multiple optimized versions
   */
  const generateOptimizedVersions = useCallback(async (imageUrl, versions = ['thumbnail', 'small', 'medium', 'large']) => {
    setOptimizing(true);
    
    try {
      const results = {};
      
      for (const version of versions) {
        results[version] = await imageService.getOptimizedUrlForUseCase(imageUrl, version);
      }
      
      setOptimizedUrls(prev => ({
        ...prev,
        [imageUrl]: results
      }));
      
      return results;
    } catch (err) {
      console.error('Multiple image optimization failed:', err);
      return { original: imageUrl };
    } finally {
      setOptimizing(false);
    }
  }, []);

  /**
   * Get image dimensions
   */
  const getImageDimensions = useCallback(async (imageUrl) => {
    try {
      return await imageService.getImageDimensions(imageUrl);
    } catch (err) {
      console.error('Failed to get image dimensions:', err);
      return null;
    }
  }, []);

  /**
   * Clear optimized URLs
   */
  const clearOptimizedUrls = useCallback(() => {
    setOptimizedUrls({});
  }, []);

  return {
    // State
    optimizing,
    optimizedUrls,
    
    // Actions
    optimizeForUseCase,
    generateOptimizedVersions,
    getImageDimensions,
    clearOptimizedUrls
  };
};

/**
 * React hook for image preview
 * Provides utilities for handling image previews
 */
export const useImagePreview = () => {
  const [previewUrl, setPreviewUrl] = useState(null);

  /**
   * Create preview for file
   */
  const createPreview = useCallback((file) => {
    if (!file) {
      setPreviewUrl(null);
      return null;
    }

    const url = imageService.createImagePreview(file);
    setPreviewUrl(url);
    return url;
  }, []);

  /**
   * Clear preview
   */
  const clearPreview = useCallback(() => {
    if (previewUrl) {
      imageService.revokeImagePreview(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  return {
    previewUrl,
    createPreview,
    clearPreview
  };
};

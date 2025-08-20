import React, { useState, useRef } from 'react';
import { useImageUpload, useImagePreview } from '../hooks/useImageUpload';

/**
 * ImageUploader Component
 * Provides a complete image upload interface with CloudFront integration
 */
const ImageUploader = ({ 
  onUpload, 
  onError, 
  type = 'event', 
  multiple = false, 
  maxFiles = 10,
  className = '',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  showPreview = true,
  showProgress = true,
  showDelete = true,
  uploadText = 'Upload Image',
  dragText = 'Drag and drop images here, or click to select',
  ...props 
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const { 
    uploading, 
    uploadProgress, 
    error, 
    uploadedImages,
    uploadProfileImage,
    uploadEventImage,
    uploadGalleryImages,
    deleteImage,
    clearError 
  } = useImageUpload();
  
  const { previewUrl, createPreview, clearPreview } = useImagePreview();

  // Get token from localStorage or context
  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Handle file selection
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    
    // Validate file count
    if (multiple && fileArray.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        onError?.(`File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        onError?.(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(validFiles);
    
    // Create preview for single file
    if (!multiple && validFiles.length === 1) {
      createPreview(validFiles[0]);
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const token = getToken();
    if (!token) {
      onError?.('Authentication required');
      return;
    }

    try {
      clearError();
      let result;

      if (multiple) {
        result = await uploadGalleryImages(selectedFiles, token);
      } else {
        const file = selectedFiles[0];
        if (type === 'profile') {
          result = await uploadProfileImage(file, token);
        } else {
          result = await uploadEventImage(file, token);
        }
      }

      onUpload?.(result);
      
      // Clear selected files and preview
      setSelectedFiles([]);
      clearPreview();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      onError?.(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (imageUrl) => {
    const token = getToken();
    if (!token) {
      onError?.('Authentication required');
      return;
    }

    try {
      await deleteImage(imageUrl, token);
    } catch (err) {
      onError?.(err.message);
    }
  };

  // Handle file removal from selection
  const removeSelectedFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    if (newFiles.length === 1 && !multiple) {
      createPreview(newFiles[0]);
    } else if (newFiles.length === 0) {
      clearPreview();
    }
  };

  return (
    <div className={`image-uploader ${className}`} {...props}>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="text-sm">{error}</p>
          <button 
            onClick={clearError}
            className="mt-2 text-red-600 hover:text-red-800 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {showProgress && uploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${selectedFiles.length > 0 ? 'border-green-500 bg-green-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Upload Icon */}
        <div className="mb-4">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48"
          >
            <path 
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
              strokeWidth={2} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        </div>

        {/* Upload Text */}
        <p className="text-lg font-medium text-gray-900 mb-2">
          {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : uploadText}
        </p>
        <p className="text-sm text-gray-500">
          {dragText}
        </p>

        {/* File Type Info */}
        <p className="text-xs text-gray-400 mt-2">
          PNG, JPG, JPEG, WebP up to {maxSize / (1024 * 1024)}MB
        </p>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview */}
      {showPreview && previewUrl && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview:</h4>
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-xs max-h-48 rounded border"
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="mt-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </button>
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Uploaded Images:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.optimized_urls?.thumbnail || image.url}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                
                {/* Delete Button */}
                {showDelete && (
                  <button
                    onClick={() => handleDelete(image.url)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ×
                  </button>
                )}
                
                {/* Image Info */}
                <div className="mt-1 text-xs text-gray-500">
                  <p className="truncate">{image.originalName || 'Image'}</p>
                  <p>{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimized URLs Display (for debugging) */}
      {process.env.NODE_ENV === 'development' && uploadedImages.length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Optimized URLs:</h5>
          {uploadedImages.map((image, index) => (
            <div key={index} className="mb-2">
              <p className="text-xs text-gray-600">Image {index + 1}:</p>
              <div className="text-xs space-y-1">
                <p><strong>Original:</strong> {image.url}</p>
                {image.optimized_urls && (
                  <>
                    <p><strong>Thumbnail:</strong> {image.optimized_urls.thumbnail}</p>
                    <p><strong>Medium:</strong> {image.optimized_urls.medium}</p>
                    <p><strong>Large:</strong> {image.optimized_urls.large}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

# Event Media Upload and Processing Guide

This document describes the comprehensive event media upload and processing system implemented for the Bilten platform.

## Overview

The media upload system provides secure, scalable file handling for event organizers to upload and manage various types of media content including images, videos, and documents.

## Features

### 🔒 Security Features
- **File Type Validation**: Strict validation of file types and extensions
- **Size Limits**: Configurable size limits per media type (10MB for images, 50MB for videos)
- **Virus Scanning**: Placeholder for virus scanning integration
- **Malicious File Detection**: Basic detection of suspicious file patterns
- **Authentication Required**: All upload operations require valid JWT tokens

### 📁 Supported Media Types
- **Images**: JPEG, PNG, WebP (up to 10MB)
- **Videos**: MP4, WebM, MOV (up to 50MB)
- **Audio**: MP3, WAV, OGG (up to 50MB)
- **Documents**: PDF, TXT (up to 50MB)

### 🎯 Media Management
- **Primary Media**: Set cover images for events
- **Metadata**: Alt text, captions, display order
- **Reordering**: Drag-and-drop media organization
- **Bulk Upload**: Multiple files in single request
- **Statistics**: File count and size tracking per event

## API Endpoints

### Upload Event Media
```http
POST /api/v1/uploads/event/:eventId/media
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- media: File[] (up to 10 files)
- mediaType: string (image|video|audio|document)
- altText: string (optional)
- caption: string (optional)
- displayOrder: number (optional)
- isPrimary: boolean (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "2 media files uploaded successfully",
  "data": {
    "uploaded": [
      {
        "id": "uuid",
        "filename": "generated-filename.jpg",
        "originalName": "original-name.jpg",
        "size": 1024000,
        "mimetype": "image/jpeg",
        "url": "http://localhost:3001/uploads/events/generated-filename.jpg",
        "mediaType": "image",
        "altText": "Alt text",
        "caption": "Caption",
        "isPrimary": false
      }
    ],
    "errors": []
  }
}
```

### Get Event Media
```http
GET /api/v1/uploads/event/:eventId/media?type=image
```

**Response:**
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "uuid",
        "event_id": "event-uuid",
        "media_type": "image",
        "file_name": "filename.jpg",
        "file_path": "http://localhost:3001/uploads/events/filename.jpg",
        "file_size": 1024000,
        "mime_type": "image/jpeg",
        "alt_text": "Alt text",
        "caption": "Caption",
        "display_order": 0,
        "is_primary": true,
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "count": 1
  }
}
```

### Update Media Metadata
```http
PATCH /api/v1/uploads/media/:mediaId
Authorization: Bearer <token>
Content-Type: application/json

{
  "alt_text": "Updated alt text",
  "caption": "Updated caption",
  "display_order": 1,
  "is_primary": false
}
```

### Delete Media
```http
DELETE /api/v1/uploads/media/:mediaId
Authorization: Bearer <token>
```

### Set Primary Media
```http
POST /api/v1/uploads/event/:eventId/media/:mediaId/primary
Authorization: Bearer <token>
```

### Reorder Media
```http
POST /api/v1/uploads/event/:eventId/media/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "mediaOrder": ["media-id-1", "media-id-2", "media-id-3"]
}
```

### Get Media Statistics
```http
GET /api/v1/uploads/event/:eventId/media/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_files": 5,
    "total_size": 15728640,
    "by_type": {
      "image": {
        "count": 3,
        "size": 10485760
      },
      "video": {
        "count": 2,
        "size": 5242880
      }
    }
  }
}
```

## Database Schema

The media system uses the `events.event_media` table:

```sql
CREATE TABLE events.event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
    media_type media_type NOT NULL, -- 'image', 'video', 'audio', 'document', 'logo', 'banner'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    alt_text VARCHAR(255),
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    status asset_status DEFAULT 'uploading', -- 'uploading', 'processing', 'active', 'archived', 'deleted'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## File Storage Structure

```
uploads/
├── events/
│   ├── uuid-filename.jpg
│   ├── uuid-filename.mp4
│   └── uuid-filename.pdf
├── profiles/
│   └── uuid-avatar.jpg
└── gallery/
    └── uuid-gallery-image.jpg
```

## Frontend Integration

### React Component Usage

```jsx
import EventMediaUpload from './components/EventMediaUpload';

function EventEditPage({ eventId }) {
  const handleMediaUploaded = (uploadedFiles) => {
    console.log('New media uploaded:', uploadedFiles);
    // Refresh event data or update state
  };

  return (
    <EventMediaUpload
      eventId={eventId}
      onMediaUploaded={handleMediaUploaded}
      existingMedia={event.media}
    />
  );
}
```

### Features
- **Drag & Drop**: Intuitive file dropping interface
- **Multiple File Types**: Support for images, videos, documents
- **Real-time Preview**: Immediate preview of selected files
- **Metadata Editing**: Alt text, captions, primary selection
- **Progress Tracking**: Upload progress indicators
- **Error Handling**: Comprehensive error messages

## Security Considerations

### File Validation
- **MIME Type Checking**: Validates actual file content, not just extension
- **Size Limits**: Prevents oversized uploads that could impact performance
- **Extension Validation**: Double-checks file extensions match content
- **Suspicious Pattern Detection**: Identifies potentially malicious files

### Access Control
- **Authentication Required**: All upload operations require valid JWT
- **Event Ownership**: Users can only upload to events they own (TODO: implement)
- **Rate Limiting**: Prevents abuse through upload flooding

### Storage Security
- **Unique Filenames**: UUIDs prevent filename conflicts and guessing
- **Separate Directory**: Uploaded files stored outside web root when possible
- **Content-Type Headers**: Proper MIME type serving prevents execution

## Performance Optimizations

### File Processing
- **Asynchronous Processing**: Large files processed in background
- **Thumbnail Generation**: Automatic thumbnail creation for images
- **Compression**: Optional image compression for web delivery
- **CDN Integration**: Ready for CDN deployment

### Database Optimization
- **Indexed Queries**: Optimized indexes for common query patterns
- **Metadata Storage**: JSONB for flexible metadata without schema changes
- **Soft Deletes**: Files marked as deleted rather than immediately removed

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "File too large. Maximum size is 10MB.",
  "code": "FILE_TOO_LARGE"
}
```

```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
  "code": "INVALID_FILE_TYPE"
}
```

```json
{
  "success": false,
  "message": "No valid files found",
  "errors": [
    {
      "fileIndex": 0,
      "filename": "document.txt",
      "errors": ["Unsupported image format. Supported formats: jpeg, jpg, png, webp"]
    }
  ]
}
```

## Testing

### Unit Tests
- File validation logic
- URL generation
- Metadata handling
- Error scenarios

### Integration Tests
- Complete upload workflow
- Authentication requirements
- File cleanup on errors
- Database operations

### Load Testing
- Multiple concurrent uploads
- Large file handling
- Memory usage monitoring
- Database performance

## Future Enhancements

### Planned Features
- **Image Processing**: Automatic resizing, format conversion
- **Video Processing**: Thumbnail extraction, format conversion
- **Cloud Storage**: AWS S3, Google Cloud Storage integration
- **Advanced Security**: Real virus scanning, content analysis
- **Analytics**: Upload statistics, usage tracking
- **Backup System**: Automated backup and recovery

### Performance Improvements
- **Streaming Uploads**: Handle very large files efficiently
- **Progressive Upload**: Resume interrupted uploads
- **Background Processing**: Queue-based processing for heavy operations
- **Caching**: Intelligent caching strategies for frequently accessed media

## Configuration

### Environment Variables

```env
# File Upload Configuration
MAX_FILE_SIZE=52428800          # 50MB in bytes
MAX_IMAGE_SIZE=10485760         # 10MB in bytes
UPLOAD_DIR=./uploads            # Upload directory path
BASE_URL=http://localhost:3001  # Base URL for file serving

# Security Configuration
ENABLE_VIRUS_SCAN=false         # Enable virus scanning
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Processing Configuration
ENABLE_IMAGE_PROCESSING=true    # Enable automatic image processing
ENABLE_THUMBNAIL_GENERATION=true # Generate thumbnails
THUMBNAIL_SIZES=150,300,600     # Thumbnail sizes in pixels
```

This comprehensive media upload system provides a solid foundation for event media management while maintaining security, performance, and user experience standards.
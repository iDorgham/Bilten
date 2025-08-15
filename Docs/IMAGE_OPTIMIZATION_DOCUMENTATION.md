# Image Optimization Service

## Overview

Optional background image optimization service that processes uploaded images to create multiple optimized versions in different sizes and formats.

## Features

- Background job processing with queue management
- Multiple size profiles (thumbnail, small, medium, large)
- Format conversion (WebP, JPEG, PNG)
- Batch processing support
- Job status tracking and cancellation
- Service health monitoring

## Configuration

```bash
# Environment variables
IMAGE_OPTIMIZATION_ENABLED=true
IMAGE_OPTIMIZATION_MAX_JOBS=5
IMAGE_OPTIMIZATION_QUALITY=80
```

## API Endpoints

### Create Job
**POST** `/v1/image-optimization/job`
```json
{
  "imageKey": "uploads/events/123/image.jpg",
  "profiles": ["thumbnail", "small", "medium"],
  "quality": 85,
  "format": "webp"
}
```

### Get Job Status
**GET** `/v1/image-optimization/job/:jobId`

### Batch Processing
**POST** `/v1/image-optimization/batch`
```json
{
  "imageKeys": ["image1.jpg", "image2.png"],
  "options": {
    "profiles": ["thumbnail", "small"],
    "quality": 90,
    "format": "webp"
  }
}
```

### Queue Status
**GET** `/v1/image-optimization/queue`

### Toggle Service
**POST** `/v1/image-optimization/toggle`
```json
{
  "enabled": false
}
```

### Health Check
**GET** `/v1/image-optimization/health`

## Size Profiles

| Profile | Size | Use Case |
|---------|------|----------|
| thumbnail | 150x150 | Thumbnails, avatars |
| small | 300x300 | Small previews |
| medium | 600x600 | Medium displays |
| large | 1200x1200 | Large displays |

## Usage Example

```javascript
// Create optimization job
const job = await optimizationService.addOptimizationJob(imageKey, {
  profiles: ['thumbnail', 'small', 'medium'],
  quality: 85,
  format: 'webp'
});

// Check job status
const status = optimizationService.getJobStatus(job.id);
console.log('Job status:', status.status);
```

## Testing

Run the test script:
```bash
node test-image-optimization.js
```

## Dependencies

- `sharp`: Image processing library
- `aws-sdk`: AWS S3 integration
- Express.js: API endpoints

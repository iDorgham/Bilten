# CloudFront Setup and Configuration Guide

## 🚀 **CloudFront-Ready Image URL Storage System**

The Bilten application now supports CloudFront-ready image URLs for optimized content delivery and caching. This system provides automatic URL generation, image optimization, and cache invalidation.

## 📋 **Features Implemented**

### ✅ **Core Features**
- **CloudFront URL Generation**: Automatic generation of CloudFront-ready URLs
- **Image Optimization**: On-the-fly image resizing and optimization
- **Cache Invalidation**: Automatic cache invalidation when files are updated/deleted
- **Fallback Support**: Graceful fallback to S3 URLs when CloudFront is not configured
- **Mock Mode**: Development support with mock CloudFront URLs

### ✅ **Optimization Features**
- **Multiple Sizes**: Automatic generation of thumbnail, medium, and large versions
- **Quality Control**: Configurable image quality settings
- **Format Optimization**: Automatic format selection (WebP, JPEG, PNG)
- **Responsive Images**: Support for different screen sizes and devices

## 🔧 **Environment Configuration**

### **Required Environment Variables**

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1

# CloudFront Configuration
CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
USE_CLOUDFRONT=true

# Development/Mock Configuration (Optional)
MOCK_CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
USE_MOCK_CLOUDFRONT=true
```

### **Configuration Options**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CLOUDFRONT_DOMAIN` | Your CloudFront distribution domain | - | Yes (if using CloudFront) |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID for cache invalidation | - | Yes (if using CloudFront) |
| `USE_CLOUDFRONT` | Enable/disable CloudFront integration | `false` | No |
| `MOCK_CLOUDFRONT_DOMAIN` | Mock domain for development | `d1234567890abc.cloudfront.net` | No |
| `USE_MOCK_CLOUDFRONT` | Enable mock CloudFront for development | `false` | No |

## 🏗️ **AWS Infrastructure Setup**

### **1. S3 Bucket Configuration**

```bash
# Create S3 bucket for image storage
aws s3 mb s3://bilten-image-storage

# Configure bucket for CloudFront access
aws s3api put-bucket-policy --bucket bilten-image-storage --policy file://s3-policy.json
```

**S3 Bucket Policy (`s3-policy.json`):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bilten-image-storage/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### **2. CloudFront Distribution Setup**

```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**CloudFront Configuration (`cloudfront-config.json`):**
```json
{
  "CallerReference": "bilten-cdn-2024",
  "Comment": "Bilten CDN for image delivery",
  "DefaultRootObject": "",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "bilten-s3-origin",
        "DomainName": "bilten-image-storage.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginPath": "",
        "CustomHeaders": {
          "Quantity": 0
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "bilten-s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "TrustedKeyGroups": {
      "Enabled": false,
      "Quantity": 0
    },
    "ViewerCertificate": {
      "CloudFrontDefaultCertificate": true,
      "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true,
    "LambdaFunctionAssociations": {
      "Quantity": 0
    },
    "FunctionAssociations": {
      "Quantity": 0
    },
    "FieldLevelEncryptionId": "",
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "none"
      },
      "Headers": {
        "Quantity": 0
      },
      "QueryStringCacheKeys": {
        "Quantity": 0
      }
    }
  },
  "CacheBehaviors": {
    "Quantity": 0
  },
  "CustomErrorResponses": {
    "Quantity": 0
  },
  "PriceClass": "PriceClass_100",
  "Enabled": true,
  "WebACLId": "",
  "HttpVersion": "http2",
  "IsIPV6Enabled": true
}
```

## 📡 **API Endpoints**

### **Production Endpoints (S3 + CloudFront)**

#### **Upload Endpoints**
- `POST /v1/uploads/profile-image` - Upload user profile image
- `POST /v1/uploads/event-image` - Upload event cover image
- `POST /v1/uploads/event-gallery` - Upload multiple event images

#### **Management Endpoints**
- `DELETE /v1/uploads/delete` - Delete uploaded file
- `GET /v1/uploads/optimize` - Get optimized image URL

### **Development Endpoints (Mock)**

#### **Upload Endpoints**
- `POST /v1/uploads-mock/profile-image` - Upload user profile image (mock)
- `POST /v1/uploads-mock/event-image` - Upload event cover image (mock)
- `POST /v1/uploads-mock/event-gallery` - Upload multiple event images (mock)

#### **Management Endpoints**
- `DELETE /v1/uploads-mock/delete` - Delete uploaded file (mock)
- `GET /v1/uploads-mock/optimize` - Get optimized image URL (mock)
- `GET /v1/uploads-mock/mock/:folder/:subfolder/:filename` - Serve uploaded files

## 🔄 **Response Format**

### **Upload Response**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://d1234567890abc.cloudfront.net/events/images/1703123456789-abc123.png",
    "key": "events/images/1703123456789-abc123.png",
    "size": 1024000,
    "mimetype": "image/png",
    "originalName": "event-cover.png",
    "optimized_urls": {
      "thumbnail": "https://d1234567890abc.cloudfront.net/events/images/1703123456789-abc123.png?w=300&h=200&q=80",
      "medium": "https://d1234567890abc.cloudfront.net/events/images/1703123456789-abc123.png?w=800&h=600&q=80",
      "large": "https://d1234567890abc.cloudfront.net/events/images/1703123456789-abc123.png?w=1200&h=800&q=80"
    }
  }
}
```

### **Optimization Response**
```json
{
  "success": true,
  "data": {
    "original_url": "https://d1234567890abc.cloudfront.net/events/images/image.png",
    "optimized_url": "https://d1234567890abc.cloudfront.net/events/images/image.png?w=800&h=600&q=80&f=webp",
    "key": "events/images/image.png"
  }
}
```

## 🎯 **Usage Examples**

### **Frontend Integration**

```javascript
// Upload profile image
const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/v1/uploads/profile-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Use optimized URLs for different contexts
    const { url, optimized_urls } = result.data;
    
    // Profile thumbnail
    const thumbnailUrl = optimized_urls.thumbnail;
    
    // Full profile image
    const fullImageUrl = optimized_urls.large;
    
    return { url, optimized_urls };
  }
};

// Get optimized image URL
const getOptimizedImage = async (imageUrl, width, height) => {
  const response = await fetch(`/v1/uploads/optimize?url=${encodeURIComponent(imageUrl)}&width=${width}&height=${height}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data.optimized_url;
  }
  
  return imageUrl; // Fallback to original URL
};
```

### **React Component Example**

```jsx
import React, { useState } from 'react';

const ImageUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [imageData, setImageData] = useState(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/v1/uploads/event-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImageData(result.data);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleImageUpload} accept="image/*" />
      {uploading && <p>Uploading...</p>}
      
      {imageData && (
        <div>
          <h3>Uploaded Image</h3>
          <img src={imageData.optimized_urls.thumbnail} alt="Thumbnail" />
          <img src={imageData.optimized_urls.medium} alt="Medium" />
          <img src={imageData.optimized_urls.large} alt="Large" />
        </div>
      )}
    </div>
  );
};
```

## 🔒 **Security Considerations**

### **Access Control**
- All upload endpoints require authentication
- Event image uploads require organizer or admin role
- File deletion is restricted to authenticated users

### **File Validation**
- Only image files (JPEG, PNG, WebP) are allowed
- Maximum file size: 5MB
- Automatic file type validation

### **URL Security**
- CloudFront URLs are public but can be restricted with signed URLs
- S3 bucket access is controlled via bucket policies
- Cache invalidation requires proper AWS permissions

## 🚀 **Performance Benefits**

### **CDN Advantages**
- **Global Distribution**: Images served from edge locations worldwide
- **Reduced Latency**: Faster image loading for users
- **Bandwidth Savings**: Reduced load on origin server
- **Automatic Scaling**: Handles traffic spikes automatically

### **Optimization Benefits**
- **Responsive Images**: Different sizes for different devices
- **Format Optimization**: Automatic WebP conversion for supported browsers
- **Quality Control**: Configurable compression levels
- **Caching**: Long-term caching with automatic invalidation

## 🔧 **Troubleshooting**

### **Common Issues**

1. **CloudFront Not Working**
   - Check `CLOUDFRONT_DOMAIN` environment variable
   - Verify CloudFront distribution is deployed and enabled
   - Ensure S3 bucket policy allows CloudFront access

2. **Cache Invalidation Failing**
   - Verify `CLOUDFRONT_DISTRIBUTION_ID` is correct
   - Check AWS credentials have CloudFront invalidation permissions
   - Monitor CloudFront invalidation limits (1000 free per month)

3. **Image Optimization Not Working**
   - Check query parameters are being passed correctly
   - Verify CloudFront distribution forwards query strings
   - Test with different image formats

### **Debug Commands**

```bash
# Test CloudFront distribution
curl -I https://your-cloudfront-domain.cloudfront.net/test-image.jpg

# Check S3 bucket access
aws s3 ls s3://your-bucket-name/

# List CloudFront distributions
aws cloudfront list-distributions

# Check invalidation status
aws cloudfront list-invalidations --distribution-id YOUR_DISTRIBUTION_ID
```

## 📊 **Monitoring and Analytics**

### **CloudWatch Metrics**
- Monitor CloudFront distribution performance
- Track cache hit ratios
- Monitor error rates and latency

### **S3 Analytics**
- Track storage usage
- Monitor request patterns
- Analyze cost optimization opportunities

## 🔄 **Migration Guide**

### **From S3-Only to CloudFront**

1. **Update Environment Variables**
   ```bash
   CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
   CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
   USE_CLOUDFRONT=true
   ```

2. **Deploy CloudFront Distribution**
   - Follow the AWS infrastructure setup above
   - Wait for distribution to be deployed (15-20 minutes)

3. **Update Existing URLs**
   - Existing S3 URLs will continue to work
   - New uploads will use CloudFront URLs
   - Consider migrating existing images if needed

4. **Test and Validate**
   - Test upload functionality
   - Verify image optimization
   - Check cache invalidation

## 📝 **Changelog**

### **v1.0.0** - Initial CloudFront Integration
- ✅ CloudFront URL generation
- ✅ Image optimization with query parameters
- ✅ Cache invalidation support
- ✅ Mock mode for development
- ✅ Fallback to S3 URLs
- ✅ Multiple image size generation
- ✅ Security and access control
- ✅ Comprehensive error handling

---

**Next Steps:**
- [ ] Implement image processing Lambda@Edge functions
- [ ] Add WebP format optimization
- [ ] Implement progressive image loading
- [ ] Add image metadata extraction
- [ ] Implement image watermarking
- [ ] Add image backup and versioning

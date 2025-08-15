const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Multer configuration for local storage (mock S3)
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const folder = req.uploadFolder || 'uploads';
      const fullPath = path.join(uploadsDir, folder);
      
      // Create folder if it doesn't exist
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      
      cb(null, fullPath);
    },
    filename: function (req, file, cb) {
      const fileName = generateFileName(file.originalname);
      cb(null, fileName);
    }
  }),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Mock function to delete file
const deleteFile = async (fileUrl) => {
  try {
    // Extract path from mock URL
    // URL format: http://localhost:3001/uploads/mock/users/profiles/filename.png
    const urlParts = fileUrl.split('/uploads/mock/');
    if (urlParts.length < 2) {
      console.error('Invalid mock URL format:', fileUrl);
      return false;
    }
    
    const relativePath = urlParts[1];
    const filePath = path.join(uploadsDir, relativePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('File deleted successfully:', filePath);
      return true;
    } else {
      console.log('File not found:', filePath);
      return false;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Mock function to get signed URL
const getSignedUrl = (key, expires = 3600) => {
  return `http://localhost:3001/uploads/mock/${key}`;
};

module.exports = {
  upload,
  deleteFile,
  getSignedUrl,
  generateFileName
};
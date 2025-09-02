const MediaService = require('../services/MediaService');

describe('MediaService Unit Tests', () => {
  describe('validateFile', () => {
    it('should validate image files correctly', () => {
      const mockImageFile = {
        size: 1024 * 1024, // 1MB
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      };

      const errors = MediaService.validateFile(mockImageFile, 'image');
      expect(errors).toHaveLength(0);
    });

    it('should reject oversized image files', () => {
      const mockLargeFile = {
        size: 15 * 1024 * 1024, // 15MB
        mimetype: 'image/jpeg',
        originalname: 'large.jpg'
      };

      const errors = MediaService.validateFile(mockLargeFile, 'image');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('exceeds limit');
    });

    it('should reject invalid file types for images', () => {
      const mockInvalidFile = {
        size: 1024,
        mimetype: 'application/exe',
        originalname: 'virus.exe'
      };

      const errors = MediaService.validateFile(mockInvalidFile, 'image');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid file type');
    });

    it('should validate video files correctly', () => {
      const mockVideoFile = {
        size: 10 * 1024 * 1024, // 10MB
        mimetype: 'video/mp4',
        originalname: 'test.mp4'
      };

      const errors = MediaService.validateFile(mockVideoFile, 'video');
      expect(errors).toHaveLength(0);
    });

    it('should reject oversized video files', () => {
      const mockLargeVideoFile = {
        size: 60 * 1024 * 1024, // 60MB
        mimetype: 'video/mp4',
        originalname: 'large.mp4'
      };

      const errors = MediaService.validateFile(mockLargeVideoFile, 'video');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('exceeds limit');
    });

    it('should validate document files correctly', () => {
      const mockDocumentFile = {
        size: 1024 * 1024, // 1MB
        mimetype: 'application/pdf',
        originalname: 'document.pdf'
      };

      const errors = MediaService.validateFile(mockDocumentFile, 'document');
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid media types', () => {
      const mockFile = {
        size: 1024,
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      };

      const errors = MediaService.validateFile(mockFile, 'invalid_type');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid media type');
    });
  });

  describe('generateFileUrl', () => {
    it('should generate correct file URLs', () => {
      const filename = 'test-image.jpg';
      const mediaType = 'image';
      
      const url = MediaService.generateFileUrl(filename, mediaType);
      expect(url).toContain(filename);
      expect(url).toContain('/uploads/events/');
      expect(url).toMatch(/^https?:\/\//);
    });

    it('should use BASE_URL from environment', () => {
      const originalBaseUrl = process.env.BASE_URL;
      process.env.BASE_URL = 'https://example.com';
      
      const filename = 'test.jpg';
      const url = MediaService.generateFileUrl(filename, 'image');
      
      expect(url).toContain('https://example.com');
      
      // Restore original value
      if (originalBaseUrl) {
        process.env.BASE_URL = originalBaseUrl;
      } else {
        delete process.env.BASE_URL;
      }
    });
  });

  describe('ensureMediaDirectory', () => {
    it('should return the correct media directory path', () => {
      const mediaType = 'image';
      const directory = MediaService.ensureMediaDirectory(mediaType);
      
      expect(directory).toContain('uploads');
      expect(directory).toContain('events');
    });
  });

  describe('File validation edge cases', () => {
    it('should handle files with no extension', () => {
      const mockFile = {
        size: 1024,
        mimetype: 'image/jpeg',
        originalname: 'noextension'
      };

      const errors = MediaService.validateFile(mockFile, 'image');
      // Should still validate based on mimetype
      expect(errors).toHaveLength(0);
    });

    it('should handle files with multiple dots in name', () => {
      const mockFile = {
        size: 1024,
        mimetype: 'image/jpeg',
        originalname: 'my.file.name.jpg'
      };

      const errors = MediaService.validateFile(mockFile, 'image');
      expect(errors).toHaveLength(0);
    });

    it('should handle empty file names', () => {
      const mockFile = {
        size: 1024,
        mimetype: 'image/jpeg',
        originalname: ''
      };

      const errors = MediaService.validateFile(mockFile, 'image');
      expect(errors).toHaveLength(0);
    });

    it('should handle zero-size files', () => {
      const mockFile = {
        size: 0,
        mimetype: 'image/jpeg',
        originalname: 'empty.jpg'
      };

      const errors = MediaService.validateFile(mockFile, 'image');
      expect(errors).toHaveLength(0); // Zero size is technically valid
    });
  });

  describe('Media type validation', () => {
    const testCases = [
      { mediaType: 'image', validMimes: ['image/jpeg', 'image/png', 'image/webp'], invalidMimes: ['video/mp4', 'application/pdf'] },
      { mediaType: 'video', validMimes: ['video/mp4', 'video/webm', 'video/mov'], invalidMimes: ['image/jpeg', 'application/pdf'] },
      { mediaType: 'audio', validMimes: ['audio/mp3', 'audio/wav', 'audio/ogg'], invalidMimes: ['image/jpeg', 'video/mp4'] },
      { mediaType: 'document', validMimes: ['application/pdf', 'text/plain'], invalidMimes: ['image/jpeg', 'video/mp4'] }
    ];

    testCases.forEach(({ mediaType, validMimes, invalidMimes }) => {
      describe(`${mediaType} files`, () => {
        validMimes.forEach(mimetype => {
          it(`should accept ${mimetype}`, () => {
            const mockFile = {
              size: 1024,
              mimetype,
              originalname: `test.${mimetype.split('/')[1]}`
            };

            const errors = MediaService.validateFile(mockFile, mediaType);
            expect(errors).toHaveLength(0);
          });
        });

        invalidMimes.forEach(mimetype => {
          it(`should reject ${mimetype}`, () => {
            const mockFile = {
              size: 1024,
              mimetype,
              originalname: `test.${mimetype.split('/')[1]}`
            };

            const errors = MediaService.validateFile(mockFile, mediaType);
            expect(errors.length).toBeGreaterThan(0);
          });
        });
      });
    });
  });
});
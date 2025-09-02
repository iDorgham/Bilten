const request = require('supertest');
const express = require('express');
const mfaRoutes = require('../routes/mfa');
const MFAService = require('../services/MFAService');
const { authenticateToken } = require('../middleware/auth');

// Mock dependencies
jest.mock('../services/MFAService');
jest.mock('../middleware/auth');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('MFA Management Routes', () => {
  let app;
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: mockUserId, email: mockEmail };
      next();
    });
    
    app.use('/api/v1/mfa', mfaRoutes);
    
    jest.clearAllMocks();
  });

  describe('GET /api/v1/mfa/methods', () => {
    it('should return all MFA methods with management details', async () => {
      const mockMethods = [
        {
          id: 'method-1',
          type: 'totp',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'method-2',
          type: 'sms',
          is_active: false,
          phone_number: '+1234567890',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      const mockStats = {
        total_methods: 2,
        active_methods: 1,
        has_totp: true,
        has_sms: false
      };

      const mockMFASettings = {
        backup_codes: ['CODE1', 'CODE2', 'CODE3'],
        backup_codes_used: ['CODE1'],
        last_used_at: '2024-01-01T12:00:00Z'
      };

      // Mock the MFAMethod require
      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findByUser = jest.fn().mockResolvedValue(mockMethods);
      MFAMethod.prototype.getUserMFAStats = jest.fn().mockResolvedValue(mockStats);
      MFAService.getMFASettings.mockResolvedValue(mockMFASettings);

      const response = await request(app)
        .get('/api/v1/mfa/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.methods).toHaveLength(2);
      expect(response.body.data.methods[0]).toEqual({
        id: 'method-1',
        type: 'totp',
        isActive: true,
        phoneNumber: undefined,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        canDisable: true,
        canDelete: false
      });
      expect(response.body.data.methods[1]).toEqual({
        id: 'method-2',
        type: 'sms',
        isActive: false,
        phoneNumber: '+1234567890',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        canDisable: true,
        canDelete: true
      });
      expect(response.body.data.backupCodes).toEqual({
        total: 3,
        used: 1,
        remaining: 2
      });
    });

    it('should handle empty methods list', async () => {
      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findByUser = jest.fn().mockResolvedValue([]);
      MFAMethod.prototype.getUserMFAStats = jest.fn().mockResolvedValue({
        total_methods: 0,
        active_methods: 0
      });
      MFAService.getMFASettings.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/mfa/methods')
        .expect(200);

      expect(response.body.data.methods).toHaveLength(0);
      expect(response.body.data.backupCodes.total).toBe(0);
    });
  });

  describe('DELETE /api/v1/mfa/methods/:methodId', () => {
    it('should delete inactive MFA method successfully', async () => {
      const methodId = 'method-123';
      const mockMethod = {
        id: methodId,
        user_id: mockUserId,
        type: 'sms',
        is_active: false
      };

      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findById = jest.fn().mockResolvedValue(mockMethod);
      MFAMethod.prototype.delete = jest.fn().mockResolvedValue(mockMethod);

      const response = await request(app)
        .delete(`/api/v1/mfa/methods/${methodId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'MFA method deleted successfully'
      });

      expect(MFAMethod.prototype.delete).toHaveBeenCalledWith(methodId);
    });

    it('should reject deletion of non-existent method', async () => {
      const methodId = 'non-existent';

      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/v1/mfa/methods/${methodId}`)
        .expect(404);

      expect(response.body.error).toBe('MFA method not found');
    });

    it('should reject deletion of method belonging to different user', async () => {
      const methodId = 'method-123';
      const mockMethod = {
        id: methodId,
        user_id: 'different-user-id',
        type: 'sms',
        is_active: false
      };

      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findById = jest.fn().mockResolvedValue(mockMethod);

      const response = await request(app)
        .delete(`/api/v1/mfa/methods/${methodId}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should reject deletion of active method', async () => {
      const methodId = 'method-123';
      const mockMethod = {
        id: methodId,
        user_id: mockUserId,
        type: 'totp',
        is_active: true
      };

      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findById = jest.fn().mockResolvedValue(mockMethod);

      const response = await request(app)
        .delete(`/api/v1/mfa/methods/${methodId}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot delete active method');
    });
  });

  describe('POST /api/v1/mfa/validate', () => {
    it('should validate TOTP code successfully', async () => {
      const mockResult = {
        success: true,
        method: 'totp',
        message: 'MFA validation successful'
      };

      MFAService.validateMFACode.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/validate')
        .send({
          userId: mockUserId,
          code: '123456',
          method: 'totp'
        })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(MFAService.validateMFACode).toHaveBeenCalledWith(mockUserId, '123456', 'totp');
    });

    it('should return failure for invalid code', async () => {
      const mockResult = {
        success: false,
        method: 'totp',
        message: 'Invalid MFA code'
      };

      MFAService.validateMFACode.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/validate')
        .send({
          userId: mockUserId,
          code: 'invalid',
          method: 'totp'
        })
        .expect(400);

      expect(response.body).toEqual(mockResult);
    });

    it('should validate backup code successfully', async () => {
      const mockResult = {
        success: true,
        method: 'backup_code',
        message: 'MFA validation successful'
      };

      MFAService.validateMFACode.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/mfa/validate')
        .send({
          userId: mockUserId,
          code: 'ABCD1234EFGH',
          method: 'backup'
        })
        .expect(200);

      expect(response.body).toEqual(mockResult);
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .post('/api/v1/mfa/validate')
        .send({
          userId: 'invalid-uuid',
          code: '123',
          method: 'invalid'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveLength(3);
    });
  });

  describe('GET /api/v1/mfa/available-methods/:userId', () => {
    it('should return available MFA methods for user', async () => {
      const mockAvailableMethods = {
        methods: {
          totp: true,
          sms: false,
          email: true,
          backup: true
        },
        hasAnyMethod: true,
        activeMethodCount: 2
      };

      MFAService.getAvailableMFAMethods.mockResolvedValue(mockAvailableMethods);

      const response = await request(app)
        .get(`/api/v1/mfa/available-methods/${mockUserId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAvailableMethods,
        message: 'Available MFA methods retrieved successfully'
      });

      expect(MFAService.getAvailableMFAMethods).toHaveBeenCalledWith(mockUserId);
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/mfa/available-methods/invalid-uuid')
        .expect(400);

      expect(response.body.error).toBe('Invalid user ID format');
    });

    it('should handle service errors', async () => {
      MFAService.getAvailableMFAMethods.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/v1/mfa/available-methods/${mockUserId}`)
        .expect(500);

      expect(response.body.error).toBe('Failed to get available MFA methods');
    });
  });

  describe('Error Handling', () => {
    it('should handle MFA methods retrieval failure', async () => {
      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findByUser = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/mfa/methods')
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve MFA methods');
    });

    it('should handle MFA method deletion failure', async () => {
      const methodId = 'method-123';
      const mockMethod = {
        id: methodId,
        user_id: mockUserId,
        type: 'sms',
        is_active: false
      };

      const MFAMethod = require('../models/MFAMethod');
      MFAMethod.prototype.findById = jest.fn().mockResolvedValue(mockMethod);
      MFAMethod.prototype.delete = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/v1/mfa/methods/${methodId}`)
        .expect(500);

      expect(response.body.error).toBe('Failed to delete MFA method');
    });

    it('should handle MFA validation service errors', async () => {
      MFAService.validateMFACode.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/v1/mfa/validate')
        .send({
          userId: mockUserId,
          code: '123456',
          method: 'totp'
        })
        .expect(500);

      expect(response.body.error).toBe('MFA validation failed');
    });
  });
});
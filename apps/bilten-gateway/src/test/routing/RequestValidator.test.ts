/**
 * Unit tests for RequestValidator
 */

import { Request, Response } from 'express';
import { RequestValidator } from '../../routing/RequestValidator';
import { RouteValidation } from '../../routing/types';

describe('RequestValidator', () => {
  describe('validate', () => {
    it('should validate required string fields', () => {
      const req = {
        headers: { 'content-type': 'application/json' },
        query: { name: 'test' },
        body: { email: 'test@example.com' }
      } as unknown as Request;

      const validation: RouteValidation = {
        headers: [{ field: 'content-type', type: 'string', required: true }],
        query: [{ field: 'name', type: 'string', required: true }],
        body: [{ field: 'email', type: 'string', required: true }]
      };

      const errors = RequestValidator.validate(req, validation);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const req = {
        headers: {},
        query: {},
        body: {}
      } as unknown as Request;

      const validation: RouteValidation = {
        headers: [{ field: 'authorization', type: 'string', required: true }],
        query: [{ field: 'page', type: 'number', required: true }],
        body: [{ field: 'name', type: 'string', required: true }]
      };

      const errors = RequestValidator.validate(req, validation);
      expect(errors).toHaveLength(3);
      expect(errors[0].field).toBe('header.authorization');
      expect(errors[1].field).toBe('query.page');
      expect(errors[2].field).toBe('body.name');
    });

    it('should validate string length constraints', () => {
      const req = {
        body: {
          shortString: 'ab',
          longString: 'a'.repeat(101)
        }
      } as unknown as Request;

      const validation: RouteValidation = {
        body: [
          { field: 'shortString', type: 'string', minLength: 3 },
          { field: 'longString', type: 'string', maxLength: 100 }
        ]
      };

      const errors = RequestValidator.validate(req, validation);
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toContain('at least 3 characters');
      expect(errors[1].message).toContain('at most 100 characters');
    });

    it('should validate string patterns', () => {
      const req = {
        body: {
          email: 'invalid-email',
          validEmail: 'test@example.com'
        }
      } as unknown as Request;

      const validation: RouteValidation = {
        body: [
          { field: 'email', type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
          { field: 'validEmail', type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' }
        ]
      };

      const errors = RequestValidator.validate(req, validation);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('body.email');
      expect(errors[0].message).toContain('does not match the required pattern');
    });

    it('should validate number types', () => {
      const req = {
        query: {
          validNumber: 42,
          invalidNumber: 'not-a-number'
        }
      } as any;

      const validation: RouteValidation = {
        query: [
          { field: 'validNumber', type: 'number' },
          { field: 'invalidNumber', type: 'number' }
        ]
      };

      const errors = RequestValidator.validate(req, validation);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('query.invalidNumber');
      expect(errors[0].message).toContain('must be of type number');
    });

    it('should validate array types and length', () => {
      const req = {
        body: {
          validArray: [1, 2, 3],
          shortArray: [1],
          longArray: [1, 2, 3, 4, 5, 6],
          notArray: 'string'
        }
      } as unknown as Request;

      const validation: RouteValidation = {
        body: [
          { field: 'validArray', type: 'array', minLength: 2, maxLength: 5 },
          { field: 'shortArray', type: 'array', minLength: 2 },
          { field: 'longArray', type: 'array', maxLength: 5 },
          { field: 'notArray', type: 'array' }
        ]
      };

      const errors = RequestValidator.validate(req, validation);
      expect(errors).toHaveLength(3);
      expect(errors.find(e => e.field === 'body.shortArray')?.message).toContain('at least 2 items');
      expect(errors.find(e => e.field === 'body.longArray')?.message).toContain('at most 5 items');
      expect(errors.find(e => e.field === 'body.notArray')?.message).toContain('must be of type array');
    });

    it('should validate enum values', () => {
      const req = {
        query: {
          validStatus: 'active',
          invalidStatus: 'unknown'
        }
      } as any;

      const validation: RouteValidation = {
        query: [
          { field: 'validStatus', type: 'string', enum: ['active', 'inactive', 'pending'] },
          { field: 'invalidStatus', type: 'string', enum: ['active', 'inactive', 'pending'] }
        ]
      };

      const errors = RequestValidator.validate(req, validation);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('query.invalidStatus');
      expect(errors[0].message).toContain('must be one of: active, inactive, pending');
    });

    it('should skip validation for optional missing fields', () => {
      const req = {
        body: {}
      } as unknown as Request;

      const validation: RouteValidation = {
        body: [
          { field: 'optionalField', type: 'string', required: false }
        ]
      };

      const errors = RequestValidator.validate(req, validation);
      expect(errors).toHaveLength(0);
    });
  });

  describe('middleware', () => {
    it('should call next() for valid requests', () => {
      const req = {
        body: { name: 'test' }
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      const validation: RouteValidation = {
        body: [{ field: 'name', type: 'string', required: true }]
      };

      const middleware = RequestValidator.middleware(validation);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 400 error for invalid requests', () => {
      const req = {
        body: {}
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;
      const next = jest.fn();

      const validation: RouteValidation = {
        body: [{ field: 'name', type: 'string', required: true }]
      };

      const middleware = RequestValidator.middleware(validation);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.any(Array),
          timestamp: expect.any(String)
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeRequest', () => {
    it('should trim string values in query parameters', () => {
      const req = {
        query: {
          name: '  test  ',
          number: 123
        }
      } as any;

      RequestValidator.sanitizeRequest(req);

      expect(req.query.name).toBe('test');
      expect(req.query.number).toBe(123);
    });

    it('should trim string values in request body', () => {
      const req = {
        body: {
          name: '  test  ',
          nested: {
            value: '  nested  '
          }
        }
      } as unknown as Request;

      RequestValidator.sanitizeRequest(req);

      expect(req.body.name).toBe('test');
      expect(req.body.nested.value).toBe('nested');
    });

    it('should handle missing query and body', () => {
      const req = {} as unknown as Request;

      expect(() => RequestValidator.sanitizeRequest(req)).not.toThrow();
    });
  });
});
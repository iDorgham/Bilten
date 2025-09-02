/**
 * Request validation middleware for route requests
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationRule, RouteValidation } from './types';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class RequestValidator {
  /**
   * Validate request against validation rules
   */
  static validate(req: Request, validation: RouteValidation): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate headers
    if (validation.headers) {
      errors.push(...this.validateObject(req.headers, validation.headers, 'header'));
    }

    // Validate query parameters
    if (validation.query) {
      errors.push(...this.validateObject(req.query, validation.query, 'query'));
    }

    // Validate request body
    if (validation.body) {
      errors.push(...this.validateObject(req.body || {}, validation.body, 'body'));
    }

    return errors;
  }

  /**
   * Create Express middleware for request validation
   */
  static middleware(validation: RouteValidation) {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors = this.validate(req, validation);

      if (errors.length > 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      next();
    };
  }

  /**
   * Validate an object against validation rules
   */
  private static validateObject(
    obj: any, 
    rules: ValidationRule[], 
    context: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const value = obj[rule.field];
      const fieldErrors = this.validateField(value, rule, context);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  /**
   * Validate a single field against a validation rule
   */
  private static validateField(
    value: any, 
    rule: ValidationRule, 
    context: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const fieldName = `${context}.${rule.field}`;

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldName,
        message: `${rule.field} is required`,
        value
      });
      return errors; // Don't validate further if required field is missing
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    if (!this.validateType(value, rule.type)) {
      errors.push({
        field: fieldName,
        message: `${rule.field} must be of type ${rule.type}`,
        value
      });
      return errors; // Don't validate further if type is wrong
    }

    // String-specific validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: fieldName,
          message: `${rule.field} must be at least ${rule.minLength} characters long`,
          value
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: fieldName,
          message: `${rule.field} must be at most ${rule.maxLength} characters long`,
          value
        });
      }

      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        errors.push({
          field: fieldName,
          message: `${rule.field} does not match the required pattern`,
          value
        });
      }
    }

    // Array-specific validations
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: fieldName,
          message: `${rule.field} must have at least ${rule.minLength} items`,
          value
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: fieldName,
          message: `${rule.field} must have at most ${rule.maxLength} items`,
          value
        });
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field: fieldName,
        message: `${rule.field} must be one of: ${rule.enum.join(', ')}`,
        value
      });
    }

    return errors;
  }

  /**
   * Validate value type
   */
  private static validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Sanitize request data
   */
  static sanitizeRequest(req: Request): void {
    // Trim string values in query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = value.trim();
        }
      }
    }

    // Trim string values in body
    if (req.body && typeof req.body === 'object') {
      this.sanitizeObject(req.body);
    }
  }

  /**
   * Recursively sanitize object properties
   */
  private static sanitizeObject(obj: any): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        obj[key] = value.trim();
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.sanitizeObject(value);
      }
    }
  }
}
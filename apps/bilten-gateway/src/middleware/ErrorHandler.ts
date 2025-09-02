import { Request, Response } from 'express';
import { Logger } from '../utils/Logger';

export interface GatewayError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ErrorHandler {
  private static logger = Logger.getInstance();

  static handleError() {
    return (error: GatewayError, req: Request, res: Response) => {
      // Log the error
      ErrorHandler.logger.error('Gateway error occurred', {
        error: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        code: error.code,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id
      });

      // Determine status code
      const statusCode = error.statusCode || 500;
      
      // Determine error code
      const errorCode = error.code || ErrorHandler.getErrorCodeFromStatus(statusCode);
      
      // Create error response
      const errorResponse = {
        error: {
          code: errorCode,
          message: ErrorHandler.getErrorMessage(error, statusCode),
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        }
      };

      // Add details in development mode
      if (process.env.NODE_ENV === 'development') {
        errorResponse.error = {
          ...errorResponse.error,
          details: error.details,
          stack: error.stack
        } as any;
      }

      res.status(statusCode).json(errorResponse);
    };
  }

  private static getErrorCodeFromStatus(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 408:
        return 'REQUEST_TIMEOUT';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  private static getErrorMessage(error: GatewayError, statusCode: number): string {
    // Return custom error message if provided
    if (error.message && error.message !== 'Error') {
      return error.message;
    }

    // Return default message based on status code
    switch (statusCode) {
      case 400:
        return 'The request was invalid or malformed';
      case 401:
        return 'Authentication is required to access this resource';
      case 403:
        return 'You do not have permission to access this resource';
      case 404:
        return 'The requested resource was not found';
      case 408:
        return 'The request timed out';
      case 409:
        return 'The request conflicts with the current state of the resource';
      case 422:
        return 'The request data failed validation';
      case 429:
        return 'Too many requests. Please try again later';
      case 500:
        return 'An internal server error occurred';
      case 502:
        return 'Bad gateway - upstream server error';
      case 503:
        return 'Service temporarily unavailable';
      case 504:
        return 'Gateway timeout - upstream server did not respond';
      default:
        return 'An unexpected error occurred';
    }
  }

  // Helper methods to create specific errors
  static createBadRequestError(message: string, details?: any): GatewayError {
    const error = new Error(message) as GatewayError;
    error.statusCode = 400;
    error.code = 'BAD_REQUEST';
    error.details = details;
    return error;
  }

  static createUnauthorizedError(message: string = 'Authentication required'): GatewayError {
    const error = new Error(message) as GatewayError;
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    return error;
  }

  static createForbiddenError(message: string = 'Access denied'): GatewayError {
    const error = new Error(message) as GatewayError;
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    return error;
  }

  static createNotFoundError(message: string = 'Resource not found'): GatewayError {
    const error = new Error(message) as GatewayError;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    return error;
  }

  static createTimeoutError(message: string = 'Request timeout'): GatewayError {
    const error = new Error(message) as GatewayError;
    error.statusCode = 408;
    error.code = 'REQUEST_TIMEOUT';
    return error;
  }

  static createRateLimitError(message: string = 'Rate limit exceeded'): GatewayError {
    const error = new Error(message) as GatewayError;
    error.statusCode = 429;
    error.code = 'RATE_LIMIT_EXCEEDED';
    return error;
  }

  static createServiceUnavailableError(message: string = 'Service unavailable'): GatewayError {
    const error = new Error(message) as GatewayError;
    error.statusCode = 503;
    error.code = 'SERVICE_UNAVAILABLE';
    return error;
  }
}
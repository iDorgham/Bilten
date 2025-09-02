/**
 * Centralized Logging Configuration for Bilten Platform (TypeScript)
 *
 * This module provides a standardized logging configuration that can be used
 * across all Bilten services to ensure consistent structured logging.
 */
import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
export declare const LOG_LEVELS: {
    error: number;
    warn: number;
    info: number;
    http: number;
    debug: number;
};
export declare const LOG_COLORS: {
    error: string;
    warn: string;
    info: string;
    http: string;
    debug: string;
};
export interface LoggerOptions {
    logLevel?: string;
    logDir?: string;
    enableConsole?: boolean;
    enableFile?: boolean;
    enableLogstash?: boolean;
    logstashHost?: string;
    logstashPort?: number;
}
export interface LogContext {
    requestId?: string;
    userId?: string;
    component?: string;
    [key: string]: any;
}
export interface ExtendedRequest extends Request {
    requestId?: string;
    logger?: winston.Logger;
}
/**
 * Creates a structured logger instance for a service
 */
export declare function createLogger(serviceName: string, options?: LoggerOptions): winston.Logger;
/**
 * Creates a child logger with additional context
 */
export declare function createChildLogger(parentLogger: winston.Logger, context?: LogContext): winston.Logger;
/**
 * Express middleware for HTTP request logging
 */
export declare function createHttpLoggerMiddleware(logger: winston.Logger): (req: ExtendedRequest, res: Response, next: NextFunction) => void;
/**
 * Error logging middleware for Express
 */
export declare function createErrorLoggerMiddleware(logger: winston.Logger): (error: Error, req: ExtendedRequest, res: Response, next: NextFunction) => void;
/**
 * Graceful shutdown handler for loggers
 */
export declare function setupGracefulShutdown(logger: winston.Logger): void;
//# sourceMappingURL=logging-config.d.ts.map
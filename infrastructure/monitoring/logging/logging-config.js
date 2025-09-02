"use strict";
/**
 * Centralized Logging Configuration for Bilten Platform (TypeScript)
 *
 * This module provides a standardized logging configuration that can be used
 * across all Bilten services to ensure consistent structured logging.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_COLORS = exports.LOG_LEVELS = void 0;
exports.createLogger = createLogger;
exports.createChildLogger = createChildLogger;
exports.createHttpLoggerMiddleware = createHttpLoggerMiddleware;
exports.createErrorLoggerMiddleware = createErrorLoggerMiddleware;
exports.setupGracefulShutdown = setupGracefulShutdown;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
// Define log levels with priorities
exports.LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
// Define colors for console output
exports.LOG_COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
};
/**
 * Creates a structured logger instance for a service
 */
function createLogger(serviceName, options = {}) {
    const { logLevel = process.env.LOG_LEVEL || 'info', logDir = process.env.LOG_DIR || 'logs', enableConsole = process.env.NODE_ENV !== 'production', enableFile = true, enableLogstash = process.env.ENABLE_LOGSTASH === 'true', logstashHost = process.env.LOGSTASH_HOST || 'localhost', logstashPort = parseInt(process.env.LOGSTASH_PORT || '5000') } = options;
    // Create custom format for structured logging
    const structuredFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, service, component, requestId, userId, ...meta }) => {
        const logEntry = {
            '@timestamp': timestamp,
            level: level.toUpperCase(),
            service: service || serviceName,
            component: component || 'main',
            message,
            ...(requestId && { requestId }),
            ...(userId && { userId }),
            ...meta
        };
        // Add environment information
        logEntry.environment = process.env.NODE_ENV || 'development';
        logEntry.version = process.env.APP_VERSION || '1.0.0';
        logEntry.hostname = process.env.HOSTNAME || os_1.default.hostname();
        return JSON.stringify(logEntry);
    }));
    // Create console format for development
    const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'HH:mm:ss'
    }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, service, component, requestId, ...meta }) => {
        const serviceInfo = `[${service || serviceName}${component ? ':' + component : ''}]`;
        const reqInfo = requestId ? ` [${requestId}]` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level} ${serviceInfo}${reqInfo}: ${message}${metaStr}`;
    }));
    // Configure transports
    const transports = [];
    // Console transport for development
    if (enableConsole) {
        transports.push(new winston_1.default.transports.Console({
            level: logLevel,
            format: consoleFormat
        }));
    }
    // File transports
    if (enableFile) {
        // Ensure log directory exists
        const fs = require('fs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        // Error log file
        transports.push(new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, `${serviceName}-error.log`),
            level: 'error',
            format: structuredFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }));
        // Combined log file
        transports.push(new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, `${serviceName}-combined.log`),
            format: structuredFormat,
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        }));
        // HTTP access log file (for gateway and backend)
        if (['gateway', 'backend'].includes(serviceName)) {
            transports.push(new winston_1.default.transports.File({
                filename: path_1.default.join(logDir, `${serviceName}-access.log`),
                level: 'http',
                format: structuredFormat,
                maxsize: 10485760, // 10MB
                maxFiles: 5,
                tailable: true
            }));
        }
    }
    // Logstash transport for centralized logging
    if (enableLogstash) {
        try {
            const LogstashTransport = require('winston-logstash');
            transports.push(new LogstashTransport({
                port: logstashPort,
                node_name: `${serviceName}-${process.env.HOSTNAME || os_1.default.hostname()}`,
                host: logstashHost,
                max_connect_retries: 5,
                timeout_connect_retries: 10000
            }));
        }
        catch (error) {
            console.warn('winston-logstash not available, skipping Logstash transport');
        }
    }
    // Create logger instance
    const logger = winston_1.default.createLogger({
        levels: exports.LOG_LEVELS,
        level: logLevel,
        format: structuredFormat,
        defaultMeta: {
            service: serviceName,
            pid: process.pid
        },
        transports,
        exitOnError: false
    });
    // Add colors
    winston_1.default.addColors(exports.LOG_COLORS);
    return logger;
}
/**
 * Creates a child logger with additional context
 */
function createChildLogger(parentLogger, context = {}) {
    return parentLogger.child(context);
}
/**
 * Express middleware for HTTP request logging
 */
function createHttpLoggerMiddleware(logger) {
    return (req, res, next) => {
        const startTime = Date.now();
        const requestId = req.headers['x-request-id'] ||
            req.headers['x-correlation-id'] ||
            crypto_1.default.randomUUID();
        // Add request ID to request object for use in other middleware
        req.requestId = requestId;
        // Create child logger with request context
        req.logger = createChildLogger(logger, {
            requestId,
            component: 'http'
        });
        // Log incoming request
        req.logger.http('Incoming request', {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection?.remoteAddress,
            headers: {
                'content-type': req.get('Content-Type'),
                'authorization': req.get('Authorization') ? '[REDACTED]' : undefined
            }
        });
        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function (...args) {
            const duration = Date.now() - startTime;
            req.logger.http('Request completed', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration,
                contentLength: res.get('Content-Length')
            });
            originalEnd.apply(this, args);
        };
        next();
    };
}
/**
 * Error logging middleware for Express
 */
function createErrorLoggerMiddleware(logger) {
    return (error, req, res, next) => {
        const requestLogger = req.logger || logger;
        requestLogger.error('Request error', {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            method: req.method,
            url: req.url,
            statusCode: res.statusCode || 500,
            requestId: req.requestId
        });
        next(error);
    };
}
/**
 * Graceful shutdown handler for loggers
 */
function setupGracefulShutdown(logger) {
    const shutdown = (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        // Close all transports
        logger.end(() => {
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
//# sourceMappingURL=logging-config.js.map
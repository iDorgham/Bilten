/**
 * Gateway Service Logger
 * 
 * Structured logging implementation for the Bilten API Gateway
 */

import * as winston from 'winston';

export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
    // Create winston logger with console and file transports
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/gateway-error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/gateway-combined.log' 
        })
      ]
    });
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Main logger methods
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: any): void {
    this.logger.error(message, { error: error?.stack || error });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  http(message: string, meta?: any): void {
    this.logger.http(message, meta);
  }

  // Component-specific logger methods
  routing(message: string, meta?: any): void {
    this.logger.info(message, { component: 'routing', ...meta });
  }

  service(message: string, meta?: any): void {
    this.logger.info(message, { component: 'service-discovery', ...meta });
  }

  auth(message: string, meta?: any): void {
    this.logger.info(message, { component: 'auth', ...meta });
  }

  // Create child logger with context
  createChild(context: LogContext): winston.Logger {
    return this.logger.child(context);
  }

  // Get raw winston logger for advanced usage
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}
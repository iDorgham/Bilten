/**
 * Scanner App Logger
 * 
 * Client-side logging implementation for the Bilten Scanner Mobile Application
 * This logger sends structured logs to the backend for centralized logging
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class ScannerLogger {
  constructor() {
    this.logLevel = this.getLogLevel();
    this.sessionId = this.generateSessionId();
    this.deviceId = this.getDeviceId();
    this.logBuffer = [];
    this.flushInterval = 10000; // 10 seconds (longer for mobile)
    this.maxBufferSize = 30; // Smaller buffer for mobile
    
    // Start periodic log flushing
    this.startLogFlushing();
    
    // Setup error handlers
    this.setupErrorHandlers();
  }

  getLogLevel() {
    // Try to get from localStorage, fallback to environment
    try {
      return localStorage?.getItem('logLevel') || 
             (process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO');
    } catch (e) {
      return process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO';
    }
  }

  generateSessionId() {
    return 'scanner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getDeviceId() {
    try {
      let deviceId = localStorage?.getItem('deviceId');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage?.setItem('deviceId', deviceId);
      }
      return deviceId;
    } catch (e) {
      return 'unknown_device';
    }
  }

  shouldLog(level) {
    const currentLevelValue = LOG_LEVELS[this.logLevel] || LOG_LEVELS.INFO;
    const messageLevelValue = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    return messageLevelValue <= currentLevelValue;
  }

  createLogEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    
    return {
      '@timestamp': timestamp,
      level: level.toUpperCase(),
      service: 'scanner',
      component: meta.component || 'main',
      message,
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.REACT_APP_VERSION || '1.0.0',
      platform: this.getPlatform(),
      ...meta
    };
  }

  getPlatform() {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) return 'android';
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    return 'web';
  }

  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);
    
    // Flush immediately for errors
    if (logEntry.level === 'ERROR') {
      this.flush();
    } else if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.logBuffer.length === 0) return;
    
    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // Get API base URL from environment or current location
      const apiBaseUrl = process.env.REACT_APP_API_URL || 
                        (typeof window !== 'undefined' ? 
                         `${window.location.protocol}//${window.location.hostname}:3001` : 
                         'http://localhost:3001');
      
      const response = await fetch(`${apiBaseUrl}/api/v1/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend })
      });
      
      if (!response.ok) {
        console.warn('Failed to send logs to server:', response.statusText);
      }
    } catch (error) {
      console.warn('Error sending logs to server:', error);
      // Store failed logs in localStorage for retry
      this.storeFailedLogs(logsToSend);
    }
  }

  storeFailedLogs(logs) {
    try {
      const existingLogs = JSON.parse(localStorage?.getItem('failedLogs') || '[]');
      const updatedLogs = [...existingLogs, ...logs].slice(-100); // Keep last 100 logs
      localStorage?.setItem('failedLogs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.warn('Failed to store logs in localStorage:', e);
    }
  }

  async retryFailedLogs() {
    try {
      const failedLogs = JSON.parse(localStorage?.getItem('failedLogs') || '[]');
      if (failedLogs.length === 0) return;
      
      const apiBaseUrl = process.env.REACT_APP_API_URL || 
                        (typeof window !== 'undefined' ? 
                         `${window.location.protocol}//${window.location.hostname}:3001` : 
                         'http://localhost:3001');
      
      const response = await fetch(`${apiBaseUrl}/api/v1/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: failedLogs })
      });
      
      if (response.ok) {
        localStorage?.removeItem('failedLogs');
      }
    } catch (error) {
      console.warn('Failed to retry sending logs:', error);
    }
  }

  startLogFlushing() {
    setInterval(() => {
      this.flush();
      this.retryFailedLogs();
    }, this.flushInterval);
    
    // Flush logs when app goes to background (mobile)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  setupErrorHandlers() {
    if (typeof window === 'undefined') return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Global JavaScript error', {
        component: 'global-error-handler',
        error: {
          message: event.error?.message || event.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        component: 'promise-rejection-handler',
        error: {
          message: event.reason?.message || event.reason,
          stack: event.reason?.stack
        }
      });
    });
  }

  // Public logging methods
  error(message, meta = {}) {
    if (!this.shouldLog('ERROR')) return;
    
    const logEntry = this.createLogEntry('ERROR', message, meta);
    
    // Always log errors to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${logEntry['@timestamp']}] ERROR [${logEntry.component}]:`, message, meta);
    }
    
    this.addToBuffer(logEntry);
  }

  warn(message, meta = {}) {
    if (!this.shouldLog('WARN')) return;
    
    const logEntry = this.createLogEntry('WARN', message, meta);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${logEntry['@timestamp']}] WARN [${logEntry.component}]:`, message, meta);
    }
    
    this.addToBuffer(logEntry);
  }

  info(message, meta = {}) {
    if (!this.shouldLog('INFO')) return;
    
    const logEntry = this.createLogEntry('INFO', message, meta);
    
    if (process.env.NODE_ENV === 'development') {
      console.info(`[${logEntry['@timestamp']}] INFO [${logEntry.component}]:`, message, meta);
    }
    
    this.addToBuffer(logEntry);
  }

  debug(message, meta = {}) {
    if (!this.shouldLog('DEBUG')) return;
    
    const logEntry = this.createLogEntry('DEBUG', message, meta);
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${logEntry['@timestamp']}] DEBUG [${logEntry.component}]:`, message, meta);
    }
    
    this.addToBuffer(logEntry);
  }

  // Specialized logging methods for scanner app
  scanAttempt(eventId, ticketId, result, meta = {}) {
    this.info(`Scan attempt: ${result}`, {
      component: 'qr-scanner',
      eventId,
      ticketId,
      result,
      ...meta
    });
  }

  scanSuccess(eventId, ticketId, attendeeName, meta = {}) {
    this.info('Ticket scan successful', {
      component: 'qr-scanner',
      eventId,
      ticketId,
      attendeeName,
      ...meta
    });
  }

  scanError(eventId, ticketId, error, meta = {}) {
    this.error('Ticket scan failed', {
      component: 'qr-scanner',
      eventId,
      ticketId,
      error: typeof error === 'string' ? error : error.message,
      ...meta
    });
  }

  offlineSync(action, count, meta = {}) {
    this.info(`Offline sync: ${action}`, {
      component: 'offline-sync',
      action,
      count,
      ...meta
    });
  }

  cameraError(error, meta = {}) {
    this.error('Camera error', {
      component: 'camera',
      error: typeof error === 'string' ? error : error.message,
      ...meta
    });
  }
}

// Create singleton instance
const logger = new ScannerLogger();

// Export logger instance and helper functions
export default logger;

export const createComponentLogger = (componentName) => {
  return {
    error: (message, meta = {}) => logger.error(message, { component: componentName, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { component: componentName, ...meta }),
    info: (message, meta = {}) => logger.info(message, { component: componentName, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { component: componentName, ...meta }),
    scanAttempt: (eventId, ticketId, result, meta = {}) => 
      logger.scanAttempt(eventId, ticketId, result, { component: componentName, ...meta }),
    scanSuccess: (eventId, ticketId, attendeeName, meta = {}) => 
      logger.scanSuccess(eventId, ticketId, attendeeName, { component: componentName, ...meta }),
    scanError: (eventId, ticketId, error, meta = {}) => 
      logger.scanError(eventId, ticketId, error, { component: componentName, ...meta })
  };
};
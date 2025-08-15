// Simple logger utility for development
// In production, this should be replaced with a proper logging library like winston

class Logger {
  log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  error(message, ...args) {
    this.log('error', message, ...args);
  }

  debug(message, ...args) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, ...args);
    }
  }
}

module.exports = new Logger();

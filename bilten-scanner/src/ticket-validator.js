export class TicketValidator {
  constructor() {
    this.apiBaseUrl = 'https://api.bilten.com';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async validateTicket(qrData) {
    try {
      // Parse QR data
      const ticketData = this.parseQRData(qrData);
      
      if (!ticketData) {
        return {
          valid: false,
          error: 'Invalid QR code format',
          ticket: null
        };
      }

      // Check cache first
      const cached = this.getCachedResult(ticketData.ticketId);
      if (cached) {
        return cached;
      }

      // Validate with server
      const result = await this.validateWithServer(ticketData);
      
      // Cache result
      this.cacheResult(ticketData.ticketId, result);
      
      return result;
    } catch (error) {
      console.error('Ticket validation error:', error);
      return {
        valid: false,
        error: 'Validation failed',
        ticket: null,
        offline: !navigator.onLine
      };
    }
  }

  parseQRData(qrData) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(qrData);
      
      // Validate required fields
      if (parsed.ticketId && parsed.eventId && parsed.timestamp) {
        return {
          ticketId: parsed.ticketId,
          eventId: parsed.eventId,
          timestamp: parsed.timestamp,
          signature: parsed.signature
        };
      }
    } catch (error) {
      // Not JSON, try other formats
      console.warn('QR data is not JSON:', error);
    }

    // Try to extract ticket ID from URL or other formats
    const ticketIdMatch = qrData.match(/ticket[_-]?id[=:]([a-zA-Z0-9_-]+)/i);
    if (ticketIdMatch) {
      return {
        ticketId: ticketIdMatch[1],
        eventId: null,
        timestamp: Date.now(),
        signature: null
      };
    }

    return null;
  }

  async validateWithServer(ticketData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/tickets/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          ticketId: ticketData.ticketId,
          eventId: ticketData.eventId,
          timestamp: ticketData.timestamp,
          signature: ticketData.signature
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          error: errorData.message || 'Server validation failed',
          ticket: null
        };
      }

      const result = await response.json();
      
      return {
        valid: result.valid,
        ticket: result.ticket,
        event: result.event,
        error: result.error || null,
        message: result.message || null
      };
    } catch (error) {
      console.error('Server validation error:', error);
      throw error;
    }
  }

  getCachedResult(ticketId) {
    const cached = this.cache.get(ticketId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    return null;
  }

  cacheResult(ticketId, result) {
    this.cache.set(ticketId, {
      result,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    this.cleanupCache();
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  getAuthToken() {
    // Get auth token from localStorage or other storage
    return localStorage.getItem('scanner_auth_token') || '';
  }

  setAuthToken(token) {
    localStorage.setItem('scanner_auth_token', token);
  }

  clearCache() {
    this.cache.clear();
  }

  // Offline validation (basic checks)
  validateOffline(qrData) {
    const ticketData = this.parseQRData(qrData);
    
    if (!ticketData) {
      return {
        valid: false,
        error: 'Invalid QR code format',
        offline: true
      };
    }

    // Basic timestamp validation (within 24 hours)
    const ticketTime = new Date(ticketData.timestamp);
    const now = new Date();
    const timeDiff = now - ticketTime;
    
    if (timeDiff > 24 * 60 * 60 * 1000) {
      return {
        valid: false,
        error: 'Ticket timestamp is too old',
        offline: true
      };
    }

    return {
      valid: true,
      message: 'Ticket appears valid (offline validation)',
      offline: true,
      ticket: {
        id: ticketData.ticketId,
        eventId: ticketData.eventId,
        timestamp: ticketData.timestamp
      }
    };
  }
}

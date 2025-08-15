const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * QR Code Utility for Ticket Management
 * Handles generation, validation, and processing of QR codes for tickets
 */

class QRCodeUtil {
  /**
   * Generate a unique QR code payload for a ticket
   * @param {Object} ticketData - Ticket information
   * @param {string} ticketData.ticketId - Unique ticket ID
   * @param {string} ticketData.eventId - Event ID
   * @param {string} ticketData.userId - User ID
   * @param {string} ticketData.ticketNumber - Human-readable ticket number
   * @returns {string} QR code payload
   */
  static generateTicketPayload(ticketData) {
    const { ticketId, eventId, userId, ticketNumber } = ticketData;
    
    // Create a structured payload with all necessary information
    const payload = {
      t: ticketId, // ticket ID
      e: eventId,  // event ID
      u: userId,   // user ID
      n: ticketNumber, // ticket number
      ts: Date.now(), // timestamp
      v: '1.0' // version
    };

    // Convert to JSON and encode
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Generate QR code image as data URL
   * @param {string} payload - QR code payload
   * @param {Object} options - QR code options
   * @returns {Promise<string>} Data URL of QR code image
   */
  static async generateQRCodeImage(payload, options = {}) {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };

    const qrOptions = { ...defaultOptions, ...options };

    try {
      const dataURL = await QRCode.toDataURL(payload, qrOptions);
      return dataURL;
    } catch (error) {
      console.error('Error generating QR code image:', error);
      throw new Error('Failed to generate QR code image');
    }
  }

  /**
   * Generate QR code image as buffer
   * @param {string} payload - QR code payload
   * @param {Object} options - QR code options
   * @returns {Promise<Buffer>} Buffer of QR code image
   */
  static async generateQRCodeBuffer(payload, options = {}) {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };

    const qrOptions = { ...defaultOptions, ...options };

    try {
      const buffer = await QRCode.toBuffer(payload, qrOptions);
      return buffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Parse QR code payload
   * @param {string} payload - QR code payload
   * @returns {Object} Parsed ticket data
   */
  static parseTicketPayload(payload) {
    try {
      const decoded = Buffer.from(payload, 'base64').toString('utf8');
      const data = JSON.parse(decoded);
      
      // Validate required fields
      if (!data.t || !data.e || !data.u || !data.n) {
        throw new Error('Invalid QR code payload: missing required fields');
      }

      return {
        ticketId: data.t,
        eventId: data.e,
        userId: data.u,
        ticketNumber: data.n,
        timestamp: data.ts,
        version: data.v
      };
    } catch (error) {
      console.error('Error parsing QR code payload:', error);
      throw new Error('Invalid QR code payload');
    }
  }

  /**
   * Generate a secure random QR code identifier
   * @returns {string} Random QR code identifier
   */
  static generateSecureQRIdentifier() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate QR code format and structure
   * @param {string} qrCode - QR code data
   * @returns {boolean} True if valid, false otherwise
   */
  static validateQRCode(qrCode) {
    try {
      if (!qrCode || typeof qrCode !== 'string') {
        return false;
      }

      // Try to parse the payload
      this.parseTicketPayload(qrCode);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate QR code for ticket with all necessary data
   * @param {Object} ticketData - Complete ticket information
   * @returns {Promise<Object>} QR code data and image
   */
  static async generateTicketQRCode(ticketData) {
    const {
      ticketId,
      eventId,
      userId,
      ticketNumber,
      eventTitle,
      eventDate,
      ticketType,
      organizerName
    } = ticketData;

    // Generate the payload
    const payload = this.generateTicketPayload({
      ticketId,
      eventId,
      userId,
      ticketNumber
    });

    // Generate QR code image
    const qrImageDataURL = await this.generateQRCodeImage(payload);

    // Create ticket information object
    const ticketInfo = {
      ticketId,
      eventId,
      userId,
      ticketNumber,
      eventTitle,
      eventDate,
      ticketType,
      organizerName,
      qrCode: payload,
      qrImage: qrImageDataURL,
      generatedAt: new Date().toISOString()
    };

    return ticketInfo;
  }

  /**
   * Generate QR code for event check-in (organizer use)
   * @param {string} eventId - Event ID
   * @param {string} organizerId - Organizer ID
   * @returns {Promise<Object>} Check-in QR code data
   */
  static async generateCheckInQRCode(eventId, organizerId) {
    const payload = {
      type: 'checkin',
      eventId,
      organizerId,
      timestamp: Date.now(),
      version: '1.0'
    };

    const qrPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const qrImage = await this.generateQRCodeImage(qrPayload);

    return {
      type: 'checkin',
      eventId,
      organizerId,
      qrCode: qrPayload,
      qrImage,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Verify QR code authenticity and extract ticket information
   * @param {string} qrCode - QR code data
   * @param {Object} db - Database connection
   * @returns {Promise<Object>} Verified ticket information
   */
  static async verifyTicketQRCode(qrCode, db) {
    try {
      // Parse the QR code payload
      const ticketData = this.parseTicketPayload(qrCode);

      // Verify ticket exists in database
      const ticket = await db('user_tickets')
        .select([
          'user_tickets.*',
          'events.title as event_title',
          'events.start_date as event_start_date',
          'events.end_date as event_end_date',
          'events.venue_name',
          'events.venue_address',
          'tickets.name as ticket_type_name',
          'tickets.type as ticket_type',
          'users.first_name as attendee_first_name',
          'users.last_name as attendee_last_name',
          'users.email as attendee_email'
        ])
        .leftJoin('events', 'user_tickets.event_id', 'events.id')
        .leftJoin('tickets', 'user_tickets.ticket_type_id', 'tickets.id')
        .leftJoin('users', 'user_tickets.user_id', 'users.id')
        .where('user_tickets.id', ticketData.ticketId)
        .where('user_tickets.qr_code', qrCode)
        .first();

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Check if ticket is valid
      if (ticket.status !== 'active') {
        throw new Error(`Ticket is ${ticket.status}`);
      }

      // Check if event has passed
      const now = new Date();
      const eventEnd = new Date(ticket.event_end_date);
      if (now > eventEnd) {
        throw new Error('Event has already ended');
      }

      return {
        isValid: true,
        ticket,
        verificationData: ticketData
      };

    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        ticket: null,
        verificationData: null
      };
    }
  }
}

module.exports = QRCodeUtil;

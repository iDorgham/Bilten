const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * QR Code Generator Utility for Bilten Tickets
 * Handles generation, validation, and security of ticket QR codes
 */

class QRGenerator {
  /**
   * Generate a unique QR code for a ticket
   * @param {Object} ticketData - Ticket information
   * @param {string} ticketData.ticketId - Unique ticket ID
   * @param {string} ticketData.eventId - Event ID
   * @param {string} ticketData.userId - User ID
   * @param {string} ticketData.ticketNumber - Human-readable ticket number
   * @returns {Promise<string>} Base64 encoded QR code image
   */
  static async generateTicketQR(ticketData) {
    try {
      // Create a secure payload with ticket information
      const payload = {
        tid: ticketData.ticketId,
        eid: ticketData.eventId,
        uid: ticketData.userId,
        tn: ticketData.ticketNumber,
        ts: Date.now(),
        sig: this.generateSignature(ticketData)
      };

      // Convert payload to JSON string
      const qrData = JSON.stringify(payload);

      // Generate QR code as base64
      const qrCodeBase64 = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeBase64;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate a secure signature for ticket validation
   * @param {Object} ticketData - Ticket data
   * @returns {string} HMAC signature
   */
  static generateSignature(ticketData) {
    const secret = process.env.QR_SECRET || process.env.JWT_SECRET || 'bilten-default-secret-key';
    const data = `${ticketData.ticketId}:${ticketData.eventId}:${ticketData.userId}:${ticketData.ticketNumber}`;
    
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Verify QR code signature
   * @param {Object} payload - Decoded QR payload
   * @returns {boolean} True if signature is valid
   */
  static verifySignature(payload) {
    try {
      const expectedSignature = this.generateSignature({
        ticketId: payload.tid,
        eventId: payload.eid,
        userId: payload.uid,
        ticketNumber: payload.tn
      });

      return payload.sig === expectedSignature;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Decode QR code data from base64 image or data string
   * @param {string} qrData - QR code data or base64 image
   * @returns {Object|null} Decoded payload or null if invalid
   */
  static decodeQRData(qrData) {
    try {
      // If it's a base64 image, we need to decode it first
      // For now, assume it's already the data string
      const payload = JSON.parse(qrData);
      
      // Validate required fields
      if (!payload.tid || !payload.eid || !payload.uid || !payload.tn || !payload.sig) {
        return null;
      }

      // Verify signature
      if (!this.verifySignature(payload)) {
        return null;
      }

      return {
        ticketId: payload.tid,
        eventId: payload.eid,
        userId: payload.uid,
        ticketNumber: payload.tn,
        timestamp: payload.ts,
        signature: payload.sig
      };
    } catch (error) {
      console.error('Error decoding QR data:', error);
      return null;
    }
  }

  /**
   * Generate a simple QR code for testing or basic use cases
   * @param {string} data - Data to encode
   * @returns {Promise<string>} Base64 encoded QR code
   */
  static async generateSimpleQR(data) {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        quality: 0.8,
        margin: 1,
        width: 200
      });
    } catch (error) {
      console.error('Error generating simple QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate a unique ticket number
   * @param {string} eventId - Event ID
   * @param {string} ticketTypeId - Ticket type ID
   * @returns {string} Unique ticket number
   */
  static generateTicketNumber(eventId, ticketTypeId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `BLT-${eventId.substring(0, 8)}-${ticketTypeId.substring(0, 8)}-${timestamp}-${random}`;
  }

  /**
   * Generate a unique QR code hash
   * @param {string} ticketNumber - Ticket number
   * @returns {string} Unique QR code hash
   */
  static generateQRHash(ticketNumber) {
    return crypto
      .createHash('sha256')
      .update(`${ticketNumber}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Validate QR code timestamp (prevent replay attacks)
   * @param {number} timestamp - QR code timestamp
   * @param {number} maxAge - Maximum age in milliseconds (default: 24 hours)
   * @returns {boolean} True if timestamp is valid
   */
  static validateTimestamp(timestamp, maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const age = now - timestamp;
    return age >= 0 && age <= maxAge;
  }
}

module.exports = QRGenerator;

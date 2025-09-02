const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../database/connection');

class MediaService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
    this.allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg'];
    this.allowedDocumentTypes = ['application/pdf', 'text/plain'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.maxImageSize = 10 * 1024 * 1024; // 10MB for images
  }

  /**
   * Validate file type and size
   */
  validateFile(file, mediaType) {
    const errors = [];

    // Check file size based on media type
    const maxSize = mediaType === 'image' ? this.maxImageSize : this.maxFileSize;
    if (file.size > maxSize) {
      errors.push(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    let allowedTypes = [];
    switch (mediaType) {
      case 'image':
      case 'logo':
      case 'banner':
        allowedTypes = this.allowedImageTypes;
        break;
      case 'video':
        allowedTypes = this.allowedVideoTypes;
        break;
      case 'audio':
        allowedTypes = this.allowedAudioTypes;
        break;
      case 'document':
        allowedTypes = this.allowedDocumentTypes;
        break;
      default:
        errors.push('Invalid media type');
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return errors;
  }

  /**
   * Generate file URL
   */
  generateFileUrl(filename, mediaType) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/events/${filename}`;
  }

  /**
   * Create media directory if it doesn't exist
   */
  ensureMediaDirectory(mediaType) {
    const mediaDir = path.join(this.uploadsDir, 'events');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    return mediaDir;
  }

  /**
   * Save event media to database
   */
  async saveEventMedia(eventId, file, mediaType, options = {}) {
    const {
      altText = '',
      caption = '',
      displayOrder = 0,
      isPrimary = false
    } = options;

    try {
      const mediaId = uuidv4();
      const fileUrl = this.generateFileUrl(file.filename, mediaType);

      const result = await query(`
        INSERT INTO events.event_media (
          id, event_id, media_type, file_name, file_path, file_size, 
          mime_type, alt_text, caption, display_order, is_primary, 
          status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        mediaId,
        eventId,
        mediaType,
        file.filename,
        fileUrl,
        file.size,
        file.mimetype,
        altText,
        caption,
        displayOrder,
        isPrimary,
        'active',
        JSON.stringify({
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        })
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving event media:', error);
      throw new Error('Failed to save media information');
    }
  }

  /**
   * Get event media by event ID
   */
  async getEventMedia(eventId, mediaType = null) {
    try {
      let queryText = `
        SELECT * FROM events.event_media 
        WHERE event_id = $1 AND status = 'active'
      `;
      const params = [eventId];

      if (mediaType) {
        queryText += ` AND media_type = $2`;
        params.push(mediaType);
      }

      queryText += ` ORDER BY display_order ASC, created_at ASC`;

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching event media:', error);
      throw new Error('Failed to fetch event media');
    }
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(mediaId, updates) {
    try {
      const allowedFields = ['alt_text', 'caption', 'display_order', 'is_primary'];
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(field => {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(updates[field]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(mediaId);

      const queryText = `
        UPDATE events.event_media 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating media metadata:', error);
      throw new Error('Failed to update media metadata');
    }
  }

  /**
   * Delete event media
   */
  async deleteEventMedia(mediaId) {
    try {
      return await transaction(async (client) => {
        // Get media info first
        const mediaResult = await client.query(
          'SELECT * FROM events.event_media WHERE id = $1',
          [mediaId]
        );

        if (mediaResult.rows.length === 0) {
          throw new Error('Media not found');
        }

        const media = mediaResult.rows[0];

        // Mark as deleted in database
        await client.query(
          'UPDATE events.event_media SET status = $1, updated_at = NOW() WHERE id = $2',
          ['deleted', mediaId]
        );

        // Try to delete physical file
        try {
          const filePath = path.join(this.uploadsDir, 'events', media.file_name);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.warn('Could not delete physical file:', fileError.message);
          // Don't throw error for file deletion failure
        }

        return { success: true, message: 'Media deleted successfully' };
      });
    } catch (error) {
      console.error('Error deleting event media:', error);
      throw new Error('Failed to delete media');
    }
  }

  /**
   * Set primary media for event
   */
  async setPrimaryMedia(eventId, mediaId) {
    try {
      return await transaction(async (client) => {
        // Remove primary flag from all media for this event
        await client.query(
          'UPDATE events.event_media SET is_primary = FALSE WHERE event_id = $1',
          [eventId]
        );

        // Set new primary media
        const result = await client.query(
          'UPDATE events.event_media SET is_primary = TRUE, updated_at = NOW() WHERE id = $1 AND event_id = $2 RETURNING *',
          [mediaId, eventId]
        );

        if (result.rows.length === 0) {
          throw new Error('Media not found or does not belong to this event');
        }

        return result.rows[0];
      });
    } catch (error) {
      console.error('Error setting primary media:', error);
      throw new Error('Failed to set primary media');
    }
  }

  /**
   * Reorder event media
   */
  async reorderMedia(eventId, mediaOrder) {
    try {
      return await transaction(async (client) => {
        for (let i = 0; i < mediaOrder.length; i++) {
          await client.query(
            'UPDATE events.event_media SET display_order = $1, updated_at = NOW() WHERE id = $2 AND event_id = $3',
            [i, mediaOrder[i], eventId]
          );
        }

        // Get updated media list
        const result = await client.query(
          'SELECT * FROM events.event_media WHERE event_id = $1 AND status = $2 ORDER BY display_order ASC',
          [eventId, 'active']
        );

        return result.rows;
      });
    } catch (error) {
      console.error('Error reordering media:', error);
      throw new Error('Failed to reorder media');
    }
  }

  /**
   * Get media statistics for an event
   */
  async getMediaStats(eventId) {
    try {
      const result = await query(`
        SELECT 
          media_type,
          COUNT(*) as count,
          SUM(file_size) as total_size
        FROM events.event_media 
        WHERE event_id = $1 AND status = 'active'
        GROUP BY media_type
      `, [eventId]);

      const stats = {
        total_files: 0,
        total_size: 0,
        by_type: {}
      };

      result.rows.forEach(row => {
        stats.total_files += parseInt(row.count);
        stats.total_size += parseInt(row.total_size || 0);
        stats.by_type[row.media_type] = {
          count: parseInt(row.count),
          size: parseInt(row.total_size || 0)
        };
      });

      return stats;
    } catch (error) {
      console.error('Error getting media stats:', error);
      throw new Error('Failed to get media statistics');
    }
  }
}

module.exports = new MediaService();
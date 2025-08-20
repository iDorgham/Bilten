import { API_CONFIG } from '../config/api';

class ExportService {
  constructor() {
    this.api = API_CONFIG.BASE_URL;
  }

  /**
   * Get auth token for requests
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Export data in various formats
   */
  async exportData(config) {
    try {
      const response = await fetch(`${this.api}/export/data`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Download the file
        this.downloadFile(result.data, result.metadata.filename, config.format);
        return result;
      } else {
        throw new Error(result.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }

  /**
   * Get available export types and metadata
   */
  async getExportTypes() {
    try {
      const response = await fetch(`${this.api}/export/types`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get export types: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Get export types error:', error);
      throw error;
    }
  }

  /**
   * Get preview of export data
   */
  async getExportPreview(type, filters = {}, dateRange = {}) {
    try {
      const params = new URLSearchParams();
      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }
      if (Object.keys(dateRange).length > 0) {
        params.append('dateRange', JSON.stringify(dateRange));
      }

      const response = await fetch(`${this.api}/export/preview/${type}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get export preview: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Get export preview error:', error);
      throw error;
    }
  }

  /**
   * Schedule a recurring export
   */
  async scheduleExport(config) {
    try {
      const response = await fetch(`${this.api}/export/schedule`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Failed to schedule export: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Schedule export error:', error);
      throw error;
    }
  }

  /**
   * Get scheduled exports
   */
  async getScheduledExports() {
    try {
      const response = await fetch(`${this.api}/export/scheduled`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get scheduled exports: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Get scheduled exports error:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled export
   */
  async cancelScheduledExport(exportId) {
    try {
      const response = await fetch(`${this.api}/export/scheduled/${exportId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel scheduled export: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Cancel scheduled export error:', error);
      throw error;
    }
  }

  /**
   * Get export history
   */
  async getExportHistory(limit = 20, offset = 0) {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.api}/export/history?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get export history: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Get export history error:', error);
      throw error;
    }
  }

  /**
   * Bulk export multiple data types
   */
  async bulkExport(exportConfigs) {
    try {
      const response = await fetch(`${this.api}/export/bulk`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ exports: exportConfigs })
      });

      if (!response.ok) {
        throw new Error(`Bulk export failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Bulk export error:', error);
      throw error;
    }
  }

  /**
   * Download exported file
   */
  async downloadExportFile(filename) {
    try {
      const response = await fetch(`${this.api}/export/download/${filename}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      this.downloadBlob(blob, filename);
    } catch (error) {
      console.error('Download export file error:', error);
      throw error;
    }
  }

  /**
   * Download file from data and filename
   */
  downloadFile(data, filename, format) {
    let content, mimeType;

    if (format === 'csv') {
      content = data;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  /**
   * Download blob as file
   */
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get default export configurations
   */
  getDefaultExportConfigs() {
    return {
      events: {
        type: 'events',
        format: 'csv',
        filters: {},
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        includeRelations: false
      },
      users: {
        type: 'users',
        format: 'csv',
        filters: {},
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        includeRelations: false
      },
      orders: {
        type: 'orders',
        format: 'csv',
        filters: {},
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        includeRelations: false
      },
      financial: {
        type: 'financial',
        format: 'csv',
        filters: {},
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        includeRelations: false
      }
    };
  }

  /**
   * Get date range presets
   */
  getDateRangePresets() {
    const now = new Date();
    return {
      'Last 7 days': {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString()
      },
      'Last 30 days': {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString()
      },
      'Last 90 days': {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString()
      },
      'This month': {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate: now.toISOString()
      },
      'Last month': {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
      },
      'This year': {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
        endDate: now.toISOString()
      }
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate export configuration
   */
  validateExportConfig(config) {
    const errors = [];

    if (!config.type) {
      errors.push('Export type is required');
    }

    if (!config.format) {
      errors.push('Export format is required');
    }

    if (config.dateRange) {
      if (config.dateRange.startDate && config.dateRange.endDate) {
        const startDate = new Date(config.dateRange.startDate);
        const endDate = new Date(config.dateRange.endDate);
        
        if (startDate > endDate) {
          errors.push('Start date cannot be after end date');
        }
      }
    }

    return errors;
  }
}

export default new ExportService();

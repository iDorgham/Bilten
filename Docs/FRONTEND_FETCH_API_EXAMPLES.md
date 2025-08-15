# Frontend Integration Examples with Fetch API

This document provides comprehensive examples of how to integrate with the Bilten backend API using the native fetch API.

## Basic Setup

### API Configuration

```javascript
// src/config/api.js
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/v1',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const headers = {
    ...API_CONFIG.HEADERS,
    ...getAuthHeaders(),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
```

### Custom Hook for API Calls

```javascript
// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import { apiFetch } from '../config/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFetch(endpoint, options);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiCall, loading, error };
};
```

## Authentication Examples

### Auth Service

```javascript
// src/services/authService.js
import { apiFetch } from '../config/api';

export const authService = {
  async register(userData) {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  async login(credentials) {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  async logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};
```

### Login Component

```javascript
// src/components/Login.js
import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const { apiCall, loading, error } = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        onLoginSuccess(result.user);
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input
          type="email"
          id="email"
          value={credentials.email}
          onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input
          type="password"
          id="password"
          value={credentials.password}
          onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>
      
      {error && <div className="text-red-600 text-sm">{error}</div>}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

export default Login;
```

## Event Management

### Event Service

```javascript
// src/services/eventService.js
import { apiFetch } from '../config/api';

export const eventService = {
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;
    return await apiFetch(endpoint);
  },

  async getEventById(eventId) {
    return await apiFetch(`/events/${eventId}`);
  },

  async createEvent(eventData) {
    return await apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  async updateEvent(eventId, eventData) {
    return await apiFetch(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  async deleteEvent(eventId) {
    return await apiFetch(`/events/${eventId}`, {
      method: 'DELETE',
    });
  },

  async searchEvents(query, filters = {}) {
    const searchParams = new URLSearchParams({
      q: query,
      ...filters,
    });
    return await apiFetch(`/events/search?${searchParams}`);
  }
};
```

### Event List Component

```javascript
// src/components/EventList.js
import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({});
  const { apiCall, loading, error } = useApi();

  const fetchEvents = async () => {
    try {
      const result = await apiCall('/events');
      setEvents(result.events || result);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  if (loading) return <div className="text-center py-8">Loading events...</div>;
  if (error) return <div className="text-red-600 text-center py-8">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <p className="text-gray-600 mt-2">{event.description}</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {new Date(event.date).toLocaleDateString()}
              </span>
              <span className="text-sm font-medium">${event.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventList;
```

## File Upload

### Upload Service

```javascript
// src/services/uploadService.js
import { API_CONFIG, getAuthHeaders } from '../config/api';

export const uploadService = {
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress?.(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', `${API_CONFIG.BASE_URL}/uploads`);
        xhr.setRequestHeader('Authorization', getAuthHeaders().Authorization);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
};
```

### File Upload Component

```javascript
// src/components/FileUpload.js
import React, { useState, useRef } from 'react';
import { uploadService } from '../services/uploadService';

const FileUpload = ({ onUploadComplete, multiple = false }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadService.uploadFile(files[0], setProgress);
      onUploadComplete?.([result]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />
        
        {!uploading ? (
          <div>
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                browse
              </button>
            </p>
          </div>
        ) : (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-gray-600">Uploading... {Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
```

## Error Handling

### Global Error Handler

```javascript
// src/utils/errorHandler.js
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const handleApiError = (error) => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return 'Please check your input and try again.';
      case 500:
        return 'An internal server error occurred. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return 'Network error. Please check your connection and try again.';
};
```

## Advanced Patterns

### Request Interceptor with Retry Logic

```javascript
// src/utils/apiInterceptor.js
export class ApiInterceptor {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 10000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }
}

// Usage example
const api = new ApiInterceptor('http://localhost:3001/v1', {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000,
});

const fetchEvents = async () => {
  try {
    const events = await api.get('/events');
    return events;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};
```

This guide provides practical examples of frontend integration using the fetch API for the Bilten project, including authentication, event management, file uploads, error handling, and advanced patterns.

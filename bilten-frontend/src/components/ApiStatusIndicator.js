/**
 * API Status Indicator - Shows whether using real API or mock API
 * Only visible in development mode
 */

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { API_CONFIG } from '../config/api';

const ApiStatusIndicator = () => {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking API connection...');

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      // Use the API configuration instead of hardcoded URL
      const healthUrl = API_CONFIG.BASE_URL.replace('/api/v1', '/health');
      const response = await fetch(healthUrl);
      if (response.ok) {
        const data = await response.json();
        setStatus('connected');
        setMessage(`API Connected: ${data.message}`);
      } else {
        setStatus('error');
        setMessage('API Error: Unable to connect');
      }
    } catch (error) {
      setStatus('error');
      setMessage('API Error: Connection failed');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-full border text-sm font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="ml-2">{message}</span>
    </div>
  );
};

export default ApiStatusIndicator;
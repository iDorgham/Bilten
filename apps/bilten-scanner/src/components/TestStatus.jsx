import React from 'react';
import { useLiveEvents } from '../hooks/useLiveEvents';

const TestStatus = () => {
  const {
    liveEvents,
    isLoading,
    error,
    hasLiveEvents,
    liveEventsCount,
    getLiveEventsInfo,
    refresh
  } = useLiveEvents();

  return (
    <div style={{ 
      padding: '1rem', 
      margin: '1rem', 
      border: '2px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔍 Live Events Debug Status</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Loading:</strong> {isLoading ? '✅ Yes' : '❌ No'}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Error:</strong> {error ? `❌ ${error}` : '✅ None'}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Has Live Events:</strong> {hasLiveEvents ? '✅ Yes' : '❌ No'}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Live Events Count:</strong> {liveEventsCount}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Live Events Info:</strong>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '0.5rem', 
          borderRadius: '4px',
          fontSize: '0.8rem'
        }}>
          {JSON.stringify(getLiveEventsInfo(), null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Raw Live Events:</strong>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '0.5rem', 
          borderRadius: '4px',
          fontSize: '0.8rem',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {JSON.stringify(liveEvents, null, 2)}
        </pre>
      </div>
      
      <button 
        onClick={refresh}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🔄 Refresh
      </button>
    </div>
  );
};

export default TestStatus;

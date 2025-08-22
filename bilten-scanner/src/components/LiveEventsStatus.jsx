import React from 'react';
import './LiveEventsStatus.css';

const LiveEventsStatus = ({ 
  hasLiveEvents, 
  isLoading, 
  error, 
  liveEventsCount, 
  getLiveEventsInfo, 
  onRefresh 
}) => {
  const eventsInfo = getLiveEventsInfo();

  if (isLoading) {
    return (
      <div className="live-events-status loading">
        <div className="status-icon">
          <svg className="spinner-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="status-content">
          <h4>Checking Live Events...</h4>
          <p>Verifying if there are any active events</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="live-events-status error">
        <div className="status-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="status-content">
          <h4>Connection Error</h4>
          <p>{error}</p>
          <button onClick={onRefresh} className="btn btn-secondary btn-sm">
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`live-events-status ${hasLiveEvents ? 'active' : 'inactive'}`}>
      <div className="status-icon">
        {hasLiveEvents ? (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="status-content">
        <h4>
          {hasLiveEvents ? 'Live Events Active' : 'No Live Events'}
        </h4>
        <p>{eventsInfo.message}</p>
        
        {hasLiveEvents && eventsInfo.events.length > 0 && (
          <div className="live-events-list">
            <h5>Currently Running:</h5>
            <ul>
              {eventsInfo.events.slice(0, 3).map(event => (
                <li key={event.id}>
                  <strong>{event.title}</strong>
                  <span className="event-details">
                    {event.venue} • {event.startTime} - {event.endTime}
                  </span>
                </li>
              ))}
              {eventsInfo.events.length > 3 && (
                <li className="more-events">
                  +{eventsInfo.events.length - 3} more events
                </li>
              )}
            </ul>
          </div>
        )}
        
        <button onClick={onRefresh} className="btn btn-secondary btn-sm">
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default LiveEventsStatus;

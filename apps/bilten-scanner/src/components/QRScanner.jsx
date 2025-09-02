import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useLiveEvents } from '../hooks/useLiveEvents'
import LiveEventsStatus from './LiveEventsStatus'
import './QRScanner.css'

const QRScanner = ({ onScan }) => {
  const scannerRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  
  // Live events hook
  const {
    hasLiveEvents,
    isLoading: isLiveEventsLoading,
    error: liveEventsError,
    getLiveEventsInfo,
    refresh: refreshLiveEvents
  } = useLiveEvents()

  useEffect(() => {
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      )

      scanner.render((decodedText, decodedResult) => {
        console.log('QR Code detected:', decodedText)
        onScan(decodedText)
        setIsScanning(false)
        scanner.clear()
      }, (errorMessage) => {
        // Handle scan error
        console.warn('QR Scan error:', errorMessage)
      })

      scannerRef.current = scanner
      setIsScanning(true)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [onScan])

  const handleStartScan = () => {
    if (!scannerRef.current && hasLiveEvents) {
      setIsScanning(true)
      setError(null)
    }
  }

  const handleStopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
      setIsScanning(false)
    }
  }

  return (
    <div className="qr-scanner">
      {/* Live Events Status */}
      <LiveEventsStatus
        hasLiveEvents={hasLiveEvents}
        isLoading={isLiveEventsLoading}
        error={liveEventsError}
        getLiveEventsInfo={getLiveEventsInfo}
        onRefresh={refreshLiveEvents}
      />
      
      <div className="scanner-controls">
        <h2>QR Code Scanner</h2>
        <div className="button-group">
          <button 
            onClick={handleStartScan}
            disabled={isScanning || !hasLiveEvents || isLiveEventsLoading}
            className={`btn btn-primary ${!hasLiveEvents && !isLiveEventsLoading ? 'disabled' : ''}`}
            title={!hasLiveEvents && !isLiveEventsLoading ? 'No live events available for scanning' : ''}
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {isLiveEventsLoading ? 'Checking Events...' : 'Start Scanner'}
          </button>
          <button 
            onClick={handleStopScan}
            disabled={!isScanning}
            className="btn btn-secondary"
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop Scanner
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      <div id="qr-reader" className="qr-reader-container"></div>
      
      <div className="scanner-instructions">
        <svg className="instruction-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Point your camera at a QR code to scan</p>
        <p>Make sure the QR code is clearly visible and well-lit</p>
        {!hasLiveEvents && !isLiveEventsLoading && (
          <div className="no-events-warning">
            <svg className="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p>Scanner is disabled - no live events are currently running</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRScanner

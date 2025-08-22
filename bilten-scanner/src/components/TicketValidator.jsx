import React, { useEffect, useState } from 'react'
import { apiService } from '../services/api'
import './TicketValidator.css'

const TicketValidator = ({ ticketData, onValidation }) => {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)

  useEffect(() => {
    if (ticketData) {
      validateTicket(ticketData)
    }
  }, [ticketData])

  const validateTicket = async (data) => {
    setIsValidating(true)
    setValidationResult(null)

    try {
      // Parse the ticket data (assuming it's JSON)
      let ticketInfo
      try {
        ticketInfo = JSON.parse(data)
      } catch (e) {
        // If not JSON, treat as simple string
        ticketInfo = { ticketId: data }
      }

      // Make API call to validate ticket using the service
      const result = await apiService.validateTicket({
        ticketId: ticketInfo.ticketId || data,
        eventId: ticketInfo.eventId,
        timestamp: new Date().toISOString()
      })

      if (result.success) {
        const validationResult = {
          valid: result.data.valid,
          message: result.data.message,
          ticketInfo: result.data.ticketInfo || ticketInfo
        }

        setValidationResult(validationResult)
        onValidation(validationResult)
      } else {
        const validationResult = {
          valid: false,
          message: result.error || 'Failed to validate ticket. Please try again.',
          error: result.error
        }

        setValidationResult(validationResult)
        onValidation(validationResult)
      }

    } catch (error) {
      console.error('Ticket validation error:', error)
      
      const result = {
        valid: false,
        message: 'Failed to validate ticket. Please try again.',
        error: error.message
      }

      setValidationResult(result)
      onValidation(result)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRevalidate = () => {
    if (ticketData) {
      validateTicket(ticketData)
    }
  }

  return (
    <div className="ticket-validator">
      <div className="validator-header">
        <h3>
          <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ticket Validation
        </h3>
        {isValidating && (
          <div className="loading-spinner">
            <svg className="spinner-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Validating...
          </div>
        )}
      </div>

      <div className="ticket-data">
        <h4>
          <svg className="data-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Scanned Data:
        </h4>
        <pre className="ticket-data-display">
          {typeof ticketData === 'string' ? ticketData : JSON.stringify(ticketData, null, 2)}
        </pre>
      </div>

      {validationResult && (
        <div className={`validation-status ${validationResult.valid ? 'valid' : 'invalid'}`}>
          <div className="status-icon">
            {validationResult.valid ? (
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
            <h4>{validationResult.valid ? 'Valid Ticket' : 'Invalid Ticket'}</h4>
            <p>{validationResult.message}</p>
            {validationResult.ticketInfo && (
              <div className="ticket-details">
                <h5>
                  <svg className="details-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ticket Details:
                </h5>
                <ul>
                  {validationResult.ticketInfo.eventName && (
                    <li><strong>Event:</strong> {validationResult.ticketInfo.eventName}</li>
                  )}
                  {validationResult.ticketInfo.attendeeName && (
                    <li><strong>Attendee:</strong> {validationResult.ticketInfo.attendeeName}</li>
                  )}
                  {validationResult.ticketInfo.ticketType && (
                    <li><strong>Type:</strong> {validationResult.ticketInfo.ticketType}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="validator-actions">
        <button 
          onClick={handleRevalidate}
          disabled={isValidating}
          className="btn btn-primary"
        >
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Revalidate Ticket
        </button>
      </div>
    </div>
  )
}

export default TicketValidator

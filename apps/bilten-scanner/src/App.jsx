import React, { useState, useEffect } from 'react'
import QRScanner from './components/QRScanner'
import TicketValidator from './components/TicketValidator'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

function App() {
  const [scannedData, setScannedData] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('scanner-theme')
      if (saved) return saved === 'dark'
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch (_) {
      return false
    }
  })

  // Apply theme on mount and when toggled
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('scanner-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('scanner-theme', 'light')
      }
    } catch (_) {
      // ignore
    }
  }, [isDark])

  const handleScan = (data) => {
    setScannedData(data)
    setValidationResult(null)
  }

  const handleValidation = (result) => {
    setValidationResult(result)
  }

  const toggleTheme = () => setIsDark((v) => !v)

  return (
    <div className={`app ${isDark ? 'dark' : ''}`}>
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Bilten Scanner</h1>
            <p>QR Code Scanner for Event Tickets</p>
          </div>
          <div className="header-right">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <QRScanner onScan={handleScan} />
        
        {scannedData && (
          <TicketValidator 
            ticketData={scannedData} 
            onValidation={handleValidation}
          />
        )}
        
        {validationResult && (
          <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
            <h3>{validationResult.valid ? 'Valid Ticket' : 'Invalid Ticket'}</h3>
            <p>{validationResult.message}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

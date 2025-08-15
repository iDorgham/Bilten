import { QRScanner } from './qr-scanner.js';
import { TicketValidator } from './ticket-validator.js';
import { Settings } from './settings.js';
import { UI } from './ui.js';

export class ScannerApp {
  constructor() {
    this.scanner = null;
    this.validator = null;
    this.settings = null;
    this.ui = null;
    this.isScanning = false;
    this.lastScanTime = 0;
    this.scanCooldown = 2000; // 2 seconds between scans
    
    // Bind methods
    this.handleScan = this.handleScan.bind(this);
    this.handleError = this.handleError.bind(this);
    this.toggleScanning = this.toggleScanning.bind(this);
    this.openSettings = this.openSettings.bind(this);
    this.closeSettings = this.closeSettings.bind(this);
  }

  async init() {
    try {
      // Initialize components
      this.settings = new Settings();
      this.validator = new TicketValidator();
      this.ui = new UI();
      
      // Load settings
      await this.settings.load();
      
      // Initialize scanner
      await this.initScanner();
      
      // Setup UI
      this.setupUI();
      
      // Check permissions
      await this.checkPermissions();
      
      console.log('Scanner app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize scanner app:', error);
      this.ui.showError('Initialization Failed', error.message);
    }
  }

  async initScanner() {
    try {
      this.scanner = new QRScanner();
      await this.scanner.init();
      
      // Setup event listeners
      this.scanner.on('scan', this.handleScan);
      this.scanner.on('error', this.handleError);
      
      console.log('QR Scanner initialized');
    } catch (error) {
      console.error('Failed to initialize QR scanner:', error);
      throw new Error('Camera access required for scanning');
    }
  }

  setupUI() {
    // Setup header
    this.ui.setupHeader({
      title: 'Bilten Scanner',
      onSettingsClick: this.openSettings
    });

    // Setup scanner viewport
    this.ui.setupScannerViewport(this.scanner.getElement());

    // Setup controls
    this.ui.setupControls({
      onScanToggle: this.toggleScanning,
      onSettingsClick: this.openSettings
    });

    // Setup settings panel
    this.ui.setupSettingsPanel({
      settings: this.settings,
      onClose: this.closeSettings
    });

    // Update status
    this.updateStatus();
  }

  async checkPermissions() {
    try {
      // Check camera permission
      const permission = await navigator.permissions.query({ name: 'camera' });
      
      if (permission.state === 'denied') {
        this.ui.showError('Camera Permission Required', 'Please enable camera access in your browser settings to use the scanner.');
        return false;
      }
      
      if (permission.state === 'prompt') {
        // Request permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      }
      
      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      this.ui.showError('Camera Access Required', 'Please allow camera access to use the scanner.');
      return false;
    }
  }

  async handleScan(result) {
    // Prevent multiple rapid scans
    const now = Date.now();
    if (now - this.lastScanTime < this.scanCooldown) {
      return;
    }
    this.lastScanTime = now;

    try {
      console.log('QR Code scanned:', result);
      
      // Show scanning feedback
      this.ui.showScanningFeedback();
      
      // Validate ticket
      const validationResult = await this.validator.validateTicket(result);
      
      // Show result
      this.ui.showValidationResult(validationResult);
      
      // Play sound feedback
      this.playSoundFeedback(validationResult.valid);
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(validationResult.valid ? [100, 50, 100] : [200, 100, 200]);
      }
      
      // Log scan
      this.logScan(result, validationResult);
      
    } catch (error) {
      console.error('Scan handling error:', error);
      this.ui.showError('Scan Error', 'Failed to process the scanned code. Please try again.');
    }
  }

  handleError(error) {
    console.error('Scanner error:', error);
    this.ui.showError('Scanner Error', error.message);
  }

  async toggleScanning() {
    if (this.isScanning) {
      await this.stopScanning();
    } else {
      await this.startScanning();
    }
  }

  async startScanning() {
    try {
      await this.scanner.start();
      this.isScanning = true;
      this.ui.updateScanButton(true);
      this.ui.showInstructions('Position the QR code within the frame');
      console.log('Scanning started');
    } catch (error) {
      console.error('Failed to start scanning:', error);
      this.ui.showError('Scanning Error', 'Failed to start the camera. Please check permissions.');
    }
  }

  async stopScanning() {
    try {
      await this.scanner.stop();
      this.isScanning = false;
      this.ui.updateScanButton(false);
      this.ui.hideInstructions();
      console.log('Scanning stopped');
    } catch (error) {
      console.error('Failed to stop scanning:', error);
    }
  }

  openSettings() {
    this.ui.openSettingsPanel();
  }

  closeSettings() {
    this.ui.closeSettingsPanel();
  }

  updateStatus() {
    const isOnline = navigator.onLine;
    const status = isOnline ? 'Online' : 'Offline';
    this.ui.updateStatus(status, isOnline);
  }

  playSoundFeedback(isValid) {
    // Create audio context for sound feedback
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set frequency based on validation result
      oscillator.frequency.setValueAtTime(isValid ? 800 : 400, audioContext.currentTime);
      
      // Set volume
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Sound feedback not available:', error);
    }
  }

  async logScan(qrData, validationResult) {
    try {
      // Log to local storage for offline support
      const scanLog = {
        timestamp: new Date().toISOString(),
        qrData: qrData,
        validationResult: validationResult,
        userAgent: navigator.userAgent,
        online: navigator.onLine
      };

      // Get existing logs
      const logs = JSON.parse(localStorage.getItem('scanLogs') || '[]');
      logs.push(scanLog);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('scanLogs', JSON.stringify(logs));

      // Send to server if online
      if (navigator.onLine) {
        await this.sendScanLog(scanLog);
      }
    } catch (error) {
      console.error('Failed to log scan:', error);
    }
  }

  async sendScanLog(scanLog) {
    try {
      const response = await fetch('/api/scans/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanLog)
      });

      if (!response.ok) {
        throw new Error('Failed to send scan log');
      }
    } catch (error) {
      console.error('Failed to send scan log:', error);
      // Log will be sent when back online
    }
  }

  // Cleanup method
  destroy() {
    if (this.scanner) {
      this.scanner.destroy();
    }
    
    if (this.ui) {
      this.ui.destroy();
    }
    
    console.log('Scanner app destroyed');
  }
}

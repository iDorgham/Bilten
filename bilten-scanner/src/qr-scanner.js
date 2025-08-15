import { Html5Qrcode } from 'html5-qrcode';

export class QRScanner {
  constructor() {
    this.html5QrCode = null;
    this.element = null;
    this.isInitialized = false;
    this.isScanning = false;
    this.eventListeners = new Map();
    
    // Scanner configuration
    this.config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 2,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
    };
  }

  async init() {
    try {
      // Create container element
      this.element = document.createElement('div');
      this.element.id = 'qr-scanner';
      this.element.style.width = '100%';
      this.element.style.height = '100%';
      
      // Initialize Html5Qrcode
      this.html5QrCode = new Html5Qrcode('qr-scanner');
      
      // Check if camera is supported
      if (!Html5Qrcode.isCameraSupported()) {
        throw new Error('Camera is not supported on this device');
      }
      
      this.isInitialized = true;
      console.log('QR Scanner initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize QR scanner:', error);
      throw error;
    }
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('Scanner not initialized');
    }

    if (this.isScanning) {
      console.log('Scanner already running');
      return;
    }

    try {
      // Get available cameras
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras.length === 0) {
        throw new Error('No cameras found');
      }

      // Use the first available camera (usually the back camera on mobile)
      const cameraId = cameras[0].id;
      
      // Start scanning
      await this.html5QrCode.start(
        cameraId,
        this.config,
        this.onScanSuccess.bind(this),
        this.onScanFailure.bind(this)
      );

      this.isScanning = true;
      console.log('QR Scanner started');
      
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isInitialized || !this.isScanning) {
      return;
    }

    try {
      await this.html5QrCode.stop();
      this.isScanning = false;
      console.log('QR Scanner stopped');
    } catch (error) {
      console.error('Failed to stop QR scanner:', error);
      throw error;
    }
  }

  onScanSuccess(decodedText, decodedResult) {
    console.log('QR Code detected:', decodedText);
    
    // Emit scan event
    this.emit('scan', decodedText);
  }

  onScanFailure(error) {
    // Ignore scan failures - they're normal when no QR code is in view
    // Only log actual errors
    if (error && error.name !== 'NotFoundException') {
      console.warn('Scan failure:', error);
    }
  }

  // Event handling
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  getElement() {
    return this.element;
  }

  isRunning() {
    return this.isScanning;
  }

  // Camera management
  async getCameras() {
    try {
      return await Html5Qrcode.getCameras();
    } catch (error) {
      console.error('Failed to get cameras:', error);
      return [];
    }
  }

  async switchCamera(cameraId) {
    if (!this.isScanning) {
      throw new Error('Scanner must be running to switch cameras');
    }

    try {
      await this.stop();
      await this.start();
      console.log('Camera switched successfully');
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw error;
    }
  }

  // Torch control
  async toggleTorch() {
    if (!this.isInitialized || !this.isScanning) {
      return false;
    }

    try {
      const isTorchOn = await this.html5QrCode.isTorchOn();
      if (isTorchOn) {
        await this.html5QrCode.turnTorchOff();
        return false;
      } else {
        await this.html5QrCode.turnTorchOn();
        return true;
      }
    } catch (error) {
      console.error('Failed to toggle torch:', error);
      return false;
    }
  }

  async isTorchSupported() {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return await this.html5QrCode.isTorchSupported();
    } catch (error) {
      console.error('Failed to check torch support:', error);
      return false;
    }
  }

  // Zoom control
  async setZoom(zoomValue) {
    if (!this.isInitialized || !this.isScanning) {
      return;
    }

    try {
      await this.html5QrCode.setZoom(zoomValue);
    } catch (error) {
      console.error('Failed to set zoom:', error);
    }
  }

  async isZoomSupported() {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return await this.html5QrCode.isZoomSupported();
    } catch (error) {
      console.error('Failed to check zoom support:', error);
      return false;
    }
  }

  // Pause/Resume functionality
  async pause() {
    if (!this.isScanning) {
      return;
    }

    try {
      await this.html5QrCode.pause();
      console.log('QR Scanner paused');
    } catch (error) {
      console.error('Failed to pause QR scanner:', error);
    }
  }

  async resume() {
    if (!this.isScanning) {
      return;
    }

    try {
      await this.html5QrCode.resume();
      console.log('QR Scanner resumed');
    } catch (error) {
      console.error('Failed to resume QR scanner:', error);
    }
  }

  // Get scanner state
  getState() {
    return {
      isInitialized: this.isInitialized,
      isScanning: this.isScanning,
      config: this.config
    };
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Scanner configuration updated');
  }

  // Cleanup
  destroy() {
    if (this.isScanning) {
      this.stop().catch(console.error);
    }

    if (this.html5QrCode) {
      this.html5QrCode.clear();
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.eventListeners.clear();
    this.isInitialized = false;
    this.isScanning = false;

    console.log('QR Scanner destroyed');
  }
}

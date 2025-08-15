export class UI {
  constructor() {
    this.app = document.getElementById('app');
    this.modal = null;
    this.settingsPanel = null;
    this.scanButton = null;
    this.statusIndicator = null;
  }

  setupHeader({ title, onSettingsClick }) {
    const header = document.createElement('header');
    header.className = 'header';
    
    header.innerHTML = `
      <h1>${title}</h1>
      <div class="status">
        <div class="status-indicator" id="status-indicator"></div>
        <span id="status-text">Online</span>
      </div>
      <button class="btn secondary" id="settings-btn" style="padding: 0.5rem; min-width: auto;">
        ⚙️
      </button>
    `;

    // Insert header at the beginning
    this.app.insertBefore(header, this.app.firstChild);

    // Setup event listeners
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', onSettingsClick);
  }

  setupScannerViewport(scannerElement) {
    // Clear existing content
    const existingContainer = this.app.querySelector('.scanner-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    const container = document.createElement('div');
    container.className = 'scanner-container';

    const viewport = document.createElement('div');
    viewport.className = 'scanner-viewport';

    // Add scanner element
    viewport.appendChild(scannerElement);

    // Add scanner overlay
    const overlay = this.createScannerOverlay();
    viewport.appendChild(overlay);

    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'scanner-instructions';
    instructions.id = 'scanner-instructions';
    instructions.textContent = 'Position the QR code within the frame';
    viewport.appendChild(instructions);

    container.appendChild(viewport);
    this.app.appendChild(container);
  }

  createScannerOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'scanner-overlay';

    const frame = document.createElement('div');
    frame.className = 'scanner-frame';

    const corners = document.createElement('div');
    corners.className = 'scanner-corners';

    // Create corner elements
    const cornerClasses = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    cornerClasses.forEach(className => {
      const corner = document.createElement('div');
      corner.className = `scanner-corner ${className}`;
      corners.appendChild(corner);
    });

    frame.appendChild(corners);
    overlay.appendChild(frame);

    return overlay;
  }

  setupControls({ onScanToggle, onSettingsClick }) {
    const controls = document.createElement('div');
    controls.className = 'controls';

    controls.innerHTML = `
      <button class="btn" id="scan-btn">
        <span id="scan-btn-text">Start Scanning</span>
      </button>
      <button class="btn secondary" id="torch-btn" style="display: none;">
        🔦
      </button>
    `;

    this.app.appendChild(controls);

    // Setup event listeners
    this.scanButton = document.getElementById('scan-btn');
    this.scanButton.addEventListener('click', onScanToggle);

    const torchBtn = document.getElementById('torch-btn');
    torchBtn.addEventListener('click', () => {
      // Torch functionality will be implemented
      console.log('Torch toggle');
    });
  }

  setupSettingsPanel({ settings, onClose }) {
    this.settingsPanel = document.createElement('div');
    this.settingsPanel.className = 'settings-panel';
    this.settingsPanel.id = 'settings-panel';

    this.settingsPanel.innerHTML = `
      <div class="settings-header">
        <h2 class="settings-title">Settings</h2>
        <button class="close-btn" id="close-settings">×</button>
      </div>
      
      <div class="setting-group">
        <h3>Scanner</h3>
        <div class="setting-item">
          <span class="setting-label">Auto-scan</span>
          <div class="toggle" id="auto-scan-toggle"></div>
        </div>
        <div class="setting-item">
          <span class="setting-label">Sound feedback</span>
          <div class="toggle" id="sound-toggle"></div>
        </div>
        <div class="setting-item">
          <span class="setting-label">Vibration</span>
          <div class="toggle" id="vibration-toggle"></div>
        </div>
      </div>

      <div class="setting-group">
        <h3>Display</h3>
        <div class="setting-item">
          <span class="setting-label">Dark mode</span>
          <div class="toggle" id="dark-mode-toggle"></div>
        </div>
        <div class="setting-item">
          <span class="setting-label">Show instructions</span>
          <div class="toggle" id="instructions-toggle"></div>
        </div>
      </div>

      <div class="setting-group">
        <h3>Data</h3>
        <div class="setting-item">
          <span class="setting-label">Cache size</span>
          <span class="setting-value" id="cache-size">0 items</span>
        </div>
        <button class="btn secondary" id="clear-cache-btn">Clear Cache</button>
      </div>
    `;

    this.app.appendChild(this.settingsPanel);

    // Setup event listeners
    const closeBtn = document.getElementById('close-settings');
    closeBtn.addEventListener('click', onClose);

    // Setup toggles
    this.setupToggles(settings);
  }

  setupToggles(settings) {
    const toggles = {
      'auto-scan-toggle': 'autoScan',
      'sound-toggle': 'soundFeedback',
      'vibration-toggle': 'vibration',
      'dark-mode-toggle': 'darkMode',
      'instructions-toggle': 'showInstructions'
    };

    Object.entries(toggles).forEach(([id, settingKey]) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        // Set initial state
        toggle.classList.toggle('active', settings.get(settingKey));
        
        toggle.addEventListener('click', () => {
          const newValue = !settings.get(settingKey);
          settings.set(settingKey, newValue);
          toggle.classList.toggle('active', newValue);
        });
      }
    });

    // Clear cache button
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    clearCacheBtn.addEventListener('click', () => {
      localStorage.removeItem('scanLogs');
      this.updateCacheSize();
    });

    this.updateCacheSize();
  }

  updateCacheSize() {
    const cacheSizeElement = document.getElementById('cache-size');
    if (cacheSizeElement) {
      const logs = JSON.parse(localStorage.getItem('scanLogs') || '[]');
      cacheSizeElement.textContent = `${logs.length} items`;
    }
  }

  updateScanButton(isScanning) {
    if (this.scanButton) {
      const textElement = this.scanButton.querySelector('#scan-btn-text');
      if (textElement) {
        textElement.textContent = isScanning ? 'Stop Scanning' : 'Start Scanning';
      }
      this.scanButton.classList.toggle('scanning', isScanning);
    }
  }

  updateStatus(status, isOnline) {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    
    if (statusText) {
      statusText.textContent = status;
    }
    
    if (statusIndicator) {
      statusIndicator.classList.toggle('offline', !isOnline);
    }
  }

  showInstructions(text) {
    const instructions = document.getElementById('scanner-instructions');
    if (instructions) {
      instructions.textContent = text;
      instructions.style.display = 'block';
    }
  }

  hideInstructions() {
    const instructions = document.getElementById('scanner-instructions');
    if (instructions) {
      instructions.style.display = 'none';
    }
  }

  showScanningFeedback() {
    // Add visual feedback for scanning
    const frame = document.querySelector('.scanner-frame');
    if (frame) {
      frame.style.borderColor = '#10b981';
      setTimeout(() => {
        frame.style.borderColor = '#3b82f6';
      }, 500);
    }
  }

  showValidationResult(result) {
    this.hideModal();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const icon = result.valid ? '✓' : '✗';
    const iconClass = result.valid ? 'success' : 'error';
    const title = result.valid ? 'Valid Ticket' : 'Invalid Ticket';
    
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-icon ${iconClass}">${icon}</div>
          <h3 class="modal-title">${title}</h3>
        </div>
        
        <div class="modal-content">
          <p>${result.message || result.error || 'Ticket validation completed'}</p>
          
          ${result.ticket ? `
            <div class="ticket-info">
              <h4>Ticket Details</h4>
              <p><strong>ID:</strong> ${result.ticket.id}</p>
              ${result.ticket.eventId ? `<p><strong>Event:</strong> ${result.ticket.eventId}</p>` : ''}
              ${result.ticket.timestamp ? `<p><strong>Issued:</strong> ${new Date(result.ticket.timestamp).toLocaleString()}</p>` : ''}
            </div>
          ` : ''}
          
          ${result.offline ? '<p><em>Offline validation</em></p>' : ''}
        </div>
        
        <div class="modal-actions">
          <button class="btn secondary" id="modal-close">Close</button>
          ${result.valid ? '<button class="btn" id="modal-checkin">Check In</button>' : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // Setup event listeners
    const closeBtn = modal.querySelector('#modal-close');
    closeBtn.addEventListener('click', () => this.hideModal());

    const checkinBtn = modal.querySelector('#modal-checkin');
    if (checkinBtn) {
      checkinBtn.addEventListener('click', () => {
        this.handleCheckin(result.ticket);
      });
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideModal();
    }, 5000);
  }

  async handleCheckin(ticket) {
    try {
      // Show loading state
      const checkinBtn = this.modal.querySelector('#modal-checkin');
      checkinBtn.textContent = 'Checking in...';
      checkinBtn.disabled = true;

      // Call check-in API
      const response = await fetch('/api/tickets/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('scanner_auth_token')}`
        },
        body: JSON.stringify({
          ticketId: ticket.id
        })
      });

      if (response.ok) {
        this.showNotification('Ticket checked in successfully!', 'success');
        this.hideModal();
      } else {
        throw new Error('Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      this.showNotification('Check-in failed. Please try again.', 'error');
    }
  }

  showError(title, message) {
    this.hideModal();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-icon error">⚠</div>
          <h3 class="modal-title">${title}</h3>
        </div>
        
        <div class="modal-content">
          <p>${message}</p>
        </div>
        
        <div class="modal-actions">
          <button class="btn" id="modal-close">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    const closeBtn = modal.querySelector('#modal-close');
    closeBtn.addEventListener('click', () => this.hideModal());
  }

  hideModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  openSettingsPanel() {
    if (this.settingsPanel) {
      this.settingsPanel.classList.add('open');
    }
  }

  closeSettingsPanel() {
    if (this.settingsPanel) {
      this.settingsPanel.classList.remove('open');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  destroy() {
    this.hideModal();
    
    if (this.settingsPanel) {
      this.settingsPanel.remove();
    }
    
    // Remove all event listeners
    const buttons = this.app.querySelectorAll('button');
    buttons.forEach(button => {
      button.replaceWith(button.cloneNode(true));
    });
  }
}

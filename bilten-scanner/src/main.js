import { registerSW } from 'virtual:pwa-register';
import './style.css';
import { ScannerApp } from './app.js';

// Register PWA service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Show update notification
    if (confirm('New version available! Reload to update?')) {
      updateSW();
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(swRegistration) {
    console.log('SW registered: ', swRegistration);
  },
  onRegisterError(error) {
    console.error('SW registration error', error);
  }
});

// Initialize the scanner app
document.addEventListener('DOMContentLoaded', () => {
  const app = new ScannerApp();
  app.init();
});

// Handle app visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // App went to background - pause scanner
    console.log('App went to background');
  } else {
    // App came to foreground - resume scanner
    console.log('App came to foreground');
  }
});

// Handle beforeunload to clean up
window.addEventListener('beforeunload', () => {
  // Clean up any ongoing operations
  console.log('App unloading - cleaning up');
});

// Handle online/offline status
window.addEventListener('online', () => {
  console.log('App is online');
  // Show online status
  showNotification('Back online', 'success');
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  // Show offline status
  showNotification('You are offline', 'warning');
});

// Utility function to show notifications
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 1000;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

# Bilten Mobile Scanner PWA

A Progressive Web App (PWA) for scanning and validating QR codes for event tickets in the Bilten platform.

## Features

- **QR Code Scanning**: Real-time QR code detection using device camera
- **Ticket Validation**: Server-side ticket validation with offline fallback
- **PWA Support**: Installable as a native app on mobile devices
- **Offline Capability**: Works offline with cached validation results
- **Dark Theme**: Optimized for low-light scanning environments
- **Haptic Feedback**: Vibration and sound feedback for scan results
- **Settings Management**: Configurable scanning preferences
- **Scan Logging**: Local and server-side scan history

## Quick Start

### Prerequisites

- Node.js 16+ 
- Modern browser with camera support
- HTTPS (required for camera access in PWA)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd bilten-scanner
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Serve production build:**
   ```bash
   npm run serve
   ```

## Usage

### For Event Organizers

1. **Install the PWA:**
   - Open the scanner in a mobile browser
   - Tap "Add to Home Screen" or "Install App"
   - The scanner will now work like a native app

2. **Configure Settings:**
   - Tap the settings gear icon
   - Adjust scanning preferences
   - Set authentication token if required

3. **Start Scanning:**
   - Tap "Start Scanning" to begin
   - Position QR codes within the scanning frame
   - View validation results instantly

### QR Code Format

The scanner expects QR codes in the following format:

```json
{
  "ticketId": "TKT_123456789",
  "eventId": "EVT_987654321", 
  "timestamp": 1640995200000,
  "signature": "hmac_signature_here"
}
```

Or simple ticket ID format:
```
TKT_123456789
```

## API Integration

### Authentication

Set your authentication token in the scanner settings or via localStorage:

```javascript
localStorage.setItem('scanner_auth_token', 'your_jwt_token_here');
```

### Validation Endpoint

The scanner calls the following endpoint for ticket validation:

```
POST /api/tickets/validate
Content-Type: application/json
Authorization: Bearer <token>

{
  "ticketId": "TKT_123456789",
  "eventId": "EVT_987654321",
  "timestamp": 1640995200000,
  "signature": "hmac_signature_here"
}
```

### Response Format

```json
{
  "valid": true,
  "ticket": {
    "id": "TKT_123456789",
    "eventId": "EVT_987654321",
    "status": "valid",
    "checkedIn": false,
    "timestamp": 1640995200000
  },
  "event": {
    "id": "EVT_987654321",
    "title": "Sample Event",
    "date": "2022-01-01T00:00:00Z"
  },
  "message": "Ticket is valid"
}
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://api.bilten.com
VITE_APP_NAME=Bilten Scanner
VITE_APP_VERSION=1.0.0
```

### PWA Configuration

The PWA is configured in `vite.config.js` with:

- **App Name**: Bilten Scanner
- **Theme Color**: #2563eb (Blue)
- **Background Color**: #1f2937 (Dark gray)
- **Display Mode**: Standalone
- **Orientation**: Portrait

### Scanner Settings

Available settings in the app:

- **Auto-scan**: Automatically start scanning when app opens
- **Sound feedback**: Play sounds for scan results
- **Vibration**: Vibrate device for scan feedback
- **Dark mode**: Use dark theme (default)
- **Show instructions**: Display scanning instructions

## Development

### Project Structure

```
bilten-scanner/
├── src/
│   ├── app.js              # Main application class
│   ├── qr-scanner.js       # QR code scanning logic
│   ├── ticket-validator.js # Ticket validation service
│   ├── ui.js              # User interface management
│   ├── settings.js        # Settings management
│   ├── main.js            # App entry point
│   └── style.css          # Main styles
├── index.html             # Main HTML file
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Key Components

#### ScannerApp
Main application class that orchestrates all components.

#### QRScanner
Handles camera access and QR code detection using html5-qrcode library.

#### TicketValidator
Manages ticket validation with server communication and caching.

#### UI
Manages all user interface elements and interactions.

#### Settings
Handles user preferences and app configuration.

### Adding Features

1. **New Scanner Settings:**
   - Add to `Settings` class defaults
   - Update UI in `setupToggles()`
   - Implement in `ScannerApp`

2. **Custom Validation Logic:**
   - Extend `TicketValidator` class
   - Add new validation methods
   - Update API integration

3. **UI Enhancements:**
   - Modify `UI` class methods
   - Add new CSS classes in `style.css`
   - Update HTML templates

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized files.

### Deploy to Web Server

1. Upload `dist/` contents to your web server
2. Ensure HTTPS is enabled
3. Configure proper MIME types for PWA files

### CDN Deployment

For better performance, deploy to a CDN:

```bash
# Example with Netlify
npm run build
netlify deploy --prod --dir=dist
```

## Troubleshooting

### Common Issues

1. **Camera not working:**
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Try refreshing the page

2. **PWA not installing:**
   - Check manifest.json is served correctly
   - Verify service worker registration
   - Ensure all PWA requirements are met

3. **Validation errors:**
   - Check API endpoint configuration
   - Verify authentication token
   - Check network connectivity

4. **Performance issues:**
   - Clear browser cache
   - Check device memory usage
   - Restart the scanner app

### Debug Mode

Enable debug logging by setting in browser console:

```javascript
localStorage.setItem('debug', 'true');
```

## Security Considerations

- **HTTPS Required**: Camera access requires secure context
- **Token Storage**: Authentication tokens stored in localStorage
- **QR Validation**: Server-side validation prevents tampering
- **Offline Limits**: Offline validation has basic checks only

## Browser Support

- **Chrome**: 67+ (Full PWA support)
- **Firefox**: 67+ (Full PWA support)
- **Safari**: 11.1+ (Limited PWA support)
- **Edge**: 79+ (Full PWA support)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the Bilten development team
- Check the documentation wiki

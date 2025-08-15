# Routes Organization

This directory contains all the API routes organized into logical folders for better maintainability and clarity.

## Structure

```
src/routes/
├── index.js              # Main router that combines all route groups
├── core/                 # Core application routes
│   ├── index.js
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management routes
│   ├── events.js        # Event management routes
│   └── tickets.js       # Ticket management routes
├── business/            # Business logic routes
│   ├── index.js
│   ├── payments.js      # Payment processing routes
│   ├── payments-test.js # Payment testing routes
│   └── promo-codes.js   # Promotional code routes
├── content/             # Content management routes
│   ├── index.js
│   ├── articles.js      # Article management routes
│   ├── search.js        # Search functionality routes
│   ├── recommendations.js # Recommendation system routes
│   └── wishlist.js      # User wishlist routes
├── system/              # System and monitoring routes
│   ├── index.js
│   ├── analytics.js     # Analytics and reporting routes
│   ├── monitoring.js    # System monitoring routes
│   ├── tracking.js      # User tracking routes
│   ├── webhooks.js      # Webhook endpoints
│   └── webhook-management.js # Webhook management routes
└── utility/             # Utility and helper routes
    ├── index.js
    ├── uploads.js       # File upload routes
    ├── uploads-mock.js  # Mock upload routes for testing
    ├── imageOptimization.js # Image optimization routes
    ├── qr.js           # QR code generation routes
    ├── export.js       # Data export routes
    ├── fts.js          # Full-text search routes
    └── notifications.js # Notification routes
```

## Route Categories

### Core Routes (`/core`)
Essential application functionality including authentication, user management, events, and tickets.

### Business Routes (`/business`)
Business logic related to payments, promotional codes, and financial operations.

### Content Routes (`/content`)
Content management including articles, search functionality, recommendations, and user wishlists.

### System Routes (`/system`)
System-level functionality including analytics, monitoring, tracking, and webhook management.

### Utility Routes (`/utility`)
Helper and utility functions including file uploads, image optimization, QR codes, data export, and notifications.

## Adding New Routes

1. **Choose the appropriate category** for your new route
2. **Create the route file** in the corresponding folder
3. **Update the index.js** file in that folder to include your new route
4. **Follow the existing naming conventions** and structure

## Example: Adding a New Route

```javascript
// 1. Create the route file (e.g., src/routes/business/orders.js)
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  // Your route logic here
});

module.exports = router;

// 2. Update the folder's index.js (e.g., src/routes/business/index.js)
const orderRoutes = require('./orders');
router.use('/orders', orderRoutes);
```

## Benefits of This Organization

- **Better Maintainability**: Related routes are grouped together
- **Easier Navigation**: Clear folder structure makes it easy to find specific routes
- **Scalability**: Easy to add new route categories as the application grows
- **Team Collaboration**: Different team members can work on different route categories
- **Testing**: Easier to organize and run tests for specific route categories

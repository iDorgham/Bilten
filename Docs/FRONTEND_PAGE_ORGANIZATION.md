# Frontend Page Organization

## Overview

The Bilten frontend pages have been reorganized from a flat structure into logical folders for better maintainability, scalability, and developer experience. This document outlines the new organization structure and provides guidelines for maintaining it.

## Folder Structure

```
src/pages/
├── auth/                    # Authentication pages
│   ├── index.js
│   ├── Login.js
│   ├── Register.js
│   ├── ForgotPassword.js
│   ├── ResetPassword.js
│   └── EmailVerification.js
├── admin/                   # Admin dashboard pages
│   ├── index.js
│   ├── AdminDashboard.js
│   ├── AdminUsers.js
│   ├── AdminAnalytics.js
│   ├── AdminFinancial.js
│   ├── AdminConfig.js
│   ├── AdminSecurity.js
│   ├── AdminTeam.js
│   └── AdminModeration.js
├── events/                  # Event-related pages
│   ├── index.js
│   ├── Events.js
│   ├── EventDetails.js
│   ├── EventSearch.js
│   ├── EventCalendar.js
│   ├── EventReviews.js
│   ├── CreateEvent.js
│   ├── OrganizerDashboard.js
│   └── OrganizerTicketManagement.js
├── user/                    # User profile and settings
│   ├── index.js
│   ├── Profile.js
│   ├── Settings.js
│   ├── Notifications.js
│   ├── Wishlist.js
│   ├── MyTickets.js
│   └── TicketDetails.js
├── orders/                  # Order management
│   ├── index.js
│   ├── OrderHistory.js
│   ├── OrderDetails.js
│   ├── Checkout.js
│   └── Pasket.js
├── analytics/               # Analytics and reporting
│   ├── index.js
│   ├── Analytics.js
│   └── RealTimeAnalytics.js
├── legal/                   # Legal and policy pages
│   ├── index.js
│   ├── PrivacyPolicy.js
│   ├── TermsOfService.js
│   ├── CookiePolicy.js
│   └── RefundPolicy.js
├── company/                 # Company information pages
│   ├── index.js
│   ├── AboutUs.js
│   ├── Contact.js
│   ├── Careers.js
│   ├── Press.js
│   └── FAQ.js
├── help/                    # Help and support
│   ├── index.js
│   ├── HelpCenter.js
│   └── QA.js
├── news/                    # News and articles
│   ├── index.js
│   ├── News.js
│   └── ArticleDetail.js
├── recommendations/         # Recommendation system
│   ├── index.js
│   └── Recommendations.js
├── errors/                  # Error pages
│   ├── index.js
│   ├── NotFound.js
│   ├── ServerError.js
│   └── Maintenance.js
└── Home.js                  # Main landing page (root level)
```

## Import Structure

### Before (Flat Structure)
```javascript
// 47 individual imports
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
// ... 40 more imports
```

### After (Organized Structure)
```javascript
// Clean organized imports
import Home from './pages/Home';

// Auth pages
import { 
  Login, 
  Register, 
  ForgotPassword, 
  ResetPassword, 
  EmailVerification 
} from './pages/auth';

// Events pages
import {
  Events,
  EventDetails,
  EventSearch,
  EventCalendar,
  EventReviews,
  CreateEvent,
  OrganizerDashboard,
  OrganizerTicketManagement
} from './pages/events';

// User pages
import {
  Profile,
  Settings,
  Notifications,
  Wishlist,
  MyTickets,
  TicketDetails
} from './pages/user';

// Orders pages
import {
  OrderHistory,
  OrderDetails,
  Checkout,
  Pasket
} from './pages/orders';

// Analytics pages
import {
  Analytics,
  RealTimeAnalytics
} from './pages/analytics';

// Legal pages
import {
  PrivacyPolicy,
  TermsOfService,
  CookiePolicy,
  RefundPolicy
} from './pages/legal';

// Company pages
import {
  AboutUs,
  Contact,
  FAQ,
  Careers,
  Press
} from './pages/company';

// Help pages
import {
  HelpCenter,
  QA
} from './pages/help';

// News pages
import {
  News,
  ArticleDetail
} from './pages/news';

// Recommendations pages
import {
  Recommendations
} from './pages/recommendations';

// Error pages
import {
  NotFound,
  ServerError,
  Maintenance
} from './pages/errors';

// Admin pages
import {
  AdminDashboard,
  AdminUsers,
  AdminModeration,
  AdminAnalytics,
  AdminFinancial,
  AdminConfig,
  AdminSecurity,
  AdminTeam
} from './pages/admin';
```

## Index Files

Each folder contains an `index.js` file that exports all components from that folder. This enables clean imports and better organization.

### Example: `auth/index.js`
```javascript
export { default as Login } from './Login';
export { default as Register } from './Register';
export { default as ForgotPassword } from './ForgotPassword';
export { default as ResetPassword } from './ResetPassword';
export { default as EmailVerification } from './EmailVerification';
```

## Benefits

### 1. **Improved Scalability**
- Easy to add new pages to appropriate folders
- Clear organization prevents confusion
- Better handling of large numbers of pages

### 2. **Enhanced Developer Experience**
- Faster navigation to specific pages
- Logical grouping makes code easier to understand
- Reduced cognitive load when working on features

### 3. **Better Team Collaboration**
- Multiple developers can work on different sections
- Clear boundaries between different features
- Easier code reviews and maintenance

### 4. **Cleaner Imports**
- Reduced import clutter in main files
- Self-documenting import structure
- Easier to see what features are being used

### 5. **Code Splitting Ready**
- Natural boundaries for lazy loading
- Easy to implement feature-based code splitting
- Better performance optimization opportunities

## Guidelines for Adding New Pages

### 1. **Choose the Right Folder**
- **auth/**: Authentication, registration, password management
- **admin/**: Admin dashboard and management features
- **events/**: Event-related functionality
- **user/**: User profile, settings, personal data
- **orders/**: Order management, checkout, shopping cart
- **analytics/**: Data visualization and reporting
- **legal/**: Terms, policies, legal information
- **company/**: About us, contact, company information
- **help/**: Support, FAQ, help documentation
- **news/**: News articles and content
- **recommendations/**: Recommendation system
- **errors/**: Error pages and maintenance

### 2. **Update Index Files**
Always update the `index.js` file in the appropriate folder when adding new pages:

```javascript
// Add new export to the folder's index.js
export { default as NewPage } from './NewPage';
```

### 3. **Update App.js Imports**
Add the new page to the appropriate import group in `App.js`:

```javascript
// Add to the appropriate import group
import {
  ExistingPage,
  NewPage  // Add here
} from './pages/appropriate-folder';
```

### 4. **Add Routes**
Add the route in the `App.js` file:

```javascript
<Route path="/new-route" element={<NewPage />} />
```

## Migration Notes

### Import Path Updates
When moving pages to subfolders, import paths need to be updated:

```javascript
// Before (in auth files)
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SocialButton from '../components/SocialButton';

// After (in auth files)
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import SocialButton from '../../components/SocialButton';
```

### File Locations
- All pages are now in their respective feature folders
- `Home.js` remains at the root level as it's the main landing page
- Index files are created in each folder for clean exports

## Best Practices

### 1. **Consistent Naming**
- Use PascalCase for component files
- Use descriptive names that indicate the page's purpose
- Keep names consistent with the route structure

### 2. **Folder Organization**
- Keep related functionality together
- Don't create too many nested levels
- Use clear, descriptive folder names

### 3. **Import Organization**
- Group imports by feature
- Use destructuring for cleaner imports
- Keep imports organized and readable

### 4. **Documentation**
- Update this document when adding new folders
- Document any special considerations for specific folders
- Keep the structure documented for team reference

## Troubleshooting

### Common Issues

1. **Import Path Errors**
   - Ensure relative paths are correct after moving files
   - Check that index files are properly exporting components
   - Verify App.js imports are updated

2. **Missing Components**
   - Check that components are properly exported from index files
   - Verify that imports in App.js match the export names
   - Ensure file names match the export names

3. **Build Errors**
   - Run `npm run build` to check for compilation errors
   - Check console for specific import/export issues
   - Verify all index files are properly structured

## Future Considerations

### Code Splitting
The new structure makes it easy to implement code splitting:

```javascript
// Lazy load entire feature sections
const AuthPages = lazy(() => import('./pages/auth'));
const AdminPages = lazy(() => import('./pages/admin'));
const EventPages = lazy(() => import('./pages/events'));
```

### Feature Flags
The organization supports feature flag implementation:

```javascript
// Easy to conditionally import entire features
if (featureFlags.adminEnabled) {
  import('./pages/admin').then(module => {
    // Load admin pages
  });
}
```

### Testing Organization
The folder structure naturally supports organized testing:

```
src/pages/
├── auth/
│   ├── __tests__/
│   │   ├── Login.test.js
│   │   └── Register.test.js
│   ├── Login.js
│   └── Register.js
```

This organization provides a solid foundation for the Bilten frontend's continued growth and maintainability.

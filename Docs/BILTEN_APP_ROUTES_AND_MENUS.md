# Bilten App Routes and Menus Documentation

## Table of Contents
1. [Overview](#overview)
2. [Application Routes](#application-routes)
3. [Navigation Structure](#navigation-structure)
4. [Menu Components](#menu-components)
5. [How to Edit Menus](#how-to-edit-menus)
6. [Example Prompts](#example-prompts)
7. [Role-Based Access](#role-based-access)

## Overview

The Bilten application is a comprehensive event management platform with a React frontend and Express.js backend. The application features role-based navigation, responsive design, and dark mode support.

**Key Technologies:**
- **Frontend**: React, React Router, Tailwind CSS, Heroicons
- **Backend**: Express.js, Knex.js, PostgreSQL
- **Authentication**: JWT-based with role management
- **Styling**: Dark mode support with glass-style buttons and animated backgrounds

**Page Organization:**
- **Organized Structure**: Pages are organized into logical folders by feature
- **Clean Imports**: Using index files for clean, organized imports
- **Scalable Architecture**: Easy to add new pages and maintain existing ones
- **See**: `FRONTEND_PAGE_ORGANIZATION.md` for detailed structure

## Page Organization

The frontend pages are organized into logical folders for better maintainability and developer experience:

### Folder Structure
- **`auth/`** - Authentication pages (Login, Register, Password management)
- **`admin/`** - Admin dashboard and management pages
- **`events/`** - Event-related pages (browsing, details, management)
- **`user/`** - User profile and settings pages
- **`orders/`** - Order management and checkout pages
- **`analytics/`** - Analytics and reporting pages
- **`legal/`** - Legal and policy pages
- **`company/`** - Company information pages
- **`help/`** - Help and support pages
- **`news/`** - News and article pages
- **`recommendations/`** - Recommendation system pages
- **`errors/`** - Error and maintenance pages
- **`Home.js`** - Main landing page (root level)

### Import Pattern
```javascript
// Clean, organized imports using index files
import { Login, Register, ForgotPassword } from './pages/auth';
import { Events, EventDetails, EventSearch } from './pages/events';
import { Profile, Settings, Notifications } from './pages/user';
```

For detailed information about the page organization, see `FRONTEND_PAGE_ORGANIZATION.md`.

## Application Routes

### Public Routes (No Authentication Required)

| Route | Component | Description | Access Level |
|-------|-----------|-------------|--------------|
| `/` | `Home` | Landing page with featured events and news | Public |
| `/login` | `Login` | User authentication page | Public |
| `/register` | `Register` | User registration page | Public |
| `/forgot-password` | `ForgotPassword` | Password recovery request | Public |
| `/reset-password` | `ResetPassword` | Password reset form | Public |
| `/verify-email` | `EmailVerification` | Email verification page | Public |
| `/events` | `Events` | Browse all events | Public |
| `/events/search` | `EventSearch` | Advanced event search with filters | Public |
| `/events/calendar` | `EventCalendar` | Calendar view of events | Public |
| `/events/:id` | `EventDetails` | Individual event details | Public |
| `/events/:id/reviews` | `EventReviews` | Event reviews and ratings | Public |
| `/news` | `News` | News and articles listing | Public |
| `/news/:id` | `ArticleDetail` | Individual article details | Public |
| `/contact` | `Contact` | Contact form and information | Public |
| `/help` | `HelpCenter` | Help center and FAQ | Public |
| `/privacy-policy` | `PrivacyPolicy` | Privacy policy page | Public |
| `/terms-of-service` | `TermsOfService` | Terms of service page | Public |
| `/cookie-policy` | `CookiePolicy` | Cookie policy page | Public |

### Protected Routes (Authentication Required)

| Route | Component | Description | Access Level |
|-------|-----------|-------------|--------------|
| `/profile` | `Profile` | User profile management | Authenticated |
| `/settings` | `Settings` | Account settings and preferences | Authenticated |
| `/notifications` | `Notifications` | User notifications center | Authenticated |
| `/wishlist` | `Wishlist` | User's favorite events | Authenticated |
| `/pasket` | `Pasket` | Shopping cart/basket | Authenticated |
| `/my-tickets` | `MyTickets` | User's purchased tickets | Authenticated |
| `/tickets/:id` | `TicketDetails` | Individual ticket details | Authenticated |
| `/orders` | `OrderHistory` | Order history and tracking | Authenticated |
| `/orders/:id` | `OrderDetails` | Individual order details | Authenticated |

### Organizer Routes (Organizer Role Required)

| Route | Component | Description | Access Level |
|-------|-----------|-------------|--------------|
| `/create-event` | `CreateEvent` | Create new event form | Organizer |
| `/organizer-dashboard` | `OrganizerDashboard` | Organizer management dashboard | Organizer |

### Admin Routes (Admin Role Required)

*Note: Admin routes are referenced in the navbar but not yet implemented*

| Route | Component | Description | Access Level |
|-------|-----------|-------------|--------------|
| `/admin/dashboard` | *Not implemented* | Admin dashboard | Admin |
| `/admin/users` | *Not implemented* | User management | Admin |
| `/admin/moderation` | *Not implemented* | Content moderation | Admin |
| `/admin/analytics` | *Not implemented* | Platform analytics | Admin |
| `/admin/financial` | *Not implemented* | Financial reports | Admin |
| `/admin/config` | *Not implemented* | System configuration | Admin |
| `/admin/security` | *Not implemented* | Security settings | Admin |
| `/admin/team` | *Not implemented* | Team management | Admin |

### Error Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/maintenance` | `Maintenance` | Maintenance mode page |
| `/500` | `ServerError` | Server error page |
| `*` | `NotFound` | 404 Not Found page |

### Redirect Routes

| Route | Redirects To | Purpose |
|-------|-------------|---------|
| `/favorites` | `/wishlist` | Alias for wishlist |
| `/favourite` | `/wishlist` | Alias for wishlist |
| `/favourites` | `/wishlist` | Alias for wishlist |

## Navigation Structure

### Main Navigation (Desktop)
The main navigation is centered and includes:
- **Events** - Browse all events
- **News** - News and articles
- **Contact** - Contact information

### User Menu (Dropdown)
The user menu is role-based and includes different options based on authentication status and user role.

#### Guest Users (Not Authenticated)
- Sign In
- Sign Up
- Help

#### Regular Users (Authenticated)
- My Tickets
- Order History
- Favorite Events
- Payment Methods
- My Pasket
- My Profile
- Account Settings
- Notification Preferences
- Help & Support
- Logout

#### Organizers (Authenticated + Organizer Role)
- Dashboard
- Events Management
- Create Event
- Ticket Management
- Organization
- Financial
- Analytics & Insights
- Marketing
- Customer Support
- [All regular user items]

#### Admins (Authenticated + Admin Role)
- Dashboard
- User Management
- Content Moderation
- Platform Analytics
- Financial Reports
- System Configuration
- Security & Compliance
- Team Management
- [All regular user items]

### Mobile Navigation
The mobile menu includes:
- Main navigation links
- Role-based menu items
- Authentication options

## Menu Components

### Primary Components

#### 1. Navbar (`bilten-frontend/src/components/Navbar.js`)
- **Purpose**: Main navigation bar with user dropdown
- **Features**: 
  - Logo and branding
  - Main navigation links
  - Theme toggle (dark/light mode)
  - Shopping cart with item count
  - User avatar and dropdown menu
  - Role-based menu items
  - Mobile menu trigger

#### 2. MobileMenu (`bilten-frontend/src/components/MobileMenu.js`)
- **Purpose**: Mobile-responsive navigation menu
- **Features**:
  - Slide-out panel design
  - Main navigation links
  - Role-based menu items
  - Authentication options
  - Responsive design

### Key Features

#### Theme Toggle
- Toggle between light and dark modes
- Persists user preference in localStorage
- Automatic detection of system preference

#### Shopping Cart Badge
- Shows number of items in wishlist
- Only visible when authenticated
- Maximum display of 99 items

#### Role-Based Menus
- Different menu items based on user role
- Dynamic menu generation
- Proper access control

## How to Edit Menus

### 1. Adding New Routes

To add a new route to the application:

1. **Create the page component** in `bilten-frontend/src/pages/`
2. **Add the route** in `bilten-frontend/src/App.js`
3. **Add navigation links** in the appropriate menu components

#### Example: Adding a New Page

```javascript
// 1. Create the page component
// bilten-frontend/src/pages/NewPage.js
import React from 'react';

const NewPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">New Page</h1>
      {/* Page content */}
    </div>
  );
};

export default NewPage;

// 2. Add the route in App.js
import NewPage from './pages/NewPage';

// Add this line in the Routes section:
<Route path="/new-page" element={<NewPage />} />

// 3. Add navigation link in Navbar.js
// Add to the main navigation or user menu as appropriate
```

### 2. Modifying Menu Items

#### Desktop Navigation (Navbar.js)

The main navigation is defined in the `Navbar` component:

```javascript
// Main navigation links (lines 175-195)
<div className="hidden md:flex flex-1 items-center justify-center space-x-6">
  <Link to="/events" className="...">Events</Link>
  <Link to="/news" className="...">News</Link>
  <Link to="/contact" className="...">Contact</Link>
</div>
```

#### User Menu Items (Navbar.js)

Menu items are generated by the `getMenuItems()` function:

```javascript
// Role-based menu items (lines 95-180)
const getMenuItems = () => {
  if (!isAuthenticated) {
    return [
      { label: 'Sign In', icon: ArrowRightOnRectangleIcon, action: () => navigate('/login') },
      { label: 'Sign Up', icon: UserPlusIcon, action: () => navigate('/register') },
      { label: 'Help', icon: LifebuoyIcon, action: () => navigate('/help') },
    ];
  }

  const commonItems = [
    { label: 'My Pasket', icon: ShoppingCartIcon, action: () => navigate('/pasket') },
    { type: 'divider' },
    { label: 'My Profile', icon: UserIcon, action: () => navigate('/profile') },
    // ... more items
  ];

  // Role-specific items
  switch (user?.role) {
    case 'admin':
      return [
        { label: 'Dashboard', icon: Squares2X2Icon, action: () => navigate('/admin/dashboard') },
        // ... admin items
        ...commonItems,
      ];
    case 'organizer':
      return [
        { label: 'Dashboard', icon: Squares2X2Icon, action: () => navigate('/organizer/dashboard') },
        // ... organizer items
        ...commonItems,
      ];
    default:
      return [
        { label: 'My Tickets', icon: TicketIcon, action: () => navigate('/my-tickets') },
        // ... user items
        ...commonItems,
      ];
  }
};
```

#### Mobile Menu Items (MobileMenu.js)

Mobile menu items are defined in the `MobileMenu` component:

```javascript
// Main navigation (lines 30-50)
<div className="px-4 space-y-2">
  <Link to="/events" onClick={handleLinkClick} className="...">Events</Link>
  <Link to="/news" onClick={handleLinkClick} className="...">News</Link>
  <Link to="/contact" onClick={handleLinkClick} className="...">Contact</Link>
</div>

// Role-based items (lines 55-95)
{isAuthenticated ? (
  <div className="px-4 space-y-2">
    {isOrganizer && (
      <>
        <Link to="/organizer/dashboard" onClick={handleLinkClick} className="...">Dashboard</Link>
        <Link to="/create-event" onClick={handleLinkClick} className="...">Create Event</Link>
      </>
    )}
    <Link to="/my-tickets" onClick={handleLinkClick} className="...">My Tickets</Link>
    // ... more items
  </div>
) : (
  // Authentication options
)}
```

### 3. Adding New Menu Items

To add a new menu item:

1. **Import the icon** from Heroicons
2. **Add the menu item** to the appropriate role section
3. **Update both desktop and mobile menus** if needed

#### Example: Adding a "Support" Menu Item

```javascript
// 1. Import the icon
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

// 2. Add to the menu items function
const getMenuItems = () => {
  // ... existing code ...
  
  const commonItems = [
    // ... existing items ...
    { label: 'Support', icon: QuestionMarkCircleIcon, action: () => navigate('/support') },
    { label: 'Logout', icon: ArrowRightOnRectangleIcon, action: handleLogout },
  ];
  
  // ... rest of the function
};

// 3. Add to mobile menu if needed
<Link to="/support" onClick={handleLinkClick} className="...">Support</Link>
```

### 4. Modifying Menu Styling

#### Theme Colors
The application uses a primary color scheme defined in Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          // ... more shades
        }
      }
    }
  }
}
```

#### Dark Mode Support
All menu items support dark mode through Tailwind classes:

```javascript
// Example of dark mode classes
className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
```

## Example Prompts

### 1. Adding a New Page and Menu Item

**Prompt**: "Add a new 'About Us' page to the Bilten application and include it in the main navigation menu."

**Expected Changes**:
1. Create `bilten-frontend/src/pages/AboutUs.js`
2. Add route in `bilten-frontend/src/App.js`
3. Add navigation link in `bilten-frontend/src/components/Navbar.js`
4. Add navigation link in `bilten-frontend/src/components/MobileMenu.js`

### 2. Modifying Role-Based Menus

**Prompt**: "Add a 'Reports' menu item for organizers that links to '/organizer/reports' and includes a chart icon."

**Expected Changes**:
1. Import `ChartBarIcon` in `Navbar.js`
2. Add menu item to organizer section in `getMenuItems()` function
3. Add route in `App.js` (if page exists)
4. Create the Reports page component

### 3. Reorganizing Menu Structure

**Prompt**: "Move the 'Help' link from the user dropdown to the main navigation bar and update the mobile menu accordingly."

**Expected Changes**:
1. Remove 'Help' from `getMenuItems()` function
2. Add 'Help' link to main navigation section
3. Update mobile menu to include 'Help' in main navigation
4. Update styling to match main navigation

### 4. Adding Authentication-Based Menu Items

**Prompt**: "Add a 'Premium Features' menu item that only appears for users with a 'premium' subscription status."

**Expected Changes**:
1. Check for premium status in `getMenuItems()` function
2. Add conditional menu item for premium users
3. Update mobile menu with conditional rendering
4. Add premium status check to authentication context

### 5. Customizing Menu Icons

**Prompt**: "Change the 'Settings' menu item icon from Cog6ToothIcon to WrenchScrewdriverIcon and update the styling to use a different color."

**Expected Changes**:
1. Import `WrenchScrewdriverIcon` in `Navbar.js`
2. Update the Settings menu item icon
3. Modify the icon styling classes
4. Update mobile menu if needed

## Role-Based Access

### User Roles

1. **Guest** - Not authenticated
   - Access to public pages only
   - Limited menu options

2. **User** - Authenticated customer
   - Access to personal features
   - Ticket management
   - Order history
   - Wishlist

3. **Organizer** - Event organizer
   - All user features
   - Event management
   - Dashboard access
   - Analytics and reporting

4. **Admin** - Platform administrator
   - All organizer features
   - User management
   - System configuration
   - Platform-wide analytics

### Access Control

Menu items are controlled by:
- Authentication status (`isAuthenticated`)
- User role (`user.role`)
- Specific permissions (if implemented)

### Security Considerations

- Always verify authentication on protected routes
- Implement proper role-based access control
- Use server-side validation for sensitive operations
- Protect admin routes with additional security measures

---

## File Structure Summary

```
bilten-frontend/src/
├── App.js                    # Main routing configuration
├── components/
│   ├── Navbar.js            # Desktop navigation
│   ├── MobileMenu.js        # Mobile navigation
│   └── Footer.js            # Footer component
├── pages/                   # All page components
└── context/
    └── AuthContext.js       # Authentication and user context
```

This documentation provides a comprehensive guide to understanding and modifying the Bilten application's routing and menu system. Use the example prompts as templates for common menu modifications and follow the established patterns for consistency.

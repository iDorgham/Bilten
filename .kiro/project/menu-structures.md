# EventChain Menu Structures

Based on the EventChain System Architecture, this document defines the simplified menu structures for all client applications with a clean main navigation and role-based avatar dropdown menus.

## Universal Main Navigation Structure

### Main Navigation Menu (All Applications)
```
┌─ Events
├─ News  
├─ Contact
└─ [Avatar Dropdown] ← Role-based menu
```

## Role-Based Avatar Dropdown Menus

### 1. Platform Admin Avatar Menu
```
👤 Platform Admin
┌─ Dashboard
├─ User Management
│  ├─ All Users
│  ├─ Organizations
│  ├─ Support Tickets
│  └─ User Analytics
├─ Content Moderation
│  ├─ Event Reviews
│  ├─ Content Reports
│  ├─ Policy Management
│  └─ Moderation Queue
├─ Platform Analytics
│  ├─ System Overview
│  ├─ Performance Metrics
│  ├─ User Behavior
│  └─ Revenue Analytics
├─ SEO Management
│  ├─ SEO Settings
│  ├─ Meta Tags
│  ├─ Search Rankings
│  └─ SEO Reports
├─ Cache Management
│  ├─ Cache Settings
│  ├─ Performance Monitor
│  ├─ Cache Operations
│  └─ Optimization Tools
├─ Financial Reports
│  ├─ Revenue Overview
│  ├─ Transaction Reports
│  ├─ Fee Analysis
│  ├─ Payout Management
│  └─ Tax Reports
├─ System Configuration
│  ├─ Platform Settings
│  ├─ Feature Flags
│  ├─ API Management
│  └─ Maintenance
├─ Security & Compliance
│  ├─ Security Dashboard
│  ├─ Access Control
│  ├─ Audit Logs
│  └─ Compliance Reports
├─ Team Management
│  ├─ Admin Users
│  ├─ Roles & Permissions
│  └─ Activity Logs
├─ ──────────────────
├─ Profile Settings
├─ Security Settings
├─ Notification Preferences
├─ Help & Support
└─ Logout
```

### 2. Event Organizer Avatar Menu
```
👤 Events Organizer
┌─ Dashboard
├─ Events Management ▼
│  ├─ Create Events
│  ├─ All Events
│  ├─ Events Calendar
│  ├─ Draft Events
│  ├─ Archived Events
│  └─ Events Categories
├─ Ticket Management ▼
│  ├─ Ticket Types ▼
│  │  ├─ View All Ticket Types
│  │  └─ Add New Ticket Type
│  ├─ Trash
│  ├─ Tiers ▼
│  │  ├─ Add Tier
│  │  ├─ Edit Tier
│  │  └─ Remove Tier
│  └─ Tier Analytics
├─ Organization ▼
│  ├─ Profile Settings
│  ├─ Branding
│  ├─ Team Management
│  ├─ Payment Settings
│  └─ Notification Settings
├─ Financial ▼
│  ├─ Revenue Overview
│  ├─ Sales Analytics
│  ├─ Cash-out Management
│  ├─ Financial Reports
│  └─ Tax Documentation
├─ Analytics & Insights ▼
│  ├─ Events Performance
│  ├─ Customer Analytics
│  ├─ Marketing Attribution
│  ├─ Predictive Analytics
│  └─ Custom Reports
├─ Marketing ▼
│  ├─ Campaign Management
│  ├─ Social Media
│  ├─ Email Marketing
│  └─ Promotional Codes
├─ Customer Support ▼
│  ├─ Attendee List
│  ├─ Customer Support
│  ├─ Refund Requests
│  └─ Communication
├─ ──────────────────
├─ My Profile
├─ Account Settings ▼
│  ├─ Organization Settings
│  ├─ Billing & Payments
│  ├─ Notification Preferences
│  └─ Security Settings
├─ Help & Support ▼
│  ├─ Help Center
│  ├─ Support Tickets
│  └─ Documentation
└─ Logout
```

### 3. Regular Customer Avatar Menu
```
👤 Customer
┌─ My Profile
├─ My Tickets
│  ├─ Upcoming Events
│  ├─ Past Events
│  └─ Digital Tickets
├─ Order History
├─ Favorite Events
├─ Payment Methods
├─ ──────────────────
├─ Account Settings
├─ Notification Preferences
├─ Help & Support
└─ Logout
```

### 4. Event Staff Avatar Menu
```
👤 Event Staff
┌─ Scanner Dashboard
├─ Scan Ticket
├─ Event Details
├─ Scan History
├─ Attendance Reports
├─ Offline Mode
├─ ──────────────────
├─ Profile Settings
├─ Event Access
├─ Sync Status
├─ Help
└─ Logout
```

### 5. Guest User (Not Logged In)
```
👤 Guest
┌─ Sign In
├─ Sign Up
├─ Forgot Password
└─ Help
```

## Footer Menu (Universal)

```
┌─ Company
│  ├─ About Us
│  ├─ Careers
│  ├─ Press
│  └─ Contact
├─ Support
│  ├─ Help Center
│  ├─ Contact Support
│  ├─ Community Guidelines
│  └─ Safety
├─ Legal
│  ├─ Terms of Service
│  ├─ Privacy Policy
│  ├─ Cookie Policy
│  └─ Refund Policy
└─ Connect
   ├─ Facebook
   ├─ Twitter
   ├─ Instagram
   └─ LinkedIn
```

## Navigation Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]              Events | News | Contact        [Avatar] │
└─────────────────────────────────────────────────────────────┘
│                                                             │
│                    Page Content                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
│                    Footer Menu                              │
└─────────────────────────────────────────────────────────────┘
```

## Avatar Dropdown Behavior

### Visual Design
- **Avatar Display**: User profile picture or initials in a circle
- **Dropdown Trigger**: Click on avatar to open dropdown menu
- **Menu Position**: Right-aligned dropdown below avatar
- **Visual Indicators**: Arrow or chevron to indicate dropdown
- **Role Badge**: Small badge or text indicating user role

### Interaction Flow
1. **Hover State**: Avatar highlights on hover
2. **Click Action**: Opens dropdown menu with smooth animation
3. **Outside Click**: Closes dropdown when clicking elsewhere
4. **Keyboard Navigation**: Arrow keys to navigate menu items
5. **Role Detection**: Menu content changes based on user role

## Menu Structure Implementation Guidelines

### Design Principles
- **Consistent Navigation**: Same menu structure across all pages
- **Clear Hierarchy**: Logical grouping and nesting of menu items
- **Responsive Design**: Mobile-first approach with collapsible menus
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Visual Indicators**: Active states, breadcrumbs, progress indicators

### Technical Implementation
- **React Components**: Reusable navigation components
- **State Management**: Context API for menu state and user permissions
- **Routing**: Next.js routing with dynamic menu highlighting
- **Permissions**: Role-based menu item visibility
- **Caching**: Menu structure caching for performance

### User Experience Features
- **Search Integration**: Global search in main navigation
- **Breadcrumbs**: Clear navigation path indication
- **Quick Actions**: Frequently used actions in prominent positions
- **Notifications**: Badge indicators for alerts and updates
- **Personalization**: Customizable menu preferences where applicable

### Mobile Considerations
- **Hamburger Menu**: Collapsible navigation for mobile devices
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Swipe Gestures**: Intuitive navigation gestures
- **Bottom Navigation**: Key actions accessible via bottom tabs
- **Progressive Disclosure**: Show/hide menu levels based on screen size

### Security & Permissions
- **Role-Based Access**: Menu items shown based on user permissions
- **Dynamic Menus**: Menu structure adapts to user role and organization
- **Secure Routes**: Protected routes with authentication checks
- **Audit Logging**: Track menu navigation for security analysis

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Maintained By**: EventChain UX Team  
**Review Cycle**: Monthly UX reviews
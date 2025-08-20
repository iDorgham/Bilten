import React from 'react';
import { Navigate } from 'react-router-dom';

// Import all pages
import Home from '../pages/Home';

// Auth pages
import { 
  Login, 
  Register, 
  ForgotPassword, 
  ResetPassword, 
  EmailVerification 
} from '../pages/auth';

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
} from '../pages/events';

// Analytics pages
import {
  Analytics,
  RealTimeAnalytics
} from '../pages/analytics';

// User pages
import {
  Wishlist,
  Profile,
  Settings,
  Notifications,
  MyTickets,
  TicketDetails
} from '../pages/user';

// Orders pages
import {
  Pasket,
  OrderHistory,
  OrderDetails,
  Checkout
} from '../pages/orders';

// Legal pages
import {
  PrivacyPolicy,
  TermsOfService,
  CookiePolicy,
  RefundPolicy
} from '../pages/legal';

// Company pages
import {
  AboutUs,
  Contact,
  FAQ,
  Careers,
  Press
} from '../pages/company';

// Help pages
import {
  HelpCenter,
  QA
} from '../pages/help';

// News pages
import {
  News,
  ArticleDetail
} from '../pages/news';

// Recommendations pages
import {
  Recommendations
} from '../pages/recommendations';

// Error pages
import {
  NotFound,
  ServerError,
  Maintenance
} from '../pages/errors';

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
} from '../pages/admin';

// Components
import DataExport from '../components/DataExport';

// Route configurations organized by category
export const routeConfig = {
  // Public routes
  public: [
    { path: '/', element: <Home /> },
    { path: '/events', element: <Events /> },
    { path: '/events/search', element: <EventSearch /> },
    { path: '/events/calendar', element: <EventCalendar /> },
    { path: '/events/:slug', element: <EventDetails /> },
    { path: '/events/:id/reviews', element: <EventReviews /> },
    { path: '/news', element: <News /> },
    { path: '/news/:id', element: <ArticleDetail /> },
    { path: '/recommendations', element: <Recommendations /> },
    { path: '/help', element: <HelpCenter /> },
    { path: '/qa', element: <QA /> },
    { path: '/about', element: <AboutUs /> },
    { path: '/contact', element: <Contact /> },
    { path: '/faq', element: <FAQ /> },
    { path: '/careers', element: <Careers /> },
    { path: '/press', element: <Press /> },
    { path: '/privacy-policy', element: <PrivacyPolicy /> },
    { path: '/terms-of-service', element: <TermsOfService /> },
    { path: '/cookie-policy', element: <CookiePolicy /> },
    { path: '/refund-policy', element: <RefundPolicy /> },
  ],

  // Authentication routes
  auth: [
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/reset-password', element: <ResetPassword /> },
    { path: '/verify-email', element: <EmailVerification /> },
  ],

  // User routes (require authentication)
  user: [
    { path: '/profile', element: <Profile /> },
    { path: '/settings', element: <Settings /> },
    { path: '/notifications', element: <Notifications /> },
    { path: '/wishlist', element: <Wishlist /> },
    { path: '/my-tickets', element: <MyTickets /> },
    { path: '/tickets/:id', element: <TicketDetails /> },
    { path: '/pasket', element: <Pasket /> },
    { path: '/orders', element: <OrderHistory /> },
    { path: '/orders/:id', element: <OrderDetails /> },
    { path: '/checkout', element: <Checkout /> },
    { path: '/analytics', element: <Analytics /> },
    { path: '/analytics/realtime', element: <RealTimeAnalytics /> },
    { path: '/export', element: <DataExport /> },
  ],

  // Organizer routes (require organizer role)
  organizer: [
    { path: '/create-event', element: <CreateEvent /> },
    { path: '/organizer-dashboard', element: <OrganizerDashboard /> },
    { path: '/organizer/dashboard', element: <OrganizerDashboard /> },
    { path: '/organizer/events/:eventId/tickets', element: <OrganizerTicketManagement /> },
  ],

  // Admin routes (require admin role)
  admin: [
    { path: '/admin/dashboard', element: <AdminDashboard /> },
    { path: '/admin/users', element: <AdminUsers /> },
    { path: '/admin/moderation', element: <AdminModeration /> },
    { path: '/admin/analytics', element: <AdminAnalytics /> },
    { path: '/admin/financial', element: <AdminFinancial /> },
    { path: '/admin/config', element: <AdminConfig /> },
    { path: '/admin/security', element: <AdminSecurity /> },
    { path: '/admin/team', element: <AdminTeam /> },
  ],

  // Redirect routes
  redirects: [
    { path: '/favorites', element: <Navigate to="/wishlist" replace /> },
    { path: '/favourite', element: <Navigate to="/wishlist" replace /> },
    { path: '/favourites', element: <Navigate to="/wishlist" replace /> },
  ],

  // Error routes
  errors: [
    { path: '/maintenance', element: <Maintenance /> },
    { path: '/500', element: <ServerError /> },
    { path: '*', element: <NotFound /> },
  ],
};

// Helper function to get all routes
export const getAllRoutes = () => {
  return Object.values(routeConfig).flat();
};

// Helper function to get routes by category
export const getRoutesByCategory = (category) => {
  return routeConfig[category] || [];
};

// Helper function to get public routes
export const getPublicRoutes = () => {
  return routeConfig.public;
};

// Helper function to get authenticated routes
export const getAuthenticatedRoutes = () => {
  return [...routeConfig.user, ...routeConfig.organizer, ...routeConfig.admin];
};

// Helper function to get admin routes
export const getAdminRoutes = () => {
  return routeConfig.admin;
};

// Helper function to get organizer routes
export const getOrganizerRoutes = () => {
  return routeConfig.organizer;
};

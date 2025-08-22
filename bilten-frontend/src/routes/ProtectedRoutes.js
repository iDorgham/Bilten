import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { withAuth, withAdminAuth, withOrganizerAuth } from './RouteGuard';
import { routeConfig } from './index';

// Import components that need protection
import {
  Wishlist,
  Profile,
  Settings,
  Notifications,
  MyTickets,
  TicketDetails
} from '../pages/user';

import {
  Pasket,
  OrderHistory,
  OrderDetails,
  Checkout
} from '../pages/orders';

import {
  Analytics,
  RealTimeAnalytics
} from '../pages/analytics';

import DataExport from '../components/DataExport';

import {
  CreateEvent,
  OrganizerDashboard,
  OrganizerTicketManagement
} from '../pages/events';

import {
  AdminDashboard,
  AdminUsers,
  AdminModeration,
  AdminAnalytics,
  AdminFinancial,
  AdminConfig,
  AdminSecurity,
  AdminTeam,
  AdminEvents,
  AdminRealtime,
  AdminPromo
} from '../pages/admin';
import AdminLayout from '../components/admin/AdminLayout';

// Create protected route components
const ProtectedUserRoutes = () => (
  <Routes>
    {/* User routes - require authentication */}
    <Route path="/profile" element={<Profile />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/notifications" element={<Notifications />} />
    <Route path="/wishlist" element={<Wishlist />} />
    <Route path="/my-tickets" element={<MyTickets />} />
    <Route path="/tickets/:id" element={<TicketDetails />} />
    <Route path="/pasket" element={<Pasket />} />
    <Route path="/orders" element={<OrderHistory />} />
    <Route path="/orders/:id" element={<OrderDetails />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/analytics/realtime" element={<RealTimeAnalytics />} />
    <Route path="/export" element={<DataExport />} />
  </Routes>
);

const ProtectedOrganizerRoutes = () => (
  <Routes>
    {/* Organizer routes - require organizer role */}
    <Route path="/create-event" element={<CreateEvent />} />
    <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
    <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
    <Route path="/organizer/events/:eventId/tickets" element={<OrganizerTicketManagement />} />
  </Routes>
);

const ProtectedAdminRoutes = () => (
  <Routes>
    {/* Admin routes - require admin role */}
    <Route path="/dashboard" element={
      <AdminLayout title="Dashboard">
        <AdminDashboard />
      </AdminLayout>
    } />
    <Route path="/users" element={
      <AdminLayout title="User Management">
        <AdminUsers />
      </AdminLayout>
    } />
    <Route path="/events" element={
      <AdminLayout title="Event Management">
        <AdminEvents />
      </AdminLayout>
    } />
    <Route path="/moderation" element={
      <AdminLayout title="Content Moderation">
        <AdminModeration />
      </AdminLayout>
    } />
    <Route path="/analytics" element={
      <AdminLayout title="Analytics">
        <AdminAnalytics />
      </AdminLayout>
    } />
    <Route path="/realtime" element={
      <AdminLayout title="Real-time Analytics">
        <AdminRealtime />
      </AdminLayout>
    } />
    <Route path="/financial" element={
      <AdminLayout title="Financial Reports">
        <AdminFinancial />
      </AdminLayout>
    } />
    <Route path="/promo-codes" element={
      <AdminLayout title="Promo Code Management">
        <AdminPromo />
      </AdminLayout>
    } />
    <Route path="/config" element={
      <AdminLayout title="System Configuration">
        <AdminConfig />
      </AdminLayout>
    } />
    <Route path="/security" element={
      <AdminLayout title="Security & Compliance">
        <AdminSecurity />
      </AdminLayout>
    } />
    <Route path="/team" element={
      <AdminLayout title="Team Management">
        <AdminTeam />
      </AdminLayout>
    } />
  </Routes>
);

// Export protected route components with appropriate guards
export const ProtectedUserRoutesWithAuth = withAuth(ProtectedUserRoutes);
export const ProtectedOrganizerRoutesWithAuth = withOrganizerAuth(ProtectedOrganizerRoutes);
export const ProtectedAdminRoutesWithAuth = withAdminAuth(ProtectedAdminRoutes);

// Helper function to get protected routes based on user role
export const getProtectedRoutesByRole = (userRole) => {
  switch (userRole) {
    case 'admin':
      return [
        ...routeConfig.user,
        ...routeConfig.organizer,
        ...routeConfig.admin
      ];
    case 'organizer':
      return [
        ...routeConfig.user,
        ...routeConfig.organizer
      ];
    case 'user':
      return routeConfig.user;
    default:
      return [];
  }
};

// Helper function to check if user has access to a specific route
export const hasRouteAccess = (userRole, routePath) => {
  const publicRoutes = routeConfig.public.map(route => route.path);
  const authRoutes = routeConfig.auth.map(route => route.path);
  
  // Public and auth routes are always accessible
  if ([...publicRoutes, ...authRoutes].includes(routePath)) {
    return true;
  }

  // Check user-specific routes
  const userRoutes = routeConfig.user.map(route => route.path);
  if (userRoutes.includes(routePath)) {
    return userRole === 'user' || userRole === 'organizer' || userRole === 'admin';
  }

  // Check organizer-specific routes
  const organizerRoutes = routeConfig.organizer.map(route => route.path);
  if (organizerRoutes.includes(routePath)) {
    return userRole === 'organizer' || userRole === 'admin';
  }

  // Check admin-specific routes
  const adminRoutes = routeConfig.admin.map(route => route.path);
  if (adminRoutes.includes(routePath)) {
    return userRole === 'admin';
  }

  return false;
};

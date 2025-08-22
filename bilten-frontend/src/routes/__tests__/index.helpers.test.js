// Mock heavy page modules to avoid importing app pages
jest.mock('../../pages/Home', () => ({ __esModule: true, default: () => null }));
jest.mock('../../pages/auth', () => ({
  __esModule: true,
  Login: () => null,
  Register: () => null,
  ForgotPassword: () => null,
  ResetPassword: () => null,
  EmailVerification: () => null,
}));
jest.mock('../../pages/events', () => ({
  __esModule: true,
  Events: () => null,
  EventDetails: () => null,
  EventSearch: () => null,
  EventCalendar: () => null,
  EventReviews: () => null,
  CreateEvent: () => null,
  OrganizerDashboard: () => null,
  OrganizerTicketManagement: () => null,
}));
jest.mock('../../pages/analytics', () => ({ __esModule: true, Analytics: () => null, RealTimeAnalytics: () => null }));
jest.mock('../../pages/user', () => ({
  __esModule: true,
  Wishlist: () => null,
  Profile: () => null,
  Settings: () => null,
  Notifications: () => null,
  MyTickets: () => null,
  TicketDetails: () => null,
}));
jest.mock('../../pages/orders', () => ({
  __esModule: true,
  Pasket: () => null,
  OrderHistory: () => null,
  OrderDetails: () => null,
  Checkout: () => null,
}));
jest.mock('../../pages/legal', () => ({
  __esModule: true,
  PrivacyPolicy: () => null,
  TermsOfService: () => null,
  CookiePolicy: () => null,
  RefundPolicy: () => null,
}));
jest.mock('../../pages/company', () => ({
  __esModule: true,
  AboutUs: () => null,
  Contact: () => null,
  FAQ: () => null,
  Careers: () => null,
  Press: () => null,
}));
jest.mock('../../pages/help', () => ({ __esModule: true, HelpCenter: () => null, QA: () => null }));
jest.mock('../../pages/news', () => ({ __esModule: true, News: () => null, ArticleDetail: () => null }));
jest.mock('../../pages/recommendations', () => ({ __esModule: true, Recommendations: () => null }));
jest.mock('../../pages/errors', () => ({ __esModule: true, NotFound: () => null, ServerError: () => null, Maintenance: () => null }));
jest.mock('../../components/DataExport', () => ({ __esModule: true, default: () => null }));
jest.mock('react-router-dom', () => ({ __esModule: true, Navigate: () => null }), { virtual: true });

import { routeConfig, getAllRoutes, getRoutesByCategory, getPublicRoutes, getAuthenticatedRoutes, getAdminRoutes, getOrganizerRoutes } from '../index';

describe('routes/index helpers', () => {
  test('getPublicRoutes returns routeConfig.public', () => {
    expect(getPublicRoutes().length).toBe(routeConfig.public.length);
  });

  test('getAuthenticatedRoutes concatenates user+organizer+admin', () => {
    const expected = routeConfig.user.length + routeConfig.organizer.length + routeConfig.admin.length;
    expect(getAuthenticatedRoutes().length).toBe(expected);
  });

  test('getRoutesByCategory returns by key or empty array', () => {
    expect(getRoutesByCategory('auth').length).toBe(routeConfig.auth.length);
    expect(getRoutesByCategory('nonexistent')).toEqual([]);
  });

  test('getAdminRoutes and getOrganizerRoutes return respective arrays', () => {
    expect(getAdminRoutes().length).toBe(routeConfig.admin.length);
    expect(getOrganizerRoutes().length).toBe(routeConfig.organizer.length);
  });

  test('getAllRoutes flattens all categories', () => {
    const sum = Object.values(routeConfig).reduce((acc, arr) => acc + arr.length, 0);
    expect(getAllRoutes().length).toBe(sum);
  });
});



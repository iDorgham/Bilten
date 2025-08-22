// Mock the heavy routeConfig to avoid importing all pages
jest.mock('../index', () => ({
  __esModule: true,
  routeConfig: {
    public: [ { path: '/' }, { path: '/about' } ],
    auth: [ { path: '/login' }, { path: '/register' } ],
    user: [ { path: '/profile' }, { path: '/orders' } ],
    organizer: [ { path: '/organizer/dashboard' } ],
    admin: [ { path: '/admin/dashboard' } ]
  }
}));

// Mock react-router-dom components referenced by ProtectedRoutes to avoid ESM import
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    __esModule: true,
    Routes: ({ children }) => React.createElement('div', null, children),
    Route: () => null,
  };
}, { virtual: true });

import { getProtectedRoutesByRole, hasRouteAccess } from '../ProtectedRoutes';

describe('ProtectedRoutes helpers', () => {
  test('getProtectedRoutesByRole merges routes per role', () => {
    expect(getProtectedRoutesByRole('admin').length).toBe(4); // user(2)+organizer(1)+admin(1)
    expect(getProtectedRoutesByRole('organizer').length).toBe(3); // user(2)+organizer(1)
    expect(getProtectedRoutesByRole('user').length).toBe(2); // user(2)
    expect(getProtectedRoutesByRole('unknown').length).toBe(0);
  });

  test('hasRouteAccess allows public and auth routes to anyone', () => {
    expect(hasRouteAccess(null, '/')).toBe(true);
    expect(hasRouteAccess('guest', '/login')).toBe(true);
  });

  test('hasRouteAccess enforces role-specific routes', () => {
    // user routes
    expect(hasRouteAccess('user', '/profile')).toBe(true);
    expect(hasRouteAccess('organizer', '/profile')).toBe(true);
    expect(hasRouteAccess('admin', '/profile')).toBe(true);
    expect(hasRouteAccess(null, '/profile')).toBe(false);

    // organizer routes
    expect(hasRouteAccess('organizer', '/organizer/dashboard')).toBe(true);
    expect(hasRouteAccess('admin', '/organizer/dashboard')).toBe(true);
    expect(hasRouteAccess('user', '/organizer/dashboard')).toBe(false);

    // admin routes
    expect(hasRouteAccess('admin', '/admin/dashboard')).toBe(true);
    expect(hasRouteAccess('organizer', '/admin/dashboard')).toBe(false);
    expect(hasRouteAccess('user', '/admin/dashboard')).toBe(false);
  });
});



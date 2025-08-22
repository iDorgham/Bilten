import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom to avoid ESM resolution issues in Jest
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    BrowserRouter: ({ children }) => React.createElement('div', null, children),
    Routes: ({ children }) => React.createElement('div', null, children),
    Route: ({ element }) => element,
    Navigate: () => null,
    useLocation: () => ({ pathname: '/' }),
    useNavigate: () => jest.fn(),
    Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
  };
}, { virtual: true });

// Mock axios usage via api service to avoid ESM import from axios in tests
jest.mock('./services/api', () => ({
  __esModule: true,
  default: { },
}));

// Mock aiChat service (uses axios ESM)
jest.mock('./services/aiChat', () => ({
  __esModule: true,
  default: {
    sendMessage: jest.fn().mockResolvedValue({ data: { reply: 'ok' } }),
  },
}));

// Mock heavy components that may pull axios indirectly
jest.mock('./components/ApiStatusIndicator', () => () => null);

// Mock routes to avoid importing pages that import axios
jest.mock('./routes', () => ({
  __esModule: true,
  routeConfig: { public: [], auth: [], redirects: [], errors: [] },
  getAllRoutes: jest.fn(() => []),
  getPublicRoutes: jest.fn(() => []),
  getAuthenticatedRoutes: jest.fn(() => []),
}));

test('renders learn react link', () => {
  render(<App />);
  const brand = screen.getByText(/Bilten/i);
  expect(brand).toBeInTheDocument();
});

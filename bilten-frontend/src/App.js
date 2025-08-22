import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Import organized route configuration
import { 
  routeConfig, 
  getAllRoutes,
  getPublicRoutes,
  getAuthenticatedRoutes 
} from './routes';
import { 
  ProtectedUserRoutesWithAuth,
  ProtectedOrganizerRoutesWithAuth,
  ProtectedAdminRoutesWithAuth
} from './routes/ProtectedRoutes';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import TranslationValidator from './components/TranslationValidator';
import ApiStatusIndicator from './components/ApiStatusIndicator';

// Wrapper component to conditionally render layout
const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');

  // Admin pages use their own layout (AdminLayout), so don't wrap them
  if (isAdminPage) {
    return (
      <div className="min-h-screen">
        <Routes>
          {/* Admin Routes - Protected by admin authentication */}
          <Route path="/admin/*" element={<ProtectedAdminRoutesWithAuth />} />
        </Routes>
        <TranslationValidator />
        <ApiStatusIndicator />
      </div>
    );
  }

  // Regular pages use standard layout
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          {routeConfig.public.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          {/* Authentication Routes */}
          {routeConfig.auth.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          {/* Redirect Routes */}
          {routeConfig.redirects.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          
          {/* Organizer Routes - Protected by organizer authentication */}
          <Route path="/organizer/*" element={<ProtectedOrganizerRoutesWithAuth />} />

          {/* Protected User Routes - These will be handled by the route guards (catch-all, must be last) */}
          <Route path="/*" element={<ProtectedUserRoutesWithAuth />} />

          {/* Error Routes */}
          {routeConfig.errors.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </main>
      {!isHomePage && <Footer />}
      <TranslationValidator />
      <ApiStatusIndicator />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <Router>
            <AppContent />
          </Router>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
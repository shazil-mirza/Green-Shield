
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DetectionPage from './pages/DetectionPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SubscriptionPage from './pages/SubscriptionPage'; // New
import AdminUserManagementPage from './pages/AdminUserManagementPage'; // New
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'; // New
import { useAuth } from './contexts/AuthContext';

// Wrapper for routes accessible only by non-admin authenticated users
const UserRoutesWrapper: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base_100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.role === 'admin') {
    // If an admin tries to access a general user page (like /subscription explicitly), let them,
    // but for general flow, they are usually directed to /admin/dashboard from other user pages.
    // This allows admins to test subscription flows if needed.
    if (location.pathname === '/detect' || location.pathname === '/history') {
        return <Navigate to="/admin/dashboard" replace />;
    }
  }
  return <Outlet />;
};

// Wrapper for routes accessible only by admin users
const AdminRoutesWrapper: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base_100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/detect" replace />; // Non-admin trying to access admin page
  }
  return <Outlet />;
};


const App: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth(); 

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base_100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  const commonRedirectPath = isAuthenticated 
    ? (user?.role === 'admin' ? "/admin/dashboard" : "/detect") 
    : "/login";
  
  const loggedInRedirectPath = user?.role === 'admin' ? "/admin/dashboard" : "/detect";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to={loggedInRedirectPath} /> : <LoginPage />} 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to={loggedInRedirectPath} /> : <SignupPage />} 
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to={loggedInRedirectPath} /> : <ForgotPasswordPage />}
          />
          <Route
            path="/reset-password/:token"
            element={isAuthenticated ? <Navigate to={loggedInRedirectPath} /> : <ResetPasswordPage />}
          />
          
          {/* User Routes */}
          <Route element={<UserRoutesWrapper />}>
            <Route path="/detect" element={<DetectionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoutesWrapper />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUserManagementPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
          </Route>
          
          {/* Catch-all route */}
          {/* Redirect to /login if not authenticated, or to role-specific page if authenticated */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to={loggedInRedirectPath} replace /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to={commonRedirectPath} replace />} />
        </Routes>
      </main>
      <footer className="bg-neutral text-base_100 p-4 text-center">
        <p>&copy; {new Date().getFullYear()} Green Shield. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
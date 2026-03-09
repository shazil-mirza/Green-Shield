
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, isLoading: authIsLoading } = useAuth();

  const from = location.state?.from?.pathname || (user?.role === 'admin' ? '/admin/dashboard' : '/detect');

  useEffect(() => {
    if (isAuthenticated && !authIsLoading) {
      if (user?.role === 'admin') {
        navigate(location.state?.from?.pathname && !location.state?.from?.pathname.startsWith('/admin') ? '/admin/dashboard' : from, { replace: true });
      } else if (user?.role === 'user') {
         navigate(location.state?.from?.pathname && location.state?.from?.pathname.startsWith('/admin') ? '/detect' : from, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, authIsLoading, user, navigate, from, location.state?.from?.pathname]);

  const handleLogin = async (data: { email: string, password?: string }) => {
    if (!data.password) {
        setError("Password is required.");
        return;
    }
    setLoading(true);
    setError(null);
    
    try {
      await login(data.email, data.password);
      // Navigation is handled by useEffect after user state is updated
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (authIsLoading && !isAuthenticated) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isAuthenticated && !authIsLoading) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-12">
       <div className="w-full max-w-md">
        <AuthForm 
            isLogin={true} 
            onSubmit={handleLogin}
            error={error}
            loading={loading}
        />
        <div className="mt-4 text-sm text-center">
            <Link to="/forgot-password" className="font-medium text-primary hover:text-green-700">
                Forgot Password?
            </Link>
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:text-green-700">
            Sign Up
          </Link>
        </p>
       </div>
    </div>
  );
};

export default LoginPage;

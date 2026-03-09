
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const SignupPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, isAuthenticated, user, isLoading: authIsLoading } = useAuth();

  const from = location.state?.from?.pathname || (user?.role === 'admin' ? '/admin/dashboard' : '/detect');

  useEffect(() => {
    if (isAuthenticated && !authIsLoading) {
      const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/detect';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, authIsLoading, user, navigate]);

  const handleSignup = async (data: { name?: string; email: string; password?: string }) => {
    if (!data.name || !data.password) {
        setError("Name and password are required for signup.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      await signup(data.name, data.email, data.password);
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to sign up. Please try again.');
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
          isLogin={false} 
          onSubmit={handleSignup}
          error={error}
          loading={loading}
        />
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-green-700">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

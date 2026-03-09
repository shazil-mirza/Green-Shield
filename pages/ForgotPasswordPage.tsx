
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { Mail } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resetTokenForDev, setResetTokenForDev] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetTokenForDev(null);

    try {
      const response = await apiService.post<{ message: string; resetToken?: string }>('/api/auth/forgot-password', { email });
      setMessage(response.message);
      if (response.resetToken) {
        setResetTokenForDev(response.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center text-primary">
          Forgot Password
        </h2>

        {message && !error && <Alert type="info" message={message} />}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {resetTokenForDev && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                <p className="font-semibold">Development Only: Password Reset Token</p>
                <p className="break-all">Token: {resetTokenForDev}</p>
                <p className="mt-2">
                    Click here to reset: {' '}
                    <Link 
                        to={`/reset-password/${resetTokenForDev}`} 
                        className="font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                        Reset Password
                    </Link>
                </p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!message && ( // Hide form after successful submission message
            <>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
                </label>
                <div className="mt-1 relative">
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="you@example.com"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
            </div>

            <div>
                <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 transition-colors"
                >
                {loading ? (
                    <Spinner size="sm" color="text-white" />
                ) : (
                    'Send Password Reset Link'
                )}
                </button>
            </div>
            </>
          )}
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-green-700">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

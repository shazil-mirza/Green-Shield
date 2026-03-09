
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { Lock } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiService.post<{ message: string }>(`/api/auth/reset-password/${token}`, { password });
      setMessage(response.message + " Redirecting to login...");
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password. The token might be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center text-primary">
          Set New Password
        </h2>

        {message && !error && <Alert type="success" message={message} />}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {!message && ( // Hide form after successful submission
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
                </label>
                <div className="mt-1 relative">
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
            </div>

            <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
                </label>
                <div className="mt-1 relative">
                <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="••••••••"
                />
                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
                 {password !== confirmPassword && confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>}
            </div>

            <div>
                <button
                type="submit"
                disabled={loading || (password !== confirmPassword && confirmPassword.length > 0) || password.length < 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 transition-colors"
                >
                {loading ? (
                    <Spinner size="sm" color="text-white" />
                ) : (
                    'Reset Password'
                )}
                </button>
            </div>
            </form>
        )}
         {message && (
            <p className="mt-6 text-center text-sm text-gray-600">
                 <Link to="/login" className="font-medium text-primary hover:text-green-700">
                    Go to Login
                </Link>
            </p>
         )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

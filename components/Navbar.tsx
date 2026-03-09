
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, LogIn, UserPlus, ShieldAlert, CreditCard, Crown } from 'lucide-react'; 

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout(); // Ensure logout completes before navigation
    navigate('/login');
  };
  
  const isUserPageActive = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));
  const isAdminPageActive = location.pathname.startsWith('/admin');

  return (
    <nav className="bg-primary shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            to={isAuthenticated ? (user?.role === 'admin' ? '/admin/dashboard' : '/detect') : '/login'} 
            className="flex items-center text-white text-xl font-semibold hover:text-green-200 transition-colors"
          >
            <Leaf size={28} className="mr-2" /> 
            Green Shield
          </Link>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {isAuthenticated ? (
              <>
                <span className="text-white text-sm hidden md:block mr-2">
                  Hi, {user?.email?.split('@')[0]}!
                  {/* Fix: Wrap Crown icon in a span with a title attribute for tooltip */}
                  {user?.planType === 'premium' && <span title="Premium User"><Crown size={16} className="inline ml-1 mb-1 text-yellow-400" /></span>}
                </span>
                
                {user?.role !== 'admin' && (
                  <>
                    <Link 
                      to="/detect" 
                      className={`px-2 py-2 sm:px-3 rounded-md text-sm font-medium transition-colors ${isUserPageActive(['/detect']) ? 'bg-green-700 text-white' : 'text-white hover:text-green-200 hover:bg-green-600'}`}
                    >
                      Detect
                    </Link>
                    <Link 
                      to="/history" 
                      className={`px-2 py-2 sm:px-3 rounded-md text-sm font-medium transition-colors ${isUserPageActive(['/history']) ? 'bg-green-700 text-white' : 'text-white hover:text-green-200 hover:bg-green-600'}`}
                    >
                      History
                    </Link>
                     <Link 
                        to="/subscription" 
                        className={`px-2 py-2 sm:px-3 rounded-md text-sm font-medium transition-colors flex items-center ${isUserPageActive(['/subscription']) ? 'bg-green-700 text-white' : 'text-white hover:text-green-200 hover:bg-green-600'}`}
                      >
                       <CreditCard size={16} className="mr-1 sm:mr-2"/> Subscription
                    </Link>
                  </>
                )}

                {user?.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className={`px-2 py-2 sm:px-3 rounded-md text-sm font-medium flex items-center transition-colors ${isAdminPageActive ? 'bg-accent text-white' : 'text-white bg-orange-600 hover:bg-orange-700'}`}
                  >
                    <ShieldAlert size={18} className="mr-1 sm:mr-2" /> Admin
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-green-200 transition-colors px-2 py-2 sm:px-3 rounded-md text-sm font-medium flex items-center">
                  <LogIn size={18} className="mr-1 sm:mr-2"/> Login
                </Link>
                <Link to="/signup" className="bg-secondary hover:bg-emerald-600 text-white px-2 py-2 sm:px-3 rounded-md text-sm font-medium transition-colors flex items-center">
                   <UserPlus size={18} className="mr-1 sm:mr-2"/> Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

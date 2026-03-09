import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Users, BarChart2, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const cardLinkStyle = "block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
            <ShieldCheck size={32} className="mr-3 text-accent" />
            Admin Dashboard
        </h1>
        {user && <p className="text-neutral text-sm sm:text-base">Welcome, Admin <span className="font-semibold">{user.email}</span>!</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-neutral mb-3">System Overview</h2>
        <p className="text-gray-700">
          Manage users, view application analytics, and oversee system settings from this dashboard.
          Use the links below to navigate to specific administrative sections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/admin/users" className={cardLinkStyle}>
            <div className="flex items-center text-blue-600 mb-3">
                <Users size={28} className="mr-3"/>
                <h3 className="text-xl font-semibold">User Management</h3>
            </div>
            <p className="text-sm text-gray-600">View, edit roles, or manage user accounts and their subscription statuses.</p>
        </Link>
        
        <Link to="/admin/analytics" className={cardLinkStyle}>
            <div className="flex items-center text-green-600 mb-3">
                <BarChart2 size={28} className="mr-3"/>
                <h3 className="text-xl font-semibold">Application Analytics</h3>
            </div>
            <p className="text-sm text-gray-600">Track detection usage, popular diseases, and subscription statistics.</p>
        </Link>
        
        {/* Placeholder for a future settings card if needed */}
        <div className={`${cardLinkStyle} opacity-50 cursor-not-allowed`}>
           <div className="flex items-center text-gray-500 mb-3">
                <CreditCard size={28} className="mr-3"/>
                <h3 className="text-xl font-semibold">Billing & Subscriptions</h3>
            </div>
            <p className="text-sm text-gray-500">Review overall subscription revenue and manage Stripe product settings (via Stripe Dashboard).</p>
             <span className="mt-2 inline-block text-xs text-gray-400">(Link to Stripe Dashboard would be external)</span>
        </div>
      </div>
      
      <div className="mt-10 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md">
        <h4 className="font-bold">Admin Responsibilities</h4>
        <p className="text-sm">As an administrator, you have elevated privileges. Please ensure all actions are performed responsibly and ethically. User data privacy and system integrity are paramount.</p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
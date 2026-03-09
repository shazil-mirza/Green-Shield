
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { Users, Edit3, Trash2, Shield, UserCheck, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: adminUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<User[]>('/admin/users');
      setUsers(data || []);
    } catch (err: any) {
      setError(err.data?.message || err.message || "Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (userId === adminUser?.id && newRole === 'user') {
        setError("You cannot demote your own admin account.");
        return;
    }
    setIsSubmitting(true);
    try {
      await apiService.put(`/admin/users/${userId}`, { role: newRole });
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null); // Close modal or editing form
    } catch (err: any) {
      setError(err.data?.message || err.message || "Failed to update user role.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === adminUser?.id) {
        setError("You cannot delete your own admin account.");
        return;
    }
    if (window.confirm("Are you sure you want to delete this user? This will also cancel their active subscription and delete their detection history. This action cannot be undone.")) {
      setIsSubmitting(true);
      try {
        await apiService.delete(`/admin/users/${userId}`);
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      } catch (err: any) {
        setError(err.data?.message || err.message || "Failed to delete user.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.stripeSubscriptionStatus && user.stripeSubscriptionStatus.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.planType && user.planType.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  if (isLoading && users.length === 0) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Users size={32} className="mr-3 text-blue-600" /> User Management
        </h1>
        <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
        >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Users
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search users by name, email, role, plan..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      {isLoading && users.length > 0 && <div className="text-center py-4"><Spinner /></div>}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-accent text-white' : 'bg-green-100 text-green-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.planType || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {user.stripeSubscriptionStatus ? user.stripeSubscriptionStatus.replace(/_/g, ' ') : (user.planType === 'free' ? 'N/A' : 'Inactive')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setEditingUser(user)}
                    disabled={isSubmitting || user.id === adminUser?.id}
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit Role"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={isSubmitting || user.id === adminUser?.id}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && !isLoading && (
            <p className="text-center py-8 text-gray-500">No users found matching your criteria.</p>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Edit User Role: {editingUser.name}</h3>
            <p className="text-sm mb-1">Current Role: <span className="font-semibold">{editingUser.role}</span></p>
            <p className="text-sm mb-4">Current Plan: <span className="font-semibold capitalize">{editingUser.planType}</span> (Status: <span className="capitalize">{editingUser.stripeSubscriptionStatus || 'N/A'}</span>)</p>
            
            <div className="space-y-3">
                <button
                  onClick={() => handleRoleChange(editingUser.id, 'admin')}
                  disabled={isSubmitting || editingUser.role === 'admin'}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-orange-700 disabled:bg-gray-400"
                >
                  <Shield size={16} className="mr-2" /> Make Admin
                </button>
                <button
                  onClick={() => handleRoleChange(editingUser.id, 'user')}
                  disabled={isSubmitting || editingUser.role === 'user'}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-300"
                >
                  <UserCheck size={16} className="mr-2" /> Make User
                </button>
            </div>
            {isSubmitting && <div className="mt-4"><Spinner/></div>}
            <button onClick={() => setEditingUser(null)} className="mt-6 w-full text-sm text-gray-600 hover:text-gray-800 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementPage;

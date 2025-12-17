'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { ArrowLeft, UserX, UserCheck, Trash2, Shield } from 'lucide-react';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  branch?: string;
  section?: string;
  rollNo?: string;
  notesUploaded?: number;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export default function UsersManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!(user as any).isAdmin) {
      router.push('/browse');
      return;
    }

    loadUsers();
  }, [user, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      setActionLoading(userId);
      await adminAPI.suspendUser(userId);
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error suspending user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminAPI.unsuspendUser(userId);
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error unsuspending user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to DELETE this user and all their notes? This action cannot be undone!')) return;

    try {
      setActionLoading(userId);
      await adminAPI.deleteUser(userId);
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting user');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Total Users: {users.length}</p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploads</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => {
                    const userId = u._id || u.id;
                    const isLoading = actionLoading === userId;
                    
                    return (
                      <tr key={userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                {u.isAdmin && (
                                  <span title="Admin">
                                    <Shield className="w-4 h-4 text-yellow-500 ml-2" />
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.branch || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.rollNo || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {u.notesUploaded || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.isSuspended ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {u.isAdmin ? (
                            <span className="text-gray-400 text-xs">Protected</span>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              {u.isSuspended ? (
                                <button
                                  onClick={() => handleUnsuspend(userId)}
                                  disabled={isLoading}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  title="Unsuspend"
                                >
                                  <UserCheck className="w-5 h-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspend(userId)}
                                  disabled={isLoading}
                                  className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                                  title="Suspend"
                                >
                                  <UserX className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(userId)}
                                disabled={isLoading}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { Users, FileText, Download, Eye, AlertTriangle, UserX } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalNotes: number;
  totalDownloads: number;
  totalViews: number;
  suspendedUsers: number;
  reportedNotes: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Check if user is admin
    if (!(user as any).isAdmin) {
      router.push('/browse');
      return;
    }

    loadStats();
  }, [user, router]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, content, and platform statistics</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers}</h3>
              <p className="text-sm text-gray-600">Registered Users</p>
            </div>

            {/* Total Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalNotes}</h3>
              <p className="text-sm text-gray-600">Notes Uploaded</p>
            </div>

            {/* Total Downloads */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalDownloads}</h3>
              <p className="text-sm text-gray-600">Downloads</p>
            </div>

            {/* Total Views */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalViews}</h3>
              <p className="text-sm text-gray-600">Page Views</p>
            </div>

            {/* Suspended Users */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.suspendedUsers}</h3>
              <p className="text-sm text-gray-600">Suspended Users</p>
            </div>

            {/* Reported Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-500">Pending</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.reportedNotes}</h3>
              <p className="text-sm text-gray-600">Reported Notes</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/admin/users')}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group"
            >
              <Users className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Users</h3>
              <p className="text-sm text-gray-600">View, suspend, or delete user accounts</p>
            </button>

            <button
              onClick={() => router.push('/admin/notes')}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-green-500 hover:shadow-md transition-all text-left group"
            >
              <FileText className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Moderate Content</h3>
              <p className="text-sm text-gray-600">Review and delete inappropriate notes</p>
            </button>

            <button
              onClick={() => router.push('/admin/reports')}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-yellow-500 hover:shadow-md transition-all text-left group"
            >
              <AlertTriangle className="w-8 h-8 text-yellow-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Reports</h3>
              <p className="text-sm text-gray-600">Manage reported content and violations</p>
            </button>
          </div>
        </div>
      </div>
  );
}

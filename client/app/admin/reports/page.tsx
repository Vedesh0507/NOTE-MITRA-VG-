'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { ArrowLeft, Trash2, CheckCircle, FileText, AlertTriangle } from 'lucide-react';

interface Report {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  subject: string;
  semester: string;
  branch: string;
  userName: string;
  reportReason: string;
  createdAt: string;
}

export default function ReportsManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
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

    loadReports();
  }, [user, router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getReports();
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (noteId: string) => {
    try {
      setActionLoading(noteId);
      await adminAPI.resolveReport(noteId);
      await loadReports();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error resolving report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this reported note? This action cannot be undone!')) return;

    try {
      setActionLoading(noteId);
      await adminAPI.deleteNote(noteId);
      await loadReports();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting note');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reported Content</h1>
            <p className="text-gray-600">Pending Reports: {reports.length}</p>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => {
              const noteId = report._id || report.id;
              const isLoading = actionLoading === noteId;

              return (
                <div
                  key={noteId}
                  className="bg-white rounded-lg shadow-sm p-6 border border-yellow-300 bg-yellow-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
                          Reported
                        </span>
                      </div>

                      {report.description && (
                        <p className="text-gray-600 text-sm mb-3">{report.description}</p>
                      )}

                      <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm font-semibold text-red-900 mb-1">Report Reason:</p>
                        <p className="text-sm text-red-800">{report.reportReason}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {report.subject}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          Sem {report.semester}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          {report.branch}
                        </span>
                        <span>By: {report.userName}</span>
                      </div>

                      <div className="text-xs text-gray-500">
                        Uploaded: {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => handleResolve(noteId)}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Dismiss
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(noteId)}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Trash2 className="w-5 h-5 mr-2" />
                            Delete Note
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {reports.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
              <p className="text-gray-500">No reported content at the moment</p>
            </div>
          )}
        </div>
      </div>
  );
}

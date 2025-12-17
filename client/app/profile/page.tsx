'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  GraduationCap,
  Upload,
  Download,
  Eye,
  ThumbsUp,
  BookmarkPlus,
  Edit,
  Award,
  FileText,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { notesAPI } from '@/lib/api';

interface UserNote {
  id: number;
  title: string;
  subject: string;
  semester: string;
  branch: string;
  views: number;
  downloads: number;
  upvotes: number;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [uploadedNotes, setUploadedNotes] = useState<UserNote[]>([]);
  const [savedNotes, setSavedNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'uploaded' | 'saved'>('uploaded');

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    refreshUser(); // Refresh user data to get latest stats
    fetchUserData();
  }, [user?.id]); // Re-fetch when user ID changes

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's uploaded notes
      const response = await notesAPI.getNotes();
      const allNotes = response.data.notes || [];
      
      // Filter notes uploaded by current user - compare as strings
      if (user) {
        const userNotes = allNotes.filter((note: any) => {
          const noteUserId = note.userId?._id || note.userId;
          return noteUserId?.toString() === user.id.toString();
        });
        setUploadedNotes(userNotes);
      }

      // Fetch saved notes
      try {
        const savedResponse = await notesAPI.getSavedNotes();
        setSavedNotes(savedResponse.data.notes || []);
      } catch (err) {
        console.error('Failed to fetch saved notes:', err);
        setSavedNotes([]);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Redirecting to sign in...</p>
      </div>
    );
  }

  // Get statistics from user object (provided by backend)
  const totalViews = (user as any).totalViews || uploadedNotes.reduce((sum, note) => sum + note.views, 0);
  const totalDownloads = (user as any).totalDownloads || 0;
  const totalUpvotes = (user as any).totalUpvotes || uploadedNotes.reduce((sum, note) => sum + note.upvotes, 0);
  const reputation = (user as any).reputation || 0;
  const notesUploaded = (user as any).uploadsCount || uploadedNotes.length;
  const savedNotesCount = (user as any).savedNotesCount || savedNotes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between -mt-16 mb-4">
              {/* Avatar */}
              <div className="flex items-end gap-4 mb-4 md:mb-0">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Edit Profile Button */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => alert('Edit profile coming soon!')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>

            {/* User Details */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span className="capitalize">{user.role || 'Student'}</span>
              </div>
              {user.branch && (
                <div className="flex items-center gap-2">
                  <span>Branch: {user.branch}</span>
                </div>
              )}
              {user.section && (
                <div className="flex items-center gap-2">
                  <span>Section: {user.section}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">{notesUploaded}</div>
                <div className="text-sm text-blue-700">Notes Uploaded</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">{totalDownloads}</div>
                <div className="text-sm text-green-700">Downloads</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900">{totalViews}</div>
                <div className="text-sm text-purple-700">Total Views</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <ThumbsUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-900">{totalUpvotes}</div>
                <div className="text-sm text-orange-700">Upvotes</div>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Award className="w-6 h-6 text-pink-600" />
                </div>
                <div className="text-2xl font-bold text-pink-900">{reputation}</div>
                <div className="text-sm text-pink-700">Reputation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Sections */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('uploaded')}
                className={`flex-1 py-4 px-6 text-center font-medium transition ${
                  activeTab === 'uploaded'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-5 h-5 inline-block mr-2" />
                Uploaded Notes ({uploadedNotes.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-4 px-6 text-center font-medium transition ${
                  activeTab === 'saved'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BookmarkPlus className="w-5 h-5 inline-block mr-2" />
                Saved Notes ({savedNotes.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : activeTab === 'uploaded' ? (
              uploadedNotes.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes uploaded yet</h3>
                  <p className="text-gray-600 mb-4">Share your knowledge by uploading your first note!</p>
                  <Button onClick={() => router.push('/upload')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Notes
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => router.push(`/notes/${note.id}`)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {note.subject}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Sem {note.semester}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {note.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            {note.downloads}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {note.upvotes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <BookmarkPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved notes yet</h3>
                <p className="text-gray-600 mb-4">Bookmark notes you want to read later!</p>
                <Button onClick={() => router.push('/browse')}>
                  Browse Notes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  User,
  FileText,
  Flag,
  Share2,
  BookmarkPlus,
  Send,
  Edit,
  Trash2
} from 'lucide-react';
import { notesAPI } from '@/lib/api';

interface Note {
  id?: number | string; // Can be number (in-memory) or string (MongoDB _id)
  _id?: string; // MongoDB uses _id
  title: string;
  description: string;
  subject: string;
  semester: string;
  module: string;
  branch: string;
  userName: string;
  userId: number | string; // Can be ObjectId string
  views: number;
  downloads: number;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  fileUrl?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
}

interface Comment {
  id: number | string;
  text: string;
  userName: string;
  userId: number | string;
  createdAt: string;
  isEdited?: boolean;
}

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const noteId = params?.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (noteId) {
      fetchNoteDetails();
      checkIfSaved();
    }
  }, [noteId]);

  const fetchNoteDetails = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching note with ID:', noteId);
      
      // Fetch note details
      const noteResponse = await notesAPI.getNoteById(noteId);
      
      console.log('📦 Received note response:', {
        fullResponse: noteResponse,
        noteData: noteResponse.data,
        note: noteResponse.data.note
      });
      
      const fetchedNote = noteResponse.data.note;
      
      // Ensure note has proper ID fields
      if (fetchedNote) {
        // MongoDB uses _id, but we also want id for consistency
        if (fetchedNote._id && !fetchedNote.id) {
          fetchedNote.id = fetchedNote._id;
        }
        
        console.log('✅ Note set with IDs:', {
          id: fetchedNote.id,
          _id: fetchedNote._id,
          hasId: !!fetchedNote.id,
          has_id: !!fetchedNote._id,
          title: fetchedNote.title,
          fileId: fetchedNote.fileId
        });
      } else {
        console.error('❌ No note in response');
      }
      
      setNote(fetchedNote);

      // Fetch real comments from API
      try {
        const commentsResponse = await notesAPI.getComments(noteId);
        const fetchedComments = commentsResponse.data.comments || [];
        // Map API response to component's Comment interface
        setComments(fetchedComments.map((c: any) => ({
          id: c._id || c.id,
          text: c.text,
          userName: c.userName,
          userId: c.userId,
          createdAt: c.createdAt,
          isEdited: c.isEdited
        })));
        console.log('✅ Fetched', fetchedComments.length, 'comments from API');
      } catch (commentError) {
        console.error('Failed to fetch comments:', commentError);
        setComments([]); // Empty array instead of mock data
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;
    try {
      const response = await notesAPI.checkIfSaved(noteId);
      setIsSaved(response.data.saved);
    } catch (error) {
      console.error('Failed to check saved status:', error);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      setSavingNote(true);
      if (isSaved) {
        await notesAPI.unsaveNote(noteId);
        setIsSaved(false);
      } else {
        await notesAPI.saveNote(noteId);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to save/unsave note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDownload = async () => {
    if (!note) {
      console.error('❌ No note object available for download');
      alert('Error: Note data not loaded. Please refresh the page.');
      return;
    }
    
    try {
      console.log('📥 Starting download for note:', note.title);
      
      // Determine note ID
      const downloadNoteId = note._id || note.id || noteId;
      
      if (!downloadNoteId) {
        throw new Error('Note ID not found. Please refresh the page.');
      }
      
      const noteIdString = String(downloadNoteId).trim();
      console.log('✅ Using note ID:', noteIdString);
      
      // Get API base URL
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // For mobile: Use direct download link approach
      // For desktop: Fetch and create blob
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // First get the download URL from the API
      const response = await fetch(`${apiBase}/notes/${noteIdString}/download`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get download URL: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📄 Download response:', data);
      
      // Track download - increment count
      try {
        await notesAPI.trackDownload(noteIdString);
        setNote({ ...note, downloads: note.downloads + 1 });
      } catch (trackError) {
        console.warn('⚠️ Failed to track download:', trackError);
      }
      
      // Get the actual download URL
      let actualDownloadUrl = data.downloadUrl;
      
      // If URL is relative, make it absolute
      if (actualDownloadUrl && actualDownloadUrl.startsWith('/')) {
        // Extract base without /api
        const baseWithoutApi = apiBase.replace(/\/api$/, '');
        actualDownloadUrl = baseWithoutApi + actualDownloadUrl;
      }
      
      console.log('📥 Download URL:', actualDownloadUrl);
      
      // Mobile-optimized download: Use anchor tag with download attribute
      if (isMobileDevice) {
        console.log('📱 Mobile download - using anchor tag approach');
        
        // Create a hidden anchor and trigger download
        const link = document.createElement('a');
        link.href = actualDownloadUrl;
        link.download = note.fileName || `${note.title}.pdf`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // iOS Safari workaround: open in same window
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          window.location.href = actualDownloadUrl;
        } else {
          document.body.appendChild(link);
          link.click();
          setTimeout(() => document.body.removeChild(link), 100);
        }
        
        console.log('✅ Mobile download initiated');
      } else {
        // Desktop: Fetch blob and trigger download
        console.log('💻 Desktop download - fetching blob');
        
        const pdfResponse = await fetch(actualDownloadUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Download failed: ${pdfResponse.status}`);
        }
        
        const blob = await pdfResponse.blob();
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }
        
        const filename = note.fileName || `${note.title}.pdf`;
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        console.log('✅ Desktop download completed');
      }
      
    } catch (error) {
      console.error('❌ Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
      alert(`Download Error: ${errorMessage}\n\nPlease try again or use a different browser.`);
    }
  };

  const handlePreview = () => {
    if (note) {
      // Navigate to the integrated PDF preview with AI chat
      const previewNoteId = note._id || note.id || noteId;
      router.push(`/notes/${previewNoteId}/preview`);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!note) return;

    const noteIdToVote = note._id || note.id || noteId;
    
    try {
      // Call API first - server is source of truth
      const response = await notesAPI.voteNote(String(noteIdToVote), voteType === 'up' ? 'upvote' : 'downvote');
      
      // Update local state from API response
      // The backend returns { message, note } where note contains upvotes/downvotes
      if (response.data && response.data.note) {
        setNote({
          ...note,
          upvotes: response.data.note.upvotes ?? note.upvotes,
          downvotes: response.data.note.downvotes ?? note.downvotes
        });
        setUserVote(voteType);
      }
      
      console.log('✅ Vote registered:', response.data);
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to register vote. Please try again.');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);

      // Call API to add comment
      const response = await notesAPI.addComment(noteId, commentText.trim());
      const savedComment = response.data.comment;

      // Add comment from API response (source of truth)
      const newComment: Comment = {
        id: savedComment._id || savedComment.id,
        text: savedComment.text,
        userName: savedComment.userName,
        userId: savedComment.userId,
        createdAt: savedComment.createdAt
      };

      setComments([newComment, ...comments]);
      setCommentText('');
      console.log('✅ Comment added successfully');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveNote = () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    alert('Bookmark functionality will be implemented');
  };

  const handleReport = () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    alert('Report functionality will be implemented');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: note?.title,
        text: note?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Note not found</h2>
          <p className="text-gray-600 mb-4">The note you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/browse')}>Browse Notes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 mb-6 flex items-center gap-2"
        >
          ← Back to Browse
        </button>

        {/* Note Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 break-words">{note.title}</h1>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">{note.description}</p>

              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {note.subject}
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Semester {note.semester}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {note.branch}
                </span>
                {note.module && (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    {note.module}
                  </span>
                )}
              </div>

              {/* Author and Date */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{note.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Download and Preview Buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview with AI Chat
              </Button>
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button 
                onClick={handleSaveToggle} 
                disabled={savingNote}
                variant={isSaved ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <BookmarkPlus className="w-4 h-4" />
                {savingNote ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
              </Button>
              <div className="text-sm text-gray-600 text-center">
                {note.fileSize ? `${(note.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Size unknown'}
              </div>
            </div>
          </div>

          {/* Stats and Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200">
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-600 text-sm sm:text-base">
              <div className="flex items-center gap-1 sm:gap-2">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">{note.views}</span>
                <span className="text-xs sm:text-sm">views</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">{note.downloads}</span>
                <span className="text-xs sm:text-sm">downloads</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">{comments.length}</span>
                <span className="text-xs sm:text-sm">comments</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Voting */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleVote('up')}
                  className={`p-2 rounded ${
                    userVote === 'up'
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-gray-900">
                  {note.upvotes - note.downvotes}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  className={`p-2 rounded ${
                    userVote === 'down'
                      ? 'bg-red-600 text-white'
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>

              {/* Save */}
              <Button variant="outline" size="sm" onClick={handleSaveNote}>
                <BookmarkPlus className="w-4 h-4" />
              </Button>

              {/* Share */}
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>

              {/* Report */}
              <Button variant="outline" size="sm" onClick={handleReport}>
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({comments.length})
          </h2>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button type="submit" disabled={submittingComment || !commentText.trim()}>
                  {submittingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-gray-600 mb-3">Sign in to leave a comment</p>
              <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{comment.userName}</span>
                      <span className="text-gray-500 text-sm">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {user && parseInt(user.id) === comment.userId && (
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

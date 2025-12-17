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
  id: number;
  text: string;
  userName: string;
  userId: number;
  createdAt: string;
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

      // Fetch comments (will implement backend endpoint)
      // For now, use mock data
      setComments([
        {
          id: 1,
          text: 'Great notes! Very helpful for exam preparation.',
          userName: 'Student 1',
          userId: 2,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          text: 'Clear explanations and well organized.',
          userName: 'Student 2',
          userId: 3,
          createdAt: new Date().toISOString()
        }
      ]);
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
      // Debug: Log full note object
      console.log('📥 Starting download for note:', {
        fullNote: note,
        noteId: note._id || note.id,
        note_id: note._id,
        noteId_direct: note.id,
        fileId: note.fileId,
        fileName: note.fileName,
        title: note.title,
        allKeys: Object.keys(note)
      });
      
      // Determine note ID - try multiple fields
      // Priority: _id (MongoDB) > id (in-memory) > noteId param from URL
      let downloadNoteId = note._id || note.id || noteId;
      
      console.log('🔍 Note ID candidates:', {
        from_id: note._id,
        from_id_field: note.id,
        from_url_param: noteId,
        selected: downloadNoteId
      });
      
      if (!downloadNoteId) {
        console.error('❌ No valid note ID found in:', {
          note_id: note._id,
          note_id_field: note.id,
          url_param: noteId,
          note_object: note
        });
        throw new Error('Note ID not found. Cannot identify note. Please refresh the page.');
      }
      
      // Convert to string safely
      const noteIdString = String(downloadNoteId).trim();
      
      if (!noteIdString) {
        throw new Error('Invalid note ID format.');
      }
      
      console.log('✅ Using note ID:', noteIdString);
      
      // Track download (don't let tracking failure stop download)
      try {
        await notesAPI.trackDownload(noteIdString);
        // Increment download count locally for immediate feedback
        setNote({ ...note, downloads: note.downloads + 1 });
      } catch (trackError) {
        console.warn('⚠️  Failed to track download:', trackError);
        // Continue with download anyway
      }
      
      // STRATEGY 1: Use note ID endpoint (preferred - more robust)
      // Use API base URL which already includes /api
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const downloadUrl = `${apiBase}/notes/${noteIdString}/download`;
      
      console.log('📡 Fetching from:', downloadUrl);
      console.log('📡 Request details:', {
        method: 'GET',
        url: downloadUrl,
        timestamp: new Date().toISOString()
      });
      
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/pdf, application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        contentDisposition: response.headers.get('content-disposition')
      });
      
      // Check if response is OK
      if (!response.ok) {
        // Try to parse error message
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('❌ Server error response:', errorData);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error('❌ Server error text:', errorText);
          throw new Error(`Download failed with status: ${response.status} - ${response.statusText}`);
        }
      }
      
      // Check if response is JSON (signed URL) or binary (direct download)
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Response is JSON with downloadUrl (Supabase/signed URL mode)
        const data = await response.json();
        console.log('📄 Received JSON response with download URL:', data);
        
        if (data.downloadUrl) {
          // Open signed URL in new tab
          window.open(data.downloadUrl, '_blank');
          console.log('✅ Opened download URL in new tab');
        } else {
          throw new Error('Server returned JSON but no download URL found');
        }
      } else {
        // Response is binary (PDF file - GridFS mode)
        console.log('📄 Receiving binary file data...');
        
        // Get the blob
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty (0 bytes)');
        }
        
        console.log('✅ Downloaded blob:', {
          size: blob.size,
          type: blob.type,
          sizeInMB: (blob.size / 1024 / 1024).toFixed(2) + ' MB'
        });
        
        // Extract filename from Content-Disposition header or use default
        let filename = note.fileName || `${note.title}.pdf` || 'download.pdf';
        const disposition = response.headers.get('content-disposition');
        if (disposition) {
          const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        console.log('📁 Using filename:', filename);
        
        // Create download link using Blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        
        // Add to document, click, and cleanup
        document.body.appendChild(link);
        console.log('🖱️  Triggering download...');
        link.click();
        
        // Cleanup after a short delay
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          console.log('🧹 Cleaned up download resources');
        }, 100);
        
        console.log('✅ Download initiated successfully');
      }
      
    } catch (error) {
      console.error('❌ Download error:', error);
      
      // Detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
      
      // User-friendly error message
      alert(
        `Download Error: ${errorMessage}\n\n` +
        `Troubleshooting steps:\n` +
        `1. Refresh the page and try again\n` +
        `2. Check your internet connection\n` +
        `3. Clear browser cache and cookies\n` +
        `4. Try a different browser\n` +
        `5. Contact support if the issue persists\n\n` +
        `Technical details: Check browser console for more information`
      );
    }
  };

  const handlePreview = () => {
    if (note) {
      // Open PDF in new tab for preview
      const fileId = note.fileId || note._id;
      // Use API base URL which already includes /api
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const previewUrl = `${apiBase}/notes/view-pdf/${fileId}`;
      console.log('👁️ Opening preview:', previewUrl);
      window.open(previewUrl, '_blank');
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!note) return;

    // Toggle vote
    if (userVote === voteType) {
      // Remove vote
      setUserVote(null);
      if (voteType === 'up') {
        setNote({ ...note, upvotes: note.upvotes - 1 });
      } else {
        setNote({ ...note, downvotes: note.downvotes - 1 });
      }
    } else {
      // Add or change vote
      const prevVote = userVote;
      setUserVote(voteType);
      
      if (voteType === 'up') {
        setNote({
          ...note,
          upvotes: note.upvotes + 1,
          downvotes: prevVote === 'down' ? note.downvotes - 1 : note.downvotes
        });
      } else {
        setNote({
          ...note,
          downvotes: note.downvotes + 1,
          upvotes: prevVote === 'up' ? note.upvotes - 1 : note.upvotes
        });
      }
    }

    // Call API (will implement)
    // await notesAPI.voteNote(note.id, voteType);
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

      // Add comment locally
      const newComment: Comment = {
        id: comments.length + 1,
        text: commentText,
        userName: user.name,
        userId: parseInt(user.id),
        createdAt: new Date().toISOString()
      };

      setComments([newComment, ...comments]);
      setCommentText('');

      // Call API (will implement)
      // await notesAPI.addComment(noteId, commentText);
    } catch (error) {
      console.error('Failed to submit comment:', error);
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{note.title}</h1>
              <p className="text-gray-600 mb-4">{note.description}</p>

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
                Preview PDF
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
          <div className="flex flex-wrap items-center justify-between pt-6 border-t border-gray-200">
            {/* Stats */}
            <div className="flex items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span className="font-medium">{note.views}</span>
                <span className="text-sm">views</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="font-medium">{note.downloads}</span>
                <span className="text-sm">downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">{comments.length}</span>
                <span className="text-sm">comments</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
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

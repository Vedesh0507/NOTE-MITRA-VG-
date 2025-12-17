'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, CheckCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { notesAPI } from '@/lib/api';

export default function UploadPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    semester: '',
    module: '',
    branch: '',
    tags: ''
  });

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Biology', 'English'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const branches = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'IT', 'Chemical', 'Biotechnology'];

  // Redirect if not logged in
  if (!user) {
    router.push('/auth/signin');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to upload notes...</p>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        setError('File size must be less than 100MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError('');
  };

  const generateAIDescription = async () => {
    if (!selectedFile) return;
    
    try {
      setGeneratingDesc(true);
      setError('');
      
      // For now, send a simplified request without PDF text extraction
      // The AI will generate based on title and subject
      const response = await notesAPI.generateDescription({
        pdfText: `Study material for ${formData.subject}. Topic: ${formData.title}. Module: ${formData.module || 'General'}. This is educational content for semester ${formData.semester}.`,
        title: formData.title,
        subject: formData.subject
      });
      
      // Update description
      setFormData({
        ...formData,
        description: response.data.description
      });
      
    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate description');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
    setError('');
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    if (!formData.subject) {
      errors.subject = 'Subject is required';
    }

    if (!formData.semester) {
      errors.semester = 'Semester is required';
    }

    if (!formData.branch) {
      errors.branch = 'Branch is required';
    }

    if (!selectedFile) {
      errors.file = 'Please select a PDF file to upload';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setUploadProgress(0);

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    try {
      setUploading(true);
      console.log('🚀 Starting upload process...');
      console.log('📄 File to upload:', selectedFile?.name, selectedFile?.size, 'bytes');

      // Guard: selectedFile is checked by validateForm
      if (!selectedFile) return;

      // First, upload the PDF file to GridFS
      const formDataUpload = new FormData();
      formDataUpload.append('pdf', selectedFile);
      
      console.log('📋 FormData contents:');
      for (let pair of formDataUpload.entries()) {
        console.log('  -', pair[0], ':', pair[1]);
      }
      
      console.log(' Uploading PDF to server...');
      setUploadProgress(30);
      const uploadResponse = await notesAPI.uploadPDF(formDataUpload);
      console.log('✅ Upload response:', uploadResponse.data);
      
      setUploadProgress(60);
      const fileId = uploadResponse.data.fileId;
      console.log('📝 File ID received:', fileId);

      // Create note data with fileId
      const noteData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        semester: formData.semester,
        module: formData.module,
        branch: formData.branch,
        fileId: fileId,
        fileUrl: `/api/notes/download-pdf/${fileId}`,
        fileSize: selectedFile.size,
        fileName: selectedFile.name,
        tags: formData.tags
      };

      console.log('💾 Creating note entry...', noteData);
      // Create note entry in database
      const response = await notesAPI.createNote(noteData as any);
      console.log('✅ Note created:', response.data);

      setSuccess(true);
      
      // Refresh user data to update upload count
      await refreshUser();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        subject: '',
        semester: '',
        module: '',
        branch: '',
        tags: ''
      });
      setSelectedFile(null);

      // Get the note ID (handle both MongoDB _id and in-memory id)
      const noteId = response.data.note._id || response.data.note.id;

      // Redirect to note detail page after 2 seconds
      setTimeout(() => {
        if (noteId) {
          router.push(`/notes/${noteId}`);
        } else {
          router.push('/browse');
        }
      }, 2000);

    } catch (err: any) {
      console.error('❌ Upload error:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error message:', err.message);
      if (err.response) {
        console.error('❌ Server response status:', err.response.status);
        console.error('❌ Server response data:', err.response.data);
      }
      setError(err.response?.data?.message || 'Failed to upload note. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Notes</h1>
          <p className="text-gray-600">Share your study materials with fellow students</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Upload Successful!</h3>
              <p className="text-green-700 text-sm">Your notes have been uploaded. Redirecting...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF File *
              </label>
              
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-gray-700 font-medium mb-1">
                      Click to upload PDF
                    </span>
                    <span className="text-gray-500 text-sm">
                      Maximum file size: 100MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Data Structures Complete Notes"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAIDescription}
                    disabled={generatingDesc || !formData.title || !formData.subject}
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    {generatingDesc ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                )}
              </div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Provide a brief description of the notes... or use AI to generate one!"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {selectedFile && !formData.title && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Tip: Fill in Title and Subject first for better AI descriptions
                </p>
              )}
            </div>

            {/* Subject, Semester, Branch Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                  Branch *
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Module and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
                  Module (Optional)
                </label>
                <input
                  type="text"
                  id="module"
                  name="module"
                  value={formData.module}
                  onChange={handleInputChange}
                  placeholder="e.g. Module 1, Unit 3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g. arrays, sorting, algorithms"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/browse')}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Notes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

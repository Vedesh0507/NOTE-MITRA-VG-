import axios from 'axios';

// Detect if accessing from local network
const getApiUrl = () => {
  // Only access window.location on client side
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === '192.168.1.35' || hostname === '192.168.245.192') {
      return `http://${hostname}:5000/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

// Use a getter to lazily evaluate API_URL
const getBaseURL = () => getApiUrl();

// Create axios instance with dynamic baseURL
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set baseURL dynamically on each request
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseURL();
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // If sending FormData, remove the default Content-Type header
    // to let the browser set it with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window === 'undefined') {
          throw new Error('Not in browser context');
        }

        // For now, just redirect to login if unauthorized
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/signin';
        return Promise.reject(error);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth/signin';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  signup: (data: {
    name: string;
    email: string;
    password: string;
    semester: number;
    branch: string;
    role?: string;
    section?: string;
  }) => api.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  getCurrentUser: () => api.get('/auth/me'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post('/auth/reset-password', data),

  verifyResetToken: (token: string) =>
    api.get(`/auth/verify-reset-token/${token}`),
};

// Notes API
export const notesAPI = {
  uploadPDF: (formData: FormData) => {
    console.log('📡 API Base URL:', API_URL);
    console.log('📡 Full URL:', `${API_URL}/notes/upload-pdf`);
    // Don't set Content-Type - axios will automatically set it with proper boundary for FormData
    return api.post('/notes/upload-pdf', formData);
  },

  getUploadUrl: (data: {
    fileName: string;
    fileType: string;
    fileSize: number;
  }) => api.post('/notes/upload-url', data),

  createNote: (data: {
    title: string;
    description?: string;
    subject: string;
    semester: string;
    module: string;
    branch: string;
    section?: string;
    fileUrl: string;
    fileId?: string;
    fileSize: number;
    pages?: number;
  }) => api.post('/notes', data),

  generateDescription: (data: {
    pdfText: string;
    title?: string;
    subject?: string;
  }) => api.post('/notes/generate-description', data),

  getNotes: (params?: {
    subject?: string;
    semester?: string;
    module?: string;
    branch?: string;
    uploaderRole?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get('/notes', { params }),

  getNoteById: (id: string) => api.get(`/notes/${id}`),

  getDownloadUrl: (id: string) => api.get(`/notes/${id}/download`),
  
  // Download file by note ID - returns blob or JSON with downloadUrl
  downloadNote: async (id: string) => {
    const response = await fetch(`${API_URL}/notes/${id}/download`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf, application/json',
      },
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Download failed: ${response.status}`);
      }
      throw new Error(`Download failed with status: ${response.status}`);
    }
    
    return response;
  },

  voteNote: (id: string, voteType: 'upvote' | 'downvote') =>
    api.post(`/notes/${id}/vote`, { voteType }),

  saveNote: (id: string) => api.post(`/notes/${id}/save`),
  
  unsaveNote: (id: string) => api.delete(`/notes/${id}/save`),

  getSavedNotes: () => api.get('/notes/saved/list'),

  checkIfSaved: (id: string) => api.get(`/notes/${id}/saved`),

  trackDownload: (id: string) => api.post(`/notes/${id}/download`),

  deleteNote: (id: string) => api.delete(`/notes/${id}`),

  reportNote: (id: string, reason: string) =>
    api.post(`/notes/${id}/report`, { reason }),
};

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: () => api.get('/leaderboard'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),

  getUsers: () => api.get('/admin/users'),

  suspendUser: (userId: string) => api.put(`/admin/users/${userId}/suspend`),

  unsuspendUser: (userId: string) => api.put(`/admin/users/${userId}/unsuspend`),

  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  getNotes: () => api.get('/admin/notes'),

  deleteNote: (noteId: string) => api.delete(`/admin/notes/${noteId}`),

  getReports: () => api.get('/admin/reports'),

  resolveReport: (noteId: string) => api.put(`/admin/reports/${noteId}/resolve`),
};

// AI Chat API
export const aiAPI = {
  // Send message to AI chatbot
  chat: (data: {
    message: string;
    pageText?: string;
    userId?: string;
    noteId?: string;
  }) => api.post('/ai/chat', data),

  // Check AI service status
  getStatus: () => api.get('/ai/status'),
};

// Get base API URL for direct fetch calls
export const getAPIBaseUrl = () => getApiUrl();

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, User, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [needsDetails, setNeedsDetails] = useState(false);
  const [googleData, setGoogleData] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    branch: '',
    rollNo: '',
    section: '',
  });

  useEffect(() => {
    const token = searchParams.get('token');
    const newUser = searchParams.get('newUser');
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    if (!token) {
      setError('Authentication failed. No token received.');
      setLoading(false);
      return;
    }

    if (newUser === 'true') {
      // New user - need to collect additional details
      setNeedsDetails(true);
      setGoogleData({ token, name, email });
      setLoading(false);
    } else {
      // Existing user - log them in directly
      localStorage.setItem('token', token);
      login(token);
      router.push('/browse');
    }
  }, [searchParams, login, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.branch || !formData.rollNo) {
      setError('Branch and Roll No are required');
      return;
    }

    setSubmitting(true);

    try {
      // Update user profile with additional details
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      await axios.post(
        `${apiUrl}/auth/update-google-user`,
        {
          branch: formData.branch,
          rollNo: formData.rollNo,
          section: formData.section || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${googleData.token}`,
          },
        }
      );

      // Save token and redirect
      localStorage.setItem('token', googleData.token);
      login(googleData.token);
      router.push('/browse');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Completing Google Sign In...</p>
        </div>
      </div>
    );
  }

  if (error && !needsDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-600 mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/auth/signin')} className="w-full">
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (needsDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Welcome, {googleData?.name}! Please provide a few more details.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                Branch <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select Branch</option>
                  <option value="CSE">CSE</option>
                  <option value="AIML">AIML</option>
                  <option value="AIDS">AIDS</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="IT">IT</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="MECHANICAL">MECHANICAL</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700 mb-1">
                Roll No <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="rollNo"
                  name="rollNo"
                  type="text"
                  value={formData.rollNo}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="24H71A6132"
                />
              </div>
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                Section (Optional)
              </label>
              <input
                id="section"
                name="section"
                type="text"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="A"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

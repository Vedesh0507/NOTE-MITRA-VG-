'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, CheckCircle, Copy, Check } from 'lucide-react';
import { authAPI } from '@/lib/api';

const ALLOWED_EMAIL_DOMAIN = '@mictech.edu.in';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
  };

  const copyToClipboard = async () => {
    if (devResetUrl) {
      await navigator.clipboard.writeText(devResetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email domain
    if (!validateEmail(email)) {
      setError(`Please enter a valid college email ending with ${ALLOWED_EMAIL_DOMAIN}`);
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email.toLowerCase());
      
      // Check if dev reset URL is provided (when email not configured)
      if (response.data._dev_resetUrl) {
        setDevResetUrl(response.data._dev_resetUrl);
      }
      
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retryAfter || 900;
        const minutes = Math.ceil(retryAfter / 60);
        setError(`Too many password reset requests. Please try again in ${minutes} minutes.`);
      } else if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        setError(validationErrors.map((e: any) => e.msg).join('. '));
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        // For security, still show success even if there's an error
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            If an account exists for <span className="font-medium">{email}</span>, 
            we've sent a password reset link. The link will expire in 15 minutes.
          </p>

          {/* Development mode: Show reset URL when email not configured */}
          {devResetUrl && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⚠️ Development Mode (Email not configured)
              </p>
              <p className="text-xs text-yellow-700 mb-2">
                Use this link to reset your password:
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={devResetUrl} 
                  readOnly 
                  className="flex-1 text-xs p-2 bg-white border border-yellow-300 rounded truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-yellow-700" />}
                </button>
              </div>
              <Link 
                href={devResetUrl} 
                className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Click here to reset password →
              </Link>
            </div>
          )}

          {!devResetUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>Didn't receive the email?</strong>
                <br />
                Check your spam folder or make sure you entered the correct email address.
              </p>
            </div>
          )}

          <Link href="/auth/signin">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            Enter your college email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              College Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`your.name${ALLOWED_EMAIL_DOMAIN}`}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Must end with {ALLOWED_EMAIL_DOMAIN}
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            href="/auth/signin" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

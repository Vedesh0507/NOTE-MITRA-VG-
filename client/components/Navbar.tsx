'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, User, LogOut, Upload, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" aria-label="NoteMitra Home">
            <BookOpen className="h-8 w-8 text-blue-600" aria-hidden="true" />
            <span className="text-xl font-bold text-gray-900">NoteMitra</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6" role="menubar">
            {user && (
              <>
                <Link href="/browse" className="text-gray-700 hover:text-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" role="menuitem">
                  Browse Notes
                </Link>
                <Link href="/upload" className="text-gray-700 hover:text-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" role="menuitem">
                  Upload
                </Link>
                <Link href="/leaderboard" className="text-gray-700 hover:text-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" role="menuitem">
                  🏆 Leaderboard
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" role="menuitem">
                  About
                </Link>
                {(user as any).isAdmin && (
                  <Link href="/admin" className="text-yellow-600 hover:text-yellow-700 transition font-medium flex items-center focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded px-2 py-1" role="menuitem" aria-label="Admin Panel">
                    <Shield className="w-4 h-4 mr-1" aria-hidden="true" />
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    {user.name}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden bg-white border-t border-gray-200" role="menu">
          <div className="px-4 py-4 space-y-3">
            {user && (
              <>
                <Link
                  href="/browse"
                  className="block text-gray-700 hover:text-blue-600 transition py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={closeMobileMenu}
                  role="menuitem"
                >
                  Browse Notes
                </Link>
                <Link
                  href="/upload"
                  className="block text-gray-700 hover:text-blue-600 transition py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={closeMobileMenu}
                  role="menuitem"
                >
                  Upload
                </Link>
                <Link
                  href="/leaderboard"
                  className="block text-gray-700 hover:text-blue-600 transition py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={closeMobileMenu}
                  role="menuitem"
                >
                  🏆 Leaderboard
                </Link>
                <Link
                  href="/about"
                  className="block text-gray-700 hover:text-blue-600 transition py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={closeMobileMenu}
                  role="menuitem"
                >
                  About
                </Link>
                {(user as any).isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center text-yellow-600 hover:text-yellow-700 transition font-medium py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    onClick={closeMobileMenu}
                    role="menuitem"
                    aria-label="Admin Panel"
                  >
                    <Shield className="w-4 h-4 mr-2" aria-hidden="true" />
                    Admin Panel
                  </Link>
                )}
              </>
            )}
            <div className="pt-3 border-t border-gray-200 space-y-2">
              {user ? (
                <>
                  <Link href="/profile" onClick={closeMobileMenu}>
                    <Button variant="ghost" size="sm" className="w-full min-h-[44px] touch-target" aria-label={`Profile: ${user.name}`}>
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      {user.name}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full min-h-[44px] touch-target"
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    aria-label="Logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" onClick={closeMobileMenu}>
                    <Button variant="ghost" size="sm" className="w-full min-h-[44px] touch-target">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={closeMobileMenu}>
                    <Button size="sm" className="w-full min-h-[44px] touch-target">
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

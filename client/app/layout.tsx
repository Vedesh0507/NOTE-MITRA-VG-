import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NoteMitra - Student Notes Sharing Platform',
  description: 'Share and discover academic notes with students and teachers',
  keywords: 'notes, education, study, college, university, sharing',
  authors: [{ name: 'NoteMitra Team' }],
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <Navbar />
          <main id="main-content" role="main">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

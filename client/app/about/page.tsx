'use client';

import { BookOpen, Target, Users, Heart, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            About <span className="text-blue-600">NoteMitra</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Your trusted platform for sharing and discovering high-quality academic notes.
            Built by students, for students.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start space-x-6 mb-12">
            <div className="flex-shrink-0">
              <Target className="h-12 w-12 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                At NoteMitra, we believe that knowledge should be accessible to everyone. Our mission is to create 
                a collaborative learning environment where students can share their study materials, help each other 
                succeed, and build a strong academic community.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We aim to bridge the gap between students who have quality notes and those who need them, making 
                education more equitable and collaborative.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-6 mb-12">
            <div className="flex-shrink-0">
              <Users className="h-12 w-12 text-purple-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Community</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                NoteMitra is built on the principle of community collaboration. Every note uploaded, every upvote given, 
                and every comment shared contributes to a richer learning experience for everyone.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our reputation system ensures that quality content rises to the top, and contributors are recognized 
                for their efforts in helping their peers.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <Heart className="h-12 w-12 text-red-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Built With Care</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                NoteMitra was created by students who understand the challenges of finding quality study materials. 
                We've experienced the frustration of scattered resources and wanted to create a centralized platform 
                that makes learning easier.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Every feature is designed with students in mind - from easy uploads to smart search, from community 
                voting to reputation building. We're constantly improving to serve you better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            What Makes Us Different
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Quality First</h3>
              <p className="text-gray-600">
                Our community-driven voting system ensures that the best notes get the recognition they deserve. 
                Quality content naturally rises to the top.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Easy to Use</h3>
              <p className="text-gray-600">
                Upload notes in seconds, find what you need with powerful filters, and download instantly. 
                We keep it simple so you can focus on learning.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Recognition System</h3>
              <p className="text-gray-600">
                Build your academic reputation by contributing quality notes. Your efforts are recognized and 
                appreciated by the community.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Always Free</h3>
              <p className="text-gray-600">
                Education should be accessible to all. NoteMitra is and will always be free for students. 
                No hidden fees, no premium tiers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600">
              Have questions or suggestions? We'd love to hear from you!
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Person 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mx-auto mb-6">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">M. Pavan Vedesh</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <a href="mailto:pavanmanepalli521@gmail.com" className="text-gray-700 hover:text-blue-600 transition break-all">
                    pavanmanepalli521@gmail.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <a href="tel:+919391781748" className="text-gray-700 hover:text-blue-600 transition">
                    +91 93917 81748
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Person 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-200">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full mx-auto mb-6">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">D. Mohan Gupta</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                  <a href="mailto:mohangupta16@gmail.com" className="text-gray-700 hover:text-purple-600 transition break-all">
                    mohangupta16@gmail.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <a href="tel:+918790965198" className="text-gray-700 hover:text-purple-600 transition">
                    +91 87909 65198
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Join Our Community Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start sharing and discovering quality academic notes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8 py-6">
                Create Account
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600">
                Browse Notes
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

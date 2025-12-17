'use client';

import { useEffect, useState } from 'react';
import { leaderboardAPI } from '@/lib/api';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardUser {
  name: string;
  totalDownloads: number;
  notesUploaded: number;
  avgDownloads: number;
  joinDate: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await leaderboardAPI.getLeaderboard();
      setLeaderboard(response.data.leaderboard);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 2:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <div className="w-8 h-8 flex items-center justify-center text-gray-500 font-bold text-lg">#{index + 1}</div>;
    }
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Top Contributors
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Students who share the most valuable notes. Upload quality content to climb the leaderboard!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No users on the leaderboard yet.</p>
            <p className="text-gray-500 mt-2">Be the first to upload notes and gain popularity!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg p-6 transition-all hover:scale-[1.02] hover:shadow-xl ${
                  index === 0 ? 'border-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50' :
                  index === 1 ? 'border-4 border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50' :
                  index === 2 ? 'border-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50' :
                  'border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-6">
                  {/* Rank Icon */}
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-800 truncate">
                        {getRankEmoji(index)} {user.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Joined {new Date(user.joinDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {user.totalDownloads}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Total Downloads
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600">
                        {user.notesUploaded}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Notes Uploaded
                      </div>
                    </div>

                    <div className="bg-pink-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-pink-600">
                        {user.avgDownloads.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Avg per Note
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3">📊 How Rankings Work</h3>
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>Total Downloads:</strong> More downloads = higher rank</li>
            <li>✅ <strong>Average Downloads per Note:</strong> Quality matters! (ties broken by avg)</li>
            <li>✅ <strong>Upload Date:</strong> Earlier uploads win ties</li>
            <li>✅ Upload clear, useful notes to gain popularity and climb the leaderboard!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

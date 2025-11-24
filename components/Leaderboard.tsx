import React, { useEffect, useState } from 'react';
import { getLeaderboard, LeaderboardEntry } from '../services/firestoreService';
import { Trophy, Medal, Award, Loader2, TrendingUp } from 'lucide-react';
import { Button } from './Button';

interface LeaderboardProps {
  currentUserId?: string;
  isGuest?: boolean;
  onClose: () => void;
  onLogin?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId, isGuest, onClose, onLogin }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGuest) {
      loadLeaderboard();
    } else {
      setLoading(false);
    }
  }, [isGuest]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getLeaderboard(10);
      setEntries(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</div>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
      default:
        return 'bg-white border-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Leaderboard</h1>
            <p className="text-sm text-gray-500">Top Scholars</p>
          </div>
        </div>
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      </div>

      {/* Content */}
      {isGuest ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to Compete</h2>
          <p className="text-gray-500 mb-8 max-w-xs">
            Join the leaderboard and compete with other scholars by signing in with Google.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={onLogin} fullWidth>
              Sign In
            </Button>
            <Button onClick={onClose} variant="secondary" fullWidth>
              Back to Home
            </Button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500">Loading rankings...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadLeaderboard}>Retry</Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500">No rankings yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-auto">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.uid === currentUserId;

            return (
              <div
                key={entry.uid}
                className={`
                  flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
                  ${getRankBgColor(rank)}
                  ${isCurrentUser ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                `}
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {entry.photoURL ? (
                    <img
                      src={entry.photoURL}
                      alt={entry.name}
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate">
                      {entry.name}
                    </h3>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{entry.grade}</p>
                </div>

                {/* Points */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-black text-gray-900">
                    {entry.totalPoints}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
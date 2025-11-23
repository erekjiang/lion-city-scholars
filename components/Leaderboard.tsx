import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  // Mock data
  const players: LeaderboardEntry[] = [
    { id: '1', name: 'Wei Jie', score: 4520, rank: 1, avatar: 'https://picsum.photos/100/100?random=1' },
    { id: '2', name: 'Sarah Tan', score: 4350, rank: 2, avatar: 'https://picsum.photos/100/100?random=2' },
    { id: '3', name: 'Ahmad', score: 4100, rank: 3, avatar: 'https://picsum.photos/100/100?random=3' },
    { id: '4', name: 'You (Alex)', score: 3800, rank: 4, avatar: 'https://picsum.photos/100/100?random=4' },
    { id: '5', name: 'Muthu', score: 3650, rank: 5, avatar: 'https://picsum.photos/100/100?random=5' },
    { id: '6', name: 'Chloe', score: 3200, rank: 6, avatar: 'https://picsum.photos/100/100?random=6' },
  ];

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
          <p className="text-gray-500 text-sm">Top Scholars this Week</p>
        </div>
        <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600">
          <Trophy size={24} />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`flex items-center p-4 border-b border-gray-50 last:border-0 ${player.id === '4' ? 'bg-indigo-50' : ''}`}
          >
            <div className="w-8 font-bold text-gray-400 text-center mr-4">
              {player.rank <= 3 ? (
                 <Medal className={player.rank === 1 ? 'text-yellow-500' : player.rank === 2 ? 'text-gray-400' : 'text-orange-500'} />
              ) : (
                player.rank
              )}
            </div>
            <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full mr-4 border border-gray-200" />
            <div className="flex-1">
              <h3 className={`font-bold ${player.id === '4' ? 'text-indigo-700' : 'text-gray-800'}`}>
                {player.name}
              </h3>
              <p className="text-xs text-gray-400">Primary 4</p>
            </div>
            <div className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm">
              {player.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { CalendarTracker } from './CalendarTracker';
import { Share2, UserPlus, LogOut, Award, Zap, Settings as SettingsIcon } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout, onOpenSettings }) => {
  const [inviteLink, setInviteLink] = useState('');

  const handleInvite = () => {
    const link = "https://scholars.sg/invite/u/" + user.id;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="p-6 pb-24 max-w-lg mx-auto">
      <div className="flex justify-end mb-2">
         <button onClick={onOpenSettings} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            <SettingsIcon size={24} />
         </button>
      </div>

      <div className="flex flex-col items-center mb-8 slide-in">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 p-1 mb-4 shadow-xl">
           <img 
             src={user.avatar} 
             alt="Profile" 
             className="w-full h-full rounded-full border-4 border-white object-cover"
           />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
        <div className="flex items-center gap-2 mt-2 bg-indigo-50 px-3 py-1 rounded-full text-indigo-700 text-sm font-semibold">
          <Award size={16} />
          Level {user.level} • {user.grade}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 slide-in">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="flex justify-center text-yellow-500 mb-2">
            <Award size={28} fill="currentColor" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{user.totalScore}</div>
          <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Points</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="flex justify-center text-orange-500 mb-2">
            <Zap size={28} fill="currentColor" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{user.streak}</div>
          <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Day Streak</div>
        </div>
      </div>

      {/* Calendar Tracker */}
      <div className="slide-in" style={{ animationDelay: '0.1s' }}>
        <CalendarTracker completedDates={user.completedDates} />
      </div>

      {/* Invite Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 slide-in" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus className="text-indigo-500" size={20} />
          Invite Friends
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Challenge your classmates and see who can get the highest score in Math!
        </p>
        <Button variant="outline" fullWidth onClick={handleInvite} className="mb-2">
          <Share2 size={18} />
          {inviteLink ? 'Link Copied!' : 'Copy Invite Link'}
        </Button>
      </div>

      <Button variant="danger" fullWidth onClick={onLogout} className="opacity-80 hover:opacity-100">
        <LogOut size={18} />
        Sign Out
      </Button>
    </div>
  );
};

import React from 'react';
import { Home, Trophy, User, BookOpen } from 'lucide-react';
import { ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: ViewState.HOME, icon: Home, label: 'Home' },
    { view: ViewState.LEADERBOARD, icon: Trophy, label: 'Rankings' },
    { view: ViewState.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => setView(item.view)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === item.view ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <item.icon size={24} strokeWidth={currentView === item.view ? 2.5 : 2} />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};
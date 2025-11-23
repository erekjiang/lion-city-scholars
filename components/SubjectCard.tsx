import React from 'react';
import { Subject, SUBJECT_THEMES } from '../types';
import { ArrowRight, Star } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
  dailyComplete?: boolean;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, dailyComplete = false }) => {
  const theme = SUBJECT_THEMES[subject];

  return (
    <button 
      onClick={onClick}
      disabled={dailyComplete}
      className={`w-full p-6 rounded-3xl text-left transition-all transform hover:scale-[1.02] shadow-lg relative overflow-hidden group ${
        dailyComplete ? 'bg-gray-100 cursor-default opacity-80' : 'bg-white hover:shadow-xl'
      }`}
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} rounded-bl-full opacity-50 -mr-10 -mt-10 transition-transform group-hover:scale-110`}></div>

      <div className="relative z-10 flex justify-between items-center">
        <div>
          <div className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center text-2xl mb-4 shadow-sm`}>
            {theme.icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800">{subject}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {dailyComplete ? 'Daily Quest Complete!' : '10 Questions • +100 XP'}
          </p>
        </div>
        
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${dailyComplete ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
           {dailyComplete ? <Star fill="currentColor" size={20} /> : <ArrowRight size={20} />}
        </div>
      </div>

      {dailyComplete && (
        <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
            Done for today! <Star size={14} fill="currentColor"/>
          </div>
        </div>
      )}
    </button>
  );
};
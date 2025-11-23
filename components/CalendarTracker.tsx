import React from 'react';
import { Star } from 'lucide-react';

interface CalendarTrackerProps {
  completedDates: string[];
}

export const CalendarTracker: React.FC<CalendarTrackerProps> = ({ completedDates }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const renderDays = () => {
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isCompleted = completedDates.includes(dateStr);
      const isToday = d === today.getDate();

      days.push(
        <div key={d} className="flex flex-col items-center justify-center relative">
          <div 
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold
              ${isCompleted ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}
              ${isToday && !isCompleted ? 'border-2 border-indigo-400 text-indigo-600' : ''}
            `}
          >
            {isCompleted ? <Star size={12} fill="currentColor" /> : d}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 w-full mb-6">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-bold text-gray-800 text-lg">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="text-xs text-gray-400 font-medium">
          {completedDates.length} Days Active
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-xs font-bold text-gray-300">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-3 gap-x-1">
        {renderDays()}
      </div>
    </div>
  );
};
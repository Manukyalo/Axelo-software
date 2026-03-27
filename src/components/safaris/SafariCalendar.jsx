import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

export const SafariCalendar = ({ safaris, onSafariClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-playfair font-bold text-safari-primary dark:text-dark-text capitalize">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, index) => (
          <div key={index} className="text-center text-[10px] uppercase tracking-widest font-bold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const daySafaris = safaris.filter(s => isSameDay(parseISO(s.date), cloneDay));
        
        days.push(
          <div
            key={day.toString()}
            className={`
              min-h-[100px] p-2 border border-gray-50 dark:border-dark-border transition-all relative
              ${!isSameMonth(day, monthStart) ? 'bg-gray-50/50 dark:bg-dark-surface/50 text-gray-300' : 'bg-white dark:bg-dark-card'}
              ${isSameDay(day, new Date()) ? 'ring-2 ring-inset ring-safari-gold/20' : ''}
            `}
          >
            <span className={`text-xs font-bold ${isSameDay(day, new Date()) ? 'text-safari-gold' : 'text-gray-500'}`}>
              {formattedDate}
            </span>
            
            <div className="mt-1 space-y-1">
              {daySafaris.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => onSafariClick(s)}
                  className={`
                    w-full text-left px-1.5 py-1 rounded text-[10px] font-bold truncate transition-colors
                    ${s.type === 'Safari' ? 'bg-safari-gold/10 text-safari-gold hover:bg-safari-gold/20' : 'bg-safari-success/10 text-safari-success hover:bg-safari-success/20'}
                  `}
                >
                  {s.clientName.split(' ')[0]} - {s.packageName || s.type}
                </button>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border border-gray-50 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">{rows}</div>;
  };

  return (
    <div className="bg-white dark:bg-dark-card p-4 rounded-card">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

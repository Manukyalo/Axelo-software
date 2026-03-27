import React from 'react';
import { SafariCard } from './SafariCard';

export const SafariTimeline = ({ safaris, drivers, vehicles, onSafariClick }) => {
  if (safaris.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-dark-card rounded-card border border-dashed border-gray-200 dark:border-dark-border">
        <p className="text-lg font-playfair font-bold">No upcoming expeditions found.</p>
        <p className="text-sm">Adjust your filters to see more results.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-12 pr-4 py-8">
      {/* Vertical Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-safari-gold/50 via-safari-gold to-safari-gold/20 rounded-full" />
      
      <div className="space-y-12">
        {safaris.map((safari, index) => (
          <div key={safari.id} className="relative">
            {/* Timeline Node */}
            <div className="absolute -left-[30px] top-6 w-5 h-5 bg-white dark:bg-dark-surface border-4 border-safari-gold rounded-full shadow-lg z-10" />
            
            {/* Safari Card */}
            <SafariCard 
              safari={safari} 
              drivers={drivers} 
              vehicles={vehicles} 
              onClick={() => onSafariClick(safari)} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

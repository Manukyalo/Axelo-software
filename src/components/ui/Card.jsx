import React from 'react';

export const Card = ({ children, className = '', hover = true }) => {
  return (
    <div className={`
      bg-white dark:bg-dark-card 
      rounded-card shadow-premium-light dark:shadow-premium-dark
      border border-gray-100 dark:border-dark-border
      transition-all duration-300
      ${hover ? 'hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-safari-gold/5' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-100 dark:border-dark-border ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

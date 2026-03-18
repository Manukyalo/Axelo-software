import React from 'react';

export const Badge = ({ 
  children, 
  variant = 'default', 
  className = '' 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-dark-card dark:text-gray-300',
    success: 'bg-safari-success/10 text-safari-success',
    warning: 'bg-safari-warning/10 text-safari-warning',
    danger: 'bg-red-500/10 text-red-500',
    info: 'bg-blue-500/10 text-blue-500',
    gold: 'bg-safari-gold/10 text-safari-gold',
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-dm-sans
      ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  );
};

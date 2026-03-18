import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-dm-sans font-medium transition-all duration-300 rounded-button disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variants = {
    primary: 'bg-safari-gold text-white hover:bg-safari-gold/90 shadow-sm',
    secondary: 'bg-safari-primary text-white hover:bg-safari-primary/90 dark:bg-safari-gold dark:text-safari-primary',
    outline: 'border-2 border-safari-gold text-safari-gold hover:bg-safari-gold hover:text-white',
    ghost: 'text-safari-primary hover:bg-safari-gold/10 dark:text-dark-text dark:hover:bg-safari-gold/10',
    danger: 'bg-safari-warning text-white hover:bg-safari-warning/90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg font-semibold',
    icon: 'p-2',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

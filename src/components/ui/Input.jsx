import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({ 
  label, 
  error, 
  type = 'text', 
  className = '', 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-safari-primary dark:text-dark-text mb-1.5 font-dm-sans">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`
            w-full px-4 py-2.5 bg-white dark:bg-dark-surface 
            border-2 border-gray-100 dark:border-dark-border
            rounded-input outline-none transition-all duration-300
            focus:border-safari-gold focus:ring-4 focus:ring-safari-gold/5
            text-safari-primary dark:text-dark-text font-dm-sans
            ${error ? 'border-safari-warning' : ''}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-safari-gold transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-safari-warning font-dm-sans">{error}</p>}
    </div>
  );
};

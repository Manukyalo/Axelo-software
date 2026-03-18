import React from 'react';

export const PageWrapper = ({ children, title, subtitle, actions }) => {
  return (
    <div className="px-8 py-8 h-full overflow-y-auto animate-fade-in no-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-safari-primary dark:text-dark-text">
            {title}
          </h1>
          {subtitle && (
            <p className="text-safari-earthy dark:text-safari-gold/60 mt-1 font-dm-sans">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

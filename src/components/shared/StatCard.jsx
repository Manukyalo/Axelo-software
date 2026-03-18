import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, change, icon: Icon, unit = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]+/g, ''));

  useEffect(() => {
    let start = 0;
    const end = numericValue;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * end);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [numericValue]);

  const isPositive = change > 0;

  return (
    <Card className="border-t-4 border-t-safari-gold overflow-hidden group">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-safari-gold/10 text-safari-gold rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Icon size={24} />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-bold font-dm-sans px-2 py-1 rounded-full ${isPositive ? 'text-safari-success bg-safari-success/10' : 'text-safari-warning bg-safari-warning/10'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-dm-sans font-medium uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-jetbrains font-bold text-safari-primary dark:text-dark-text flex items-baseline gap-1">
          <span className="text-lg opacity-50">{unit}</span>
          {typeof value === 'number' ? displayValue.toLocaleString() : value.replace(/[0-9,]+/, displayValue.toLocaleString())}
        </h3>
      </CardContent>
    </Card>
  );
};

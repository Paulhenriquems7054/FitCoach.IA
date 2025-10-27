import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800/50 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 overflow-hidden ring-1 ring-slate-900/5 dark:ring-slate-200/10 transition-all duration-300 hover:shadow-xl hover:dark:shadow-black/30 hover:-translate-y-1 ${className}`}>
      {children}
    </div>
  );
};
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
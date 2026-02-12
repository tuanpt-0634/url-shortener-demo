import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-teal-100 p-8 transition-all duration-200 hover:shadow-xl ${className}`}>
      {children}
    </div>
  );
};

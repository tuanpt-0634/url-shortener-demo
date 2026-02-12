import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type, children, className = '' }) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-300 text-green-900',
    error: 'bg-red-50 border-red-300 text-red-900',
    info: 'bg-teal-50 border-teal-300 text-teal-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${typeStyles[type]} ${className}`} role="alert">
      {children}
    </div>
  );
};

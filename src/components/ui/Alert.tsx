import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type, children, className = '' }) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div className={`border rounded-md p-4 ${typeStyles[type]} ${className}`} role="alert">
      {children}
    </div>
  );
};

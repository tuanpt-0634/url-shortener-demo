import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  const inputId = props.id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-teal-900 mb-2" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-5 py-3.5 border rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
          error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 hover:border-teal-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
};

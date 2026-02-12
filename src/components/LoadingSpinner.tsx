import React from 'react';

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Color variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'white';

  /**
   * Optional label for accessibility
   */
  label?: string;

  /**
   * Whether to center the spinner
   * @default false
   */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

const variantClasses = {
  primary: 'border-primary border-t-transparent',
  secondary: 'border-secondary border-t-transparent',
  white: 'border-white border-t-transparent',
};

/**
 * LoadingSpinner component
 *
 * Accessible loading indicator with customizable size and color
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" variant="primary" label="Loading data..." />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  label = 'Loading...',
  centered = false,
}: LoadingSpinnerProps) {
  const spinnerElement = (
    <div
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        inline-block
        animate-spin
        rounded-full
      `}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
}

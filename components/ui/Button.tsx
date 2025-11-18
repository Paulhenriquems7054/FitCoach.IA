import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none';

  const variantClasses = {
    primary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
    secondary: 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-primary-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading}
      aria-disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {variant === 'primary' ? 'Processando...' : ''}
        </>
      ) : (
        children
      )}
    </button>
  );
};
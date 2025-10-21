import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'text-white',
    secondary: '',
    outline: 'border text-gray-700 dark:border-gray-600 dark:text-gray-300',
    ghost: 'text-gray-700 dark:text-gray-300',
    danger: 'text-white',
    accent: 'text-white',
  };

  const getButtonStyle = (): React.CSSProperties => {
    if (variant === 'primary') return { backgroundColor: 'var(--color-primary)' };
    if (variant === 'secondary')
      return {
        backgroundColor: 'var(--color-secondary)',
        borderColor: 'var(--color-secondary-border)',
        borderWidth: '1px',
        borderStyle: 'solid',
        color: 'var(--color-primary)',
      };
    if (variant === 'accent') return { backgroundColor: 'var(--color-accent-button)', borderRadius: '9999px' };
    if (variant === 'danger') return { backgroundColor: '#dc2626', color: '#fff' }; // red bg, white text
    return {};
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{ ...getButtonStyle(), outline: 'none', boxShadow: 'none' }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;



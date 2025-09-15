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
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'text-white',
    secondary: '',
    outline: 'border text-gray-700 dark:border-gray-600 dark:text-gray-300',
    ghost: 'text-gray-700 dark:text-gray-300',
    danger: 'hover:opacity-90 text-white dark:hover:opacity-90 dark:text-white',
    accent: 'hover:opacity-90 text-white dark:hover:opacity-90 dark:text-white',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizeClasses[size]} ${className}`;

  // Get theme colors for all variants
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
        } as React.CSSProperties;
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary)',
          borderColor: 'var(--color-secondary-border)',
          borderWidth: '1px',
          borderStyle: 'solid',
          color: 'var(--color-primary)',
        } as React.CSSProperties;
      case 'accent':
        return {
          backgroundColor: 'var(--color-accent-button)',
          borderRadius: '9999px', // Make it oval-shaped
        } as React.CSSProperties;
      default:
        return {};
    }
  };

  return (
    <button 
      className={classes} 
      style={{
        ...getButtonStyle(),
        outline: 'none',
        boxShadow: 'none',
      }}
      onFocus={(e) => {
        e.target.style.outline = 'none';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;



import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  const checkboxClasses = `h-4 w-4 text-[var(--color-primary)] border-gray-300 dark:border-gray-600 rounded ${className}`;

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <input
          type="checkbox"
          className={checkboxClasses}
          {...props}
        />
        {label && (
          <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Checkbox;






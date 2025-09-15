import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  className = '',
  ...props
}) => {
  const selectClasses = `w-full px-3 py-2 border rounded-md focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
    error 
      ? 'border-red-500 focus:border-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-2 focus:border-[var(--color-primary)] dark:focus:border-[var(--color-primary)]'
  } ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select className={selectClasses} style={{ color: '#000000' }} {...props}>
        {placeholder && (
          <option value="" disabled style={{ color: '#000000' }}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ color: '#000000' }}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Select;



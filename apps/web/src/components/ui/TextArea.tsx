import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  const textAreaClasses = `w-full px-3 py-2 border rounded-md focus:outline-none transition-colors resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
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
      <textarea className={textAreaClasses} {...props} />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export default TextArea;


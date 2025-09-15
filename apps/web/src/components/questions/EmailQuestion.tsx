import React from 'react';
import type { QuestionProps } from './QuestionRenderer';

const EmailQuestion: React.FC<QuestionProps> = ({
  question,
  value = '',
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange?.(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium" style={{ color: themeColors?.textColor || '#111827' }}>
          {question.title}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {question.description && (
          <p className="text-sm mt-1" style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}>
            {question.description}
          </p>
        )}
      </div>

      <input
        type="email"
        value={value as string}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Enter your email address"
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{ 
          backgroundColor: 'transparent',
          color: themeColors?.textColor || '#111827'
        }}
        aria-describedby={error ? `error-${question.id}` : undefined}
      />

      {error && (
        <p id={`error-${question.id}`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default EmailQuestion;


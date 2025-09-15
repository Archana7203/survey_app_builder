import React, { useMemo } from 'react';
import type { QuestionProps } from './QuestionRenderer';

const TextLongQuestion: React.FC<QuestionProps> = ({
  question,
  value = '',
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const maxLength = useMemo(() => {
    return (question.settings as { maxLength?: number })?.maxLength || 1000;
  }, [question.settings]);
  
  const currentLength = (value as string).length;
  const remainingChars = maxLength - currentLength;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

      <div className="space-y-2">
        <textarea
          value={value as string}
          onChange={handleChange}
          disabled={disabled}
          rows={6}
          maxLength={maxLength}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ 
            backgroundColor: 'transparent',
            color: themeColors?.textColor || '#111827'
          }}
          placeholder="Type your answer here..."
          aria-describedby={error ? `error-${question.id}` : `char-count-${question.id}`}
        />

        <div className="flex justify-between items-center text-xs" style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}>
          <span id={`char-count-${question.id}`}>
            {currentLength} / {maxLength} characters
          </span>
          {remainingChars <= 100 && (
            <span className={remainingChars <= 20 ? 'text-red-500' : 'text-yellow-500'}>
              {remainingChars} characters remaining
            </span>
          )}
        </div>
      </div>

      {error && (
        <p id={`error-${question.id}`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextLongQuestion;


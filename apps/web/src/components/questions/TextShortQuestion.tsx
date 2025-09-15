import React, { useMemo } from 'react';
import Input from '../ui/Input';
import type { QuestionProps } from './QuestionRenderer';

const TextShortQuestion: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const settings = useMemo(() => {
    return question.settings as { 
      placeholder?: string; 
      maxLength?: number;
    } || {};
  }, [question.settings]);

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

      <Input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={settings.placeholder || 'Enter your answer...'}
        maxLength={settings.maxLength}
        disabled={disabled}
        error={error}
        aria-labelledby={`question-${question.id}`}
      />

      {settings.maxLength && (
        <p className="text-xs" style={{ color: themeColors?.textColor ? `${themeColors.textColor}60` : '#6b7280' }}>
          {(typeof value === 'string' ? value : '').length}/{settings.maxLength} characters
        </p>
      )}
    </div>
  );
};

export default TextShortQuestion;


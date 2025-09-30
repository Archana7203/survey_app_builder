import React, { useMemo } from 'react';
import type { QuestionProps } from './QuestionRenderer';

const SingleChoiceQuestion: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const allowOther = useMemo(() => {
    return (question.settings as { allowOther?: boolean })?.allowOther || false;
  }, [question.settings]);

  const handleChange = (optionId: string) => {
    if (!disabled) {
      onChange?.(optionId);
    }
  };

  const getBackgroundColor = (isSelected: boolean) => {
    if (!isSelected) return 'transparent';
    if (themeColors?.primaryColor) return `${themeColors.primaryColor}20`;
    return '#eff6ff';
  };

  const getBorderColor = (isSelected: boolean) => 
    isSelected ? (themeColors?.primaryColor || '#3b82f6') : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium" style={{ color: themeColors?.textColor || '#111827' }}>
          {question.title}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {question.description && (
          <p
            className="text-sm mt-1"
            style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}
          >
            {question.description}
          </p>
        )}
      </div>

      <fieldset className="space-y-3 p-0 m-0" aria-labelledby={`question-${question.id}`}>
        <legend className="sr-only">{question.title}</legend>

        {question.options?.map((option) => {
          const isSelected = value === option.id;

          return (
            <label
              key={option.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: getBackgroundColor(isSelected),
                borderColor: getBorderColor(isSelected),
              }}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={isSelected}
                onChange={() => handleChange(option.id)}
                disabled={disabled}
                className="w-4 h-4 text-[var(--color-primary)] border-gray-300 dark:border-gray-600 rounded"
                aria-describedby={error ? `error-${question.id}` : undefined}
              />
              <span style={{ color: themeColors?.textColor || '#111827' }}>{option.text}</span>
            </label>
          );
        })}

        {allowOther && (
          <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer">
            <input
              type="radio"
              name={`question-${question.id}`}
              value="other"
              checked={value === 'other'}
              onChange={() => handleChange('other')}
              disabled={disabled}
              className="w-4 h-4 text-[var(--color-primary)] border-gray-300 dark:border-gray-600 rounded"
            />
            <span style={{ color: themeColors?.textColor || '#111827' }}>Other</span>
          </label>
        )}
      </fieldset>

      {error && (
        <p id={`error-${question.id}`} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default SingleChoiceQuestion;



import React, { useMemo } from 'react';
import type { QuestionProps } from './QuestionRenderer';

const MultiChoiceQuestion: React.FC<QuestionProps> = ({
  question,
  value = [],
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const allowOther = useMemo(() => {
    return (question.settings as { allowOther?: boolean })?.allowOther || false;
  }, [question.settings]);

  const handleChange = (optionId: string, checked: boolean) => {
    if (disabled) return;

    const currentValue = Array.isArray(value) ? value : [];
    const newValue = checked
      ? [...currentValue, optionId]
      : currentValue.filter(id => id !== optionId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange?.(newValue as any);
  };

  const isSelected = (optionId: string) =>
    Array.isArray(value) && (value as string[]).includes(optionId);

  const getBackgroundColor = (optionId: string) => {
    if (!isSelected(optionId)) return 'transparent';
    return themeColors?.primaryColor ? `${themeColors.primaryColor}20` : '#eff6ff';
  };

  const getBorderColor = (optionId: string) => {
    return isSelected(optionId) ? themeColors?.primaryColor || '#3b82f6' : undefined;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3
          className="text-lg font-medium"
          style={{ color: themeColors?.textColor || '#111827' }}
        >
          {question.title}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {question.description && (
          <p
            className="text-sm mt-1"
            style={{
              color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151',
            }}
          >
            {question.description}
          </p>
        )}
      </div>

      <fieldset className="space-y-3 p-0 m-0" aria-labelledby={`question-${question.id}`}>
        <legend id={`question-${question.id}`} className="sr-only">
          {question.title}
        </legend>

        {question.options?.map((option) => {
          const selected = isSelected(option.id);
          const backgroundColor = getBackgroundColor(option.id);
          const borderColor = getBorderColor(option.id);

          return (
            <label
              key={option.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selected
                  ? 'border-[var(--color-primary)]'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ backgroundColor, borderColor }}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => handleChange(option.id, e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded"
                aria-describedby={error ? `error-${question.id}` : undefined}
              />
              <span style={{ color: themeColors?.textColor || '#111827' }}>
                {option.text}
              </span>
            </label>
          );
        })}

        {allowOther && (
          <label
            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={isSelected('other')}
              onChange={(e) => handleChange('other', e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded"
            />
            <span style={{ color: themeColors?.textColor || '#111827' }}>Other</span>
          </label>
        )}
      </fieldset>

      {error && (
        <p id={`error-${question.id}`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default MultiChoiceQuestion;


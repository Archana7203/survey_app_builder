import React, { useMemo } from 'react';
import type { QuestionProps } from './QuestionRenderer';

const RatingNumberQuestion: React.FC<QuestionProps> = ({
  question,
  value = 0,
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const maxRating = useMemo(() => {
    const rating = (question.settings as { maxRating?: number })?.maxRating ?? 10;
    // Restrict max rating to 10
    return Math.min(Math.max(rating || 10, 1), 10);
  }, [question.settings]);

  const handleRatingChange = (rating: number) => {
    if (disabled) return;
    onChange?.(rating);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium" style={{ color: themeColors?.textColor || '#111827' }}>
          {question.title}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {question.description && (
          <p className="text-sm mt-2" style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}>
            {question.description}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2" role="group" aria-labelledby={`question-${question.id}`}>
        {Array.from({ length: maxRating }, (_, index) => {
          const ratingValue = index + 1;
          const isSelected = (value as number) === ratingValue;
          
          return (
            <button
              key={ratingValue}
              type="button"
              onClick={() => handleRatingChange(ratingValue)}
              disabled={disabled}
              className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
              } ${
                isSelected
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              style={{
                borderColor: isSelected ? (themeColors?.primaryColor || '#3b82f6') : undefined,
                backgroundColor: isSelected ? (themeColors?.primaryColor || '#3b82f6') : 'transparent',
                color: isSelected ? '#ffffff' : (themeColors?.textColor || '#111827')
              }}
              aria-label={`Rate ${ratingValue} out of ${maxRating}`}
              aria-pressed={isSelected}
              title={`Rate ${ratingValue} out of ${maxRating}`}
            >
              {ratingValue}
            </button>
          );
        })}
      </div>

      {value && (
        <p className="text-sm" style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}>
          You rated this {String(value)} out of {maxRating}
        </p>
      )}

      {error && (
        <p id={`error-${question.id}`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default RatingNumberQuestion;


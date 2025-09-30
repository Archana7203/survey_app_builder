import React, { useMemo } from 'react';
import type { QuestionProps } from './QuestionRenderer';

const RatingStarQuestion: React.FC<QuestionProps> = ({
  question,
  value = 0,
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const maxRating = useMemo(() => {
    const rating = (question.settings as { maxRating?: number })?.maxRating || 5;
    // Restrict max rating to 10
    return Math.min(Math.max(rating, 1), 10);
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

      <fieldset className="flex items-center space-x-3 star-rating p-0 m-0" aria-labelledby={`question-${question.id}`}>
        <legend id={`question-${question.id}`} className="sr-only">
          {question.title}
        </legend>
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = (value as number) >= starValue;
          
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => handleRatingChange(starValue)}
              disabled={disabled}
              className={`text-3xl transition-all duration-200 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
              } ${isFilled ? 'star-filled' : 'star-unfilled'}`}
              aria-label={`Rate ${starValue} out of ${maxRating} stars`}
              aria-pressed={isFilled}
              title={`${starValue} ${starValue === 1 ? 'star' : 'stars'}`}
            >
              ★
            </button>
          );
        })}
      </fieldset>

      {Boolean(value) && (
        <p className="text-sm" style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}>
          You rated this {String(value)} out of {maxRating} stars
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

export default RatingStarQuestion;


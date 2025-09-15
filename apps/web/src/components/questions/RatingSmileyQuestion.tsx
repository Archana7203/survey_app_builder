import React, { useMemo } from 'react';
import type { QuestionProps } from './QuestionRenderer';

const RatingSmileyQuestion: React.FC<QuestionProps> = ({
  question,
  value = '',
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const maxRating = useMemo(() => {
    const rating = (question.settings as { maxRating?: number })?.maxRating || 5;
    // Restrict max rating to 5 for smileys
    return Math.min(Math.max(rating, 3), 5);
  }, [question.settings]);

  const handleRatingChange = (rating: string) => {
    if (disabled) return;
    onChange?.(rating);
  };

  // Dynamic smiley ratings based on maxRating
  const ratings = useMemo(() => {
    const allRatings = [
      { value: 'very_sad', emoji: '😢', label: 'Very Sad' },
      { value: 'sad', emoji: '😞', label: 'Sad' },
      { value: 'neutral', emoji: '😐', label: 'Neutral' },
      { value: 'happy', emoji: '😊', label: 'Happy' },
      { value: 'very_happy', emoji: '😄', label: 'Very Happy' },
    ];
    
    // Return different combinations based on maxRating
    if (maxRating === 3) {
      // 3 emotions: very sad, neutral, very happy
      return [allRatings[0], allRatings[2], allRatings[4]];
    } else if (maxRating === 4) {
      // 4 emotions: very sad, neutral, happy, very happy
      return [allRatings[0], allRatings[2], allRatings[3], allRatings[4]];
    } else {
      // 5 emotions: all emotions
      return allRatings;
    }
  }, [maxRating]);

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

      <div className="flex items-center space-x-4" role="group" aria-labelledby={`question-${question.id}`}>
        {ratings.map((rating) => (
          <div key={rating.value} className="flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={() => handleRatingChange(rating.value)}
              disabled={disabled}
              className={`text-4xl transition-all duration-200 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
              } ${
                value === rating.value
                  ? 'scale-110 drop-shadow-lg'
                  : 'opacity-70 hover:opacity-100'
              }`}
              aria-label={rating.label}
              aria-pressed={value === rating.value}
            >
              {rating.emoji}
            </button>
            <span className="text-xs text-center font-medium" style={{ color: themeColors?.textColor || '#111827' }}>
              {rating.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p id={`error-${question.id}`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default RatingSmileyQuestion;


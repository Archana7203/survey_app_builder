import React, { useState } from 'react';

interface RatingNumberProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  maxRating?: number;
  readOnly?: boolean;
  error?: string;
}

const RatingNumber: React.FC<RatingNumberProps> = ({
  label,
  value = 0,
  onChange,
  maxRating = 10,
  readOnly = false,
  error,
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readOnly) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoveredRating(0);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
          {label}
        </label>
      )}
      <div className="flex justify-center items-center space-x-2">
        {Array.from({ length: maxRating }, (_, index) => {
          const rating = index + 1;
          const isSelected = rating === value;
          const isHovered = rating === hoveredRating;
          
          return (
            <button
              key={rating}
              type="button"
              className={`w-10 h-10 rounded-full border-2 font-medium transition-all duration-200 ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-105'
              } ${
                isSelected || isHovered
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[var(--color-primary)] dark:hover:border-[var(--color-primary)]'
              }`}
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              title={`Rate ${rating} out of ${maxRating}`}
            >
              {rating}
            </button>
          );
        })}
      </div>
      {value > 0 && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          You rated this {value} out of {maxRating}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};

export default RatingNumber;






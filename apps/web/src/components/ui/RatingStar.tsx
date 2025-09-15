import React, { useState } from 'react';

interface RatingStarProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  maxRating?: number;
  readOnly?: boolean;
  error?: string;
}

const RatingStar: React.FC<RatingStarProps> = ({
  label,
  value = 0,
  onChange,
  maxRating = 5,
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
      <div className="flex justify-center items-center space-x-2 star-rating">
        {[...Array(maxRating)].map((_, index) => {
          const rating = index + 1;
          const isFilled = rating <= (hoveredRating || value);
          
          return (
            <button
              key={rating}
              type="button"
              className={`text-3xl transition-all duration-200 ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              } ${isFilled ? 'star-filled' : 'star-unfilled'}`}
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              title={`${rating} ${rating === 1 ? 'star' : 'stars'}`}
            >
              ★
            </button>
          );
        })}
      </div>
      {(hoveredRating || value) > 0 && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {hoveredRating || value} {((hoveredRating || value) === 1 ? 'star' : 'stars')} selected
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};

export default RatingStar;






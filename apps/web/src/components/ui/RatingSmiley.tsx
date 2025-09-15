import React, { useState } from 'react';

interface RatingSmileyProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  error?: string;
}

const RatingSmiley: React.FC<RatingSmileyProps> = ({
  label,
  value = 0,
  onChange,
  readOnly = false,
  error,
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const smileys = ['😞', '😐', '🙂', '😊', '😍'];
  const labels = ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];

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
      <div className="flex justify-center items-center space-x-4">
        {smileys.map((smiley, index) => {
          const rating = index + 1;
          const isSelected = rating === (hoveredRating || value);
          
          return (
            <div key={rating} className="flex flex-col items-center space-y-2">
              <button
                type="button"
                title={labels[index]}
                className={`text-4xl transition-all duration-200 ${
                  readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                } ${
                  isSelected 
                    ? 'scale-110 drop-shadow-lg' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                onClick={() => handleClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
                onMouseLeave={handleMouseLeave}
                disabled={readOnly}
              >
                {smiley}
              </button>
              <span className="text-xs text-center text-gray-600 dark:text-gray-400">
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>
      {(hoveredRating || value) > 0 && (
        <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {labels[(hoveredRating || value) - 1]}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};

export default RatingSmiley;






import React, { useEffect, useMemo } from 'react';
import type { QuestionProps } from './QuestionRenderer';

const SliderQuestion: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const min = useMemo(() => {
    return (question.settings as { scaleMin?: number })?.scaleMin || 0;
  }, [question.settings]);
  
  const max = useMemo(() => {
    return (question.settings as { scaleMax?: number })?.scaleMax || 100;
  }, [question.settings]);
  
  const step = useMemo(() => {
    return (question.settings as { scaleStep?: number })?.scaleStep || 1;
  }, [question.settings]);
  
  // Calculate default value as middle of range
  const defaultValue = useMemo(() => {
    return Math.round((min + max) / 2);
  }, [min, max]);
  
  const currentValue = value !== undefined && value !== null ? (value as number) : defaultValue;

  // Ensure the value is within the valid range when settings change
  useEffect(() => {
    if (onChange) {
      let newValue = currentValue;
      
      // If no value is set, use the middle of the range
      newValue ??= defaultValue;
      
      // Ensure value is within bounds
      if (newValue < min) {
        newValue = min;
      } else if (newValue > max) {
        newValue = max;
      }
      
      // Only update if the value actually changed
      if (newValue !== currentValue) {
        onChange(newValue);
      }
    }
  }, [min, max, currentValue, onChange, defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange?.(Number(e.target.value));
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

      <div className="space-y-4">
        <div className="flex justify-between text-sm" style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}>
          <span>{min}</span>
          <span>{max}</span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            background: `linear-gradient(to right, ${themeColors?.primaryColor || '#2563eb'} 0%, ${themeColors?.primaryColor || '#2563eb'} ${((currentValue - min) / (max - min)) * 100}%, #e5e7eb 0%, #e5e7eb 100%)`
          }}
          aria-describedby={error ? `error-${question.id}` : undefined}
        />

        <div className="text-center">
          <span className="text-lg font-semibold" style={{ color: themeColors?.textColor || '#111827' }}>
            {String(currentValue)}
          </span>
        </div>

        <div className="flex justify-between text-xs" style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}>
          <span>Very Low</span>
          <span>Very High</span>
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

export default SliderQuestion;


import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showValue?: boolean;
}

const Slider: React.FC<SliderProps> = ({
  label,
  error,
  showValue = true,
  value,
  className = '',
  ...props
}) => {
  const sliderClasses = `w-full h-2 bg-[var(--color-primary)]/30 dark:bg-[var(--color-primary)]/60 rounded-lg appearance-none cursor-pointer slider ${className}`;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{value}</span>
          )}
        </div>
      )}
      
      {/* Always show value if showValue is true, even without label */}
      {!label && showValue && (
        <div className="text-center">
          <span className="text-lg font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">{value}</span>
        </div>
      )}
      
      <input
        type="range"
        value={value}
        className={sliderClasses}
        style={{
          background: 'rgb(121, 156, 201)',
          height: '8px',
          borderRadius: '4px',
          outline: 'none',
          border: '2px solid #2563eb'
        }}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <style>{`
        input[type="range"].slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
        }
        
        input[type="range"].slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default Slider;


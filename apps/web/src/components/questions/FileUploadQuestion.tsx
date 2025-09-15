import React, { useMemo } from 'react';
import type { QuestionProps } from './QuestionRenderer';

const FileUploadQuestion: React.FC<QuestionProps> = ({
  question,
  value = '',
  onChange,
  error,
  disabled = false,
  themeColors,
}) => {
  const maxFileSize = useMemo(() => {
    return (question.settings as { maxFileSize?: number })?.maxFileSize || 10; // MB
  }, [question.settings]);
  
  const allowedTypes = useMemo(() => {
    return (question.settings as { allowedTypes?: string[] })?.allowedTypes || ['*'];
  }, [question.settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      onChange?.(file.name);
    }
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

      <div className="space-y-2">
        <input
          type="file"
          onChange={handleFileChange}
          disabled={disabled}
          accept={allowedTypes.join(',')}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ 
            backgroundColor: 'transparent',
            color: themeColors?.textColor || '#111827'
          }}
          aria-describedby={error ? `error-${question.id}` : `file-info-${question.id}`}
        />

        <div id={`file-info-${question.id}`} className="text-xs" style={{ color: themeColors?.textColor ? `${themeColors.textColor}80` : '#374151' }}>
          <p>Maximum file size: {maxFileSize}MB</p>
          {allowedTypes.length > 0 && allowedTypes[0] !== '*' && (
            <p>Allowed file types: {allowedTypes.join(', ')}</p>
          )}
        </div>

        {value && (
          <p className="text-sm" style={{ color: themeColors?.textColor || '#111827' }}>
            Selected file: {String(value)}
          </p>
        )}
      </div>

      {error && (
        <p id={`error-${question.id}`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUploadQuestion;


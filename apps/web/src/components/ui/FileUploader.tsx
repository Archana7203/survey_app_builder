import React, { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface FileUploaderProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFileSelect?: (files: File[]) => void;
  error?: string;
  helperText?: string;
}

interface FileWithId extends File {
  id: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  accept,
  multiple = false,
  maxSize,
  onFileSelect,
  error,
  helperText,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<FileWithId[]>([]);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    let fileArray: FileWithId[] = Array.from(selectedFiles).map(file => ({
      ...file,
      id: uuidv4(),
    }));

    if (maxSize) {
      fileArray = fileArray.filter(file => file.size <= maxSize);
    }

    setFiles(fileArray);
    onFileSelect?.(fileArray);
  };

  const handleDrop = (e: React.DragEvent) => {
    const items = e.dataTransfer?.items;
    if (items && Array.from(items).some((item) => item.kind === 'file')) {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer && Array.from(e.dataTransfer.types);
    if (types && types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Extracted ternary for drop area styling
  let dropAreaClasses = 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500';

  if (dragOver) {
    dropAreaClasses = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
  } else if (error) {
    dropAreaClasses = 'border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500';
  }


  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Entire drop area as button */}
      <button
        type="button"
        className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dropAreaClasses}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              Click to upload or drag and drop
            </p>
            {maxSize && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Maximum file size: {formatFileSize(maxSize)}
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Selected files list */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <span>{file.name}</span>
              <span>{formatFileSize(file.size)}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>}
    </div>
  );
};

export default FileUploader;

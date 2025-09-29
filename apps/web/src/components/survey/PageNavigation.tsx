import React from 'react';
import Button from '../ui/Button';

interface PageNavigationProps {
  pages: any[];
  activePageIndex: number;
  onPageChange: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
  isDisabled?: boolean;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  pages,
  activePageIndex,
  onPageChange,
  onAddPage,
  onDeletePage,
  isDisabled = false
}) => {
  return (
    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddPage}
          disabled={isDisabled}
        >
          + Add Page
        </Button>
        
        {pages.map((_: unknown, index: number) => (
          <button
            key={index}
            onClick={() => onPageChange(index)}
            className={`px-3 py-2 text-sm rounded-md transition-all duration-200 ${
              index === activePageIndex
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                : 'text-gray-700 hover:ring-1 hover:ring-gray-300 dark:text-gray-300 dark:hover:ring-gray-500'
            }`}
          >
            Page {index + 1}
          </button>
        ))}
        
        {pages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeletePage(activePageIndex)}
            disabled={isDisabled}
            className="text-red-600 hover:ring-1 hover:ring-red-300 dark:text-red-400 dark:hover:ring-red-500"
          >
            Delete Page
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageNavigation;

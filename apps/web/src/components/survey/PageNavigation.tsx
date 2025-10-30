import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { v4 as uuidv4 } from 'uuid';

interface PageNavigationProps {
  pages: any[];
  activePageIndex: number;
  onPageChange: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  pages,
  activePageIndex,
  onPageChange,
  onAddPage,
  onDeletePage,
}) => {
  // Maintain stable keys internally
  const [keys, setKeys] = useState<string[]>([]);
  const [visibleStart, setVisibleStart] = useState(0);
  const maxVisible = 10;

  useEffect(() => {
    // generate new keys only if pages length changes
    setKeys((prev) => {
      if (prev.length === pages.length) return prev;
      const newKeys = pages.map((_, i) => prev[i] ?? uuidv4());
      return newKeys;
    });
  }, [pages]);

  // Update visible start when active page changes
  useEffect(() => {
    if (pages.length > maxVisible) {
      if (activePageIndex < visibleStart) {
        setVisibleStart(activePageIndex);
      } else if (activePageIndex >= visibleStart + maxVisible) {
        setVisibleStart(activePageIndex - maxVisible + 1);
      }
    }
  }, [activePageIndex, pages.length]);

  // Scroll to show newly added page when pages exceed maxVisible
  useEffect(() => {
    if (pages.length > maxVisible && pages.length > 1) {
      // When a new page is added, scroll to show it
      const newPageIndex = pages.length - 1;
      if (newPageIndex >= visibleStart + maxVisible || newPageIndex < visibleStart) {
        setVisibleStart(Math.max(0, pages.length - maxVisible));
      }
    }
  }, [pages.length, maxVisible]);

  const hasCarousel = pages.length > maxVisible;
  const visiblePages = hasCarousel 
    ? pages.slice(visibleStart, visibleStart + maxVisible)
    : pages;

  const handlePrev = () => {
    if (visibleStart > 0) {
      setVisibleStart(Math.max(0, visibleStart - maxVisible));
    }
  };

  const handleNext = () => {
    if (visibleStart + maxVisible < pages.length) {
      setVisibleStart(Math.min(pages.length - maxVisible, visibleStart + maxVisible));
    }
  };

  return (
    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2 overflow-x-hidden">
        {/* Add Page Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onAddPage}
          className="flex-shrink-0"
        >
          + Add Page
        </Button>

        {/* Left Arrow for Carousel */}
        {hasCarousel && (
          <button
            onClick={handlePrev}
            disabled={visibleStart === 0}
            className="flex-shrink-0 px-2 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
        )}

        {/* Page Buttons */}
        {visiblePages.map((_, index) => {
          const actualIndex = hasCarousel ? visibleStart + index : index;
          return (
            <button
              key={keys[actualIndex] ?? `page-${actualIndex}`}
              onClick={() => onPageChange(actualIndex)}
              className={`flex-shrink-0 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                actualIndex === activePageIndex
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'text-gray-700 hover:ring-1 hover:ring-gray-300 dark:text-gray-300 dark:hover:ring-gray-500'
              }`}
            >
              Page {actualIndex + 1}
            </button>
          );
        })}

        {/* Right Arrow for Carousel */}
        {hasCarousel && (
          <button
            onClick={handleNext}
            disabled={visibleStart + maxVisible >= pages.length}
            className="flex-shrink-0 px-2 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        )}

        {/* Delete Page Button */}
        {pages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeletePage(activePageIndex)}
            className="flex-shrink-0 text-red-600 hover:ring-1 hover:ring-red-300 dark:text-red-400 dark:hover:ring-red-500"
          >
            Delete Page
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageNavigation;
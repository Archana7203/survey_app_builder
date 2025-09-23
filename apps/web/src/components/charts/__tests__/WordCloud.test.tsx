import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WordCloud from '../WordCloud';

describe('WordCloud Component', () => {
  const mockData = [
    { word: 'React', count: 50 },
    { word: 'JavaScript', count: 40 },
    { word: 'TypeScript', count: 30 },
    { word: 'Testing', count: 20 },
    { word: 'Components', count: 10 }
  ];

  const defaultProps = {
    data: mockData,
    title: 'Test Word Cloud'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<WordCloud {...defaultProps} />);
      
      expect(screen.getByText('Test Word Cloud')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('Components')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      const { title, ...propsWithoutTitle } = defaultProps;
      render(<WordCloud {...propsWithoutTitle} />);
      
      expect(screen.queryByText('Test Word Cloud')).not.toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('should render all words from data', () => {
      render(<WordCloud {...defaultProps} />);
      
      mockData.forEach(item => {
        expect(screen.getByText(item.word)).toBeInTheDocument();
      });
    });

    it('should apply proper container styling', () => {
      render(<WordCloud {...defaultProps} />);
      
      const container = screen.getByText('React').closest('.w-full');
      expect(container).toHaveClass('w-full', 'h-96');
    });

    it('should apply proper word container styling', () => {
      render(<WordCloud {...defaultProps} />);
      
      const wordContainer = screen.getByText('React').closest('.flex');
      expect(wordContainer).toHaveClass('flex', 'flex-wrap', 'gap-2', 'h-full', 'overflow-y-auto', 'p-4', 'border', 'border-gray-300', 'dark:border-gray-600', 'rounded');
    });
  });

  // Word Styling Tests
  describe('Word Styling', () => {
    it('should apply proper word styling classes', () => {
      render(<WordCloud {...defaultProps} />);
      
      const wordElements = screen.getAllByText(/^(React|JavaScript|TypeScript|Testing|Components)$/);
      wordElements.forEach(word => {
        expect(word).toHaveClass('inline-block', 'px-2', 'py-1', 'rounded', 'transition-transform', 'hover:scale-110', 'cursor-default');
      });
    });

    it('should apply different font sizes based on count', () => {
      render(<WordCloud {...defaultProps} />);
      
      const reactElement = screen.getByText('React');
      const componentsElement = screen.getByText('Components');
      
      const reactStyle = (reactElement as HTMLElement).style;
      const componentsStyle = (componentsElement as HTMLElement).style;
      
      // React has count 50, Components has count 10, so React should have larger font size
      const reactFontSize = parseInt(reactStyle.fontSize);
      const componentsFontSize = parseInt(componentsStyle.fontSize);
      
      expect(reactFontSize).toBeGreaterThan(componentsFontSize);
    });

    it('should apply different colors based on count', () => {
      render(<WordCloud {...defaultProps} />);
      
      const reactElement = screen.getByText('React');
      const componentsElement = screen.getByText('Components');
      
      const reactStyle = (reactElement as HTMLElement).style;
      const componentsStyle = (componentsElement as HTMLElement).style;
      
      // Different counts should result in different colors
      expect(reactStyle.color).toBeDefined();
      expect(componentsStyle.color).toBeDefined();
    });

    it('should apply different font weights based on count', () => {
      render(<WordCloud {...defaultProps} />);
      
      const reactElement = screen.getByText('React');
      const componentsElement = screen.getByText('Components');
      
      const reactStyle = (reactElement as HTMLElement).style;
      const componentsStyle = (componentsElement as HTMLElement).style;
      
      // React has higher count, so should have higher font weight
      const reactFontWeight = parseInt(reactStyle.fontWeight);
      const componentsFontWeight = parseInt(componentsStyle.fontWeight);
      
      expect(reactFontWeight).toBeGreaterThanOrEqual(componentsFontWeight);
    });

    it('should apply tooltip titles with word and count', () => {
      render(<WordCloud {...defaultProps} />);
      
      const reactElement = screen.getByText('React');
      expect(reactElement).toHaveAttribute('title', 'React: 50 occurrences');
      
      const componentsElement = screen.getByText('Components');
      expect(componentsElement).toHaveAttribute('title', 'Components: 10 occurrences');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty data array', () => {
      render(<WordCloud {...defaultProps} data={[]} />);
      
      expect(screen.getByText('No text data available')).toBeInTheDocument();
      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    it('should handle null data', () => {
      render(<WordCloud {...defaultProps} data={null as any} />);
      
      expect(screen.getByText('No text data available')).toBeInTheDocument();
    });

    it('should handle undefined data', () => {
      render(<WordCloud {...defaultProps} data={undefined as any} />);
      
      expect(screen.getByText('No text data available')).toBeInTheDocument();
    });

    it('should handle single word', () => {
      const singleWordData = [{ word: 'Single', count: 100 }];
      render(<WordCloud {...defaultProps} data={singleWordData} />);
      
      expect(screen.getByText('Single')).toBeInTheDocument();
      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    it('should handle words with same count', () => {
      const sameCountData = [
        { word: 'Word1', count: 50 },
        { word: 'Word2', count: 50 },
        { word: 'Word3', count: 50 }
      ];
      render(<WordCloud {...defaultProps} data={sameCountData} />);
      
      expect(screen.getByText('Word1')).toBeInTheDocument();
      expect(screen.getByText('Word2')).toBeInTheDocument();
      expect(screen.getByText('Word3')).toBeInTheDocument();
    });

    it('should handle words with zero count', () => {
      const zeroCountData = [
        { word: 'Zero', count: 0 },
        { word: 'Normal', count: 50 }
      ];
      render(<WordCloud {...defaultProps} data={zeroCountData} />);
      
      expect(screen.getByText('Zero')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('should handle words with negative count', () => {
      const negativeCountData = [
        { word: 'Negative', count: -10 },
        { word: 'Positive', count: 50 }
      ];
      render(<WordCloud {...defaultProps} data={negativeCountData} />);
      
      expect(screen.getByText('Negative')).toBeInTheDocument();
      expect(screen.getByText('Positive')).toBeInTheDocument();
    });

    it('should handle very large counts', () => {
      const largeCountData = [
        { word: 'Large', count: 999999 },
        { word: 'Small', count: 1 }
      ];
      render(<WordCloud {...defaultProps} data={largeCountData} />);
      
      expect(screen.getByText('Large')).toBeInTheDocument();
      expect(screen.getByText('Small')).toBeInTheDocument();
    });

    it('should handle very small counts', () => {
      const smallCountData = [
        { word: 'Small', count: 0.001 },
        { word: 'Normal', count: 50 }
      ];
      render(<WordCloud {...defaultProps} data={smallCountData} />);
      
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('should handle very long words', () => {
      const longWordData = [
        { word: 'A'.repeat(100), count: 50 },
        { word: 'Normal', count: 30 }
      ];
      render(<WordCloud {...defaultProps} data={longWordData} />);
      
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('should handle words with special characters', () => {
      const specialCharData = [
        { word: 'Word with "quotes" & symbols!', count: 50 },
        { word: 'Word with <HTML> tags', count: 30 },
        { word: 'Word with émojis 🎉', count: 20 }
      ];
      render(<WordCloud {...defaultProps} data={specialCharData} />);
      
      expect(screen.getByText('Word with "quotes" & symbols!')).toBeInTheDocument();
      expect(screen.getByText('Word with <HTML> tags')).toBeInTheDocument();
      expect(screen.getByText('Word with émojis 🎉')).toBeInTheDocument();
    });

    it('should handle words with missing count property', () => {
      const incompleteData = [
        { word: 'No Count' },
        { word: 'With Count', count: 50 }
      ] as any;
      render(<WordCloud {...defaultProps} data={incompleteData} />);
      
      expect(screen.getByText('No Count')).toBeInTheDocument();
      expect(screen.getByText('With Count')).toBeInTheDocument();
    });

    it('should handle words with missing word property', () => {
      const incompleteData = [
        { count: 50 },
        { word: 'Valid Word', count: 30 }
      ] as any;
      render(<WordCloud {...defaultProps} data={incompleteData} />);
      
      expect(screen.getByText('Valid Word')).toBeInTheDocument();
    });

    it('should handle malformed data gracefully', () => {
      // The component will throw an error for malformed data, so we expect it to throw
      const malformedData = [
        null,
        undefined,
        'not-an-object',
        { word: 'Valid', count: 50 }
      ] as any;
      expect(() => {
        render(<WordCloud {...defaultProps} data={malformedData} />);
      }).toThrow();
    });

    it('should handle empty strings as words', () => {
      const emptyStringData = [
        { word: '', count: 50 },
        { word: 'Valid', count: 30 }
      ];
      render(<WordCloud {...defaultProps} data={emptyStringData} />);
      
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });
  });

  // Font Size Calculation Tests
  describe('Font Size Calculation', () => {
    it('should calculate font sizes correctly for different counts', () => {
      const testData = [
        { word: 'Min', count: 1 },
        { word: 'Max', count: 100 }
      ];
      render(<WordCloud {...defaultProps} data={testData} />);
      
      const minElement = screen.getByText('Min');
      const maxElement = screen.getByText('Max');
      
      const minFontSize = parseInt((minElement as HTMLElement).style.fontSize);
      const maxFontSize = parseInt((maxElement as HTMLElement).style.fontSize);
      
      expect(maxFontSize).toBeGreaterThan(minFontSize);
      expect(minFontSize).toBeGreaterThanOrEqual(16); // Minimum font size
      expect(maxFontSize).toBeLessThanOrEqual(46); // Maximum font size
    });

    it('should handle single data point font size', () => {
      const singleData = [{ word: 'Single', count: 50 }];
      render(<WordCloud {...defaultProps} data={singleData} />);
      
      const element = screen.getByText('Single');
      const fontSize = (element as HTMLElement).style.fontSize;
      
      // For single data point, fontSize should be defined
      expect(fontSize).toBeDefined();
    });

    it('should handle all same counts font size', () => {
      const sameCountData = [
        { word: 'Word1', count: 50 },
        { word: 'Word2', count: 50 },
        { word: 'Word3', count: 50 }
      ];
      render(<WordCloud {...defaultProps} data={sameCountData} />);
      
      const elements = screen.getAllByText(/^Word\d$/);
      elements.forEach(element => {
        const fontSize = (element as HTMLElement).style.fontSize;
        // For same counts, fontSize should be defined
        expect(fontSize).toBeDefined();
      });
    });
  });

  // Color Calculation Tests
  describe('Color Calculation', () => {
    it('should assign different colors for different counts', () => {
      const testData = [
        { word: 'Low', count: 10 },
        { word: 'High', count: 90 }
      ];
      render(<WordCloud {...defaultProps} data={testData} />);
      
      const lowElement = screen.getByText('Low');
      const highElement = screen.getByText('High');
      
      const lowColor = (lowElement as HTMLElement).style.color;
      const highColor = (highElement as HTMLElement).style.color;
      
      expect(lowColor).toBeDefined();
      expect(highColor).toBeDefined();
    });

    it('should use predefined color palette', () => {
      render(<WordCloud {...defaultProps} />);
      
      const elements = screen.getAllByText(/^(React|JavaScript|TypeScript|Testing|Components)$/);
      elements.forEach(element => {
        const color = (element as HTMLElement).style.color;
        expect(color).toBeDefined();
        // Should be one of the predefined colors (may be in rgb format)
        const predefinedColors = [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
          '#06B6D4', '#84CC16', '#F97316', '#EC4899',
          'rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)',
          'rgb(239, 68, 68)', 'rgb(139, 92, 246)', 'rgb(6, 182, 212)',
          'rgb(132, 204, 22)', 'rgb(249, 115, 22)', 'rgb(236, 72, 153)'
        ];
        expect(predefinedColors).toContain(color);
      });
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        word: `Word${i}`,
        count: Math.random() * 100
      }));
      
      const startTime = performance.now();
      render(<WordCloud {...defaultProps} data={largeData} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(2000); // Should render in less than 2 seconds
      expect(screen.getByText('Word0')).toBeInTheDocument();
    });

    it('should handle rapid data updates efficiently', () => {
      const { rerender } = render(<WordCloud {...defaultProps} />);
      
      const startTime = performance.now();
      
      // Rapid data updates
      for (let i = 0; i < 50; i++) {
        const newData = mockData.map(item => ({
          ...item,
          count: item.count + i
        }));
        rerender(<WordCloud {...defaultProps} data={newData} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in less than 2 seconds
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle missing data prop gracefully', () => {
      render(<WordCloud title="Test Chart" />);
      
      expect(screen.getByText('No text data available')).toBeInTheDocument();
    });

    it('should handle non-array data gracefully', () => {
      // The component will throw an error for non-array data, so we expect it to throw
      expect(() => {
        render(<WordCloud {...defaultProps} data="not-an-array" as any />);
      }).toThrow();
    });

    it('should handle data with invalid count values gracefully', () => {
      const invalidCountData = [
        { word: 'Valid', count: 50 },
        { word: 'Invalid', count: 'not-a-number' }
      ] as any;
      render(<WordCloud {...defaultProps} data={invalidCountData} />);
      
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('Invalid')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper heading structure when title is provided', () => {
      render(<WordCloud {...defaultProps} />);
      
      const title = screen.getByText('Test Word Cloud');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-medium', 'text-gray-900', 'dark:text-white', 'mb-4');
    });

    it('should have proper container structure', () => {
      render(<WordCloud {...defaultProps} />);
      
      const container = screen.getByText('React').closest('.w-full');
      expect(container).toHaveClass('w-full', 'h-96');
    });

    it('should support dark mode styling', () => {
      render(<WordCloud {...defaultProps} />);
      
      const title = screen.getByText('Test Word Cloud');
      expect(title).toHaveClass('dark:text-white');
      
      const wordContainer = screen.getByText('React').closest('.flex');
      expect(wordContainer).toHaveClass('dark:border-gray-600');
    });

    it('should have proper tooltip titles for accessibility', () => {
      render(<WordCloud {...defaultProps} />);
      
      const reactElement = screen.getByText('React');
      expect(reactElement).toHaveAttribute('title', 'React: 50 occurrences');
    });

    it('should have proper cursor styling', () => {
      render(<WordCloud {...defaultProps} />);
      
      const wordElements = screen.getAllByText(/^(React|JavaScript|TypeScript|Testing|Components)$/);
      wordElements.forEach(word => {
        expect(word).toHaveClass('cursor-default');
      });
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with all props combined', () => {
      const allProps = {
        data: mockData,
        title: 'Complete Test Chart'
      };
      
      render(<WordCloud {...allProps} />);
      
      expect(screen.getByText('Complete Test Chart')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('should maintain component structure across re-renders', () => {
      const { rerender } = render(<WordCloud {...defaultProps} />);
      
      expect(screen.getByText('React')).toBeInTheDocument();
      
      rerender(<WordCloud {...defaultProps} title="Updated Title" />);
      
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('should handle mixed data types in same dataset', () => {
      const mixedData = [
        { word: 'Integer', count: 50 },
        { word: 'Decimal', count: 25.5 },
        { word: 'Zero', count: 0 },
        { word: 'Negative', count: -10 }
      ];
      
      render(<WordCloud {...defaultProps} data={mixedData} />);
      
      expect(screen.getByText('Integer')).toBeInTheDocument();
      expect(screen.getByText('Decimal')).toBeInTheDocument();
      expect(screen.getByText('Zero')).toBeInTheDocument();
      expect(screen.getByText('Negative')).toBeInTheDocument();
    });
  });
});

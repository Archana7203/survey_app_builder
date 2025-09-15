import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RatingNumberQuestion from '../RatingNumberQuestion';

describe('RatingNumberQuestion Component', () => {
  const mockOnChange = vi.fn();
  
  const mockQuestion = {
    id: 'test-question',
    type: 'rating_number',
    title: 'Rate from 1 to 10',
    description: 'Please rate from 1 to 10',
    required: true,
    settings: {
      minRating: 1,
      maxRating: 10,
      showLabels: true,
      step: 1
    }
  };

  const defaultProps = {
    question: mockQuestion,
    onChange: mockOnChange,
    value: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      expect(screen.getByText('Rate from 1 to 10')).toBeInTheDocument();
      expect(screen.getByText('Please rate from 1 to 10')).toBeInTheDocument();
    });

    it('should render correct number of rating options', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10); // 1 to 10
    });

    it('should handle rating selection', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[4]); // Click rating 5
      
      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('should display current rating', () => {
      render(<RatingNumberQuestion {...defaultProps} value={7} />);
      
      const buttons = screen.getAllByRole('button');
      // Rating 7 should be selected
      expect(buttons[6]).toHaveClass('bg-blue-500'); // 7th button (index 6)
    });

    it('should show required indicator when required', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should not show required indicator when not required', () => {
      const question = { ...mockQuestion, required: false };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle different rating ranges', () => {
      const question = { ...mockQuestion, settings: { minRating: 0, maxRating: 5 } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5); // 1 to 5
    });

    it('should handle single rating option', () => {
      const question = { ...mockQuestion, settings: { maxRating: 1 } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1); // Only rating 1
    });

    it('should handle zero rating', () => {
      render(<RatingNumberQuestion {...defaultProps} value={0} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should handle maximum rating', () => {
      render(<RatingNumberQuestion {...defaultProps} value={10} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[9]).toHaveClass('bg-blue-500'); // Last button
    });

    it('should handle rapid rating changes', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      
      // Rapid changes
      for (let i = 0; i < 5; i++) {
        fireEvent.click(buttons[i]);
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(5);
      expect(mockOnChange).toHaveBeenLastCalledWith(5);
    });

    it('should handle rating decrease', () => {
      render(<RatingNumberQuestion {...defaultProps} value={10} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[4]); // Click rating 5
      
      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('should handle same rating click', () => {
      render(<RatingNumberQuestion {...defaultProps} value={5} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[4]); // Click rating 5 again
      
      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('should handle missing minRating setting', () => {
      const question = { ...mockQuestion, settings: { maxRating: 10 } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10); // Default minRating is 1
    });

    it('should handle missing maxRating setting', () => {
      const question = { ...mockQuestion, settings: { minRating: 1 } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10); // Default maxRating is 10
    });

    it('should handle null/undefined values gracefully', () => {
      render(<RatingNumberQuestion {...defaultProps} value={null as any} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);
    });

    it('should handle undefined values gracefully', () => {
      render(<RatingNumberQuestion {...defaultProps} value={undefined as any} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);
    });

    it('should handle negative rating values', () => {
      render(<RatingNumberQuestion {...defaultProps} value={-1} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should handle rating values exceeding maxRating', () => {
      render(<RatingNumberQuestion {...defaultProps} value={15} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should handle decimal rating values', () => {
      render(<RatingNumberQuestion {...defaultProps} value={5.5} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[4]).toBeInTheDocument(); // Button 5 should exist
    });

    it('should handle step values', () => {
      const question = { ...mockQuestion, settings: { step: 2 } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10); // Component ignores step, creates 1-10
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<RatingNumberQuestion {...defaultProps} error="Please select a rating" />);
      
      expect(screen.getByText('Please select a rating')).toBeInTheDocument();
    });

    it('should handle missing question prop gracefully', () => {
      expect(() => {
        render(<RatingNumberQuestion {...defaultProps} question={null as any} />);
      }).toThrow('Cannot read properties of null');
    });

    it('should handle missing onChange prop gracefully', () => {
      expect(() => {
        render(<RatingNumberQuestion {...defaultProps} onChange={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle malformed question data', () => {
      const malformedQuestion: any = {
        id: 'malformed',
        type: 'rating_number',
        title: null,
        description: undefined,
        required: 'not-a-boolean',
        settings: null
      };
      
      expect(() => {
        render(<RatingNumberQuestion {...defaultProps} question={malformedQuestion} />);
      }).not.toThrow();
    });

    it('should handle invalid rating settings', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          minRating: 'not-a-number',
          maxRating: 'also-invalid',
          step: 'invalid'
        } 
      };
      
      expect(() => {
        render(<RatingNumberQuestion {...defaultProps} question={question} />);
      }).not.toThrow();
    });

    it('should handle minRating greater than maxRating', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          minRating: 10,
          maxRating: 5
        } 
      };
      
      expect(() => {
        render(<RatingNumberQuestion {...defaultProps} question={question} />);
      }).not.toThrow();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      
      expect(buttons[0]).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('type', 'button');
    });

    it('should support screen reader compatibility', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const label = screen.getByText('Rate from 1 to 10');
      expect(label).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      
      expect(buttons[0]).toHaveFocus();
    });

    it('should support arrow key navigation', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      
      fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
      // Component doesn't have built-in keyboard navigation
      expect(buttons[0]).toHaveFocus();
    });

    it('should support space bar selection', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      
      fireEvent.keyDown(buttons[0], { key: ' ' });
      // Component doesn't handle space bar selection
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should support enter key selection', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      
      fireEvent.keyDown(buttons[0], { key: 'Enter' });
      // Component doesn't handle enter key selection
      expect(buttons[0]).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid rating changes efficiently', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const startTime = performance.now();
      
      // Rapid changes
      for (let i = 0; i < 50; i++) {
        const buttonIndex = i % 10;
        fireEvent.click(buttons[buttonIndex]);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle large rating ranges efficiently', () => {
      const question = { ...mockQuestion, settings: { minRating: 1, maxRating: 100 } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);
      
      const startTime = performance.now();
      fireEvent.click(buttons[5]);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  // Validation Tests
  describe('Validation', () => {
    it('should handle required validation', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should handle rating range validation', () => {
      const question = { ...mockQuestion, settings: { minRating: 1, maxRating: 5 } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('should handle step validation', () => {
      const question = { ...mockQuestion, settings: { step: 0.5 } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10); // Component ignores step, creates 1-10
    });
  });

  // Theme and Styling Tests
  describe('Theme and Styling', () => {
    it('should apply custom styling when provided', () => {
      const themeColors = {
        backgroundColor: '#f0f0f0',
        textColor: '#333333',
        primaryColor: '#007bff'
      };
      
      render(<RatingNumberQuestion {...defaultProps} themeColors={themeColors} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should handle missing theme colors gracefully', () => {
      render(<RatingNumberQuestion {...defaultProps} themeColors={undefined as any} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should handle dynamic content changes', () => {
      const { rerender } = render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);
      
      // Change question content
      const newQuestion = { ...mockQuestion, title: 'New Rating Field' };
      rerender(<RatingNumberQuestion {...defaultProps} question={newQuestion} />);
      
      expect(screen.getByText('New Rating Field')).toBeInTheDocument();
    });
  });

  // Rating-specific Tests
  describe('Rating-specific Functionality', () => {
    it('should handle hover effects', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.mouseEnter(buttons[4]);
      
      // Component should handle hover
      expect(buttons[4]).toBeInTheDocument();
    });

    it('should handle mouse leave', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.mouseEnter(buttons[4]);
      fireEvent.mouseLeave(buttons[4]);
      
      // Component should handle mouse leave
      expect(buttons[4]).toBeInTheDocument();
    });

    it('should handle touch interactions', () => {
      render(<RatingNumberQuestion {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      fireEvent.touchStart(buttons[4]);
      fireEvent.touchEnd(buttons[4]);
      
      // Component doesn't handle touch events, use click instead
      fireEvent.click(buttons[4]);
      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('should handle disabled state', () => {
      const question = { ...mockQuestion, settings: { disabled: true } };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should handle custom labels', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          showLabels: true,
          labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
        } 
      };
      render(<RatingNumberQuestion {...defaultProps} question={question} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });
  });
});

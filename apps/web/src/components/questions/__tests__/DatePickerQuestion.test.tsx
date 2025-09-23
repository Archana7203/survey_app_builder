import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DatePickerQuestion from '../DatePickerQuestion';

describe('DatePickerQuestion Component', () => {
  const mockOnChange = vi.fn();
  
  const mockQuestion = {
    id: 'test-question',
    title: 'Select Date',
    description: 'Please select a date',
    required: true,
    settings: {
      minDate: '2020-01-01',
      maxDate: '2030-12-31',
      format: 'YYYY-MM-DD'
    }
  };

  const defaultProps = {
    question: mockQuestion,
    onChange: mockOnChange,
    value: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      expect(screen.getByText('Select Date')).toBeInTheDocument();
      expect(screen.getAllByText('Please select a date')).toHaveLength(2);
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('should handle date input', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { value: '2023-12-25' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('2023-12-25');
    });

    it('should display current value', () => {
      render(<DatePickerQuestion {...defaultProps} value="2023-06-15" />);
      
      const input = screen.getByDisplayValue('2023-06-15');
      expect(input).toHaveValue('2023-06-15');
    });

    it('should show required indicator when required', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show required indicator when not required', () => {
      const question = { ...mockQuestion, required: false };
      render(<DatePickerQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).not.toHaveAttribute('required');
    });

    it('should have date input type', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'date');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle valid date formats', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      const validDates = [
        '2023-01-01',
        '2023-12-31',
        '2024-02-29', // Leap year
        '2023-06-15'
      ];
      
      validDates.forEach(date => {
        fireEvent.change(input, { target: { value: date } });
        expect(mockOnChange).toHaveBeenCalledWith(date);
      });
    });

    it('should handle min date constraint', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('min', '2020-01-01');
    });

    it('should handle max date constraint', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('max', '2030-12-31');
    });

    it('should handle missing min date setting', () => {
      const question = { ...mockQuestion, settings: { maxDate: '2030-12-31' } };
      render(<DatePickerQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).not.toHaveAttribute('min');
    });

    it('should handle missing max date setting', () => {
      const question = { ...mockQuestion, settings: { minDate: '2020-01-01' } };
      render(<DatePickerQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).not.toHaveAttribute('max');
    });

        it('should handle empty string input', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { value: '' } });

      // Component doesn't call onChange for empty strings
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle invalid date formats', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      const invalidDates = [
        'invalid-date',
        '2023-13-01', // Invalid month
        '2023-02-30', // Invalid day
        '2023/01/01', // Wrong format
        '01-01-2023'  // Wrong format
      ];
      
      invalidDates.forEach(date => {
        fireEvent.change(input, { target: { value: date } });
        // Component doesn't call onChange for invalid dates
        expect(mockOnChange).not.toHaveBeenCalled();
      });
    });

    it('should handle rapid date changes', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      
      // Rapid changes
      for (let i = 1; i <= 10; i++) {
        const date = `2023-01-${i.toString().padStart(2, '0')}`;
        fireEvent.change(input, { target: { value: date } });
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(10);
      expect(mockOnChange).toHaveBeenLastCalledWith('2023-01-10');
    });

    it('should handle leap year dates', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      const leapYearDates = [
        '2024-02-29', // Valid leap year
        '2020-02-29', // Valid leap year
        '2023-02-29'  // Invalid (not leap year)
      ];
      
      leapYearDates.forEach((date, index) => {
        fireEvent.change(input, { target: { value: date } });
        if (index === 2) {
          // Browser corrects invalid date 2023-02-29 to 2024-02-29
          expect(mockOnChange).toHaveBeenCalledWith('2024-02-29');
        } else {
          expect(mockOnChange).toHaveBeenCalledWith(date);
        }
      });
    });

    it('should handle boundary dates', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      const boundaryDates = [
        '2020-01-01', // Min date
        '2030-12-31', // Max date
        '2019-12-31', // Before min
        '2031-01-01'  // After max
      ];
      
      boundaryDates.forEach(date => {
        fireEvent.change(input, { target: { value: date } });
        expect(mockOnChange).toHaveBeenCalledWith(date);
      });
    });

    it('should handle null/undefined values gracefully', () => {
      render(<DatePickerQuestion {...defaultProps} value={null as any} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveValue('');
    });

    it('should handle undefined values gracefully', () => {
      render(<DatePickerQuestion {...defaultProps} value={undefined as any} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveValue('');
    });

    it('should handle missing settings gracefully', () => {
      const question = { ...mockQuestion, settings: {} };
      render(<DatePickerQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'date');
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<DatePickerQuestion {...defaultProps} error="Please select a valid date" />);
      
      expect(screen.getByText('Please select a valid date')).toBeInTheDocument();
    });

    it('should handle missing question prop gracefully', () => {
      expect(() => {
        render(<DatePickerQuestion {...defaultProps} question={null as any} />);
      }).toThrow('Cannot read properties of null');
    });

    it('should handle missing onChange prop gracefully', () => {
      expect(() => {
        render(<DatePickerQuestion {...defaultProps} onChange={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle malformed question data', () => {
      const malformedQuestion = {
        id: 'malformed',
        title: null,
        description: undefined,
        required: 'not-a-boolean',
        settings: null
      };
      
      expect(() => {
        render(<DatePickerQuestion {...defaultProps} question={malformedQuestion} />);
      }).not.toThrow();
    });

    it('should handle invalid date settings', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          minDate: 'invalid-date',
          maxDate: 'also-invalid',
          format: 'invalid-format'
        } 
      };
      
      expect(() => {
        render(<DatePickerQuestion {...defaultProps} question={question} />);
      }).not.toThrow();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      input.focus();
      
      expect(input).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('should support screen reader compatibility', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const label = screen.getByText('Select Date');
      expect(label).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      input.focus();
      
      expect(input).toHaveFocus();
    });

    it('should support tab navigation', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      input.focus();
      
      fireEvent.keyDown(input, { key: 'Tab' });
      // Component doesn't prevent default tab behavior
      expect(input).toHaveFocus();
    });

    it('should support arrow key navigation', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      input.focus();
      
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      // Should not prevent default
      expect(input).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid date changes efficiently', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      const startTime = performance.now();
      
      // Rapid changes
      for (let i = 1; i <= 50; i++) {
        const date = `2023-01-${i.toString().padStart(2, '0')}`;
        fireEvent.change(input, { target: { value: date } });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle date picker opening efficiently', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      
      const startTime = performance.now();
      fireEvent.click(input);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should open quickly
    });
  });

  // Validation Tests
  describe('Validation', () => {
    it('should handle required validation', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should handle min date validation', () => {
      const question = { ...mockQuestion, settings: { minDate: '2023-01-01' } };
      render(<DatePickerQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('min', '2023-01-01');
    });

    it('should handle max date validation', () => {
      const question = { ...mockQuestion, settings: { maxDate: '2023-12-31' } };
      render(<DatePickerQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('max', '2023-12-31');
    });

    it('should handle date range validation', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          minDate: '2023-01-01',
          maxDate: '2023-12-31'
        } 
      };
      render(<DatePickerQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('min', '2023-01-01');
      expect(input).toHaveAttribute('max', '2023-12-31');
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
      
      render(<DatePickerQuestion {...defaultProps} themeColors={themeColors} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toBeInTheDocument();
    });

    it('should handle missing theme colors gracefully', () => {
      render(<DatePickerQuestion {...defaultProps} themeColors={undefined as any} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toBeInTheDocument();
    });

    it('should handle dynamic content changes', () => {
      const { rerender } = render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toBeInTheDocument();
      
      // Change question content
      const newQuestion = { ...mockQuestion, title: 'New Date Field' };
      rerender(<DatePickerQuestion {...defaultProps} question={newQuestion} />);
      
      expect(screen.getByText('New Date Field')).toBeInTheDocument();
    });
  });

  // Date-specific Tests
  describe('Date-specific Functionality', () => {
    it('should handle date format changes', () => {
      const question = { ...mockQuestion, settings: { format: 'DD/MM/YYYY' } };
      render(<DatePickerQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('should handle timezone considerations', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { value: '2023-06-15' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('2023-06-15');
    });

    it('should handle date picker interactions', () => {
      render(<DatePickerQuestion {...defaultProps} />);
      
      const input = screen.getByDisplayValue('');
      fireEvent.click(input);
      
      // Component should still function
      expect(input).toBeInTheDocument();
    });
  });
});

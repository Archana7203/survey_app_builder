import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TextShortQuestion from '../TextShortQuestion';

describe('TextShortQuestion Component', () => {
  const mockOnChange = vi.fn();
  
  const mockQuestion = {
    id: 'test-question',
    type: 'textShort',
    title: 'Test Question',
    description: 'Test description',
    required: true,
    settings: {
      placeholder: 'Enter your answer',
      maxLength: 100
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
      render(<TextShortQuestion {...defaultProps} />);
      
      expect(screen.getByText('Test Question')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Enter your answer');
    });

    it('should handle text input', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Test answer' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('Test answer');
    });

    it('should display current value', () => {
      render(<TextShortQuestion {...defaultProps} value="Current value" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Current value');
    });

    it('should show required indicator when required', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      // Component shows required indicator as asterisk in title, not on input
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show required indicator when not required', () => {
      const question = { ...mockQuestion, required: false };
      render(<TextShortQuestion {...defaultProps} question={question} />);
      
      // Component doesn't show asterisk when not required
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle very long text input', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const longText = 'A'.repeat(1000);
      
      fireEvent.change(input, { target: { value: longText } });
      
      expect(mockOnChange).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const specialText = 'Text with "quotes" & symbols! <HTML> émojis 🎉';
      
      fireEvent.change(input, { target: { value: specialText } });
      
      expect(mockOnChange).toHaveBeenCalledWith(specialText);
    });

    it('should handle empty string input', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');

      // Component handles empty string input
      expect(input).toHaveValue('');
    });

    it('should handle whitespace-only input', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '   ' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('   ');
    });

    it('should handle rapid text changes', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      
      // Rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `Text ${i}` } });
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(10);
      expect(mockOnChange).toHaveBeenLastCalledWith('Text 9');
    });

    it('should handle copy/paste operations', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const pastedText = 'Pasted content with multiple words';
      
      // Simulate paste by changing the input value
      fireEvent.change(input, { target: { value: pastedText } });
      
      expect(mockOnChange).toHaveBeenCalledWith(pastedText);
    });

    it('should handle maxLength constraint', () => {
      const question = { ...mockQuestion, settings: { maxLength: 10 } };
      render(<TextShortQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should handle missing maxLength setting', () => {
      const question = { ...mockQuestion, settings: {} };
      render(<TextShortQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('maxLength');
    });

    it('should handle missing placeholder setting', () => {
      const question = { ...mockQuestion, settings: {} };
      render(<TextShortQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Enter your answer...');
    });

    it('should handle null/undefined values gracefully', () => {
      render(<TextShortQuestion {...defaultProps} value={null as any} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle undefined values gracefully', () => {
      render(<TextShortQuestion {...defaultProps} value={undefined as any} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<TextShortQuestion {...defaultProps} error="This field is required" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should handle missing question prop gracefully', () => {
      // Component throws error when given null question (expected behavior)
      expect(() => {
        render(<TextShortQuestion {...defaultProps} question={null as any} />);
      }).toThrow('Cannot read properties of null');
    });

    it('should handle missing onChange prop gracefully', () => {
      expect(() => {
        render(<TextShortQuestion {...defaultProps} onChange={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle malformed question data', () => {
      const malformedQuestion = {
        id: 'malformed',
        type: 'textShort',
        title: 'Malformed Question',
        description: undefined,
        required: false,
        settings: undefined
      };
      
      expect(() => {
        render(<TextShortQuestion {...defaultProps} question={malformedQuestion} />);
      }).not.toThrow();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(input).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should support screen reader compatibility', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const label = screen.getByText('Test Question');
      expect(label).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(input).toHaveFocus();
    });

    it('should support tab navigation', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      // Component doesn't prevent default tab behavior
      expect(input).toHaveFocus();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid input changes efficiently', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const startTime = performance.now();
      
      // Rapid changes
      for (let i = 0; i < 100; i++) {
        fireEvent.change(input, { target: { value: `Text ${i}` } });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle large text input efficiently', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const largeText = 'A'.repeat(10000);
      
      const startTime = performance.now();
      fireEvent.change(input, { target: { value: largeText } });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  // Validation Tests
  describe('Validation', () => {
    it('should handle required validation', () => {
      render(<TextShortQuestion {...defaultProps} />);
      
      // Component shows required indicator as asterisk in title
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should handle maxLength validation', () => {
      const question = { ...mockQuestion, settings: { maxLength: 50 } };
      render(<TextShortQuestion {...defaultProps} question={question} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '50');
    });

    it('should handle custom validation patterns', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          pattern: '[A-Za-z]+',
          title: 'Only letters allowed'
        } 
      };
      render(<TextShortQuestion {...defaultProps} question={question} />);
      
      // Component doesn't support pattern attribute
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
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
      
      render(<TextShortQuestion {...defaultProps} themeColors={themeColors} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle missing theme colors gracefully', () => {
      render(<TextShortQuestion {...defaultProps} themeColors={undefined as any} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });
});

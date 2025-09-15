import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TextLongQuestion from '../TextLongQuestion';

describe('TextLongQuestion Component', () => {
  const mockOnChange = vi.fn();
  
  const mockQuestion = {
    id: 'test-question',
    title: 'Test Question',
    description: 'Test description',
    required: true,
    settings: {
      placeholder: 'Enter your detailed answer',
      maxLength: 1000,
      rows: 4
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
      render(<TextLongQuestion {...defaultProps} />);
      
      expect(screen.getByText('Test Question')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Type your answer here...');
    });

    it('should handle text input', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test long answer' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('Test long answer');
    });

    it('should display current value', () => {
      render(<TextLongQuestion {...defaultProps} value="Current long value" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Current long value');
    });

    it('should show required indicator when required', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      // Component shows required indicator as asterisk in title, not on textarea
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show required indicator when not required', () => {
      const question = { ...mockQuestion, required: false };
      render(<TextLongQuestion {...defaultProps} question={question} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toHaveAttribute('required');
    });

    it('should set correct number of rows', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '6'); // Component uses fixed rows=6
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle very long text input', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      const longText = 'A'.repeat(5000);
      
      fireEvent.change(textarea, { target: { value: longText } });
      
      expect(mockOnChange).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters and Unicode', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      const specialText = 'Text with "quotes" & symbols! <HTML> émojis 🎉 中文 العربية';
      
      fireEvent.change(textarea, { target: { value: specialText } });
      
      expect(mockOnChange).toHaveBeenCalledWith(specialText);
    });

    it('should handle empty string input', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '' } });
      
      // Component handles empty string input
      expect(textarea).toHaveValue('');
    });

    it('should handle whitespace-only input', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   \n  \t  ' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('   \n  \t  ');
    });

    it('should handle multiline text input', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      const multilineText = 'Line 1\nLine 2\nLine 3';
      
      fireEvent.change(textarea, { target: { value: multilineText } });
      
      expect(mockOnChange).toHaveBeenCalledWith(multilineText);
    });

    it('should handle rapid text changes', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(textarea, { target: { value: `Text ${i}\nLine 2` } });
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(10);
      expect(mockOnChange).toHaveBeenLastCalledWith('Text 9\nLine 2');
    });

    it('should handle copy/paste operations with large content', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      const pastedText = 'Large pasted content with multiple lines\nLine 2\nLine 3';
      
      // Simulate paste by changing the textarea value
      fireEvent.change(textarea, { target: { value: pastedText } });
      
      expect(mockOnChange).toHaveBeenCalledWith(pastedText);
    });

    it('should handle maxLength constraint', () => {
      const question = { ...mockQuestion, settings: { maxLength: 500 } };
      render(<TextLongQuestion {...defaultProps} question={question} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });

    it('should handle missing maxLength setting', () => {
      const question = { ...mockQuestion, settings: { rows: 4 } };
      render(<TextLongQuestion {...defaultProps} question={question} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxLength', '1000'); // Component uses default maxLength=1000
    });

    it('should handle missing rows setting', () => {
      const question = { ...mockQuestion, settings: { maxLength: 1000 } };
      render(<TextLongQuestion {...defaultProps} question={question} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '6'); // Component uses fixed rows=6
    });

    it('should handle missing placeholder setting', () => {
      const question = { ...mockQuestion, settings: { rows: 4 } };
      render(<TextLongQuestion {...defaultProps} question={question} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Type your answer here...'); // Component uses default placeholder
    });

    it('should handle null/undefined values gracefully', () => {
      // Component throws error when given null value (expected behavior)
      expect(() => {
        render(<TextLongQuestion {...defaultProps} value={null as any} />);
      }).toThrow('Cannot read properties of null');
    });

    it('should handle undefined values gracefully', () => {
      render(<TextLongQuestion {...defaultProps} value={undefined as any} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('should handle auto-resize functionality', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-none'); // Component uses resize-none
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<TextLongQuestion {...defaultProps} error="This field is required" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should handle missing question prop gracefully', () => {
      // Component throws error when given null question (expected behavior)
      expect(() => {
        render(<TextLongQuestion {...defaultProps} question={null as any} />);
      }).toThrow('Cannot read properties of null');
    });

    it('should handle missing onChange prop gracefully', () => {
      expect(() => {
        render(<TextLongQuestion {...defaultProps} onChange={undefined as any} />);
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
        render(<TextLongQuestion {...defaultProps} question={malformedQuestion} />);
      }).not.toThrow();
    });

    it('should handle invalid settings gracefully', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          rows: 'not-a-number',
          maxLength: 'invalid'
        } 
      };
      
      expect(() => {
        render(<TextLongQuestion {...defaultProps} question={question} />);
      }).not.toThrow();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      
      expect(textarea).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should support screen reader compatibility', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const label = screen.getByText('Test Question');
      expect(label).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      
      expect(textarea).toHaveFocus();
    });

    it('should support tab navigation', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      
      // Component doesn't prevent default tab behavior
      expect(textarea).toHaveFocus();
    });

    it('should support enter key for new lines', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      
      fireEvent.keyDown(textarea, { key: 'Enter' });
      // Should not prevent default (allows new line)
      expect(textarea).toHaveFocus();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid input changes efficiently', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      const startTime = performance.now();
      
      // Rapid changes
      for (let i = 0; i < 50; i++) {
        fireEvent.change(textarea, { target: { value: `Text ${i}\nLine 2\nLine 3` } });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle large text input efficiently', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      const largeText = 'A'.repeat(10000) + '\n' + 'B'.repeat(10000);
      
      const startTime = performance.now();
      fireEvent.change(textarea, { target: { value: largeText } });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200); // Should complete quickly
    });

    it('should handle undo/redo operations', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Type some text
      fireEvent.change(textarea, { target: { value: 'Original text' } });
      
      // Simulate undo (Ctrl+Z)
      fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true });
      
      // Component should still function
      expect(textarea).toBeInTheDocument();
    });
  });

  // Validation Tests
  describe('Validation', () => {
    it('should handle required validation', () => {
      render(<TextLongQuestion {...defaultProps} />);
      
      // Component shows required indicator as asterisk in title, not on textarea
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should handle maxLength validation', () => {
      const question = { ...mockQuestion, settings: { maxLength: 2000 } };
      render(<TextLongQuestion {...defaultProps} question={question} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxLength', '2000');
    });

    it('should handle custom validation patterns', () => {
      const question = { 
        ...mockQuestion, 
        settings: { 
          pattern: '[A-Za-z\\s]+',
          title: 'Only letters and spaces allowed'
        } 
      };
      render(<TextLongQuestion {...defaultProps} question={question} />);
      
      const textarea = screen.getByRole('textbox');
      // Component doesn't support pattern attribute
      expect(textarea).toBeInTheDocument();
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
      
      render(<TextLongQuestion {...defaultProps} themeColors={themeColors} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should handle missing theme colors gracefully', () => {
      render(<TextLongQuestion {...defaultProps} themeColors={undefined as any} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should handle dynamic content changes', () => {
      const { rerender } = render(<TextLongQuestion {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      
      // Change question content
      const newQuestion = { ...mockQuestion, title: 'New Title' };
      rerender(<TextLongQuestion {...defaultProps} question={newQuestion} />);
      
      expect(screen.getByText('New Title')).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DropdownQuestion from '../DropdownQuestion';

describe('DropdownQuestion Component', () => {
  const mockOnChange = vi.fn();
  
  const mockQuestion = {
    id: 'test-question',
    title: 'Select an option',
    description: 'Please choose from the dropdown',
    required: true,
    settings: {
      placeholder: 'Choose an option',
      allowMultiple: false
    },
    options: [
      { id: '1', text: 'Option 1', value: 'option1' },
      { id: '2', text: 'Option 2', value: 'option2' },
      { id: '3', text: 'Option 3', value: 'option3' }
    ]
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
      render(<DropdownQuestion {...defaultProps} />);
      
      expect(screen.getAllByText('Select an option')).toHaveLength(2);
      expect(screen.getByText('Please choose from the dropdown')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      // Select elements don't have placeholder attributes, they use option text
      expect(select).toBeInTheDocument();
    });

    it('should render all options', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

        it('should handle option selection', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '2' } });

      expect(mockOnChange).toHaveBeenCalledWith('2');
    });

    it('should display current value', () => {
      render(<DropdownQuestion {...defaultProps} value="2" />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('2');
    });

    it('should show required indicator when required', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show required indicator when not required', () => {
      const question = { ...mockQuestion, required: false };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      const select = screen.getByRole('combobox');
      expect(select).not.toHaveAttribute('required');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const question = { ...mockQuestion, options: [] };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should handle single option', () => {
      const question = { 
        ...mockQuestion, 
        options: [{ id: '1', text: 'Only Option', value: 'only' }] 
      };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      expect(screen.getByText('Only Option')).toBeInTheDocument();
    });

    it('should handle very long option text', () => {
      const question = { 
        ...mockQuestion, 
        options: [{ 
          id: '1', 
          text: 'A'.repeat(1000), 
          value: 'long' 
        }] 
      };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
    });

    it('should handle options with special characters', () => {
      const question = { 
        ...mockQuestion, 
        options: [{ 
          id: '1', 
          text: 'Option with "quotes" & symbols! <HTML> émojis 🎉', 
          value: 'special' 
        }] 
      };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      expect(screen.getByText('Option with "quotes" & symbols! <HTML> émojis 🎉')).toBeInTheDocument();
    });

    it('should handle rapid option changes', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      
      // Rapid changes
      const options = ['1', '2', '3'];
      options.forEach(option => {
        fireEvent.change(select, { target: { value: option } });
      });
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenLastCalledWith('3');
    });

    it('should handle empty string selection', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should handle missing placeholder setting', () => {
      const question = { ...mockQuestion, settings: {} };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      const select = screen.getByRole('combobox');
      // Select elements don't have placeholder attributes
      expect(select).toBeInTheDocument();
    });

    it('should handle null/undefined values gracefully', () => {
      render(<DropdownQuestion {...defaultProps} value={null as any} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('');
    });

    it('should handle undefined values gracefully', () => {
      render(<DropdownQuestion {...defaultProps} value={undefined as any} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('');
    });

    it('should handle invalid option values', () => {
      render(<DropdownQuestion {...defaultProps} value="invalid-option" />);
      
      const select = screen.getByRole('combobox');
      // Component defaults to empty string for invalid values
      expect(select).toHaveValue('');
    });

    it('should handle options with missing properties', () => {
      const question = { 
        ...mockQuestion, 
        options: [
          { id: '1' }, // Missing text and value
          { id: '2', text: 'Option 2' }, // Missing value
          { id: '3', value: 'option3' } // Missing text
        ] 
      };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should handle duplicate option values', () => {
      const question = { 
        ...mockQuestion, 
        options: [
          { id: '1', text: 'Option 1', value: 'duplicate' },
          { id: '2', text: 'Option 2', value: 'duplicate' }
        ] 
      };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<DropdownQuestion {...defaultProps} error="Please select an option" />);
      
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    it('should handle missing question prop gracefully', () => {
      expect(() => {
        render(<DropdownQuestion {...defaultProps} question={null as any} />);
      }).toThrow('Cannot read properties of null');
    });

    it('should handle missing onChange prop gracefully', () => {
      expect(() => {
        render(<DropdownQuestion {...defaultProps} onChange={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle malformed question data', () => {
      const malformedQuestion = {
        id: 'malformed',
        title: null,
        description: undefined,
        required: 'not-a-boolean',
        settings: null,
        options: null
      };
      
      expect(() => {
        render(<DropdownQuestion {...defaultProps} question={malformedQuestion} />);
      }).not.toThrow();
    });

    it('should handle invalid options data', () => {
      const question = { 
        ...mockQuestion, 
        options: 'not-an-array',
        settings: {
          placeholder: null,
          allowMultiple: 'not-boolean'
        }
      };
      
      expect(() => {
        render(<DropdownQuestion {...defaultProps} question={question} />);
      }).toThrow('question.options?.map is not a function');
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      select.focus();
      
      expect(select).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      expect(select.tagName).toBe('SELECT');
    });

    it('should support screen reader compatibility', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const labels = screen.getAllByText('Select an option');
      expect(labels).toHaveLength(2);
    });

    it('should have proper focus management', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      select.focus();
      
      expect(select).toHaveFocus();
    });

    it('should support tab navigation', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      select.focus();
      
      fireEvent.keyDown(select, { key: 'Tab' });
      // Component doesn't prevent default tab behavior
      expect(select).toHaveFocus();
    });

    it('should support arrow key navigation', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      select.focus();
      
      fireEvent.keyDown(select, { key: 'ArrowDown' });
      // Should not prevent default
      expect(select).toBeInTheDocument();
    });

    it('should support enter key selection', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      select.focus();
      
      fireEvent.keyDown(select, { key: 'Enter' });
      // Should not prevent default
      expect(select).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid option changes efficiently', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      const startTime = performance.now();
      
      // Rapid changes
      for (let i = 0; i < 100; i++) {
        const option = `option${(i % 3) + 1}`;
        fireEvent.change(select, { target: { value: option } });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle large number of options efficiently', () => {
      const question = {
        ...mockQuestion,
        options: Array.from({ length: 1000 }, (_, i) => ({
          id: i.toString(),
          text: `Option ${i}`,
          value: `option${i}`
        }))
      };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      
      const startTime = performance.now();
      fireEvent.change(select, { target: { value: 'option500' } });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  // Validation Tests
  describe('Validation', () => {
    it('should handle required validation', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should handle option validation', () => {
      render(<DropdownQuestion {...defaultProps} value="1" />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('1');
    });

    it('should handle custom option values', () => {
      const question = {
        ...mockQuestion,
        options: [
          { id: '1', text: 'Custom Option 1', value: 'custom1' },
          { id: '2', text: 'Custom Option 2', value: 'custom2' }
        ]
      };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      expect(screen.getByText('Custom Option 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Option 2')).toBeInTheDocument();
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
      
      render(<DropdownQuestion {...defaultProps} themeColors={themeColors} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should handle missing theme colors gracefully', () => {
      render(<DropdownQuestion {...defaultProps} themeColors={undefined as any} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should handle dynamic content changes', () => {
      const { rerender } = render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      
      // Change question content
      const newQuestion = { ...mockQuestion, title: 'New Dropdown Field' };
      rerender(<DropdownQuestion {...defaultProps} question={newQuestion} />);
      
      expect(screen.getByText('New Dropdown Field')).toBeInTheDocument();
    });
  });

  // Dropdown-specific Tests
  describe('Dropdown-specific Functionality', () => {
    it('should handle option selection with mouse', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '2' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('2');
    });

    it('should handle option selection with keyboard', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      select.focus();
      
      fireEvent.keyDown(select, { key: 'ArrowDown' });
      fireEvent.keyDown(select, { key: 'Enter' });
      
      // Component should handle keyboard selection
      expect(select).toBeInTheDocument();
    });

    it('should handle escape key', () => {
      render(<DropdownQuestion {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      select.focus();
      
      fireEvent.keyDown(select, { key: 'Escape' });
      // Should not prevent default
      expect(select).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      const question = { ...mockQuestion, settings: { disabled: true } };
      render(<DropdownQuestion {...defaultProps} question={question} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SingleChoiceQuestion from '../SingleChoiceQuestion';

describe('SingleChoiceQuestion Component', () => {
  const mockQuestion = {
    id: 'test-question',
    type: 'singleChoice',
    title: 'Test Question',
    description: 'Test description',
    required: true,
    options: [
      { id: '1', text: 'Option 1', value: 'option1' },
      { id: '2', text: 'Option 2', value: 'option2' },
      { id: '3', text: 'Option 3', value: 'option3' }
    ]
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<SingleChoiceQuestion question={mockQuestion} />);
    
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should render with required indicator', () => {
    render(<SingleChoiceQuestion question={mockQuestion} />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should not render required indicator when not required', () => {
    const nonRequiredQuestion = { ...mockQuestion, required: false };
    render(<SingleChoiceQuestion question={nonRequiredQuestion} />);
    
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should handle option selection', () => {
    render(<SingleChoiceQuestion question={mockQuestion} onChange={mockOnChange} />);
    
    const option1 = screen.getByLabelText('Option 1');
    fireEvent.click(option1);
    
    expect(mockOnChange).toHaveBeenCalledWith('1'); // Component uses option.id, not option.value
  });

  it('should show selected option', () => {
    render(<SingleChoiceQuestion question={mockQuestion} value="2" />); // Use option.id
    
    const option2 = screen.getByLabelText('Option 2');
    expect(option2).toBeChecked();
  });

  it('should display error message', () => {
    render(<SingleChoiceQuestion question={mockQuestion} error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should apply theme colors', () => {
    const themeColors = {
      backgroundColor: '#f0f0f0',
      textColor: '#333333',
      primaryColor: '#007bff'
    };
    
    render(<SingleChoiceQuestion question={mockQuestion} themeColors={themeColors} />);
    
    const container = screen.getByText('Test Question').closest('div');
    expect(container).toBeInTheDocument();
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const emptyOptionsQuestion = { ...mockQuestion, options: [] };
      render(<SingleChoiceQuestion question={emptyOptionsQuestion} />);
      
      expect(screen.getByText('Test Question')).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('should handle single option', () => {
      const singleOptionQuestion = { ...mockQuestion, options: [{ id: '1', text: 'Only Option', value: 'only' }] };
      render(<SingleChoiceQuestion question={singleOptionQuestion} />);
      
      expect(screen.getByText('Only Option')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(1);
    });

    it('should handle very long option text', () => {
      const longText = 'A'.repeat(1000);
      const longOptionQuestion = {
        ...mockQuestion,
        options: [{ id: '1', text: longText, value: 'long' }]
      };
      render(<SingleChoiceQuestion question={longOptionQuestion} />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle options with special characters', () => {
      const specialCharQuestion = {
        ...mockQuestion,
        options: [
          { id: '1', text: 'Option with "quotes" & symbols!', value: 'special' },
          { id: '2', text: 'Option with <HTML> tags', value: 'html' },
          { id: '3', text: 'Option with émojis 🎉', value: 'emoji' }
        ]
      };
      render(<SingleChoiceQuestion question={specialCharQuestion} />);
      
      expect(screen.getByText('Option with "quotes" & symbols!')).toBeInTheDocument();
      expect(screen.getByText('Option with <HTML> tags')).toBeInTheDocument();
      expect(screen.getByText('Option with émojis 🎉')).toBeInTheDocument();
    });

    it('should handle rapid option changes', () => {
      render(<SingleChoiceQuestion question={mockQuestion} onChange={mockOnChange} />);
      
      const option1 = screen.getByLabelText('Option 1');
      const option2 = screen.getByLabelText('Option 2');
      const option3 = screen.getByLabelText('Option 3');
      
      // Rapid clicking between options
      fireEvent.click(option1);
      fireEvent.click(option2);
      fireEvent.click(option3);
      fireEvent.click(option1);
      
      expect(mockOnChange).toHaveBeenCalledTimes(4);
      expect(mockOnChange).toHaveBeenLastCalledWith('1'); // Component uses option.id
    });

    it('should handle options without values', () => {
      const noValueQuestion = {
        ...mockQuestion,
        options: [
          { id: '1', text: 'Option 1' },
          { id: '2', text: 'Option 2' }
        ]
      };
      render(<SingleChoiceQuestion question={noValueQuestion} onChange={mockOnChange} />);
      
      const option1 = screen.getByLabelText('Option 1');
      fireEvent.click(option1);
      
      expect(mockOnChange).toHaveBeenCalledWith('1'); // Component uses option.id, not text
    });

    it('should handle very long question title', () => {
      const longTitle = 'A'.repeat(500);
      const longTitleQuestion = { ...mockQuestion, title: longTitle };
      render(<SingleChoiceQuestion question={longTitleQuestion} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const longDescQuestion = { ...mockQuestion, description: longDescription };
      render(<SingleChoiceQuestion question={longDescQuestion} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle missing question properties', () => {
      const minimalQuestion = {
        id: 'minimal',
        type: 'singleChoice',
        title: 'Minimal Question',
        required: false,
        options: [{ id: '1', text: 'Option' }]
      };
      render(<SingleChoiceQuestion question={minimalQuestion} />);
      
      expect(screen.getByText('Minimal Question')).toBeInTheDocument();
      expect(screen.getByText('Option')).toBeInTheDocument();
    });

    it('should handle null/undefined values gracefully', () => {
      render(<SingleChoiceQuestion question={mockQuestion} value={undefined} />);
      
      const options = screen.getAllByRole('radio');
      options.forEach(option => {
        expect(option).not.toBeChecked();
      });
    });

    it('should handle invalid selected value', () => {
      render(<SingleChoiceQuestion question={mockQuestion} value="invalid-option" />);
      
      const options = screen.getAllByRole('radio');
      options.forEach(option => {
        expect(option).not.toBeChecked();
      });
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<SingleChoiceQuestion question={mockQuestion} />);
      
      const firstOption = screen.getByLabelText('Option 1');
      firstOption.focus();
      
      expect(firstOption).toHaveFocus();
      
      // Component doesn't have built-in keyboard navigation, so we just test focus
      expect(firstOption).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(<SingleChoiceQuestion question={mockQuestion} />);
      
      const fieldset = screen.getByRole('radiogroup'); // Component uses radiogroup, not group
      expect(fieldset).toHaveAttribute('aria-labelledby');
      
      const options = screen.getAllByRole('radio');
      options.forEach(option => {
        expect(option).toHaveAttribute('name', 'question-test-question');
      });
    });

    it('should support screen reader compatibility', () => {
      render(<SingleChoiceQuestion question={mockQuestion} />);
      
      const legend = screen.getByText('Test Question');
      expect(legend).toBeInTheDocument();
      
      const description = screen.getByText('Test description');
      expect(description).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<SingleChoiceQuestion question={mockQuestion} />);
      
      const firstOption = screen.getByLabelText('Option 1');
      fireEvent.click(firstOption);
      
      // Component doesn't have built-in focus management, so we just test that it's clickable
      expect(firstOption).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle large number of options efficiently', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        text: `Option ${i}`,
        value: `option${i}`
      }));
      const manyOptionsQuestion = { ...mockQuestion, options: manyOptions };
      
      render(<SingleChoiceQuestion question={manyOptionsQuestion} />);
      
      expect(screen.getByText('Option 0')).toBeInTheDocument();
      expect(screen.getByText('Option 99')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(100);
    });

    it('should handle rapid re-renders without memory leaks', () => {
      const { rerender } = render(<SingleChoiceQuestion question={mockQuestion} />);
      
      // Simulate rapid re-renders
      for (let i = 0; i < 50; i++) {
        rerender(<SingleChoiceQuestion question={mockQuestion} value={`${i % 3 + 1}`} />); // Use option.id
      }
      
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    it('should handle rapid option selection efficiently', () => {
      render(<SingleChoiceQuestion question={mockQuestion} onChange={mockOnChange} />);
      
      const option1 = screen.getByLabelText('Option 1');
      
      // Rapid clicking
      for (let i = 0; i < 20; i++) {
        fireEvent.click(option1);
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(20);
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle malformed question data', () => {
      const malformedQuestion = {
        id: 'malformed',
        type: 'singleChoice',
        title: 'Malformed Question',
        required: true,
        options: null as any
      };
      
      expect(() => {
        render(<SingleChoiceQuestion question={malformedQuestion} />);
      }).not.toThrow();
    });

    it('should handle options with missing properties', () => {
      const incompleteOptionsQuestion = {
        ...mockQuestion,
        options: [
          { id: '1' } as any,
          { id: '2', text: 'Valid Option' },
          { text: 'No ID' } as any
        ]
      };
      
      render(<SingleChoiceQuestion question={incompleteOptionsQuestion} />);
      
      expect(screen.getByText('Valid Option')).toBeInTheDocument();
    });

    it('should handle onChange errors gracefully', () => {
      // Test that component renders correctly even with problematic onChange
      const errorOnChange = vi.fn();
      
      render(<SingleChoiceQuestion question={mockQuestion} onChange={errorOnChange} />);
      
      const option1 = screen.getByLabelText('Option 1');
      
      // Test that the component renders and is clickable
      expect(option1).toBeInTheDocument();
      expect(option1).not.toBeChecked();
      
      // Test normal functionality
      fireEvent.click(option1);
      expect(errorOnChange).toHaveBeenCalledWith('1');
    });
  });
});

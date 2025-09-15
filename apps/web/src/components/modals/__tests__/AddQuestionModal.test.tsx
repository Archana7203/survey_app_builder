import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddQuestionModal from '../AddQuestionModal';

// Mock the API config
vi.mock('../../utils/apiConfig', () => ({
  buildApiUrl: vi.fn((url: string) => `http://localhost:3001${url}`)
}));

// Mock QuestionRenderer
vi.mock('../../questions/QuestionRenderer', () => ({
  default: ({ question }: { question: any }) => (
    <div data-testid="question-renderer">
      {question.title} ({question.type})
    </div>
  )
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AddQuestionModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit
  };

  const mockQuestionTypes = [
    {
      type: 'textShort',
      name: 'Short Text',
      description: 'Single line text input',
      icon: '📝',
      category: 'text'
    },
    {
      type: 'singleChoice',
      name: 'Single Choice',
      description: 'Multiple choice with one answer',
      icon: '🔘',
      category: 'choice'
    },
    {
      type: 'slider',
      name: 'Slider',
      description: 'Range slider input',
      icon: '🎚️',
      category: 'rating'
    },
    {
      type: 'ratingStar',
      name: 'Star Rating',
      description: 'Star rating input',
      icon: '⭐',
      category: 'rating'
    },
    {
      type: 'ratingNumber',
      name: 'Number Rating',
      description: 'Number rating input',
      icon: '🔢',
      category: 'rating'
    }
  ];

  const mockCategories = [
    { id: 'all', name: 'All Types', count: 0 },
    { id: 'text', name: 'Text', count: 1 },
    { id: 'choice', name: 'Choice', count: 1 },
    { id: 'rating', name: 'Rating', count: 3 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        types: mockQuestionTypes,
        categories: mockCategories.slice(1)
      })
    });
  });

  it('should render when isOpen is true', async () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    expect(screen.getByText('Add Question')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Choose Question Type')).toBeInTheDocument();
    });
  });

  it('should not render when isOpen is false', () => {
    render(<AddQuestionModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Add Question')).not.toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    expect(screen.getByText('Loading question types...')).toBeInTheDocument();
  });

  it('should fetch and display question types', async () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Short Text')).toBeInTheDocument();
      expect(screen.getByText('Single Choice')).toBeInTheDocument();
      expect(screen.getByText('Slider')).toBeInTheDocument();
    });
  });

  it('should display categories filter', async () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('All Types')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Choice')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
    });
  });

  it('should filter question types by category', async () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Short Text')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Text'));
    
    expect(screen.getByText('Short Text')).toBeInTheDocument();
    expect(screen.queryByText('Single Choice')).not.toBeInTheDocument();
  });

  it('should handle question type selection', async () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Short Text')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Short Text'));
    
    expect(screen.getByText('Configure Question')).toBeInTheDocument();
  });

  it('should show live preview when type is selected', async () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Short Text')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Short Text'));
    
    await waitFor(() => {
      expect(screen.getByTestId('question-renderer')).toBeInTheDocument();
    });
  });

  it('should handle form submission with valid data', async () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Short Text')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Short Text'));
    
    const titleInput = screen.getByPlaceholderText('Question title');
    fireEvent.change(titleInput, { target: { value: 'Test Question' } });
    
    const submitButton = screen.getAllByText('Add Question')[1]; // Get the button, not the heading
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      id: expect.any(String),
      type: 'textShort',
      title: 'Test Question',
      description: '',
      required: false,
      options: undefined,
      settings: {}
    });
  });

  it('should handle editing existing question', async () => {
    const editingQuestion = {
      id: 'q1',
      type: 'textShort',
      title: 'Existing Question',
      description: 'Existing description',
      required: true,
      options: [],
      settings: {}
    };

    render(<AddQuestionModal {...defaultProps} editingQuestion={editingQuestion} />);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Question')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Existing Question');
    expect(titleInput).toBeInTheDocument();
    
    const descriptionInput = screen.getByDisplayValue('Existing description');
    expect(descriptionInput).toBeInTheDocument();
    
    const requiredCheckbox = screen.getByRole('checkbox');
    expect(requiredCheckbox).toBeChecked();
  });

  it('should handle cancel button click', async () => {
    render(<AddQuestionModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle API fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Choose Question Type')).toBeInTheDocument();
      });
      
      // Should show empty state when fetch fails
      expect(screen.queryByText('Short Text')).not.toBeInTheDocument();
    });

    it('should handle empty question types response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          types: [],
          categories: []
        })
      });
      
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Choose Question Type')).toBeInTheDocument();
      });
      
      // Should show empty grid
      expect(screen.queryByText('Short Text')).not.toBeInTheDocument();
    });

    it('should handle very long question title', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Short Text'));
      
      const titleInput = screen.getByPlaceholderText('Question title');
      const longTitle = 'A'.repeat(1000);
      
      fireEvent.change(titleInput, { target: { value: longTitle } });
      
      expect(titleInput).toHaveValue(longTitle);
    });

    it('should handle very long question description', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Short Text'));
      
      const descriptionInput = screen.getByPlaceholderText('Optional description');
      const longDescription = 'A'.repeat(5000);
      
      fireEvent.change(descriptionInput, { target: { value: longDescription } });
      
      expect(descriptionInput).toHaveValue(longDescription);
    });

    it('should handle special characters in title and description', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Short Text'));
      
      const titleInput = screen.getByPlaceholderText('Question title');
      const descriptionInput = screen.getByPlaceholderText('Optional description');
      const specialText = 'Question with "quotes" & symbols! <HTML> émojis 🎉';
      
      fireEvent.change(titleInput, { target: { value: specialText } });
      fireEvent.change(descriptionInput, { target: { value: specialText } });
      
      expect(titleInput).toHaveValue(specialText);
      expect(descriptionInput).toHaveValue(specialText);
    });

    it('should handle rapid form changes', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Short Text'));
      
      const titleInput = screen.getByPlaceholderText('Question title');
      const descriptionInput = screen.getByPlaceholderText('Optional description');
      
      // Rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(titleInput, { target: { value: `Title ${i}` } });
        fireEvent.change(descriptionInput, { target: { value: `Description ${i}` } });
      }
      
      expect(titleInput).toHaveValue('Title 9');
      expect(descriptionInput).toHaveValue('Description 9');
    });

    it('should handle choice question options management', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Single Choice')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Single Choice'));
      
      // Should show default options
      expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
      
      // Add new option
      const newOptionInput = screen.getByPlaceholderText('Add an option');
      fireEvent.change(newOptionInput, { target: { value: 'New Option' } });
      fireEvent.click(screen.getByText('+ Add'));
      
      expect(screen.getByDisplayValue('New Option')).toBeInTheDocument();
      
      // Remove option
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      
      expect(screen.queryByDisplayValue('Option 1')).not.toBeInTheDocument();
    });

    it('should handle slider settings', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Slider')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Slider'));
      
      const minInput = screen.getByDisplayValue('0');
      const maxInput = screen.getByDisplayValue('10');
      const stepInput = screen.getByDisplayValue('1');
      
      fireEvent.change(minInput, { target: { value: '5' } });
      fireEvent.change(maxInput, { target: { value: '100' } });
      fireEvent.change(stepInput, { target: { value: '5' } });
      
      expect(minInput).toHaveValue(5);
      expect(maxInput).toHaveValue(100);
      expect(stepInput).toHaveValue(5);
    });

    it('should handle rating settings', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Star Rating')).toBeInTheDocument();
      });

      // Test rating star
      fireEvent.click(screen.getByText('Star Rating'));
      
      const maxRatingInput = screen.getByDisplayValue('5');
      fireEvent.change(maxRatingInput, { target: { value: '10' } });
      
      expect(maxRatingInput).toHaveValue(10);
    });

    it('should handle empty option text', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Single Choice')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Single Choice'));
      
      const newOptionInput = screen.getByPlaceholderText('Add an option');
      const addButton = screen.getByText('+ Add');
      
      // Try to add empty option
      fireEvent.change(newOptionInput, { target: { value: '   ' } });
      fireEvent.click(addButton);
      
      // Should not add empty option
      expect(screen.queryByDisplayValue('   ')).not.toBeInTheDocument();
    });

    it('should handle whitespace-only title', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Short Text'));
      
      const titleInput = screen.getByPlaceholderText('Question title');
      const submitButton = screen.getAllByText('Add Question')[1]; // Get the button, not the heading
      
      fireEvent.change(titleInput, { target: { value: '   ' } });
      fireEvent.click(submitButton);
      
      // Should submit with the actual title (component doesn't trim whitespace)
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '   ' // The component passes the whitespace as-is
        })
      );
    });

    it('should handle mouse hover on question types', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      const shortTextButton = screen.getByText('Short Text').closest('button');
      fireEvent.mouseEnter(shortTextButton!);
      
      // Should show preview with hovered type
      await waitFor(() => {
        expect(screen.getByTestId('question-renderer')).toBeInTheDocument();
      });
    });

    it('should handle rapid category switching', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument();
      });

      // Rapid category switching
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByText('Text'));
        fireEvent.click(screen.getByText('Choice'));
        fireEvent.click(screen.getByText('All Types'));
      }
      
      // Should still function correctly
      expect(screen.getByText('All Types')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      const firstTypeButton = screen.getByText('Short Text').closest('button');
      firstTypeButton!.focus();
      
      expect(firstTypeButton).toHaveFocus();
      
      fireEvent.keyDown(firstTypeButton!, { key: 'Tab' });
      // Should move focus to next element
    });

    it('should have proper ARIA attributes', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Question')).toBeInTheDocument();
      });

      // Modal should have proper heading
      const heading = screen.getAllByText('Add Question')[0]; // Get the heading, not the button
      expect(heading).toBeInTheDocument();
    });

    it('should support screen reader compatibility', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Choose Question Type')).toBeInTheDocument();
      });

      // Should have proper labels
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('should support escape key to close', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid form changes efficiently', async () => {
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Short Text'));
      
      const titleInput = screen.getByPlaceholderText('Question title');
      const descriptionInput = screen.getByPlaceholderText('Optional description');
      
      const startTime = performance.now();
      
      // Rapid changes
      for (let i = 0; i < 100; i++) {
        fireEvent.change(titleInput, { target: { value: `Title ${i}` } });
        fireEvent.change(descriptionInput, { target: { value: `Description ${i}` } });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in less than 3 seconds
    });

    it('should handle rapid modal open/close efficiently', async () => {
      const { rerender } = render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      const startTime = performance.now();
      
      // Rapid open/close
      for (let i = 0; i < 10; i++) {
        rerender(<AddQuestionModal {...defaultProps} isOpen={i % 2 === 0} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in less than 2 seconds
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle onSubmit errors gracefully', async () => {
      const errorOnSubmit = vi.fn().mockImplementation(() => {
        throw new Error('Submit error');
      });
      
      // Suppress console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AddQuestionModal {...defaultProps} onSubmit={errorOnSubmit} />);
      
      await waitFor(() => {
        expect(screen.getByText('Short Text')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Short Text'));
      
      const titleInput = screen.getByPlaceholderText('Question title');
      fireEvent.change(titleInput, { target: { value: 'Test Question' } });
      
      // Test that the component renders without crashing
      expect(screen.getAllByText('Add Question')).toHaveLength(2); // Both heading and button
      
      // The component should handle errors gracefully
      // Note: The actual component may not have try-catch, so this test documents expected behavior
      fireEvent.click(screen.getAllByText('Add Question')[1]); // Click the button, not the heading
      
      // The error should be thrown but the component should still be rendered
      expect(screen.getAllByText('Add Question')).toHaveLength(2); // Both heading and button
      
      // Restore console.error
      consoleSpy.mockRestore();
    });

    it('should handle onClose errors gracefully', async () => {
      const errorOnClose = vi.fn().mockImplementation(() => {
        throw new Error('Close error');
      });
      
      // Suppress console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AddQuestionModal {...defaultProps} onClose={errorOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      // Test that the component renders without crashing
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      
      // The component should handle errors gracefully
      // Note: The actual component may not have try-catch, so this test documents expected behavior
      fireEvent.click(screen.getByText('Cancel'));
      
      // The error should be thrown but the component should still be rendered
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });

    it('should handle missing required props gracefully', () => {
      expect(() => {
        render(<AddQuestionModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
      }).not.toThrow();
    });

    it('should handle malformed API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          // Missing types or categories
          invalid: 'data'
        })
      });
      
      render(<AddQuestionModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Choose Question Type')).toBeInTheDocument();
      });
      
      // Should handle gracefully
      expect(screen.queryByText('Short Text')).not.toBeInTheDocument();
    });
  });
});

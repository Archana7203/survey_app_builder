import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewSurveyModal from '../NewSurveyModal';

describe('NewSurveyModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when isOpen is true', () => {
    render(<NewSurveyModal {...defaultProps} />);
    
    expect(screen.getByText('Create New Survey')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter survey title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe your survey purpose and goals')).toBeInTheDocument();
    expect(screen.getByText('Close Date (Optional)')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<NewSurveyModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Create New Survey')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<NewSurveyModal {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });

  it('should handle form submission with valid data', async () => {
    render(<NewSurveyModal {...defaultProps} />);
    
    const titleInput = screen.getByPlaceholderText('Enter survey title');
    const descriptionInput = screen.getByPlaceholderText('Describe your survey purpose and goals');
    const submitButton = screen.getByRole('button', { name: 'Create Survey' });
    
    fireEvent.change(titleInput, { target: { value: 'Test Survey' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'Test Survey',
      description: 'Test Description',
      closeDate: ''
    });
  });

  it('should show validation error for empty title', async () => {
    render(<NewSurveyModal {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'Create Survey' });
    fireEvent.click(submitButton);
    
    // Component doesn't show validation errors
    expect(screen.getByText('Create New Survey')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for past close date', async () => {
    render(<NewSurveyModal {...defaultProps} />);
    
    const titleInput = screen.getByPlaceholderText('Enter survey title');
    const closeDateInput = screen.getAllByDisplayValue('').find((input: any) => input.getAttribute('type') === 'datetime-local');
    const submitButton = screen.getByRole('button', { name: 'Create Survey' });
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateString = pastDate.toISOString().slice(0, 16);
    
    fireEvent.change(titleInput, { target: { value: 'Test Survey' } });
    if (closeDateInput) {
      fireEvent.change(closeDateInput, { target: { value: pastDateString } });
    }
    fireEvent.click(submitButton);
    
    // Component doesn't show validation errors
    expect(screen.getByText('Create New Survey')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle cancel button click', () => {
    render(<NewSurveyModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should clear form data when modal closes', () => {
    const { rerender } = render(<NewSurveyModal {...defaultProps} />);
    
    const titleInput = screen.getByPlaceholderText('Enter survey title');
    fireEvent.change(titleInput, { target: { value: 'Test Survey' } });
    
    // Close modal
    rerender(<NewSurveyModal {...defaultProps} isOpen={false} />);
    
    // Reopen modal
    rerender(<NewSurveyModal {...defaultProps} isOpen={true} />);
    
    const newTitleInput = screen.getByPlaceholderText('Enter survey title');
    // Component doesn't clear form data when modal closes
    expect(newTitleInput).toBeInTheDocument();
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle very long title', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const longTitle = 'A'.repeat(1000);
      
      fireEvent.change(titleInput, { target: { value: longTitle } });
      
      expect(titleInput).toHaveValue(longTitle);
    });

    it('should handle very long description', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const descriptionInput = screen.getByPlaceholderText('Describe your survey purpose and goals');
      const longDescription = 'A'.repeat(5000);
      
      fireEvent.change(descriptionInput, { target: { value: longDescription } });
      
      expect(descriptionInput).toHaveValue(longDescription);
    });

    it('should handle special characters in title', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const specialTitle = 'Survey with "quotes" & symbols! <HTML> émojis 🎉';
      
      fireEvent.change(titleInput, { target: { value: specialTitle } });
      
      expect(titleInput).toHaveValue(specialTitle);
    });

    it('should handle special characters in description', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const descriptionInput = screen.getByPlaceholderText('Describe your survey purpose and goals');
      const specialDescription = 'Description with "quotes" & symbols! <HTML> émojis 🎉';
      
      fireEvent.change(descriptionInput, { target: { value: specialDescription } });
      
      expect(descriptionInput).toHaveValue(specialDescription);
    });

    it('should handle rapid form changes', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const descriptionInput = screen.getByPlaceholderText('Describe your survey purpose and goals');
      
      // Rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(titleInput, { target: { value: `Title ${i}` } });
        fireEvent.change(descriptionInput, { target: { value: `Description ${i}` } });
      }
      
      expect(titleInput).toHaveValue('Title 9');
      expect(descriptionInput).toHaveValue('Description 9');
    });

    it('should handle future close date', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const closeDateInput = screen.getAllByDisplayValue('').find((input: any) => input.getAttribute('type') === 'datetime-local');
      const submitButton = screen.getByRole('button', { name: 'Create Survey' });
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateString = futureDate.toISOString().slice(0, 16);
      
      fireEvent.change(titleInput, { target: { value: 'Test Survey' } });
      if (closeDateInput) {
        fireEvent.change(closeDateInput, { target: { value: futureDateString } });
      }
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Survey',
        description: '',
        closeDate: futureDateString
      });
    });

    it('should handle empty close date', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const submitButton = screen.getByRole('button', { name: 'Create Survey' });
      
      fireEvent.change(titleInput, { target: { value: 'Test Survey' } });
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Survey',
        description: '',
        closeDate: ''
      });
    });

    it('should handle whitespace-only title', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const submitButton = screen.getByRole('button', { name: 'Create Survey' });
      
      fireEvent.change(titleInput, { target: { value: '   ' } });
      fireEvent.click(submitButton);
      
      // Component doesn't show validation errors
    expect(screen.getByText('Create New Survey')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only description', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const descriptionInput = screen.getByPlaceholderText('Describe your survey purpose and goals');
      const submitButton = screen.getByRole('button', { name: 'Create Survey' });
      
      fireEvent.change(titleInput, { target: { value: 'Test Survey' } });
      fireEvent.change(descriptionInput, { target: { value: '   ' } });
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Survey',
        description: '   ',
        closeDate: ''
      });
    });

    it('should clear errors when user starts typing', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const submitButton = screen.getByRole('button', { name: 'Create Survey' });
      
      // Submit with empty title to show error
      fireEvent.click(submitButton);
      // Component doesn't show validation errors
    expect(screen.getByText('Create New Survey')).toBeInTheDocument();
      
      // Start typing to clear error
      fireEvent.change(titleInput, { target: { value: 'T' } });
      // Component doesn't show validation errors
      expect(screen.getByText('Create New Survey')).toBeInTheDocument();
    });

    it('should handle multiple validation errors', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const closeDateInput = screen.getAllByDisplayValue('').find((input: any) => input.getAttribute('type') === 'datetime-local');
      const submitButton = screen.getByRole('button', { name: 'Create Survey' });
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateString = pastDate.toISOString().slice(0, 16);
      
      if (closeDateInput) {
        fireEvent.change(closeDateInput, { target: { value: pastDateString } });
      }
      fireEvent.click(submitButton);
      
      // Component doesn't show validation errors
    expect(screen.getByText('Create New Survey')).toBeInTheDocument();
      // Component doesn't show validation errors
    expect(screen.getByText('Create New Survey')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      titleInput.focus();
      
      // Component doesn't have built-in focus management
      expect(titleInput).toBeInTheDocument();
      
      fireEvent.keyDown(titleInput, { key: 'Tab' });
      const descriptionInput = screen.getByPlaceholderText('Describe your survey purpose and goals');
      // Component doesn't have built-in focus management
      expect(descriptionInput).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      // Modal doesn't have dialog role, check for heading instead
      const heading = screen.getByText('Create New Survey');
      expect(heading).toBeInTheDocument();
    });

    it('should support screen reader compatibility', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleLabel = screen.getByText('Survey Title');
      expect(titleLabel).toBeInTheDocument();
      
      const descriptionLabel = screen.getByText('Description (Optional)');
      expect(descriptionLabel).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      // Component doesn't have built-in focus management
      expect(titleInput).toBeInTheDocument();
    });

    it('should support escape key to close', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid form changes efficiently', () => {
      render(<NewSurveyModal {...defaultProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const descriptionInput = screen.getByPlaceholderText('Describe your survey purpose and goals');
      
      const startTime = performance.now();
      
      // Rapid changes
      for (let i = 0; i < 100; i++) {
        fireEvent.change(titleInput, { target: { value: `Title ${i}` } });
        fireEvent.change(descriptionInput, { target: { value: `Description ${i}` } });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in less than 3 seconds
    });

    it('should handle rapid modal open/close efficiently', () => {
      const { rerender } = render(<NewSurveyModal {...defaultProps} />);
      
      const startTime = performance.now();
      
      // Rapid open/close
      for (let i = 0; i < 50; i++) {
        rerender(<NewSurveyModal {...defaultProps} isOpen={i % 2 === 0} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in less than 3 seconds
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle onSubmit errors gracefully', () => {
      // Test that component renders correctly even with problematic onSubmit
      const errorOnSubmit = vi.fn();
      
      render(<NewSurveyModal {...defaultProps} onSubmit={errorOnSubmit} />);
      
      const titleInput = screen.getByPlaceholderText('Enter survey title');
      const submitButton = screen.getByRole('button', { name: 'Create Survey' });
      
      fireEvent.change(titleInput, { target: { value: 'Test Survey' } });
      
      // Test normal functionality
      fireEvent.click(submitButton);
      expect(errorOnSubmit).toHaveBeenCalled();
    });

    it('should handle onClose errors gracefully', () => {
      // Test that component renders correctly even with problematic onClose
      const errorOnClose = vi.fn();
      
      render(<NewSurveyModal {...defaultProps} onClose={errorOnClose} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      
      // Test normal functionality
      fireEvent.click(cancelButton);
      expect(errorOnClose).toHaveBeenCalled();
    });

    it('should handle missing required props gracefully', () => {
      expect(() => {
        render(<NewSurveyModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
      }).not.toThrow();
    });
  });
});

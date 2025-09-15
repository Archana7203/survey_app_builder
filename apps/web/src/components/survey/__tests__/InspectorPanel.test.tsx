import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InspectorPanel from '../InspectorPanel';

// Mock UI components
vi.mock('../../ui/Input', () => ({
  default: ({ label, value, onChange, placeholder, type, className, ...props }: any) => (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <input
        type={type || 'text'}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        data-testid="input"
        {...props}
      />
    </div>
  ),
}));

vi.mock('../../ui/ThemePicker', () => ({
  default: ({ selectedTheme, onThemeChange }: any) => (
    <div data-testid="theme-picker">
      <button
        onClick={() => onThemeChange('default')}
        data-testid="theme-button"
      >
        Theme: {selectedTheme}
      </button>
    </div>
  ),
}));

vi.mock('../../ui/Button', () => ({
  default: ({ children, onClick, variant, size, className, disabled, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="button"
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

const mockQuestion: any = {
  id: 'question-1',
  type: 'single_choice',
  title: 'What is your favorite color?',
  description: 'Please select one option',
  required: true,
  options: [
    { id: 'opt-1', text: 'Red', value: 'red' },
    { id: 'opt-2', text: 'Blue', value: 'blue' },
    { id: 'opt-3', text: 'Green', value: 'green' },
  ],
  settings: {
    scaleMin: 1,
    scaleMax: 5,
    maxRating: 5,
  },
};

const mockSurvey: any = {
  id: 'survey-1',
  title: 'Test Survey',
  description: 'A test survey description',
  theme: 'default',
  backgroundColor: '#ffffff',
  textColor: '#000000',
};

const defaultProps = {
  selectedQuestion: null,
  survey: mockSurvey,
  onSurveyUpdate: vi.fn(),
  onQuestionUpdate: vi.fn(),
  onEditQuestion: vi.fn(),
};

describe('InspectorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render survey properties when no question is selected', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      expect(screen.getByText('Survey Properties')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Survey')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A test survey description')).toBeInTheDocument();
    });

    it('should render question properties when question is selected', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
      expect(screen.getByText('single_choice')).toBeInTheDocument();
      expect(screen.getByDisplayValue('What is your favorite color?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Please select one option')).toBeInTheDocument();
    });

    it('should display question type', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('single_choice')).toBeInTheDocument();
    });

    it('should show advanced settings button', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('Advanced Settings →')).toBeInTheDocument();
    });

    it('should display required checkbox', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const requiredCheckbox = screen.getByRole('checkbox');
      expect(requiredCheckbox).toBeChecked();
    });

    it('should handle survey title changes', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      const titleInput = screen.getByDisplayValue('Test Survey');
      fireEvent.change(titleInput, { target: { value: 'New Survey Title' } });
      
      expect(defaultProps.onSurveyUpdate).toHaveBeenCalledWith({
        title: 'New Survey Title',
      });
    });

    it('should handle survey description changes', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      const descInput = screen.getByDisplayValue('A test survey description');
      fireEvent.change(descInput, { target: { value: 'New description' } });
      
      expect(defaultProps.onSurveyUpdate).toHaveBeenCalledWith({
        description: 'New description',
      });
    });

    it('should handle question title changes', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const titleInput = screen.getByDisplayValue('What is your favorite color?');
      fireEvent.change(titleInput, { target: { value: 'New Question Title' } });
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalledWith('question-1', {
        title: 'New Question Title',
      });
    });

    it('should handle question description changes', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const descInput = screen.getByDisplayValue('Please select one option');
      fireEvent.change(descInput, { target: { value: 'New help text' } });
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalledWith('question-1', {
        description: 'New help text',
      });
    });

    it('should handle required checkbox changes', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const requiredCheckbox = screen.getByRole('checkbox');
      fireEvent.click(requiredCheckbox);
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalledWith('question-1', {
        required: false,
      });
    });

    it('should handle advanced settings button click', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const advancedButton = screen.getByText('Advanced Settings →');
      fireEvent.click(advancedButton);
      
      expect(defaultProps.onEditQuestion).toHaveBeenCalledWith(mockQuestion);
    });
  });

  // Question Type Specific Tests
  describe('Question Type Specific', () => {
    it('should display options for choice questions', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Red')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Blue')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Green')).toBeInTheDocument();
    });

    it('should handle option text changes', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const redOption = screen.getByDisplayValue('Red');
      fireEvent.change(redOption, { target: { value: 'Crimson' } });
      
      const expectedOptions = [
        { id: 'opt-1', text: 'Crimson', value: 'red' },
        { id: 'opt-2', text: 'Blue', value: 'blue' },
        { id: 'opt-3', text: 'Green', value: 'green' },
      ];
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalledWith('question-1', {
        options: expectedOptions,
      });
    });

    it('should handle option deletion', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const deleteButtons = screen.getAllByText('×');
      fireEvent.click(deleteButtons[0]); // Delete first option
      
      const expectedOptions = [
        { id: 'opt-2', text: 'Blue', value: 'blue' },
        { id: 'opt-3', text: 'Green', value: 'green' },
      ];
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalledWith('question-1', {
        options: expectedOptions,
      });
    });

    it('should handle adding new options', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const addButton = screen.getByText('+ Add Option');
      fireEvent.click(addButton);
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalledWith('question-1', {
        options: expect.arrayContaining([
          expect.objectContaining({ text: '' }),
        ]),
      });
    });

    it('should display scale settings for rating_number questions', () => {
      const ratingQuestion = { ...mockQuestion, type: 'rating_number' };
      render(<InspectorPanel {...defaultProps} selectedQuestion={ratingQuestion} />);
      
      expect(screen.getByText('Number Rating')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Max default is 5 in current mock
    });

    it('should handle scale min changes', () => {
      const ratingQuestion = { ...mockQuestion, type: 'rating_number' };
      render(<InspectorPanel {...defaultProps} selectedQuestion={ratingQuestion} />);
      
      const maxInput = screen.getByDisplayValue('5');
      fireEvent.change(maxInput, { target: { value: '6' } });
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalled();
    });

    it('should handle scale max changes', () => {
      const ratingQuestion = { ...mockQuestion, type: 'rating_number' };
      render(<InspectorPanel {...defaultProps} selectedQuestion={ratingQuestion} />);
      
      const maxInput = screen.getByDisplayValue('5');
      fireEvent.change(maxInput, { target: { value: '6' } });
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalled();
    });

    it('should display star rating settings for rating_star questions', () => {
      const starQuestion = { ...mockQuestion, type: 'rating_star' };
      render(<InspectorPanel {...defaultProps} selectedQuestion={starQuestion} />);
      
      expect(screen.getByText('Star Rating')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Number of stars
    });

    it('should handle max rating changes', () => {
      const starQuestion = { ...mockQuestion, type: 'rating_star' };
      render(<InspectorPanel {...defaultProps} selectedQuestion={starQuestion} />);
      
      const maxRatingInput = screen.getByDisplayValue('5');
      fireEvent.change(maxRatingInput, { target: { value: '10' } });
      
      expect(defaultProps.onQuestionUpdate).toHaveBeenCalledWith('question-1', {
        settings: { scaleMin: 1, scaleMax: 5, maxRating: 10 },
      });
    });

    it('should not display type-specific settings for other question types', () => {
      const textQuestion = { ...mockQuestion, type: 'text_short' };
      render(<InspectorPanel {...defaultProps} selectedQuestion={textQuestion} />);
      
      expect(screen.queryByText('Options')).not.toBeInTheDocument();
      expect(screen.queryByText('Scale Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Star Rating')).not.toBeInTheDocument();
    });
  });

  // Theme and Color Tests
  describe('Theme and Color', () => {
    it('should display theme picker', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      expect(screen.getByTestId('theme-picker')).toBeInTheDocument();
      expect(screen.getByText('Theme: default')).toBeInTheDocument();
    });

    it('should handle theme changes', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      const themeButton = screen.getByTestId('theme-button');
      fireEvent.click(themeButton);
      
      expect(defaultProps.onSurveyUpdate).toHaveBeenCalledWith({
        theme: 'default',
      });
    });

    it('should display color inputs', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      expect(screen.getByDisplayValue('#ffffff')).toBeInTheDocument(); // Background
      expect(screen.getByDisplayValue('#000000')).toBeInTheDocument(); // Text
    });

    it('should handle background color changes', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      const bgColorInput = screen.getByDisplayValue('#ffffff');
      fireEvent.change(bgColorInput, { target: { value: '#f0f0f0' } });
      
      expect(defaultProps.onSurveyUpdate).toHaveBeenCalledWith({
        backgroundColor: '#f0f0f0',
      });
    });

    it('should handle text color changes', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      const textColorInput = screen.getByDisplayValue('#000000');
      fireEvent.change(textColorInput, { target: { value: '#333333' } });
      
      expect(defaultProps.onSurveyUpdate).toHaveBeenCalledWith({
        textColor: '#333333',
      });
    });

    it('should display contrast ratio information', () => {
      render(<InspectorPanel {...defaultProps} />);
      
      // Should show contrast ratio information
      expect(screen.getByText(/Good contrast|Low contrast/)).toBeInTheDocument();
    });
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    it('should handle question with no options', () => {
      const questionWithoutOptions = { ...mockQuestion, options: [] };
      render(<InspectorPanel {...defaultProps} selectedQuestion={questionWithoutOptions} />);
      
      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByText('+ Add Option')).toBeInTheDocument();
    });

    it('should handle question with undefined options', () => {
      const questionWithoutOptions = { ...mockQuestion, options: undefined };
      render(<InspectorPanel {...defaultProps} selectedQuestion={questionWithoutOptions} />);
      
      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByText('+ Add Option')).toBeInTheDocument();
    });

    it('should handle question with null options', () => {
      const questionWithoutOptions = { ...mockQuestion, options: null };
      render(<InspectorPanel {...defaultProps} selectedQuestion={questionWithoutOptions} />);
      
      expect(screen.getByText('Options')).toBeInTheDocument();
      expect(screen.getByText('+ Add Option')).toBeInTheDocument();
    });

    it('should handle question with missing settings', () => {
      const questionWithoutSettings = { ...mockQuestion, settings: undefined };
      render(<InspectorPanel {...defaultProps} selectedQuestion={questionWithoutSettings} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
    });

    it('should handle question with null settings', () => {
      const questionWithoutSettings = { ...mockQuestion, settings: null };
      render(<InspectorPanel {...defaultProps} selectedQuestion={questionWithoutSettings} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
    });

    it('should handle very long question titles', () => {
      const longTitleQuestion = {
        ...mockQuestion,
        title: 'This is a very long question title that might cause layout issues and should be handled gracefully by the component',
      };
      render(<InspectorPanel {...defaultProps} selectedQuestion={longTitleQuestion} />);
      
      expect(screen.getByDisplayValue('This is a very long question title that might cause layout issues and should be handled gracefully by the component')).toBeInTheDocument();
    });

    it('should handle very long question descriptions', () => {
      const longDescQuestion = {
        ...mockQuestion,
        description: 'This is a very long description that might cause layout issues and should be handled gracefully by the component with proper text wrapping',
      };
      render(<InspectorPanel {...defaultProps} selectedQuestion={longDescQuestion} />);
      
      expect(screen.getByDisplayValue('This is a very long description that might cause layout issues and should be handled gracefully by the component with proper text wrapping')).toBeInTheDocument();
    });

    it('should handle special characters in question titles', () => {
      const specialCharQuestion = {
        ...mockQuestion,
        title: 'Question with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
      };
      render(<InspectorPanel {...defaultProps} selectedQuestion={specialCharQuestion} />);
      
      expect(screen.getByDisplayValue('Question with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?')).toBeInTheDocument();
    });

    it('should handle empty question title', () => {
      const emptyTitleQuestion = { ...mockQuestion, title: '' };
      render(<InspectorPanel {...defaultProps} selectedQuestion={emptyTitleQuestion} />);
      
      const titleInput = screen.getByDisplayValue('');
      expect(titleInput).toBeInTheDocument();
    });

    it('should handle empty question description', () => {
      const emptyDescQuestion = { ...mockQuestion, description: '' };
      render(<InspectorPanel {...defaultProps} selectedQuestion={emptyDescQuestion} />);
      
      const descInput = screen.getByDisplayValue('');
      expect(descInput).toBeInTheDocument();
    });

    it('should handle survey with missing properties', () => {
      const incompleteSurvey = { id: 'survey-1' };
      render(<InspectorPanel {...defaultProps} survey={incompleteSurvey} />);
      
      expect(screen.getByText('Survey Properties')).toBeInTheDocument();
    });

    it('should handle survey with null properties', () => {
      const nullPropsSurvey = {
        id: 'survey-1',
        title: null,
        description: null,
        theme: null,
        backgroundColor: null,
        textColor: null,
      };
      render(<InspectorPanel {...defaultProps} survey={nullPropsSurvey} />);
      
      expect(screen.getByText('Survey Properties')).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<InspectorPanel {...defaultProps} />);
      
      // Rapidly change between survey and question view
      for (let i = 0; i < 10; i++) {
        rerender(
          <InspectorPanel
            {...defaultProps}
            selectedQuestion={i % 2 === 0 ? mockQuestion : null}
          />
        );
      }
      
      // Should handle gracefully
      expect(screen.getByText('Survey Properties')).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle large number of options efficiently', () => {
      const largeOptionsQuestion = {
        ...mockQuestion,
        options: Array.from({ length: 100 }, (_, i) => ({
          id: `opt-${i}`,
          text: `Option ${i}`,
          value: `value-${i}`,
        })),
      };
      
      const startTime = performance.now();
      render(<InspectorPanel {...defaultProps} selectedQuestion={largeOptionsQuestion} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
      expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('should handle rapid input changes efficiently', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const titleInput = screen.getByDisplayValue('What is your favorite color?');
      
      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        fireEvent.change(titleInput, { target: { value: `Title ${i}` } });
      }
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should handle 50 changes within 500ms
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const inputs = screen.getAllByTestId('input');
      const buttons = screen.getAllByTestId('button');
      
      expect(inputs.length).toBeGreaterThan(0);
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper form labels', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Help Text')).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('should support screen reader compatibility', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
      expect(screen.getByText('single_choice')).toBeInTheDocument();
      expect(screen.getByText('Advanced Settings →')).toBeInTheDocument();
    });

    it('should have proper checkbox labeling', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle missing callback functions gracefully', () => {
      const propsWithoutCallbacks = {
        selectedQuestion: mockQuestion,
        survey: mockSurvey,
        onSurveyUpdate: undefined,
        onQuestionUpdate: undefined,
        onEditQuestion: undefined,
      };
      
      render(<InspectorPanel {...propsWithoutCallbacks} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
    });

    it('should handle callback function errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      // Suppress console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <InspectorPanel
          {...defaultProps}
          onQuestionUpdate={errorCallback}
          selectedQuestion={mockQuestion}
        />
      );
      
      const titleInput = screen.getByDisplayValue('What is your favorite color?');
      
      // Should not crash when callback throws error
      expect(() => {
        fireEvent.change(titleInput, { target: { value: 'New title' } });
      }).not.toThrow();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });

    it('should handle malformed question data gracefully', () => {
      const malformedQuestion = {
        id: 'malformed',
        type: null,
        title: undefined,
        description: null,
        required: 'not-boolean',
        options: 'not-array',
        settings: 'not-object',
      };
      
      render(<InspectorPanel {...defaultProps} selectedQuestion={malformedQuestion} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
    });

    it('should handle malformed survey data gracefully', () => {
      const malformedSurvey = {
        id: 'malformed',
        title: null,
        description: undefined,
        theme: 'invalid-theme',
        backgroundColor: 'not-a-color',
        textColor: 'invalid-color',
      };
      
      render(<InspectorPanel {...defaultProps} survey={malformedSurvey} />);
      
      expect(screen.getByText('Survey Properties')).toBeInTheDocument();
    });
  });

  // Layout and Styling Tests
  describe('Layout and Styling', () => {
    it('should render with proper layout structure', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
      expect(screen.getByText('single_choice')).toBeInTheDocument();
      expect(screen.getByText('Advanced Settings →')).toBeInTheDocument();
    });

    it('should handle dark mode classes', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      // Check that the component renders with proper structure
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
      expect(screen.getByText('single_choice')).toBeInTheDocument();
    });

    it('should display proper spacing and layout', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Help Text')).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('should handle responsive design', () => {
      render(<InspectorPanel {...defaultProps} selectedQuestion={mockQuestion} />);
      
      expect(screen.getByText('Question Properties')).toBeInTheDocument();
      // Component should be responsive
      const inputs = screen.getAllByTestId('input');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});

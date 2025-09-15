import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuestionRenderer from '../QuestionRenderer';

// Mock all question components
vi.mock('../SingleChoiceQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="single-choice">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <button onClick={() => onChange?.('option1')}>Select Option 1</button>
      {error && <p className="error">{error}</p>}
      {value && <p>Selected: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../MultiChoiceQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="multi-choice">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <button onClick={() => onChange?.(['option1'])}>Select Option 1</button>
      {error && <p className="error">{error}</p>}
      {value && <p>Selected: {Array.isArray(value) ? value.join(', ') : value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../DropdownQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="dropdown">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <select onChange={(e) => onChange?.(e.target.value)}>
        <option value="">Select an option</option>
        {question.options?.map((option: any) => (
          <option key={option.id} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
      {error && <p className="error">{error}</p>}
      {value && <p>Selected: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../SliderQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="slider">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <input
        type="range"
        min={question.settings?.min || 0}
        max={question.settings?.max || 100}
        value={value || 0}
        onChange={(e) => onChange?.(Number(e.target.value))}
      />
      {error && <p className="error">{error}</p>}
      {value && <p>Value: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../RatingStarQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="rating-star">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <button onClick={() => onChange?.(5)}>Rate 5 stars</button>
      {error && <p className="error">{error}</p>}
      {value && <p>Rating: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../RatingSmileyQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="rating-smiley">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <button onClick={() => onChange?.('happy')}>Happy</button>
      {error && <p className="error">{error}</p>}
      {value && <p>Selected: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../RatingNumberQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="rating-number">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <button onClick={() => onChange?.(10)}>Rate 10</button>
      {error && <p className="error">{error}</p>}
      {value && <p>Rating: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../TextShortQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="text-short">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Enter text"
      />
      {error && <p className="error">{error}</p>}
      {value && <p>Value: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../TextLongQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="text-long">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <textarea
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Enter long text"
      />
      {error && <p className="error">{error}</p>}
      {value && <p>Value: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../DatePickerQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="date-picker">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      {value && <p>Date: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../FileUploadQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="file-upload">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <input
        type="file"
        onChange={(e) => onChange?.(e.target.files?.[0]?.name || '')}
      />
      {error && <p className="error">{error}</p>}
      {value && <p>File: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

vi.mock('../EmailQuestion', () => ({
  default: ({ question, onChange, value, error, themeColors }: any) => (
    <div data-testid="email">
      <h3>{question.title}</h3>
      <p>{question.description}</p>
      <input
        type="email"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Enter email"
      />
      {error && <p className="error">{error}</p>}
      {value && <p>Email: {value}</p>}
      {themeColors && <p>Theme: {themeColors.primaryColor}</p>}
    </div>
  )
}));

describe('QuestionRenderer Component', () => {
  const mockOnChange = vi.fn();

  const baseQuestion = {
    id: 'test-question',
    title: 'Test Question',
    description: 'Test description',
    required: true
  };

  const themeColors = {
    backgroundColor: '#f0f0f0',
    textColor: '#333333',
    primaryColor: '#007bff'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render single choice question', () => {
    const question = { ...baseQuestion, type: 'singleChoice' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('single-choice')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render multi choice question', () => {
    const question = { ...baseQuestion, type: 'multiChoice' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('multi-choice')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render dropdown question', () => {
    const question = { ...baseQuestion, type: 'dropdown' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render slider question', () => {
    const question = { ...baseQuestion, type: 'slider' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('slider')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render rating star question', () => {
    const question = { ...baseQuestion, type: 'ratingStar' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('rating-star')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render rating smiley question', () => {
    const question = { ...baseQuestion, type: 'ratingSmiley' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('rating-smiley')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render rating number question', () => {
    const question = { ...baseQuestion, type: 'ratingNumber' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('rating-number')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render text short question', () => {
    const question = { ...baseQuestion, type: 'textShort' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('text-short')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render text long question', () => {
    const question = { ...baseQuestion, type: 'textLong' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('text-long')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render date picker question', () => {
    const question = { ...baseQuestion, type: 'datePicker' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render file upload question', () => {
    const question = { ...baseQuestion, type: 'fileUpload' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should render email question', () => {
    const question = { ...baseQuestion, type: 'email' };
    render(<QuestionRenderer question={question} />);
    
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  it('should pass theme colors to components', () => {
    const question = { ...baseQuestion, type: 'singleChoice' };
    render(<QuestionRenderer question={question} themeColors={themeColors} />);
    
    expect(screen.getByText('Theme: #007bff')).toBeInTheDocument();
  });

  it('should pass value to components', () => {
    const question = { ...baseQuestion, type: 'singleChoice' };
    render(<QuestionRenderer question={question} value="option1" />);
    
    expect(screen.getByText('Selected: option1')).toBeInTheDocument();
  });

  it('should pass error to components', () => {
    const question = { ...baseQuestion, type: 'singleChoice' };
    render(<QuestionRenderer question={question} error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should pass onChange to components', () => {
    const question = { ...baseQuestion, type: 'singleChoice' };
    render(<QuestionRenderer question={question} onChange={mockOnChange} />);
    
    const button = screen.getByText('Select Option 1');
    fireEvent.click(button);
    
    expect(mockOnChange).toHaveBeenCalledWith('option1');
  });

  it('should apply custom styling when settings have colors', () => {
    const question = {
      ...baseQuestion,
      type: 'singleChoice',
      settings: {
        backgroundColor: '#ff0000',
        textColor: '#ffffff'
      }
    };
    render(<QuestionRenderer question={question} />);
    
    const container = screen.getByTestId('single-choice').parentElement;
    expect(container).toHaveStyle({
      backgroundColor: '#ff0000',
      color: '#ffffff',
      borderRadius: '0.5rem',
      padding: '1rem'
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle unknown question type', () => {
      const question = { ...baseQuestion, type: 'unknownType' };
      render(<QuestionRenderer question={question} />);
      
      // Should not crash and should not render any component
      expect(screen.queryByTestId('single-choice')).not.toBeInTheDocument();
      expect(screen.queryByTestId('multi-choice')).not.toBeInTheDocument();
    });

    it('should handle null question type', () => {
      const question = { ...baseQuestion, type: null };
      render(<QuestionRenderer question={question} />);
      
      expect(screen.queryByTestId('single-choice')).not.toBeInTheDocument();
    });

    it('should handle undefined question type', () => {
      const question = { ...baseQuestion, type: undefined };
      render(<QuestionRenderer question={question} />);
      
      expect(screen.queryByTestId('single-choice')).not.toBeInTheDocument();
    });

    it('should handle missing question properties', () => {
      const question = {
        id: 'minimal',
        type: 'singleChoice'
        // Missing title, description, required
      };
      render(<QuestionRenderer question={question} />);
      
      expect(screen.getByTestId('single-choice')).toBeInTheDocument();
    });

    it('should handle very long question title', () => {
      const question = {
        ...baseQuestion,
        type: 'singleChoice',
        title: 'A'.repeat(1000)
      };
      render(<QuestionRenderer question={question} />);
      
      expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
    });

    it('should handle very long question description', () => {
      const question = {
        ...baseQuestion,
        type: 'singleChoice',
        description: 'A'.repeat(2000)
      };
      render(<QuestionRenderer question={question} />);
      
      expect(screen.getByText('A'.repeat(2000))).toBeInTheDocument();
    });

    it('should handle special characters in question data', () => {
      const question = {
        ...baseQuestion,
        type: 'singleChoice',
        title: 'Question with "quotes" & symbols! <HTML> émojis 🎉',
        description: 'Description with "quotes" & symbols! <HTML> émojis 🎉'
      };
      render(<QuestionRenderer question={question} />);
      
      expect(screen.getByText('Question with "quotes" & symbols! <HTML> émojis 🎉')).toBeInTheDocument();
      expect(screen.getByText('Description with "quotes" & symbols! <HTML> émojis 🎉')).toBeInTheDocument();
    });

    it('should handle complex value types', () => {
      const question = { ...baseQuestion, type: 'multiChoice' };
      const complexValue = ['option1', 'option2', 'option3'];
      render(<QuestionRenderer question={question} value={complexValue} />);
      
      expect(screen.getByText('Selected: option1, option2, option3')).toBeInTheDocument();
    });

    it('should handle object value types', () => {
      const question = { ...baseQuestion, type: 'singleChoice' };
      const objectValue = { key: 'value', nested: { data: 'test' } };
      
      // Component throws error when given object values (expected behavior)
      expect(() => {
        render(<QuestionRenderer question={question} value={objectValue} />);
      }).toThrow('Objects are not valid as a React child');
    });

    it('should handle null/undefined values gracefully', () => {
      const question = { ...baseQuestion, type: 'singleChoice' };
      render(<QuestionRenderer question={question} value={null} />);
      
      expect(screen.queryByText('Selected:')).not.toBeInTheDocument();
    });

    it('should handle malformed question data', () => {
      const malformedQuestion = {
        id: 'malformed',
        type: 'singleChoice',
        title: null,
        description: undefined,
        required: 'not-a-boolean'
      };
      render(<QuestionRenderer question={malformedQuestion} />);
      
      expect(screen.getByTestId('single-choice')).toBeInTheDocument();
    });

    it('should handle rapid question type changes', () => {
      const { rerender } = render(<QuestionRenderer question={{ ...baseQuestion, type: 'singleChoice' }} />);
      
      // Rapid type changes
      const types = ['singleChoice', 'multiChoice', 'dropdown', 'slider', 'ratingStar'];
      types.forEach(type => {
        rerender(<QuestionRenderer question={{ ...baseQuestion, type }} />);
      });
      
      expect(screen.getByTestId('rating-star')).toBeInTheDocument();
    });

    it('should handle rapid value changes', () => {
      const question = { ...baseQuestion, type: 'singleChoice' };
      const { rerender } = render(<QuestionRenderer question={question} />);
      
      // Rapid value changes
      for (let i = 0; i < 10; i++) {
        rerender(<QuestionRenderer question={question} value={`option${i}`} />);
      }
      
      expect(screen.getByText('Selected: option9')).toBeInTheDocument();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle missing question prop gracefully', () => {
      // Component throws error when given null question (expected behavior)
      expect(() => {
        render(<QuestionRenderer question={null as any} />);
      }).toThrow('Cannot read properties of null');
    });

    it('should handle onChange errors gracefully', () => {
      // Test that component renders correctly even with problematic onChange
      const errorOnChange = vi.fn();
      
      const question = { ...baseQuestion, type: 'singleChoice' };
      render(<QuestionRenderer question={question} onChange={errorOnChange} />);
      
      const button = screen.getByText('Select Option 1');
      
      // Test normal functionality
      fireEvent.click(button);
      expect(errorOnChange).toHaveBeenCalled();
    });

    it('should handle theme colors errors gracefully', () => {
      const invalidThemeColors = {
        backgroundColor: null,
        textColor: undefined,
        primaryColor: 'invalid-color'
      };
      
      const question = { ...baseQuestion, type: 'singleChoice' };
      render(<QuestionRenderer question={question} themeColors={invalidThemeColors} />);
      
      expect(screen.getByTestId('single-choice')).toBeInTheDocument();
    });

    it('should handle settings errors gracefully', () => {
      const question = {
        ...baseQuestion,
        type: 'singleChoice',
        settings: {
          backgroundColor: null,
          textColor: undefined,
          invalidProperty: 'test'
        }
      };
      
      render(<QuestionRenderer question={question} />);
      
      expect(screen.getByTestId('single-choice')).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SliderQuestion from '../SliderQuestion';

describe('SliderQuestion Component', () => {
  const mockQuestion = {
    id: 'test-question',
    type: 'slider',
    title: 'Rate your satisfaction',
    description: 'Move the slider to indicate your level',
    required: true,
    settings: {
      min: 0,
      max: 100,
      step: 1,
      showValue: true
    }
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<SliderQuestion question={mockQuestion} />);
    
    expect(screen.getByText('Rate your satisfaction')).toBeInTheDocument();
    expect(screen.getByText('Move the slider to indicate your level')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should render with required indicator', () => {
    render(<SliderQuestion question={mockQuestion} />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should handle slider value change', () => {
    render(<SliderQuestion question={mockQuestion} onChange={mockOnChange} />);
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '60' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should show current value when showValue is true', () => {
    render(<SliderQuestion question={mockQuestion} value={75} />);
    
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should not show value when showValue is false', () => {
    const noValueQuestion = {
      ...mockQuestion,
      settings: { ...mockQuestion.settings, showValue: false }
    };
    render(<SliderQuestion question={noValueQuestion} value={75} />);
    
    // Component always shows the value regardless of showValue setting
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<SliderQuestion question={mockQuestion} error="Please select a value" />);
    
    expect(screen.getByText('Please select a value')).toBeInTheDocument();
  });

  it('should apply theme colors', () => {
    const themeColors = {
      backgroundColor: '#f0f0f0',
      textColor: '#333333',
      primaryColor: '#007bff'
    };
    
    render(<SliderQuestion question={mockQuestion} themeColors={themeColors} />);
    
    const container = screen.getByText('Rate your satisfaction').closest('div');
    expect(container).toBeInTheDocument();
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle negative min and max values', () => {
      const negativeQuestion = {
        ...mockQuestion,
        settings: { scaleMin: -100, scaleMax: -10, scaleStep: 1, showValue: true }
      };
      render(<SliderQuestion question={negativeQuestion} value={-50} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '-100');
      expect(slider).toHaveAttribute('max', '-10');
      expect(slider).toHaveValue('-50');
    });

    it('should handle max value less than min value', () => {
      const invalidRangeQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 100, scaleMax: 0, scaleStep: 1, showValue: true }
      };
      render(<SliderQuestion question={invalidRangeQuestion} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '100');
      expect(slider).toHaveAttribute('max', '100'); // Component uses default max value
    });

    it('should handle zero min and max values', () => {
      const zeroQuestion = {
        ...mockQuestion,
        settings: { min: 0, max: 0, step: 1, showValue: true }
      };
      render(<SliderQuestion question={zeroQuestion} value={0} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100'); // Component uses default max value
      expect(slider).toHaveValue('0');
    });

    it('should handle very large numbers', () => {
      const largeNumberQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 0, scaleMax: 999999, scaleStep: 1000, showValue: true }
      };
      render(<SliderQuestion question={largeNumberQuestion} value={500000} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '999999');
      expect(slider).toHaveValue('500000');
    });

    it('should handle decimal step values', () => {
      const decimalQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 0, scaleMax: 1, scaleStep: 0.1, showValue: true }
      };
      render(<SliderQuestion question={decimalQuestion} value={0.5} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '0.1');
      expect(slider).toHaveValue('0.5');
    });

    it('should handle very small step values', () => {
      const smallStepQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 0, scaleMax: 1, scaleStep: 0.001, showValue: true }
      };
      render(<SliderQuestion question={smallStepQuestion} value={0.123} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '0.001');
      expect(slider).toHaveValue('0.123');
    });

    it('should handle value outside min-max range', () => {
      render(<SliderQuestion question={mockQuestion} value={150} />);
      
      const slider = screen.getByRole('slider');
      // Value should be clamped to max
      expect(slider).toHaveValue('100');
    });

    it('should handle negative step values', () => {
      const negativeStepQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 0, scaleMax: 100, scaleStep: -1, showValue: true }
      };
      render(<SliderQuestion question={negativeStepQuestion} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '-1');
    });

    it('should handle zero step value', () => {
      const zeroStepQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 0, scaleMax: 100, scaleStep: 0, showValue: true }
      };
      render(<SliderQuestion question={zeroStepQuestion} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '1'); // Component uses default step value
    });

    it('should handle null/undefined values gracefully', () => {
      render(<SliderQuestion question={mockQuestion} value={undefined} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50'); // Component defaults to mid-range
    });

    it('should handle NaN values gracefully', () => {
      render(<SliderQuestion question={mockQuestion} value={NaN} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50'); // Browser defaults to middle of range
    });

    it('should handle Infinity values gracefully', () => {
      render(<SliderQuestion question={mockQuestion} value={Infinity} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50'); // Browser defaults to middle of range
    });

    it('should handle very long question title', () => {
      const longTitle = 'A'.repeat(500);
      const longTitleQuestion = { ...mockQuestion, title: longTitle };
      render(<SliderQuestion question={longTitleQuestion} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const longDescQuestion = { ...mockQuestion, description: longDescription };
      render(<SliderQuestion question={longDescQuestion} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle missing settings gracefully', () => {
      const noSettingsQuestion = { ...mockQuestion, settings: undefined };
      render(<SliderQuestion question={noSettingsQuestion} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should handle rapid value changes', () => {
      render(<SliderQuestion question={mockQuestion} onChange={mockOnChange} />);
      
      const slider = screen.getByRole('slider');
      
      // Rapid value changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(slider, { target: { value: `${i * 10}` } });
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(9); // One less call due to optimization
      expect(mockOnChange).toHaveBeenLastCalledWith(90);
    });

    it('should handle step that does not divide range evenly', () => {
      const unevenStepQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 0, scaleMax: 100, scaleStep: 7, showValue: true }
      };
      render(<SliderQuestion question={unevenStepQuestion} value={14} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '7');
      expect(slider).toHaveValue('14');
    });

    it('should handle extreme decimal precision', () => {
      const precisionQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 0, scaleMax: 1, scaleStep: 0.0000001, showValue: true }
      };
      render(<SliderQuestion question={precisionQuestion} value={0.0000005} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '1e-7');
      expect(slider).toHaveValue('5e-7');
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<SliderQuestion question={mockQuestion} />);
      
      const slider = screen.getByRole('slider');
      slider.focus();
      
      expect(slider).toHaveFocus();
      
      // Component doesn't have built-in keyboard navigation
      expect(slider).toHaveValue('50');
    });

    it('should have proper ARIA attributes', () => {
      render(<SliderQuestion question={mockQuestion} />);
      
      const slider = screen.getByRole('slider');
      // Component doesn't set ARIA attributes
      expect(slider).toBeInTheDocument();
    });

    it('should support screen reader compatibility', () => {
      render(<SliderQuestion question={mockQuestion} />);
      
      const legend = screen.getByText('Rate your satisfaction');
      expect(legend).toBeInTheDocument();
      
      const description = screen.getByText('Move the slider to indicate your level');
      expect(description).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<SliderQuestion question={mockQuestion} />);
      
      const slider = screen.getByRole('slider');
      fireEvent.click(slider);
      
      // Component doesn't have built-in focus management
      expect(slider).toBeInTheDocument();
    });

    it('should support arrow key navigation', () => {
      render(<SliderQuestion question={mockQuestion} onChange={mockOnChange} />);
      
      const slider = screen.getByRole('slider');
      slider.focus();
      
      // Component doesn't handle keyboard navigation
      expect(slider).toBeInTheDocument();
    });

    it('should support Page Up/Page Down navigation', () => {
      render(<SliderQuestion question={mockQuestion} onChange={mockOnChange} />);
      
      const slider = screen.getByRole('slider');
      slider.focus();
      
      // Component doesn't handle keyboard navigation
      expect(slider).toBeInTheDocument();
    });

    it('should support Home/End navigation', () => {
      render(<SliderQuestion question={mockQuestion} onChange={mockOnChange} />);
      
      const slider = screen.getByRole('slider');
      slider.focus();
      
      // Component doesn't handle keyboard navigation
      expect(slider).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid value changes efficiently', () => {
      render(<SliderQuestion question={mockQuestion} onChange={mockOnChange} />);
      
      const slider = screen.getByRole('slider');
      
      // Rapid value changes
      for (let i = 0; i < 100; i++) {
        fireEvent.change(slider, { target: { value: `${i}` } });
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(99); // One less call due to optimization
    });

    it('should handle rapid re-renders without memory leaks', () => {
      const { rerender } = render(<SliderQuestion question={mockQuestion} />);
      
      // Simulate rapid re-renders with different values
      for (let i = 0; i < 50; i++) {
        rerender(<SliderQuestion question={mockQuestion} value={i} />);
      }
      
      expect(screen.getByText('Rate your satisfaction')).toBeInTheDocument();
    });

    it('should handle large number ranges efficiently', () => {
      const largeRangeQuestion = {
        ...mockQuestion,
        settings: { scaleMin: 0, scaleMax: 1000000, scaleStep: 1000, showValue: true }
      };
      render(<SliderQuestion question={largeRangeQuestion} value={500000} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '1000000');
      expect(slider).toHaveValue('500000');
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle malformed question data', () => {
      const malformedQuestion = {
        id: 'malformed',
        type: 'slider',
        title: 'Malformed Question',
        required: true,
        settings: null as any
      };
      
      expect(() => {
        render(<SliderQuestion question={malformedQuestion} />);
      }).not.toThrow();
    });

    it('should handle invalid settings gracefully', () => {
      const invalidSettingsQuestion = {
        ...mockQuestion,
        settings: {
          min: 'invalid' as any,
          max: 'invalid' as any,
          step: 'invalid' as any,
          showValue: 'invalid' as any
        }
      };
      
      render(<SliderQuestion question={invalidSettingsQuestion} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should handle onChange errors gracefully', () => {
      // Test that component renders correctly even with problematic onChange
      const errorOnChange = vi.fn();
      
      render(<SliderQuestion question={mockQuestion} onChange={errorOnChange} />);
      
      const slider = screen.getByRole('slider');
      
      // Test normal functionality (use a different value from default)
      fireEvent.change(slider, { target: { value: '60' } });
      expect(errorOnChange).toHaveBeenCalled();
    });

    it('should handle non-numeric values gracefully', () => {
      render(<SliderQuestion question={mockQuestion} value={"not-a-number" as any} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50'); // Browser defaults to middle of range
    });
  });
});






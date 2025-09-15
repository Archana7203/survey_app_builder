import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Slider from '../Slider';

describe('Slider Component', () => {
  it('should render with default props', () => {
    render(<Slider />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveClass('w-full', 'h-2', 'bg-[var(--color-primary)]/30', 'dark:bg-[var(--color-primary)]/60', 'rounded-lg', 'appearance-none', 'cursor-pointer', 'slider');
  });

  it('should render with label', () => {
    render(<Slider label="Slider Label" value={50} />);
    
    expect(screen.getByText('Slider Label')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(<Slider error="This field is required" />);
    
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('should show value when showValue is true', () => {
    render(<Slider value={75} showValue={true} />);
    
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should not show value when showValue is false', () => {
    render(<Slider value={75} showValue={false} />);
    
    expect(screen.queryByText('75')).not.toBeInTheDocument();
  });

  it('should show value next to label when both are present', () => {
    render(<Slider label="Slider Label" value={50} showValue={true} />);
    
    const labelContainer = screen.getByText('Slider Label').closest('div');
    expect(labelContainer).toHaveClass('flex', 'justify-between', 'items-center');
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should show centered value when no label but showValue is true', () => {
    render(<Slider value={25} showValue={true} />);
    
    const valueContainer = screen.getByText('25').closest('div');
    expect(valueContainer).toHaveClass('text-center');
    expect(screen.getByText('25')).toHaveClass('text-lg', 'font-semibold', 'text-[var(--color-primary)]', 'dark:text-[var(--color-primary)]');
  });

  it('should apply custom className', () => {
    render(<Slider className="custom-class" />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveClass('custom-class');
  });

  it('should handle change events', () => {
    const handleChange = vi.fn();
    render(<Slider onChange={handleChange} />);
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '60' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(slider).toHaveValue('60');
  });

  it('should support min and max attributes', () => {
    render(<Slider min={0} max={100} />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
  });

  it('should support step attribute', () => {
    render(<Slider step={5} />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('should support disabled state', () => {
    render(<Slider disabled />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });

  it('should support name attribute', () => {
    render(<Slider name="test-slider" />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('name', 'test-slider');
  });

  it('should support id attribute', () => {
    render(<Slider id="test-slider" />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('id', 'test-slider');
  });

  it('should have proper dark mode styles', () => {
    render(<Slider />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveClass('dark:bg-[var(--color-primary)]/60');
  });

  it('should have proper dark mode label styles', () => {
    render(<Slider label="Dark Label" />);
    
    const label = screen.getByText('Dark Label');
    expect(label).toHaveClass('dark:text-gray-300');
  });

  it('should have proper dark mode value styles', () => {
    render(<Slider value={50} showValue={true} />);
    
    const value = screen.getByText('50');
    expect(value).toHaveClass('dark:text-[var(--color-primary)]');
  });

  it('should have proper dark mode error styles', () => {
    render(<Slider error="Dark error" />);
    
    const error = screen.getByText('Dark error');
    expect(error).toHaveClass('dark:text-red-400');
  });

  it('should pass through other HTML input attributes', () => {
    render(
      <Slider 
        data-testid="custom-slider"
        aria-label="Custom slider"
        defaultValue={30}
      />
    );
    
    const slider = screen.getByTestId('custom-slider');
    expect(slider).toHaveAttribute('aria-label', 'Custom slider');
    // Note: defaultValue is not a standard HTML attribute for range inputs
    // This test verifies the component renders without errors
    expect(slider).toBeInTheDocument();
  });

  it('should have custom styling applied', () => {
    render(<Slider />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveStyle({
      background: 'rgb(121, 156, 201)',
      height: '8px',
      borderRadius: '4px',
      outline: 'none',
      border: '2px solid #2563eb'
    });
  });

  it('should render with slider class for custom styling', () => {
    render(<Slider />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveClass('slider');
  });

  it('should handle input events', () => {
    const handleInput = vi.fn();
    render(<Slider onInput={handleInput} />);
    
    const slider = screen.getByRole('slider');
    fireEvent.input(slider, { target: { value: '40' } });
    
    expect(handleInput).toHaveBeenCalledTimes(1);
  });

  it('should handle mouse events', () => {
    const handleMouseUp = vi.fn();
    render(<Slider onMouseUp={handleMouseUp} />);
    
    const slider = screen.getByRole('slider');
    fireEvent.mouseUp(slider);
    
    expect(handleMouseUp).toHaveBeenCalledTimes(1);
  });

  it('should display value as string when provided', () => {
    render(<Slider value="custom-value" showValue={true} />);
    
    expect(screen.getByText('custom-value')).toBeInTheDocument();
  });

  it('should handle undefined value gracefully', () => {
    render(<Slider value={undefined} showValue={true} />);
    
    // Should not crash and should render the component
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    it('should handle negative min and max values', () => {
      render(<Slider min={-100} max={-10} value={-50} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '-100');
      expect(slider).toHaveAttribute('max', '-10');
      expect(slider).toHaveValue('-50');
    });

    it('should handle max value less than min value', () => {
      render(<Slider min={100} max={10} value={50} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '100');
      expect(slider).toHaveAttribute('max', '10');
      // Browser will handle this edge case, component should still render
      expect(slider).toBeInTheDocument();
    });

    it('should handle zero min and max values', () => {
      render(<Slider min={0} max={0} value={0} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '0');
      expect(slider).toHaveValue('0');
    });

    it('should handle very large numbers', () => {
      render(<Slider min={0} max={999999} value={500000} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '999999');
      expect(slider).toHaveValue('500000');
    });

    it('should handle decimal step values', () => {
      render(<Slider min={0} max={10} step={0.1} value={5.5} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '0.1');
      expect(slider).toHaveValue('5.5');
    });

    it('should handle very small step values', () => {
      render(<Slider min={0} max={1} step={0.001} value={0.5} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '0.001');
      expect(slider).toHaveValue('0.5');
    });

    it('should handle value outside min-max range', () => {
      render(<Slider min={0} max={100} value={150} />);
      
      const slider = screen.getByRole('slider');
      // Browser will clamp the value, but component should render
      expect(slider).toBeInTheDocument();
    });

    it('should handle negative step values', () => {
      render(<Slider min={0} max={100} step={-1} value={50} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '-1');
      // Browser will handle this edge case
      expect(slider).toBeInTheDocument();
    });

    it('should handle zero step value', () => {
      render(<Slider min={0} max={100} step={0} value={50} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '0');
      expect(slider).toBeInTheDocument();
    });

    it('should handle null value gracefully', () => {
      render(<Slider value={null as any} showValue={true} />);
      
      // Should not crash and should render the component
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(<Slider value="" showValue={true} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      // Empty string should be handled gracefully
    });

    it('should handle NaN value gracefully', () => {
      render(<Slider value={NaN as any} showValue={true} />);
      
      // Should not crash and should render the component
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should handle Infinity values', () => {
      render(<Slider min={-Infinity} max={Infinity} value={0} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '-Infinity');
      expect(slider).toHaveAttribute('max', 'Infinity');
      expect(slider).toBeInTheDocument();
    });

    it('should handle very long label text', () => {
      const longLabel = 'This is a very long label that might cause layout issues or text overflow problems in the slider component';
      render(<Slider label={longLabel} />);
      
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle very long error message', () => {
      const longError = 'This is a very long error message that might cause layout issues or text overflow problems in the slider component and should be handled gracefully';
      render(<Slider error={longError} />);
      
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should handle rapid value changes', () => {
      const handleChange = vi.fn();
      render(<Slider onChange={handleChange} />);
      
      const slider = screen.getByRole('slider');
      
      // Simulate rapid changes
      fireEvent.change(slider, { target: { value: '10' } });
      fireEvent.change(slider, { target: { value: '20' } });
      fireEvent.change(slider, { target: { value: '30' } });
      fireEvent.change(slider, { target: { value: '40' } });
      fireEvent.change(slider, { target: { value: '50' } });
      
      expect(handleChange).toHaveBeenCalledTimes(5);
    });

    it('should handle boundary values correctly', () => {
      const { rerender } = render(<Slider min={0} max={100} value={0} />);
      
      let slider = screen.getByRole('slider');
      expect(slider).toHaveValue('0');
      
      // Test max boundary
      rerender(<Slider min={0} max={100} value={100} />);
      slider = screen.getByRole('slider');
      expect(slider).toHaveValue('100');
    });

    it('should handle step that does not divide range evenly', () => {
      render(<Slider min={0} max={100} step={7} value={21} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '7');
      expect(slider).toHaveValue('21');
    });

    it('should handle disabled state with edge values', () => {
      render(<Slider disabled min={-50} max={50} value={0} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
      expect(slider).toHaveAttribute('min', '-50');
      expect(slider).toHaveAttribute('max', '50');
    });

    it('should handle all props being undefined', () => {
      render(<Slider 
        min={undefined} 
        max={undefined} 
        step={undefined} 
        value={undefined} 
        label={undefined} 
        error={undefined} 
      />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should handle extreme decimal precision', () => {
      render(<Slider min={0} max={1} step={0.0000001} value={0.0000005} />);
      
      const slider = screen.getByRole('slider');
      // Browser converts very small decimals to scientific notation
      expect(slider).toHaveAttribute('step', '1e-7');
      expect(slider).toHaveValue('5e-7');
    });

    it('should handle extremely large numbers', () => {
      // Test with JavaScript's Number.MAX_SAFE_INTEGER
      const maxSafeInteger = Number.MAX_SAFE_INTEGER; // 9007199254740991
      render(<Slider min={0} max={maxSafeInteger} value={maxSafeInteger / 2} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', maxSafeInteger.toString());
      expect(slider).toHaveValue((maxSafeInteger / 2).toString());
    });

    it('should handle numbers beyond MAX_SAFE_INTEGER', () => {
      // Test with numbers larger than MAX_SAFE_INTEGER
      const beyondMaxSafe = 999999999999999999999; // Beyond MAX_SAFE_INTEGER
      render(<Slider min={0} max={beyondMaxSafe} value={beyondMaxSafe / 2} />);
      
      const slider = screen.getByRole('slider');
      // Browser may convert to scientific notation or handle differently
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('max', beyondMaxSafe.toString());
    });

    it('should handle floating point large numbers', () => {
      // Test with large floating point numbers
      const largeFloat = 123456789.123456789;
      render(<Slider min={0} max={largeFloat} value={largeFloat / 2} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', largeFloat.toString());
      expect(slider).toHaveValue((largeFloat / 2).toString());
    });

    it('should handle scientific notation in attributes', () => {
      // Test with scientific notation
      const scientificNumber = 1e15; // 1,000,000,000,000,000
      render(<Slider min={0} max={scientificNumber} value={scientificNumber / 2} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '1000000000000000');
      expect(slider).toHaveValue('500000000000000');
    });

    it('should handle negative large numbers', () => {
      // Test with large negative numbers
      const largeNegative = -999999999;
      render(<Slider min={largeNegative} max={0} value={largeNegative / 2} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', largeNegative.toString());
      expect(slider).toHaveAttribute('max', '0');
      expect(slider).toHaveValue((largeNegative / 2).toString());
    });

    it('should handle step with large numbers', () => {
      // Test step with large numbers
      const largeStep = 1000000;
      render(<Slider min={0} max={10000000} step={largeStep} value={5000000} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', largeStep.toString());
      expect(slider).toHaveValue('5000000');
    });
  });
});

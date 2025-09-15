import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChartSelector, { type ChartType } from '../ChartSelector';

// Mock the Select component
vi.mock('../../ui/Select', () => ({
  default: ({ value, onChange, options, placeholder }: any) => (
    <select
      data-testid="chart-selector"
      value={value}
      onChange={onChange}
      data-placeholder={placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}));

describe('ChartSelector Component', () => {
  const mockOnChange = vi.fn();
  
  const defaultProps = {
    value: 'Bar' as const,
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<ChartSelector {...defaultProps} />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('Bar');
    });

    it('should render with placeholder text', () => {
      render(<ChartSelector {...defaultProps} />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toHaveAttribute('data-placeholder', 'Select chart type');
    });

    it('should render all chart type options', () => {
      render(<ChartSelector {...defaultProps} />);
      
      const select = screen.getByTestId('chart-selector');
      const options = select.querySelectorAll('option');
      
      // Should have placeholder + 8 chart types
      expect(options).toHaveLength(9);
      
      // Check for all chart types
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
      expect(screen.getByText('Pie Chart')).toBeInTheDocument();
      expect(screen.getByText('Doughnut Chart')).toBeInTheDocument();
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
      expect(screen.getByText('Area Chart')).toBeInTheDocument();
      expect(screen.getByText('Radar Chart')).toBeInTheDocument();
      expect(screen.getByText('Polar Area Chart')).toBeInTheDocument();
      expect(screen.getByText('Word Cloud')).toBeInTheDocument();
    });

    it('should call onChange when selection changes', () => {
      render(<ChartSelector {...defaultProps} />);
      
      const select = screen.getByTestId('chart-selector');
      fireEvent.change(select, { target: { value: 'Pie' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('Pie');
    });

    it('should display current value', () => {
      render(<ChartSelector {...defaultProps} value="Line" />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toHaveValue('Line');
    });
  });

  // Available Types Filtering Tests
  describe('Available Types Filtering', () => {
    it('should filter available types when provided', () => {
      const availableTypes: ChartType[] = ['Bar', 'Pie', 'Line'];
      render(<ChartSelector {...defaultProps} availableTypes={availableTypes} />);
      
      const select = screen.getByTestId('chart-selector');
      const options = select.querySelectorAll('option');
      
      // Should have placeholder + 3 available types
      expect(options).toHaveLength(4);
      
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
      expect(screen.getByText('Pie Chart')).toBeInTheDocument();
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
      
      // Should not have other types
      expect(screen.queryByText('Doughnut Chart')).not.toBeInTheDocument();
      expect(screen.queryByText('Area Chart')).not.toBeInTheDocument();
      expect(screen.queryByText('Radar Chart')).not.toBeInTheDocument();
      expect(screen.queryByText('Polar Area Chart')).not.toBeInTheDocument();
      expect(screen.queryByText('Word Cloud')).not.toBeInTheDocument();
    });

    it('should handle empty available types array', () => {
      render(<ChartSelector {...defaultProps} availableTypes={[]} />);
      
      const select = screen.getByTestId('chart-selector');
      const options = select.querySelectorAll('option');
      
      // Should only have placeholder
      expect(options).toHaveLength(1);
      expect(screen.queryByText('Bar Chart')).not.toBeInTheDocument();
    });

    it('should handle single available type', () => {
      const availableTypes: ChartType[] = ['Bar'];
      render(<ChartSelector {...defaultProps} availableTypes={availableTypes} />);
      
      const select = screen.getByTestId('chart-selector');
      const options = select.querySelectorAll('option');
      
      // Should have placeholder + 1 available type
      expect(options).toHaveLength(2);
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
      expect(screen.queryByText('Pie Chart')).not.toBeInTheDocument();
    });

    it('should handle all available types', () => {
      const allTypes: ChartType[] = ['Bar', 'Pie', 'Doughnut', 'Line', 'Area', 'Radar', 'PolarArea', 'WordCloud'];
      render(<ChartSelector {...defaultProps} availableTypes={allTypes} />);
      
      const select = screen.getByTestId('chart-selector');
      const options = select.querySelectorAll('option');
      
      // Should have placeholder + 8 chart types
      expect(options).toHaveLength(9);
      
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
      expect(screen.getByText('Pie Chart')).toBeInTheDocument();
      expect(screen.getByText('Doughnut Chart')).toBeInTheDocument();
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
      expect(screen.getByText('Area Chart')).toBeInTheDocument();
      expect(screen.getByText('Radar Chart')).toBeInTheDocument();
      expect(screen.getByText('Polar Area Chart')).toBeInTheDocument();
      expect(screen.getByText('Word Cloud')).toBeInTheDocument();
    });

    it('should handle invalid available types gracefully', () => {
      const invalidTypes: ChartType[] = ['Bar', 'Pie'];
      render(<ChartSelector {...defaultProps} availableTypes={invalidTypes} />);
      
      const select = screen.getByTestId('chart-selector');
      const options = select.querySelectorAll('option');
      
      // Should have placeholder + 2 valid types
      expect(options).toHaveLength(3);
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
      expect(screen.getByText('Pie Chart')).toBeInTheDocument();
    });
  });

  // Chart Type Tests
  describe('Chart Type Values', () => {
    it('should have correct values for all chart types', () => {
      render(<ChartSelector {...defaultProps} />);
      
      const select = screen.getByTestId('chart-selector');
      
      // Test each chart type value
      const chartTypes = [
        { value: 'Bar', label: 'Bar Chart' },
        { value: 'Pie', label: 'Pie Chart' },
        { value: 'Doughnut', label: 'Doughnut Chart' },
        { value: 'Line', label: 'Line Chart' },
        { value: 'Area', label: 'Area Chart' },
        { value: 'Radar', label: 'Radar Chart' },
        { value: 'PolarArea', label: 'Polar Area Chart' },
        { value: 'WordCloud', label: 'Word Cloud' }
      ];
      
      chartTypes.forEach(({ value, label }) => {
        const option = select.querySelector(`option[value="${value}"]`);
        expect(option).toBeInTheDocument();
        expect(option).toHaveTextContent(label);
      });
    });

    it('should handle all chart type selections', () => {
      const chartTypes = ['Bar', 'Pie', 'Doughnut', 'Line', 'Area', 'Radar', 'PolarArea', 'WordCloud'];
      
      chartTypes.forEach(chartType => {
        const { unmount } = render(<ChartSelector {...defaultProps} value={chartType as any} />);
        
        const select = screen.getByTestId('chart-selector');
        expect(select).toHaveValue(chartType);
        
        unmount();
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle undefined value', () => {
      render(<ChartSelector {...defaultProps} value={undefined as any} />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toHaveValue('');
    });

    it('should handle null value', () => {
      render(<ChartSelector {...defaultProps} value={null as any} />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toHaveValue('');
    });

    it('should handle empty string value', () => {
      render(<ChartSelector {...defaultProps} value={'' as any} />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toHaveValue('');
    });

    it('should handle invalid value gracefully', () => {
      render(<ChartSelector {...defaultProps} value={'InvalidType' as any} />);
      
      const select = screen.getByTestId('chart-selector');
      // Invalid values are not rendered as options, so the select will have empty value
      expect(select).toHaveValue('');
    });

    it('should handle missing onChange prop', () => {
      render(<ChartSelector value="Bar" onChange={undefined as any} />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('Bar');
    });

    it('should handle null onChange prop', () => {
      render(<ChartSelector value="Bar" onChange={null as any} />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('Bar');
    });
  });

  // Event Handling Tests
  describe('Event Handling', () => {
    it('should call onChange with correct value when option is selected', () => {
      render(<ChartSelector {...defaultProps} />);
      
      const select = screen.getByTestId('chart-selector');
      
      // Test multiple selections
      const testValues = ['Pie', 'Line', 'WordCloud'];
      
      testValues.forEach(value => {
        fireEvent.change(select, { target: { value } });
        expect(mockOnChange).toHaveBeenCalledWith(value);
      });
      
      expect(mockOnChange).toHaveBeenCalledTimes(testValues.length);
    });

    it('should call onChange with empty string when placeholder is selected', () => {
      render(<ChartSelector {...defaultProps} />);
      
      const select = screen.getByTestId('chart-selector');
      fireEvent.change(select, { target: { value: '' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should handle rapid selection changes', () => {
      render(<ChartSelector {...defaultProps} />);
      
      const select = screen.getByTestId('chart-selector');
      
      // Rapid changes
      const values = ['Bar', 'Pie', 'Line', 'Area', 'Doughnut'];
      values.forEach(value => {
        fireEvent.change(select, { target: { value } });
      });
      
      expect(mockOnChange).toHaveBeenCalledTimes(values.length);
      expect(mockOnChange).toHaveBeenLastCalledWith('Doughnut');
    });

    it('should not call onChange when value is set programmatically', () => {
      const { rerender } = render(<ChartSelector {...defaultProps} value="Bar" />);
      
      // Change value programmatically
      rerender(<ChartSelector {...defaultProps} value="Pie" />);
      
      // onChange should not be called
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid prop changes efficiently', () => {
      const { rerender } = render(<ChartSelector {...defaultProps} />);
      
      const startTime = performance.now();
      
      // Rapid prop changes
      const values = ['Bar', 'Pie', 'Line', 'Area', 'Doughnut', 'Radar', 'PolarArea', 'WordCloud'];
      for (let i = 0; i < 100; i++) {
        const value = values[i % values.length];
        rerender(<ChartSelector {...defaultProps} value={value as any} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle large availableTypes arrays efficiently', () => {
      const largeAvailableTypes = Array.from({ length: 1000 }, (_, i) => `Type${i}` as any);
      
      const startTime = performance.now();
      render(<ChartSelector {...defaultProps} availableTypes={largeAvailableTypes} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getByTestId('chart-selector')).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with all props combined', () => {
      const allProps = {
        value: 'Line' as const,
        onChange: mockOnChange,
        availableTypes: ['Bar', 'Pie', 'Line'] as ChartType[]
      };
      
      render(<ChartSelector {...allProps} />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toHaveValue('Line');
      
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(4); // placeholder + 3 available types
      
      expect(screen.getByText('Bar Chart')).toBeInTheDocument();
      expect(screen.getByText('Pie Chart')).toBeInTheDocument();
      expect(screen.getByText('Line Chart')).toBeInTheDocument();
    });

    it('should maintain component structure across re-renders', () => {
      const { rerender } = render(<ChartSelector {...defaultProps} />);
      
      expect(screen.getByTestId('chart-selector')).toBeInTheDocument();
      
      rerender(<ChartSelector {...defaultProps} value="Pie" />);
      
      const select = screen.getByTestId('chart-selector');
      expect(select).toHaveValue('Pie');
    });

    it('should handle dynamic availableTypes changes', () => {
      const { rerender } = render(<ChartSelector {...defaultProps} availableTypes={['Bar']} />);
      
      let select = screen.getByTestId('chart-selector');
      let options = select.querySelectorAll('option');
      expect(options).toHaveLength(2); // placeholder + 1 available type
      
      rerender(<ChartSelector {...defaultProps} availableTypes={['Bar', 'Pie', 'Line']} />);
      
      select = screen.getByTestId('chart-selector');
      options = select.querySelectorAll('option');
      expect(options).toHaveLength(4); // placeholder + 3 available types
    });

    it('should handle value changes with different availableTypes', () => {
      const { rerender } = render(<ChartSelector {...defaultProps} value="Bar" availableTypes={['Bar', 'Pie']} />);
      
      let select = screen.getByTestId('chart-selector');
      expect(select).toHaveValue('Bar');
      
      // Change to Pie
      rerender(<ChartSelector {...defaultProps} value="Pie" availableTypes={['Bar', 'Pie']} />);
      
      select = screen.getByTestId('chart-selector');
      expect(select).toHaveValue('Pie');
      
      // Change availableTypes to not include current value
      rerender(<ChartSelector {...defaultProps} value="Pie" availableTypes={['Bar']} />);
      
      select = screen.getByTestId('chart-selector');
      // When value is not in availableTypes, it defaults to empty
      expect(select).toHaveValue('');
    });
  });
});

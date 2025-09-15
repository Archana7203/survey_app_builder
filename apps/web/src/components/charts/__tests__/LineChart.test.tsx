import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LineChart from '../LineChart';

// Mock Recharts components to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  LineChart: ({ children, data, ...props }: any) => (
    <div data-testid="recharts-linechart" data-props={JSON.stringify(props)}>
      {children}
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  ),
  Line: ({ type, dataKey, stroke, strokeWidth, dot, ...props }: any) => (
    <div data-testid="recharts-line" data-props={JSON.stringify({ type, dataKey, stroke, strokeWidth, dot, ...props })} />
  ),
  XAxis: ({ dataKey, tick, ...props }: any) => (
    <div data-testid="recharts-xaxis" data-props={JSON.stringify({ dataKey, tick, ...props })} />
  ),
  YAxis: ({ tick, ...props }: any) => (
    <div data-testid="recharts-yaxis" data-props={JSON.stringify({ tick, ...props })} />
  ),
  CartesianGrid: ({ strokeDasharray, ...props }: any) => (
    <div data-testid="recharts-cartesian-grid" data-props={JSON.stringify({ strokeDasharray, ...props })} />
  ),
  Tooltip: (props: any) => (
    <div data-testid="recharts-tooltip" data-props={JSON.stringify(props)} />
  ),
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="recharts-responsive-container" style={{ width, height }}>
      {children}
    </div>
  ),
}));

describe('LineChart Component', () => {
  const mockData = [
    { name: 'Jan', value: 30 },
    { name: 'Feb', value: 45 },
    { name: 'Mar', value: 25 },
    { name: 'Apr', value: 60 },
    { name: 'May', value: 40 }
  ];

  const defaultProps = {
    data: mockData,
    title: 'Test Line Chart'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<LineChart {...defaultProps} />);
      
      expect(screen.getByText('Test Line Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      const { title, ...propsWithoutTitle } = defaultProps;
      render(<LineChart {...propsWithoutTitle} />);
      
      expect(screen.queryByText('Test Line Chart')).not.toBeInTheDocument();
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
    });

    it('should pass data to Recharts LineChart', () => {
      render(<LineChart {...defaultProps} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(mockData));
    });

    it('should render all required Recharts components', () => {
      render(<LineChart {...defaultProps} />);
      
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-line')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-xaxis')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-yaxis')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument();
    });

    it('should apply default styling classes', () => {
      render(<LineChart {...defaultProps} />);
      
      const container = screen.getByTestId('recharts-responsive-container').parentElement;
      expect(container).toHaveClass('w-full', 'h-96');
    });
  });

  // Props and Configuration Tests
  describe('Props and Configuration', () => {
    it('should apply custom color', () => {
      render(<LineChart {...defaultProps} color="#FF5733" />);
      
      const line = screen.getByTestId('recharts-line');
      const lineProps = JSON.parse(line.getAttribute('data-props') || '{}');
      expect(lineProps.stroke).toBe('#FF5733');
    });

    it('should apply default color when not provided', () => {
      render(<LineChart {...defaultProps} />);
      
      const line = screen.getByTestId('recharts-line');
      const lineProps = JSON.parse(line.getAttribute('data-props') || '{}');
      expect(lineProps.stroke).toBe('#3B82F6');
    });

    it('should configure Line with correct props', () => {
      render(<LineChart {...defaultProps} />);
      
      const line = screen.getByTestId('recharts-line');
      const lineProps = JSON.parse(line.getAttribute('data-props') || '{}');
      expect(lineProps.type).toBe('monotone');
      expect(lineProps.dataKey).toBe('value');
      expect(lineProps.stroke).toBe('#3B82F6');
      expect(lineProps.strokeWidth).toBe(2);
    });

    it('should configure Line with dot props', () => {
      render(<LineChart {...defaultProps} />);
      
      const line = screen.getByTestId('recharts-line');
      const lineProps = JSON.parse(line.getAttribute('data-props') || '{}');
      expect(lineProps.dot).toEqual({ fill: '#3B82F6' });
    });

    it('should configure XAxis with correct props', () => {
      render(<LineChart {...defaultProps} />);
      
      const xAxis = screen.getByTestId('recharts-xaxis');
      const xAxisProps = JSON.parse(xAxis.getAttribute('data-props') || '{}');
      expect(xAxisProps.dataKey).toBe('name');
      expect(xAxisProps.tick).toEqual({ fontSize: 12 });
    });

    it('should configure YAxis with correct props', () => {
      render(<LineChart {...defaultProps} />);
      
      const yAxis = screen.getByTestId('recharts-yaxis');
      const yAxisProps = JSON.parse(yAxis.getAttribute('data-props') || '{}');
      expect(yAxisProps.tick).toEqual({ fontSize: 12 });
    });

    it('should configure CartesianGrid with correct props', () => {
      render(<LineChart {...defaultProps} />);
      
      const grid = screen.getByTestId('recharts-cartesian-grid');
      const gridProps = JSON.parse(grid.getAttribute('data-props') || '{}');
      expect(gridProps.strokeDasharray).toBe('3 3');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty data array', () => {
      render(<LineChart {...defaultProps} data={[]} />);
      
      expect(screen.getByText('Test Line Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent('[]');
    });

    it('should handle single data point', () => {
      const singleData = [{ name: 'Single Point', value: 100 }];
      render(<LineChart {...defaultProps} data={singleData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(singleData));
    });

    it('should handle data with zero values', () => {
      const zeroData = [
        { name: 'Zero Value', value: 0 },
        { name: 'Normal Value', value: 50 }
      ];
      render(<LineChart {...defaultProps} data={zeroData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(zeroData));
    });

    it('should handle data with negative values', () => {
      const negativeData = [
        { name: 'Positive', value: 50 },
        { name: 'Negative', value: -30 },
        { name: 'Zero', value: 0 }
      ];
      render(<LineChart {...defaultProps} data={negativeData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(negativeData));
    });

    it('should handle very large values', () => {
      const largeData = [
        { name: 'Large', value: 999999 },
        { name: 'Normal', value: 50 }
      ];
      render(<LineChart {...defaultProps} data={largeData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(largeData));
    });

    it('should handle very small values', () => {
      const smallData = [
        { name: 'Small', value: 0.001 },
        { name: 'Normal', value: 50 }
      ];
      render(<LineChart {...defaultProps} data={smallData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(smallData));
    });

    it('should handle very long category names', () => {
      const longNameData = [
        { name: 'A'.repeat(100), value: 50 },
        { name: 'Normal Name', value: 30 }
      ];
      render(<LineChart {...defaultProps} data={longNameData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(longNameData));
    });

    it('should handle special characters in category names', () => {
      const specialCharData = [
        { name: 'Category with "quotes" & symbols!', value: 50 },
        { name: 'Category with <HTML> tags', value: 30 },
        { name: 'Category with émojis 🎉', value: 20 }
      ];
      render(<LineChart {...defaultProps} data={specialCharData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(specialCharData));
    });

    it('should handle data with missing name property', () => {
      const incompleteData = [
        { value: 50 },
        { name: 'Complete', value: 30 }
      ] as any;
      render(<LineChart {...defaultProps} data={incompleteData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(incompleteData));
    });

    it('should handle data with missing value property', () => {
      const incompleteData = [
        { name: 'Complete' },
        { name: 'Incomplete', value: 30 }
      ] as any;
      render(<LineChart {...defaultProps} data={incompleteData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(incompleteData));
    });

    it('should handle null/undefined data gracefully', () => {
      render(<LineChart {...defaultProps} data={null as any} />);
      
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = [
        null,
        undefined,
        'not-an-object',
        { name: 'Valid', value: 50 }
      ] as any;
      render(<LineChart {...defaultProps} data={malformedData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(malformedData));
    });

    it('should handle data with all same values', () => {
      const sameValueData = [
        { name: 'Point 1', value: 50 },
        { name: 'Point 2', value: 50 },
        { name: 'Point 3', value: 50 }
      ];
      render(<LineChart {...defaultProps} data={sameValueData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(sameValueData));
    });

    it('should handle data with decimal values', () => {
      const decimalData = [
        { name: 'Point 1', value: 50.5 },
        { name: 'Point 2', value: 30.25 },
        { name: 'Point 3', value: 75.75 }
      ];
      render(<LineChart {...defaultProps} data={decimalData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(decimalData));
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        name: `Point ${i}`,
        value: Math.random() * 100
      }));
      
      const startTime = performance.now();
      render(<LineChart {...defaultProps} data={largeData} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
    });

    it('should handle rapid data updates efficiently', () => {
      const { rerender } = render(<LineChart {...defaultProps} />);
      
      const startTime = performance.now();
      
      // Rapid data updates
      for (let i = 0; i < 100; i++) {
        const newData = mockData.map(item => ({
          ...item,
          value: item.value + i
        }));
        rerender(<LineChart {...defaultProps} data={newData} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in less than 2 seconds
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle missing data prop gracefully', () => {
      render(<LineChart title="Test Chart" />);
      
      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
    });

    it('should handle invalid color values gracefully', () => {
      render(<LineChart {...defaultProps} color="invalid-color" />);
      
      const line = screen.getByTestId('recharts-line');
      const lineProps = JSON.parse(line.getAttribute('data-props') || '{}');
      expect(lineProps.stroke).toBe('invalid-color');
    });

    it('should handle non-string color values gracefully', () => {
      render(<LineChart {...defaultProps} color={123 as any} />);
      
      const line = screen.getByTestId('recharts-line');
      const lineProps = JSON.parse(line.getAttribute('data-props') || '{}');
      expect(lineProps.stroke).toBe(123);
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper heading structure when title is provided', () => {
      render(<LineChart {...defaultProps} />);
      
      const title = screen.getByText('Test Line Chart');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-medium', 'text-gray-900', 'dark:text-white', 'mb-4');
    });

    it('should have proper container structure', () => {
      render(<LineChart {...defaultProps} />);
      
      const container = screen.getByTestId('recharts-responsive-container').parentElement;
      expect(container).toHaveClass('w-full', 'h-96');
    });

    it('should support dark mode styling', () => {
      render(<LineChart {...defaultProps} />);
      
      const title = screen.getByText('Test Line Chart');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with all props combined', () => {
      const allProps = {
        data: mockData,
        title: 'Complete Test Chart',
        color: '#FF5733'
      };
      
      render(<LineChart {...allProps} />);
      
      expect(screen.getByText('Complete Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
      
      const line = screen.getByTestId('recharts-line');
      const lineProps = JSON.parse(line.getAttribute('data-props') || '{}');
      expect(lineProps.stroke).toBe('#FF5733');
    });

    it('should maintain component structure across re-renders', () => {
      const { rerender } = render(<LineChart {...defaultProps} />);
      
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
      
      rerender(<LineChart {...defaultProps} title="Updated Title" />);
      
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
    });

    it('should handle time series data', () => {
      const timeSeriesData = [
        { name: '2023-01-01', value: 100 },
        { name: '2023-01-02', value: 120 },
        { name: '2023-01-03', value: 90 },
        { name: '2023-01-04', value: 150 }
      ];
      
      render(<LineChart {...defaultProps} data={timeSeriesData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(timeSeriesData));
    });

    it('should handle data with gaps', () => {
      const dataWithGaps = [
        { name: 'Point 1', value: 50 },
        { name: 'Point 2', value: null },
        { name: 'Point 3', value: 75 }
      ] as any;
      
      render(<LineChart {...defaultProps} data={dataWithGaps} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(dataWithGaps));
    });
  });
});


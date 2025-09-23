import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BarChart from '../BarChart';

// Mock Recharts components to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  BarChart: ({ children, data, ...props }: any) => (
    <div data-testid="recharts-barchart" data-props={JSON.stringify(props)}>
      {children}
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  ),
  Bar: ({ dataKey, fill, maxBarSize, ...props }: any) => (
    <div data-testid="recharts-bar" data-props={JSON.stringify({ dataKey, fill, maxBarSize, ...props })} />
  ),
  XAxis: ({ dataKey, tick, interval, angle, textAnchor, height, ...props }: any) => (
    <div data-testid="recharts-xaxis" data-props={JSON.stringify({ dataKey, tick, interval, angle, textAnchor, height, ...props })} />
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

describe('BarChart Component', () => {
  const mockData = [
    { name: 'Category A', value: 30 },
    { name: 'Category B', value: 45 },
    { name: 'Category C', value: 25 }
  ];

  const defaultProps = {
    data: mockData,
    title: 'Test Bar Chart'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<BarChart {...defaultProps} />);
      
      expect(screen.getByText('Test Bar Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      const { title, ...propsWithoutTitle } = defaultProps;
      render(<BarChart {...propsWithoutTitle} />);
      
      expect(screen.queryByText('Test Bar Chart')).not.toBeInTheDocument();
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
    });

    it('should pass data to Recharts BarChart', () => {
      render(<BarChart {...defaultProps} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(mockData));
    });

    it('should render all required Recharts components', () => {
      render(<BarChart {...defaultProps} />);
      
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-bar')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-xaxis')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-yaxis')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument();
    });

    it('should apply default styling classes', () => {
      render(<BarChart {...defaultProps} />);
      
      const container = screen.getByTestId('recharts-responsive-container').parentElement;
      expect(container).toHaveClass('w-full', 'h-96');
    });
  });

  // Props and Configuration Tests
  describe('Props and Configuration', () => {
    it('should apply custom color', () => {
      render(<BarChart {...defaultProps} color="#FF5733" />);
      
      const bar = screen.getByTestId('recharts-bar');
      const barProps = JSON.parse(bar.getAttribute('data-props') || '{}');
      expect(barProps.fill).toBe('#FF5733');
    });

    it('should apply default color when not provided', () => {
      render(<BarChart {...defaultProps} />);
      
      const bar = screen.getByTestId('recharts-bar');
      const barProps = JSON.parse(bar.getAttribute('data-props') || '{}');
      expect(barProps.fill).toBe('#3B82F6');
    });

    it('should apply custom maxBarSize', () => {
      render(<BarChart {...defaultProps} maxBarSize={100} />);
      
      const bar = screen.getByTestId('recharts-bar');
      const barProps = JSON.parse(bar.getAttribute('data-props') || '{}');
      expect(barProps.maxBarSize).toBe(100);
    });

    it('should apply default maxBarSize when not provided', () => {
      render(<BarChart {...defaultProps} />);
      
      const bar = screen.getByTestId('recharts-bar');
      const barProps = JSON.parse(bar.getAttribute('data-props') || '{}');
      expect(barProps.maxBarSize).toBe(80);
    });

    it('should apply custom barCategoryGap', () => {
      render(<BarChart {...defaultProps} barCategoryGap="30%" />);
      
      const chart = screen.getByTestId('recharts-barchart');
      const chartProps = JSON.parse(chart.getAttribute('data-props') || '{}');
      expect(chartProps.barCategoryGap).toBe('30%');
    });

    it('should apply default barCategoryGap when not provided', () => {
      render(<BarChart {...defaultProps} />);
      
      const chart = screen.getByTestId('recharts-barchart');
      const chartProps = JSON.parse(chart.getAttribute('data-props') || '{}');
      expect(chartProps.barCategoryGap).toBe('20%');
    });

    it('should configure XAxis with correct props', () => {
      render(<BarChart {...defaultProps} />);
      
      const xAxis = screen.getByTestId('recharts-xaxis');
      const xAxisProps = JSON.parse(xAxis.getAttribute('data-props') || '{}');
      expect(xAxisProps.dataKey).toBe('name');
      expect(xAxisProps.interval).toBe(0);
      expect(xAxisProps.angle).toBe(-45);
      expect(xAxisProps.textAnchor).toBe('end');
      expect(xAxisProps.height).toBe(60);
    });

    it('should configure YAxis with correct props', () => {
      render(<BarChart {...defaultProps} />);
      
      const yAxis = screen.getByTestId('recharts-yaxis');
      const yAxisProps = JSON.parse(yAxis.getAttribute('data-props') || '{}');
      expect(yAxisProps.tick).toEqual({ fontSize: 12 });
    });

    it('should configure CartesianGrid with correct props', () => {
      render(<BarChart {...defaultProps} />);
      
      const grid = screen.getByTestId('recharts-cartesian-grid');
      const gridProps = JSON.parse(grid.getAttribute('data-props') || '{}');
      expect(gridProps.strokeDasharray).toBe('3 3');
    });

    it('should configure Bar with correct props', () => {
      render(<BarChart {...defaultProps} />);
      
      const bar = screen.getByTestId('recharts-bar');
      const barProps = JSON.parse(bar.getAttribute('data-props') || '{}');
      expect(barProps.dataKey).toBe('value');
      expect(barProps.fill).toBe('#3B82F6');
      expect(barProps.maxBarSize).toBe(80);
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty data array', () => {
      render(<BarChart {...defaultProps} data={[]} />);
      
      expect(screen.getByText('Test Bar Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent('[]');
    });

    it('should handle single data point', () => {
      const singleData = [{ name: 'Single Category', value: 100 }];
      render(<BarChart {...defaultProps} data={singleData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(singleData));
    });

    it('should handle data with zero values', () => {
      const zeroData = [
        { name: 'Zero Value', value: 0 },
        { name: 'Normal Value', value: 50 }
      ];
      render(<BarChart {...defaultProps} data={zeroData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(zeroData));
    });

    it('should handle data with negative values', () => {
      const negativeData = [
        { name: 'Positive', value: 50 },
        { name: 'Negative', value: -30 },
        { name: 'Zero', value: 0 }
      ];
      render(<BarChart {...defaultProps} data={negativeData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(negativeData));
    });

    it('should handle very large values', () => {
      const largeData = [
        { name: 'Large', value: 999999 },
        { name: 'Normal', value: 50 }
      ];
      render(<BarChart {...defaultProps} data={largeData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(largeData));
    });

    it('should handle very small values', () => {
      const smallData = [
        { name: 'Small', value: 0.001 },
        { name: 'Normal', value: 50 }
      ];
      render(<BarChart {...defaultProps} data={smallData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(smallData));
    });

    it('should handle very long category names', () => {
      const longNameData = [
        { name: 'A'.repeat(100), value: 50 },
        { name: 'Normal Name', value: 30 }
      ];
      render(<BarChart {...defaultProps} data={longNameData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(longNameData));
    });

    it('should handle special characters in category names', () => {
      const specialCharData = [
        { name: 'Category with "quotes" & symbols!', value: 50 },
        { name: 'Category with <HTML> tags', value: 30 },
        { name: 'Category with émojis 🎉', value: 20 }
      ];
      render(<BarChart {...defaultProps} data={specialCharData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(specialCharData));
    });

    it('should handle data with missing name property', () => {
      const incompleteData = [
        { value: 50 },
        { name: 'Complete', value: 30 }
      ] as any;
      render(<BarChart {...defaultProps} data={incompleteData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(incompleteData));
    });

    it('should handle data with missing value property', () => {
      const incompleteData = [
        { name: 'Complete' },
        { name: 'Incomplete', value: 30 }
      ] as any;
      render(<BarChart {...defaultProps} data={incompleteData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(incompleteData));
    });

    it('should handle null/undefined data gracefully', () => {
      render(<BarChart {...defaultProps} data={null as any} />);
      
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = [
        null,
        undefined,
        'not-an-object',
        { name: 'Valid', value: 50 }
      ] as any;
      render(<BarChart {...defaultProps} data={malformedData} />);
      
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toHaveTextContent(JSON.stringify(malformedData));
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        name: `Category ${i}`,
        value: Math.random() * 100
      }));
      
      const startTime = performance.now();
      render(<BarChart {...defaultProps} data={largeData} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
    });

    it('should handle rapid data updates efficiently', () => {
      const { rerender } = render(<BarChart {...defaultProps} />);
      
      const startTime = performance.now();
      
      // Rapid data updates
      for (let i = 0; i < 100; i++) {
        const newData = mockData.map(item => ({
          ...item,
          value: item.value + i
        }));
        rerender(<BarChart {...defaultProps} data={newData} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in less than 2 seconds
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle missing data prop gracefully', () => {
      render(<BarChart title="Test Chart" />);
      
      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
    });

    it('should handle invalid color values gracefully', () => {
      render(<BarChart {...defaultProps} color="invalid-color" />);
      
      const bar = screen.getByTestId('recharts-bar');
      const barProps = JSON.parse(bar.getAttribute('data-props') || '{}');
      expect(barProps.fill).toBe('invalid-color');
    });

    it('should handle invalid maxBarSize values gracefully', () => {
      render(<BarChart {...defaultProps} maxBarSize={-10} />);
      
      const bar = screen.getByTestId('recharts-bar');
      const barProps = JSON.parse(bar.getAttribute('data-props') || '{}');
      expect(barProps.maxBarSize).toBe(-10);
    });

    it('should handle invalid barCategoryGap values gracefully', () => {
      render(<BarChart {...defaultProps} barCategoryGap="invalid" />);
      
      const chart = screen.getByTestId('recharts-barchart');
      const chartProps = JSON.parse(chart.getAttribute('data-props') || '{}');
      expect(chartProps.barCategoryGap).toBe('invalid');
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper heading structure when title is provided', () => {
      render(<BarChart {...defaultProps} />);
      
      const title = screen.getByText('Test Bar Chart');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-medium', 'text-gray-900', 'dark:text-white', 'mb-4');
    });

    it('should have proper container structure', () => {
      render(<BarChart {...defaultProps} />);
      
      const container = screen.getByTestId('recharts-responsive-container').parentElement;
      expect(container).toHaveClass('w-full', 'h-96');
    });

    it('should support dark mode styling', () => {
      render(<BarChart {...defaultProps} />);
      
      const title = screen.getByText('Test Bar Chart');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with all props combined', () => {
      const allProps = {
        data: mockData,
        title: 'Complete Test Chart',
        color: '#FF5733',
        maxBarSize: 100,
        barCategoryGap: '30%'
      };
      
      render(<BarChart {...allProps} />);
      
      expect(screen.getByText('Complete Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
      
      const bar = screen.getByTestId('recharts-bar');
      const barProps = JSON.parse(bar.getAttribute('data-props') || '{}');
      expect(barProps.fill).toBe('#FF5733');
      expect(barProps.maxBarSize).toBe(100);
      
      const chart = screen.getByTestId('recharts-barchart');
      const chartProps = JSON.parse(chart.getAttribute('data-props') || '{}');
      expect(chartProps.barCategoryGap).toBe('30%');
    });

    it('should maintain component structure across re-renders', () => {
      const { rerender } = render(<BarChart {...defaultProps} />);
      
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
      
      rerender(<BarChart {...defaultProps} title="Updated Title" />);
      
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
    });
  });
});
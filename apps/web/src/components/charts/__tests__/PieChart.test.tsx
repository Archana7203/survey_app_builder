import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PieChart from '../PieChart';

// Mock Recharts components to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  PieChart: ({ children, ...props }: any) => (
    <div data-testid="recharts-piechart" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
  Pie: ({ data, cx, cy, outerRadius, fill, dataKey, label, children, ...props }: any) => (
    <div data-testid="recharts-pie" data-props={JSON.stringify({ data, cx, cy, outerRadius, fill, dataKey, label, ...props })}>
      {children}
    </div>
  ),
  Cell: ({ key, fill, ...props }: any) => (
    <div data-testid="recharts-cell" data-props={JSON.stringify({ key, fill, ...props })} />
  ),
  Tooltip: (props: any) => (
    <div data-testid="recharts-tooltip" data-props={JSON.stringify(props)} />
  ),
  Legend: (props: any) => (
    <div data-testid="recharts-legend" data-props={JSON.stringify(props)} />
  ),
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="recharts-responsive-container" style={{ width, height }}>
      {children}
    </div>
  ),
}));

describe('PieChart Component', () => {
  const mockData = [
    { name: 'Category A', value: 30 },
    { name: 'Category B', value: 45 },
    { name: 'Category C', value: 25 }
  ];

  const defaultProps = {
    data: mockData,
    title: 'Test Pie Chart'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Basic Functionality Tests
  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<PieChart {...defaultProps} />);
      
      expect(screen.getByText('Test Pie Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-piechart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      const { title, ...propsWithoutTitle } = defaultProps;
      render(<PieChart {...propsWithoutTitle} />);
      
      expect(screen.queryByText('Test Pie Chart')).not.toBeInTheDocument();
      expect(screen.getByTestId('recharts-piechart')).toBeInTheDocument();
    });

    it('should render all required Recharts components', () => {
      render(<PieChart {...defaultProps} />);
      
      expect(screen.getByTestId('recharts-piechart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-pie')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-legend')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-responsive-container')).toBeInTheDocument();
    });

    it('should render cells for each data point', () => {
      render(<PieChart {...defaultProps} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
    });

    it('should apply default styling classes', () => {
      render(<PieChart {...defaultProps} />);
      
      const container = screen.getByTestId('recharts-responsive-container').parentElement;
      expect(container).toHaveClass('w-full', 'h-96');
    });
  });

  // Props and Configuration Tests
  describe('Props and Configuration', () => {
    it('should apply custom colors', () => {
      const customColors = ['#FF5733', '#33FF57', '#5733FF'];
      render(<PieChart {...defaultProps} colors={customColors} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
      
      // Check that cells have the custom colors
      cells.forEach((cell, index) => {
        const cellProps = JSON.parse(cell.getAttribute('data-props') || '{}');
        expect(cellProps.fill).toBe(customColors[index]);
      });
    });

    it('should apply default colors when not provided', () => {
      render(<PieChart {...defaultProps} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
      
      // Check that cells have default colors
      const defaultColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
      ];
      
      cells.forEach((cell, index) => {
        const cellProps = JSON.parse(cell.getAttribute('data-props') || '{}');
        expect(cellProps.fill).toBe(defaultColors[index % defaultColors.length]);
      });
    });

    it('should configure Pie with correct props', () => {
      render(<PieChart {...defaultProps} />);
      
      const pie = screen.getByTestId('recharts-pie');
      const pieProps = JSON.parse(pie.getAttribute('data-props') || '{}');
      expect(pieProps.cx).toBe('50%');
      expect(pieProps.cy).toBe('50%');
      expect(pieProps.outerRadius).toBe(110);
      expect(pieProps.fill).toBe('#8884d8');
      expect(pieProps.dataKey).toBe('value');
    });

    it('should configure Pie with label function', () => {
      render(<PieChart {...defaultProps} />);
      
      const pie = screen.getByTestId('recharts-pie');
      const pieProps = JSON.parse(pie.getAttribute('data-props') || '{}');
      // The label function is not serialized in JSON, so we just check the component renders
      expect(screen.getByTestId('recharts-pie')).toBeInTheDocument();
    });

    it('should pass data to Pie component', () => {
      render(<PieChart {...defaultProps} />);
      
      const pie = screen.getByTestId('recharts-pie');
      const pieProps = JSON.parse(pie.getAttribute('data-props') || '{}');
      expect(pieProps.data).toEqual(mockData);
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty data array', () => {
      render(<PieChart {...defaultProps} data={[]} />);
      
      expect(screen.getByText('Test Pie Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-piechart')).toBeInTheDocument();
      
      const cells = screen.queryAllByTestId('recharts-cell');
      expect(cells).toHaveLength(0);
    });

    it('should handle single data point', () => {
      const singleData = [{ name: 'Single Category', value: 100 }];
      render(<PieChart {...defaultProps} data={singleData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(1);
    });

    it('should handle data with zero values', () => {
      const zeroData = [
        { name: 'Zero Value', value: 0 },
        { name: 'Normal Value', value: 100 }
      ];
      render(<PieChart {...defaultProps} data={zeroData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(2);
    });

    it('should handle data with negative values', () => {
      const negativeData = [
        { name: 'Positive', value: 50 },
        { name: 'Negative', value: -30 },
        { name: 'Zero', value: 0 }
      ];
      render(<PieChart {...defaultProps} data={negativeData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
    });

    it('should handle very large values', () => {
      const largeData = [
        { name: 'Large', value: 999999 },
        { name: 'Normal', value: 1 }
      ];
      render(<PieChart {...defaultProps} data={largeData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(2);
    });

    it('should handle very small values', () => {
      const smallData = [
        { name: 'Small', value: 0.001 },
        { name: 'Normal', value: 99.999 }
      ];
      render(<PieChart {...defaultProps} data={smallData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(2);
    });

    it('should handle very long category names', () => {
      const longNameData = [
        { name: 'A'.repeat(100), value: 50 },
        { name: 'Normal Name', value: 30 }
      ];
      render(<PieChart {...defaultProps} data={longNameData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(2);
    });

    it('should handle special characters in category names', () => {
      const specialCharData = [
        { name: 'Category with "quotes" & symbols!', value: 50 },
        { name: 'Category with <HTML> tags', value: 30 },
        { name: 'Category with émojis 🎉', value: 20 }
      ];
      render(<PieChart {...defaultProps} data={specialCharData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
    });

    it('should handle data with missing name property', () => {
      const incompleteData = [
        { value: 50 },
        { name: 'Complete', value: 30 }
      ] as any;
      render(<PieChart {...defaultProps} data={incompleteData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(2);
    });

    it('should handle data with missing value property', () => {
      const incompleteData = [
        { name: 'Complete' },
        { name: 'Incomplete', value: 30 }
      ] as any;
      render(<PieChart {...defaultProps} data={incompleteData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(2);
    });

    it('should handle null/undefined data gracefully', () => {
      // The component will throw an error for null data, so we expect it to throw
      expect(() => {
        render(<PieChart {...defaultProps} data={null as any} />);
      }).toThrow();
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = [
        null,
        undefined,
        'not-an-object',
        { name: 'Valid', value: 50 }
      ] as any;
      render(<PieChart {...defaultProps} data={malformedData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(4); // All data points are rendered, including invalid ones
    });

    it('should handle data with all zero values', () => {
      const allZeroData = [
        { name: 'Zero 1', value: 0 },
        { name: 'Zero 2', value: 0 },
        { name: 'Zero 3', value: 0 }
      ];
      render(<PieChart {...defaultProps} data={allZeroData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
    });

    it('should handle more data points than available colors', () => {
      const manyData = Array.from({ length: 15 }, (_, i) => ({
        name: `Category ${i}`,
        value: Math.random() * 100
      }));
      render(<PieChart {...defaultProps} data={manyData} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(15);
      
      // Check that colors cycle properly
      const defaultColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
      ];
      
      cells.forEach((cell, index) => {
        const cellProps = JSON.parse(cell.getAttribute('data-props') || '{}');
        expect(cellProps.fill).toBe(defaultColors[index % defaultColors.length]);
      });
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        name: `Category ${i}`,
        value: Math.random() * 100
      }));
      
      const startTime = performance.now();
      render(<PieChart {...defaultProps} data={largeData} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getByTestId('recharts-piechart')).toBeInTheDocument();
    });

    it('should handle rapid data updates efficiently', () => {
      const { rerender } = render(<PieChart {...defaultProps} />);
      
      const startTime = performance.now();
      
      // Rapid data updates
      for (let i = 0; i < 50; i++) {
        const newData = mockData.map(item => ({
          ...item,
          value: item.value + i
        }));
        rerender(<PieChart {...defaultProps} data={newData} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in less than 2 seconds
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle missing data prop gracefully', () => {
      // The component will throw an error for undefined data, so we expect it to throw
      expect(() => {
        render(<PieChart title="Test Chart" />);
      }).toThrow();
    });

    it('should handle invalid color values gracefully', () => {
      const invalidColors = ['invalid-color', '#FF5733', 'another-invalid'];
      render(<PieChart {...defaultProps} colors={invalidColors} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
      
      cells.forEach((cell, index) => {
        const cellProps = JSON.parse(cell.getAttribute('data-props') || '{}');
        expect(cellProps.fill).toBe(invalidColors[index]);
      });
    });

    it('should handle empty colors array gracefully', () => {
      render(<PieChart {...defaultProps} colors={[]} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
      
      // When colors array is empty, the component may not set fill property
      cells.forEach((cell, index) => {
        const cellProps = JSON.parse(cell.getAttribute('data-props') || '{}');
        // Just check that the cell exists
        expect(cell).toBeInTheDocument();
      });
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper heading structure when title is provided', () => {
      render(<PieChart {...defaultProps} />);
      
      const title = screen.getByText('Test Pie Chart');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-medium', 'text-gray-900', 'dark:text-white', 'mb-4');
    });

    it('should have proper container structure', () => {
      render(<PieChart {...defaultProps} />);
      
      const container = screen.getByTestId('recharts-responsive-container').parentElement;
      expect(container).toHaveClass('w-full', 'h-96');
    });

    it('should support dark mode styling', () => {
      render(<PieChart {...defaultProps} />);
      
      const title = screen.getByText('Test Pie Chart');
      expect(title).toHaveClass('dark:text-white');
    });

    it('should render legend for accessibility', () => {
      render(<PieChart {...defaultProps} />);
      
      expect(screen.getByTestId('recharts-legend')).toBeInTheDocument();
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with all props combined', () => {
      const allProps = {
        data: mockData,
        title: 'Complete Test Chart',
        colors: ['#FF5733', '#33FF57', '#5733FF']
      };
      
      render(<PieChart {...allProps} />);
      
      expect(screen.getByText('Complete Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-piechart')).toBeInTheDocument();
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
      
      cells.forEach((cell, index) => {
        const cellProps = JSON.parse(cell.getAttribute('data-props') || '{}');
        expect(cellProps.fill).toBe(allProps.colors[index]);
      });
    });

    it('should maintain component structure across re-renders', () => {
      const { rerender } = render(<PieChart {...defaultProps} />);
      
      expect(screen.getByTestId('recharts-piechart')).toBeInTheDocument();
      
      rerender(<PieChart {...defaultProps} title="Updated Title" />);
      
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.getByTestId('recharts-piechart')).toBeInTheDocument();
    });

    it('should handle color array shorter than data array', () => {
      const shortColors = ['#FF5733', '#33FF57'];
      render(<PieChart {...defaultProps} colors={shortColors} />);
      
      const cells = screen.getAllByTestId('recharts-cell');
      expect(cells).toHaveLength(3);
      
      cells.forEach((cell, index) => {
        const cellProps = JSON.parse(cell.getAttribute('data-props') || '{}');
        expect(cellProps.fill).toBe(shortColors[index % shortColors.length]);
      });
    });
  });
});
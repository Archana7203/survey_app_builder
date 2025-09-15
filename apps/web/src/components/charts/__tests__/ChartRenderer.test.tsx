import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChartRenderer from '../ChartRenderer';

// Mock chart components
vi.mock('../BarChart', () => ({
  default: ({ data, title }: any) => (
    <div data-testid="bar-chart" data-title={title || ''}>
      Bar Chart: {JSON.stringify(data)}
    </div>
  )
}));

vi.mock('../PieChart', () => ({
  default: ({ data, title }: any) => (
    <div data-testid="pie-chart" data-title={title || ''}>
      Pie Chart: {JSON.stringify(data)}
    </div>
  )
}));

vi.mock('../LineChart', () => ({
  default: ({ data, title }: any) => (
    <div data-testid="line-chart" data-title={title || ''}>
      Line Chart: {JSON.stringify(data)}
    </div>
  )
}));

vi.mock('../WordCloud', () => ({
  default: ({ data, title }: any) => (
    <div data-testid="word-cloud" data-title={title || ''}>
      Word Cloud: {JSON.stringify(data)}
    </div>
  )
}));

describe('ChartRenderer Component', () => {
  const mockChoiceData = {
    type: 'choice' as const,
    counts: {
      'Option A': 30,
      'Option B': 20,
      'Option C': 10
    }
  };

  const mockNumericData = {
    type: 'numeric' as const,
    avg: 75.5,
    min: 10,
    max: 100,
    distribution: {
      '0-25': 5,
      '25-50': 15,
      '50-75': 25,
      '75-100': 10
    }
  };

  const mockTextData = {
    type: 'text' as const,
    topWords: [
      { word: 'excellent', count: 15 },
      { word: 'good', count: 12 },
      { word: 'average', count: 8 }
    ]
  };

  const defaultProps = {
    chartType: 'Bar' as const,
    data: mockChoiceData
  };

  describe('Chart Rendering', () => {
    it('should render Bar chart for choice data', () => {
      render(<ChartRenderer {...defaultProps} chartType="Bar" data={mockChoiceData} />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByText(/Bar Chart:/)).toBeInTheDocument();
    });

    it('should render Pie chart for choice data', () => {
      render(<ChartRenderer {...defaultProps} chartType="Pie" data={mockChoiceData} />);
      
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByText(/Pie Chart:/)).toBeInTheDocument();
    });

    it('should render Line chart for numeric data', () => {
      render(<ChartRenderer {...defaultProps} chartType="Line" data={mockNumericData} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByText(/Line Chart:/)).toBeInTheDocument();
    });

    it('should render WordCloud for text data', () => {
      render(<ChartRenderer {...defaultProps} chartType="WordCloud" data={mockTextData} />);
      
      expect(screen.getByTestId('word-cloud')).toBeInTheDocument();
      expect(screen.getByText(/Word Cloud:/)).toBeInTheDocument();
    });
  });

  describe('Data Conversion', () => {
    it('should convert choice data correctly', () => {
      render(<ChartRenderer {...defaultProps} chartType="Bar" data={mockChoiceData} />);
      
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.textContent?.replace('Bar Chart: ', '') || '[]');
      
      expect(chartData).toEqual([
        { name: 'Option A', value: 30 },
        { name: 'Option B', value: 20 },
        { name: 'Option C', value: 10 }
      ]);
    });

    it('should convert numeric data correctly', () => {
      render(<ChartRenderer {...defaultProps} chartType="Line" data={mockNumericData} />);
      
      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.textContent?.replace('Line Chart: ', '') || '[]');
      
      expect(chartData).toEqual([
        { name: '0-25', value: 5 },
        { name: '25-50', value: 15 },
        { name: '50-75', value: 25 },
        { name: '75-100', value: 10 }
      ]);
    });

    it('should convert text data correctly', () => {
      render(<ChartRenderer {...defaultProps} chartType="WordCloud" data={mockTextData} />);
      
      const wordCloud = screen.getByTestId('word-cloud');
      const chartData = JSON.parse(wordCloud.textContent?.replace('Word Cloud: ', '') || '[]');
      
      expect(chartData).toEqual(mockTextData.topWords);
    });
  });

  describe('Error Handling', () => {
    it('should show error message for unsupported chart type', () => {
      render(<ChartRenderer {...defaultProps} chartType="Radar" data={mockChoiceData} />);
      
      expect(screen.getByText('Chart type not implemented')).toBeInTheDocument();
    });

    it('should show error message for WordCloud with non-text data', () => {
      render(<ChartRenderer {...defaultProps} chartType="WordCloud" data={mockChoiceData} />);
      
      expect(screen.getByText('Word cloud only available for text data')).toBeInTheDocument();
    });

    it('should show error message for Bar chart with text data', () => {
      render(<ChartRenderer {...defaultProps} chartType="Bar" data={mockTextData} />);
      
      expect(screen.getByText('Bar chart not available for this data type')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should pass title to chart components', () => {
      render(<ChartRenderer {...defaultProps} chartType="Bar" data={mockChoiceData} title="Custom Title" />);
      
      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toHaveAttribute('data-title', 'Custom Title');
    });

    it('should handle missing title', () => {
      render(<ChartRenderer {...defaultProps} chartType="Bar" data={mockChoiceData} />);
      
      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toHaveAttribute('data-title', '');
    });
  });

  describe('Chart Type Compatibility', () => {
    const testCases = [
      { chartType: 'Bar' as const, data: mockChoiceData, expectedComponent: 'bar-chart' },
      { chartType: 'Pie' as const, data: mockChoiceData, expectedComponent: 'pie-chart' },
      { chartType: 'Line' as const, data: mockNumericData, expectedComponent: 'line-chart' },
      { chartType: 'WordCloud' as const, data: mockTextData, expectedComponent: 'word-cloud' }
    ];
    
    testCases.forEach(({ chartType, data, expectedComponent }) => {
      it(`should render ${chartType} chart correctly`, () => {
        const { unmount } = render(<ChartRenderer {...defaultProps} chartType={chartType} data={data} />);
        
        expect(screen.getByTestId(expectedComponent)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const emptyData = { type: 'choice' as const, counts: {} };
      
      render(<ChartRenderer {...defaultProps} chartType="Bar" data={emptyData} />);
      
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.textContent?.replace('Bar Chart: ', '') || '[]');
      
      expect(chartData).toEqual([]);
    });

    it('should handle missing optional properties', () => {
      const minimalData = { type: 'numeric' as const };
      
      render(<ChartRenderer {...defaultProps} chartType="Line" data={minimalData} />);
      
      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.textContent?.replace('Line Chart: ', '') || '[]');
      
      expect(chartData).toEqual([
        { name: 'Average', value: 0 },
        { name: 'Minimum', value: 0 },
        { name: 'Maximum', value: 0 }
      ]);
    });
  });
});

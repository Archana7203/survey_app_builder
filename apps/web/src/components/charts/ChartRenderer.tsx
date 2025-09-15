import React from 'react';
import type { ChartType } from './ChartSelector';
import BarChart from './BarChart';
import PieChart from './PieChart';
import LineChart from './LineChart';
import WordCloud from './WordCloud';

interface ChartData {
  type: 'choice' | 'numeric' | 'text' | 'matrix' | 'grid' | 'basic';
  counts?: Record<string, number>;
  avg?: number;
  min?: number;
  max?: number;
  distribution?: Record<string, number>;
  topWords?: Array<{ word: string; count: number }>;
  matrix?: Record<string, Record<string, number>>;
  grid?: Record<string, Record<string, number>>;
}

interface ChartRendererProps {
  chartType: ChartType;
  data: ChartData;
  title?: string;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({
  chartType,
  data,
  title,
}) => {
  // Convert data to chart format
  const getChartData = () => {
    switch (data.type) {
      case 'choice':
        return Object.entries(data.counts || {}).map(([name, value]) => ({
          name,
          value,
        }));
      
      case 'numeric':
        if (data.distribution) {
          return Object.entries(data.distribution).map(([name, value]) => ({
            name,
            value,
          }));
        }
        return [
          { name: 'Average', value: data.avg || 0 },
          { name: 'Minimum', value: data.min || 0 },
          { name: 'Maximum', value: data.max || 0 },
        ];
      
      case 'text':
        return data.topWords || [];
      
      case 'matrix':
        return data.matrix || {};
      
      case 'grid':
        return data.grid || {};
      
      default:
        return [];
    }
  };

  const chartData = getChartData();

  // Render appropriate chart based on type
  switch (chartType) {
    case 'Bar':
      if (data.type === 'text' || data.type === 'matrix' || data.type === 'grid') {
        return <div className="text-gray-500 dark:text-gray-400">Bar chart not available for this data type</div>;
      }
      return <BarChart data={chartData as Array<{ name: string; value: number }>} title={title} />;
    
    case 'Pie':
    case 'Doughnut':
      if (data.type === 'text' || data.type === 'matrix' || data.type === 'grid') {
        return <div className="text-gray-500 dark:text-gray-400">Pie chart not available for this data type</div>;
      }
      return <PieChart data={chartData as Array<{ name: string; value: number }>} title={title} />;
    
    case 'Line':
    case 'Area':
      if (data.type === 'text' || data.type === 'matrix' || data.type === 'grid') {
        return <div className="text-gray-500 dark:text-gray-400">Line chart not available for this data type</div>;
      }
      return <LineChart data={chartData as Array<{ name: string; value: number }>} title={title} />;
    
    case 'WordCloud':
      if (data.type !== 'text') {
        return <div className="text-gray-500 dark:text-gray-400">Word cloud only available for text data</div>;
      }
      return <WordCloud data={chartData as Array<{ word: string; count: number }>} title={title} />;
    
    default:
      return <div className="text-gray-500 dark:text-gray-400">Chart type not implemented</div>;
  }
};

export default ChartRenderer;

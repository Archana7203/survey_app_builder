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
  // Sort smiley rating categories in order
  const sortSmileyCategories = (entries: [string, number][]): [string, number][] => {
    const order = ['Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
    const orderMap = new Map(order.map((label, index) => [label, index]));
    
    return entries.sort(([a], [b]) => {
      const indexA = orderMap.get(a) ?? 999;
      const indexB = orderMap.get(b) ?? 999;
      return indexA - indexB;
    });
  };

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
          // Check if this might be smiley ratings (has "Very Sad" category)
          const entries = Object.entries(data.distribution);
          const hasSmileyCategories = entries.some(([key]) => 
            key.includes('Very Sad') || key.includes('Very Happy')
          );
          
          // Sort if it's smiley ratings
          const sortedEntries = hasSmileyCategories 
            ? sortSmileyCategories(entries)
            : entries.sort(([a], [b]) => Number(a) - Number(b));
          
          return sortedEntries.map(([name, value]) => ({
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

  const getAxisLabels = () => {
    switch (data.type) {
      case 'numeric':
        return { x: 'Value', y: 'Responses' };
      case 'choice':
        return { x: 'Options', y: 'Responses' };
      case 'matrix':
      case 'grid':
        return { x: 'Categories', y: 'Responses' };
      default:
        return { x: 'Categories', y: 'Responses' };
    }
  };

  const axisLabels = getAxisLabels();

  // Render appropriate chart based on type
  switch (chartType) {
    case 'Bar':
      if (data.type === 'text' || data.type === 'matrix' || data.type === 'grid') {
        return <div className="text-gray-500 dark:text-gray-400">Bar chart not available for this data type</div>;
      }
      return (
        <BarChart
          data={chartData as Array<{ name: string; value: number }>}
          title={title}
          xAxisLabel={axisLabels.x}
          yAxisLabel={axisLabels.y}
        />
      );
    
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
      return (
        <LineChart
          data={chartData as Array<{ name: string; value: number }>}
          title={title}
          xAxisLabel={axisLabels.x}
          yAxisLabel={axisLabels.y}
        />
      );
    
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

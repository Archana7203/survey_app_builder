import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  color?: string;
  maxBarSize?: number; // cap bar width so bars aren t too thick
  barCategoryGap?: string | number; // control spacing between categories
}

const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  color = '#3B82F6',
  maxBarSize = 80,
  barCategoryGap = '20%'
}) => {
  return (
    <div className="w-full h-96">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} barCategoryGap={barCategoryGap}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill={color} maxBarSize={maxBarSize} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;





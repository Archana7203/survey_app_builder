import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  color?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  title, 
  color = '#3B82F6',
  xAxisLabel,
  yAxisLabel 
}) => {
  return (
    <div className="w-full">
      <div className="h-80">
        {title && (
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12, fill: '#4B5563' },
                    }
                  : undefined
              }
            />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
      {xAxisLabel && (
        <div className="mt-2 text-center text-xs font-normal text-gray-500 dark:text-gray-400">
          {xAxisLabel}
        </div>
      )}
    </div>
  );
};

export default LineChart;





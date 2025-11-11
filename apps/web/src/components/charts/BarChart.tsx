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
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  color = '#3B82F6',
  maxBarSize = 80,
  barCategoryGap = '20%',
  xAxisLabel,
  yAxisLabel
}) => {
  const truncateLabel = (value: string): string => {
    if (!value) {
      return '';
    }
    if (value.length <= 12) {
      return value;
    }
    return `${value.slice(0, 12)}…`;
  };

  return (
    <div className="w-full">
      <div className="h-80">
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
            tickFormatter={truncateLabel}
            interval={0}
            dy={10}
              angle={-30}
              textAnchor="end"
              height={70}
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
          <Bar dataKey="value" fill={color} maxBarSize={maxBarSize} />
        </RechartsBarChart>
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

export default BarChart;





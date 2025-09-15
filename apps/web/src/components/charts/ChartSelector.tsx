import React from 'react';
import Select from '../ui/Select';

export type ChartType = 
  | 'Bar'
  | 'Pie' 
  | 'Doughnut'
  | 'Line'
  | 'Area'
  | 'Radar'
  | 'PolarArea'
  | 'WordCloud';

interface ChartSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
  availableTypes?: ChartType[];
}

const allChartTypes: { value: ChartType; label: string }[] = [
  { value: 'Bar', label: 'Bar Chart' },
  { value: 'Pie', label: 'Pie Chart' },
  { value: 'Doughnut', label: 'Doughnut Chart' },
  { value: 'Line', label: 'Line Chart' },
  { value: 'Area', label: 'Area Chart' },
  { value: 'Radar', label: 'Radar Chart' },
  { value: 'PolarArea', label: 'Polar Area Chart' },
  { value: 'WordCloud', label: 'Word Cloud' },
];

const ChartSelector: React.FC<ChartSelectorProps> = ({
  value,
  onChange,
  availableTypes,
}) => {
  const options = availableTypes 
    ? allChartTypes.filter(type => availableTypes.includes(type.value))
    : allChartTypes;

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as ChartType)}
      options={options}
      placeholder="Select chart type"
    />
  );
};

export default ChartSelector;





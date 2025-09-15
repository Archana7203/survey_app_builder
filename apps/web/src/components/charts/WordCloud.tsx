import React from 'react';

interface WordCloudProps {
  data: Array<{ word: string; count: number }>;
  title?: string;
}

const WordCloud: React.FC<WordCloudProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        No text data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map(item => item.count));
  const minCount = Math.min(...data.map(item => item.count));

  const getFontSize = (count: number) => {
    const ratio = (count - minCount) / (maxCount - minCount);
    return Math.max(16, 16 + ratio * 30); // 16px to 46px
  };

  const getColor = (count: number) => {
    const ratio = (count - minCount) / (maxCount - minCount);
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#06B6D4', '#84CC16', '#F97316', '#EC4899'
    ];
    return colors[Math.floor(ratio * colors.length)] || colors[0];
  };

  return (
    <div className="w-full h-96">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <div className="flex flex-wrap gap-2 h-full overflow-y-auto p-4 border border-gray-300 dark:border-gray-600 rounded">
        {data.map((item, index) => (
          <span
            key={`${item.word}-${index}`}
            className="inline-block px-2 py-1 rounded transition-transform hover:scale-110 cursor-default"
            style={{
              fontSize: `${getFontSize(item.count)}px`,
              color: getColor(item.count),
              fontWeight: Math.min(900, 400 + (item.count / maxCount) * 500),
            }}
            title={`${item.word}: ${item.count} occurrences`}
          >
            {item.word}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WordCloud;





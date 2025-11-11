import React, { useMemo } from 'react';

interface WordCloudProps {
  data: Array<{ word: string; count: number }>;
  title?: string;
}

interface WordPosition {
  word: string;
  count: number;
  fontSize: number;
  fontWeight: number;
  opacity: number;
  color: string;
  x: number;
  y: number;
  rotate: number;
  width: number;
  height: number;
}

const WordCloud: React.FC<WordCloudProps> = ({ data, title }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxCount = Math.max(...data.map(item => item.count));
    const minCount = Math.min(...data.map(item => item.count));

    // Sort by count descending - place larger words first
    const sorted = [...data].sort((a, b) => b.count - a.count);

    // Professional color palette
    const colors = [
      '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#22c55e',
      '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444',
      '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1'
    ];

    const positions: WordPosition[] = [];
    const containerWidth = 1000; // Virtual canvas size
    const containerHeight = 400;
    const padding = 8;

    // Helper to check if two rectangles overlap with padding
    const checkOverlap = (
      x1: number, y1: number, w1: number, h1: number,
      x2: number, y2: number, w2: number, h2: number
    ) => {
      return !(
        x1 + w1 + padding < x2 ||
        x2 + w2 + padding < x1 ||
        y1 + h1 + padding < y2 ||
        y2 + h2 + padding < y1
      );
    };

    // Spiral algorithm to find non-overlapping positions
    sorted.forEach((item, index) => {
      const ratio = (item.count - minCount) / (maxCount - minCount || 1);
      const fontSize = 20 + ratio * 36;
      const fontWeight = 500 + ratio * 400;
      const opacity = 0.65 + ratio * 0.35;
      const color = colors[index % colors.length];

      // Better width estimation: ~0.55 * fontSize per character on average
      const estimatedWidth = item.word.length * fontSize * 0.55;
      const estimatedHeight = fontSize * 1.3;

      // Generate seed for consistent randomness
      const seed = item.word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomRotate = ((seed * 5237 + 17389) % 21) - 10; // -10 to 10 degrees

      // Adjust dimensions for rotation
      const rotRad = Math.abs(randomRotate * Math.PI / 180);
      const rotatedWidth = Math.abs(estimatedWidth * Math.cos(rotRad)) + Math.abs(estimatedHeight * Math.sin(rotRad));
      const rotatedHeight = Math.abs(estimatedWidth * Math.sin(rotRad)) + Math.abs(estimatedHeight * Math.cos(rotRad));

      // Try to place word using spiral algorithm
      let placed = false;
      let attempts = 0;
      const maxAttempts = 800;
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      let radius = Math.min(index * 2, 20); // Start closer for important words
      let angle = (seed % 360) * (Math.PI / 180);
      const angleStep = 0.3;
      const radiusStep = 0.8;

      while (!placed && attempts < maxAttempts) {
        const candidateX = centerX + radius * Math.cos(angle) - rotatedWidth / 2;
        const candidateY = centerY + radius * Math.sin(angle) - rotatedHeight / 2;

        // Check if position is within bounds
        if (
          candidateX >= 0 &&
          candidateY >= 0 &&
          candidateX + rotatedWidth <= containerWidth &&
          candidateY + rotatedHeight <= containerHeight
        ) {
          // Check collision with existing words
          let hasCollision = false;
          for (const pos of positions) {
            if (checkOverlap(
              candidateX, candidateY, rotatedWidth, rotatedHeight,
              pos.x, pos.y, pos.width, pos.height
            )) {
              hasCollision = true;
              break;
            }
          }

          if (!hasCollision) {
            positions.push({
              word: item.word,
              count: item.count,
              fontSize,
              fontWeight,
              opacity,
              color,
              x: candidateX,
              y: candidateY,
              rotate: randomRotate,
              width: rotatedWidth,
              height: rotatedHeight
            });
            placed = true;
          }
        }

        // Spiral outward
        angle += angleStep;
        radius += radiusStep;
        attempts++;
      }

      // Fallback: place at a safe random position if couldn't place
      if (!placed) {
        const fallbackX = (seed % 40) * 20;
        const fallbackY = ((seed * 7) % 20) * 20;
        
        // Make sure it fits
        const safeX = Math.min(fallbackX, containerWidth - rotatedWidth);
        const safeY = Math.min(fallbackY, containerHeight - rotatedHeight);
        
        positions.push({
          word: item.word,
          count: item.count,
          fontSize,
          fontWeight,
          opacity: opacity * 0.7, // Make fallback words slightly dimmer
          color,
          x: Math.max(0, safeX),
          y: Math.max(0, safeY),
          rotate: randomRotate,
          width: rotatedWidth,
          height: rotatedHeight
        });
      }
    });

    // Convert to percentages for responsive layout
    return positions.map(pos => ({
      ...pos,
      x: (pos.x / containerWidth) * 100,
      y: (pos.y / containerHeight) * 100,
      width: (pos.width / containerWidth) * 100,
      height: (pos.height / containerHeight) * 100
    }));
  }, [data]);

  if (!processedData) {
    return (
      <div className="w-full min-h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No text responses yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {title}
        </h4>
      )}
      
      <div className="relative bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Subtle dot pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Word cloud content - non-overlapping scattered layout */}
        <div className="relative h-[450px] overflow-hidden p-6">
          <div className="relative w-full h-full">
            {processedData.map((item, index) => (
              <span
                key={`${item.word}-${index}`}
                className="absolute inline-block px-2.5 py-1 rounded-md transition-all duration-300 hover:scale-110 hover:z-50 cursor-pointer select-none whitespace-nowrap"
                style={{
                  fontSize: `${item.fontSize}px`,
                  color: item.color,
                  fontWeight: item.fontWeight,
                  opacity: item.opacity,
                  textShadow: `0 1px 3px ${item.color}15`,
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: `rotate(${item.rotate}deg)`,
                  animation: `fadeInCloud 0.6s ease-out ${index * 0.04}s backwards`
                }}
                title={`"${item.word}" - ${item.count} occurrence${item.count !== 1 ? 's' : ''}`}
              >
                {item.word}
              </span>
            ))}
          </div>
        </div>

        {/* Footer legend */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 px-4 py-2.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500" style={{ opacity: 0.65 }}></div>
              <span>Less frequent</span>
            </div>
            <span className="text-gray-400 dark:text-gray-500">{processedData.length} unique words</span>
            <div className="flex items-center gap-2">
              <span>More frequent</span>
              <div className="w-2.5 h-2.5 rounded-full bg-gray-700 dark:bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInCloud {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default WordCloud;
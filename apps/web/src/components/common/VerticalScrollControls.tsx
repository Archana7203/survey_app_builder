import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface VerticalScrollControlsProps {
  targetRef: React.RefObject<HTMLElement | null>;
  topOffsetClassName?: string;
  bottomOffsetClassName?: string;
  buttonClassName?: string;
  iconClassName?: string;
  threshold?: number;
  refreshKey?: unknown;
}

const baseButtonClasses =
  'flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-black/10 text-black shadow-md transition hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2';

const defaultTopOffset = 'absolute top-4 left-1/2';
const defaultBottomOffset = 'absolute bottom-4 left-1/2';

export const VerticalScrollControls: React.FC<VerticalScrollControlsProps> = ({
  targetRef,
  topOffsetClassName = defaultTopOffset,
  bottomOffsetClassName = defaultBottomOffset,
  buttonClassName = baseButtonClasses,
  iconClassName = 'h-5 w-5',
  threshold = 16,
  refreshKey,
}) => {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const container = targetRef.current;
    if (!container) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return undefined;
    }

    const updateScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setCanScrollUp(scrollTop > threshold);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - threshold);
    };

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
    };
  }, [targetRef, threshold, refreshKey]);

  useEffect(() => {
    const container = targetRef.current;
    if (!container) return;
    const { scrollHeight, clientHeight } = container;
    setCanScrollDown(scrollHeight > clientHeight + threshold);
    setCanScrollUp(false);
  }, [targetRef, threshold, refreshKey]);

  const handleScrollToTop = () => {
    targetRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToBottom = () => {
    const container = targetRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      {canScrollUp && targetRef.current && (
        <button
          type="button"
          className={`${topOffsetClassName} ${buttonClassName}`}
          onClick={handleScrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp className={iconClassName} />
        </button>
      )}
      {canScrollDown && targetRef.current && (
        <button
          type="button"
          className={`${bottomOffsetClassName} ${buttonClassName}`}
          onClick={handleScrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ArrowDown className={iconClassName} />
        </button>
      )}
    </>
  );
};

export default VerticalScrollControls;


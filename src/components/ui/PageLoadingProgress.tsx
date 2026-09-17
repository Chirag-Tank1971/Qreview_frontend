import React, { useState, useEffect, useRef } from 'react';

interface PageLoadingProgressProps {
  currentView: string;
}

/**
 * Ultra-lightweight, hardware-accelerated top page loading progress bar.
 * Operates purely on compositor thread (transform: scaleX) with 0 layout reflows.
 */
export const PageLoadingProgress: React.FC<PageLoadingProgressProps> = ({ currentView }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    clearTimers();

    // Start progress pulse on view change
    setIsVisible(true);
    setProgress(25);

    // Rapid, fluid progression to simulate responsive loading
    const t1 = setTimeout(() => {
      setProgress(70);
    }, 90);

    const t2 = setTimeout(() => {
      setProgress(100);
    }, 240);

    const t3 = setTimeout(() => {
      setIsVisible(false);
    }, 420);

    const t4 = setTimeout(() => {
      setProgress(0);
    }, 600);

    timersRef.current = [t1, t2, t3, t4];

    return clearTimers;
  }, [currentView]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="w-full h-full bg-transparent overflow-hidden">
        <div
          className="h-full w-full bg-blue-600 dark:bg-blue-500"
          style={{
            transform: `scaleX(${progress / 100})`,
            transformOrigin: '0 50%',
            transition: 'transform 150ms ease-out',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
};

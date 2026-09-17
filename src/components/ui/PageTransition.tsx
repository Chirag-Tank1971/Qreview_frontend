import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  viewKey: string;
  className?: string;
}

/**
 * GPU-accelerated page entrance container.
 * Promotes page view to its own compositor layer for fluid 60-120fps transitions.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  viewKey,
  className = '',
}) => {
  return (
    <div
      key={viewKey}
      className={`w-full min-h-full animate-page-enter ${className}`}
    >
      {children}
    </div>
  );
};

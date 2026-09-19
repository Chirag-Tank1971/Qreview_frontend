import React from 'react';

interface CycleBadgeProps {
  code?: string;
  cycleCode?: string;
  cycleName?: string;
  size?: 'sm' | 'md';
  className?: string;
  color?: string;
  showTooltip?: boolean;
}

/**
 * Enterprise Neutral Cycle Badge
 * Standardizes appraisal cycle presentation without rainbow styling
 */
export const CycleBadge: React.FC<CycleBadgeProps> = ({
  code: propCode,
  cycleCode,
  cycleName,
  size = 'md',
  className = '',
}) => {
  const code = propCode || cycleCode || (cycleName ? cycleName.replace(/Cycle\s*/i, '').trim() : '');
  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.2'
      : 'text-[11px] px-2 py-0.5';

  if (!code) {
    return (
      <span
        className={`inline-flex items-center font-mono font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 tracking-tight ${sizeClasses} ${className}`}
        title="No appraisal cycle assigned"
      >
        Unassigned
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tracking-tight ${sizeClasses} ${className}`}
      title={cycleName || `Appraisal Cycle ${code}`}
    >
      Cycle {code}
    </span>
  );
};

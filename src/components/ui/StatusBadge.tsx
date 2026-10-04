import React from 'react';
import { EmployeeStatus } from '../../types';
import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  showDot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const TONE_CLASSES = {
  default:
    'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80',
  primary:
    'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
  success:
    'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
  warning:
    'bg-amber-50/90 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
  danger:
    'bg-rose-50/90 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
  info:
    'bg-sky-50/90 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
};

const DOT_COLORS = {
  default: 'bg-slate-400 dark:bg-slate-500',
  primary: 'bg-indigo-500 dark:bg-indigo-400',
  success: 'bg-emerald-500 dark:bg-emerald-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-rose-500 dark:bg-rose-400',
  info: 'bg-sky-500 dark:bg-sky-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  tone = 'default',
  size = 'md',
  icon,
  showDot = true,
  className = '',
  children,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border select-none tabular-nums shadow-2xs transition-colors',
        sizeClasses,
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon ? (
        icon
      ) : showDot ? (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_COLORS[tone])} />
      ) : null}
      <span>{children || status}</span>
    </span>
  );
};

interface EmployeeStatusBadgeProps {
  status?: EmployeeStatus | string;
  className?: string;
}

export const EmployeeStatusBadge: React.FC<EmployeeStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  if (!status || status === 'ACTIVE') return null;

  switch (status) {
    case 'INACTIVE':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 select-none tabular-nums shadow-2xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>INACTIVE</span>
        </span>
      );
    case 'NOTICE':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 select-none tabular-nums shadow-2xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>NOTICE</span>
        </span>
      );
    case 'PROBATION':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 select-none tabular-nums shadow-2xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span>PROBATION</span>
        </span>
      );
    default:
      return null;
  }
};


import React from 'react';
import { cn } from '../../utils/cn';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  /** Primary call to action — solid indigo button. */
  action?: EmptyStateAction;
  /** Secondary call to action — neutral button, rendered after the primary one. */
  secondaryAction?: EmptyStateAction;
  /** 'neutral' (default) for "nothing here yet"; 'success' for a positive empty state
   *  like an empty inbox ("all caught up") — swaps the icon tint from indigo to emerald. */
  tone?: 'neutral' | 'success';
  className?: string;
}

const TONE_STYLES: Record<'neutral' | 'success', string> = {
  neutral: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800',
};

/**
 * Shared empty-state card — codifies the icon-in-tinted-box / bold title / muted
 * description / single-primary-action pattern that most views were already hand-rolling
 * slightly differently (different icon box sizes, radii, and spacing). See
 * REDESIGN_NOTES.md Step 1 §3.5 ("Empty States").
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  tone = 'neutral',
  className,
}) => {
  const ActionIcon = action?.icon;
  const SecondaryIcon = secondaryAction?.icon;

  return (
    <div
      className={cn(
        'p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto my-12 shadow-sm',
        className
      )}
    >
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border', TONE_STYLES[tone])}>
        <Icon className="w-7 h-7" />
      </div>
      <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4" />}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {SecondaryIcon && <SecondaryIcon className="w-4 h-4" />}
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';

interface ScoreSummaryBarProps {
  computedScore: number;
  scoreTier: { label: string; color: string };
  unratedCount: number;
}

export const ScoreSummaryBar: React.FC<ScoreSummaryBarProps> = ({
  computedScore,
  scoreTier,
  unratedCount,
}) => {
  return (
    <div className="px-6 py-2.5 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center space-x-6">
        <div>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider block">Live Weighted Score</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">{computedScore.toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-medium">/ 5.00</span>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <div>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider block">Performance Bracket</span>
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold border mt-0.5 ${scoreTier.color}`}>
            {scoreTier.label}
          </span>
        </div>
      </div>

      {unratedCount > 0 && (
        <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60 font-medium">
          ⚠️ {unratedCount} KRA item{unratedCount > 1 ? 's' : ''} unrated (Rating = 0)
        </div>
      )}
    </div>
  );
};

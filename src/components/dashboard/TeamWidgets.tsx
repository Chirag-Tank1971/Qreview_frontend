import React from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import type { DashboardTeam, DashboardTeamMember } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../utils/cn';

const CARD = 'bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs';

function memberStatus(m: DashboardTeamMember): { label: string; tone: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' } {
  if (!m.reviewId) return { label: 'No review', tone: 'default' };
  if (m.reviewStatus === 'RETURNED') return { label: m.stage === 'HOD' ? 'Returned to HOD' : 'Returned', tone: 'danger' };
  switch (m.stage) {
    case 'MANAGER':
      return { label: 'To score', tone: 'warning' };
    case 'HOD':
      return { label: 'With HOD', tone: 'info' };
    case 'HR':
      return { label: 'With HR', tone: 'primary' };
    case 'CLOSED':
      return { label: 'Closed', tone: 'success' };
    default:
      return { label: 'Draft', tone: 'default' };
  }
}

const Trend: React.FC<{ last?: number; previous?: number }> = ({ last, previous }) => {
  if (last === undefined || previous === undefined) return <span className="text-slate-300 dark:text-slate-600">–</span>;
  const delta = last - previous;
  if (Math.abs(delta) < 0.05) return <ArrowRight className="w-3.5 h-3.5 text-slate-400 inline" aria-label="No change" />;
  return delta > 0 ? (
    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" aria-label={`Up ${delta.toFixed(2)}`} />
  ) : (
    <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 inline" aria-label={`Down ${(-delta).toFixed(2)}`} />
  );
};

interface TeamStatusTableProps {
  team: DashboardTeam;
  onOpenReview: (reviewId: string) => void;
  className?: string;
}

export const TeamStatusTable: React.FC<TeamStatusTableProps> = ({ team, onOpenReview, className }) => (
  <section className={cn(CARD, 'flex flex-col gap-3 min-w-0', className)}>
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Team status</h2>
      {team.periodName && <span className="text-xs text-slate-400">{team.periodName}</span>}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <th className="py-2 pr-3 font-semibold">Employee</th>
            <th className="py-2 pr-3 font-semibold">Review</th>
            <th className="py-2 pr-3 font-semibold text-center">Self</th>
            <th className="py-2 pr-3 font-semibold text-right">Last score</th>
            <th className="py-2 pr-3 font-semibold text-center">Trend</th>
            <th className="py-2 font-semibold">Flags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {team.members.map((m) => {
            const status = memberStatus(m);
            return (
              <tr
                key={m.employeeId}
                onClick={m.reviewId ? () => onOpenReview(m.reviewId!) : undefined}
                className={cn(m.reviewId && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50')}
              >
                <td className="py-2 pr-3 whitespace-nowrap">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{m.name}</span>
                  {m.designationName && <span className="block text-[11px] text-slate-400">{m.designationName}</span>}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  <StatusBadge status={status.label} tone={status.tone} />
                </td>
                <td className="py-2 pr-3 text-center">
                  {m.isSelfSubmitted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" aria-label="Submitted" />
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">–</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-slate-800 dark:text-slate-100">
                  {m.lastScore !== undefined ? m.lastScore.toFixed(2) : <span className="text-slate-300 dark:text-slate-600">–</span>}
                </td>
                <td className="py-2 pr-3 text-center">
                  <Trend last={m.lastScore} previous={m.previousScore} />
                </td>
                <td className="py-2 whitespace-nowrap">{m.onPip && <StatusBadge status="On PIP" tone="warning" />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

export const RatingSpread: React.FC<{ team: DashboardTeam; className?: string }> = ({ team, className }) => {
  const rows = [
    { label: 'Outstanding', hint: '≥ 4.5', value: team.ratingSpread.outstanding, bar: 'bg-emerald-500' },
    { label: 'Exceeds', hint: '≥ 3.8', value: team.ratingSpread.exceeds, bar: 'bg-indigo-500' },
    { label: 'Meets', hint: '≥ 2.8', value: team.ratingSpread.meets, bar: 'bg-sky-500' },
    { label: 'Needs improvement', hint: '< 2.8', value: team.ratingSpread.needsImprovement, bar: 'bg-rose-500' },
    { label: 'Not yet rated', hint: '', value: team.ratingSpread.unrated, bar: 'bg-slate-300 dark:bg-slate-600' },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className={cn(CARD, 'flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Team rating spread</h2>
        <span className="text-xs text-slate-400">Latest evaluated score</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)_1.5rem] items-center gap-2.5 text-xs">
            <span className="text-slate-700 dark:text-slate-200 truncate">
              {r.label} {r.hint && <span className="text-slate-400">{r.hint}</span>}
            </span>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={cn('h-full rounded-full', r.bar)} style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <span className="text-right font-mono text-slate-600 dark:text-slate-300">{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* =========================================================================
   Manager Alerts Panel
   ========================================================================= */
export const ManagerAlertsPanel: React.FC<{
  team: DashboardTeam;
  onNavigate: (view: any, params?: any) => void;
  className?: string;
}> = ({ team, onNavigate, className }) => {
  const alerts = team.alerts || [];

  return (
    <section className={cn(CARD, 'flex flex-col gap-3 min-w-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Team Action Alerts</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {alerts.length} item{alerts.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No pending alerts. All direct report reviews are on track!
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'p-3 rounded-lg border text-xs flex flex-col gap-1.5 transition-colors',
                alert.type === 'crit'
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                  : alert.type === 'warn'
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{alert.title}</span>
                {alert.actionLabel && alert.link && (
                  <button
                    type="button"
                    onClick={() => onNavigate(alert.link!.view, alert.link!.params)}
                    className="inline-flex items-center gap-1 font-semibold text-[11px] hover:underline cursor-pointer text-indigo-600 dark:text-indigo-400 shrink-0"
                  >
                    <span>{alert.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              {alert.detail && (
                <p className="text-[11px] opacity-80 leading-relaxed">
                  {alert.detail}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

/* =========================================================================
   Manager Quick Actions
   ========================================================================= */
export const ManagerQuickActions: React.FC<{
  onNavigate: (view: any, params?: any) => void;
  className?: string;
}> = ({ onNavigate, className }) => {
  return (
    <section className={cn(CARD, 'flex flex-col gap-3 min-w-0', className)}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Manager Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <button
          type="button"
          onClick={() => onNavigate('reviews')}
          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400">Quarterly</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">Score Direct Reports</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Evaluate team KRAs</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('pip')}
          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">PIP Tracking</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Improvement plans</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('portal', { subTab: 'kras' })}
          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-semibold text-sky-600 dark:text-sky-400">Objectives</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">Team KRAs</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Review weight distribution</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('appraisals')}
          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">Annual</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">Appraisal Status</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Increment recommendations</span>
          </div>
        </button>
      </div>
    </section>
  );
};

/* =========================================================================
   Team Health & Completion Card
   ========================================================================= */
export const TeamHealthCard: React.FC<{
  team: DashboardTeam;
  className?: string;
}> = ({ team, className }) => {
  const scoredPct = team.reviewsInPeriod > 0 ? Math.round((team.scoredByManager / team.reviewsInPeriod) * 100) : 0;
  const selfPct = team.reviewsInPeriod > 0 ? Math.round((team.selfSubmitted / team.reviewsInPeriod) * 100) : 0;

  return (
    <section className={cn(CARD, 'flex flex-col gap-3 min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Review Completion & Cadence</h2>
        <span className="text-xs font-medium text-slate-400">{team.periodName || 'Active Cycle'}</span>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-300">Manager Scoring Progress</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {scoredPct}% ({team.scoredByManager}/{team.reviewsInPeriod})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${scoredPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-300">Self-Assessments Submitted</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {selfPct}% ({team.selfSubmitted}/{team.reviewsInPeriod})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${selfPct}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
};


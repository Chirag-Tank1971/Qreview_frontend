import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  Info,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import type { DashboardHodOverview, DashboardTask, DashboardTaskLink } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../utils/cn';
import { ActionQueue } from './ActionQueue';

const CARD = 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-4 shadow-xs transition-all';

type OnNavigate = (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;

/* =========================================================================
   HOD KPI Strip (6 key metrics for HOD)
   ========================================================================= */
export const HodKpiStrip: React.FC<{ hod: DashboardHodOverview }> = ({ hod }) => {
  const kpis = [
    {
      label: 'Dept. Employees',
      value: String(hod.totalEmployees),
      note: hod.departmentName,
      icon: <Users className="w-3.5 h-3.5" />,
      iconWrap: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Reviews Completed',
      value: `${hod.completionRate}%`,
      sub: `${hod.reviewsCompleted}/${hod.reviewsTotal}`,
      note: 'completion rate',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      iconWrap: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
      meter: hod.completionRate,
    },
    {
      label: 'Pending HOD Review',
      value: String(hod.reviewsPendingHod),
      note: hod.reviewsPendingHod > 0 ? 'Action required' : 'All cleared',
      icon: <Clock className="w-3.5 h-3.5" />,
      iconWrap: hod.reviewsPendingHod > 0 ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500',
      tone: hod.reviewsPendingHod > 0 ? ('warn' as const) : ('good' as const),
    },
    {
      label: 'Dept. Avg. Score',
      value: hod.averageScore !== null ? hod.averageScore.toFixed(2) : '–',
      sub: hod.averageScore !== null ? '/ 5' : undefined,
      note: `${hod.highPerformersCount} high performer${hod.highPerformersCount === 1 ? '' : 's'}`,
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      iconWrap: 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
    },
    {
      label: 'KRA Coverage',
      value: `${hod.kraCoverageRate}%`,
      note: hod.kraCoverageRate < 80 ? 'Below target' : 'On track',
      icon: <Target className="w-3.5 h-3.5" />,
      iconWrap: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
      tone: hod.kraCoverageRate < 80 ? ('warn' as const) : ('good' as const),
    },
    {
      label: 'Pending Appraisals',
      value: String(hod.pendingAppraisals),
      note: hod.pendingAppraisals > 0 ? 'Needs calibration' : 'All calibrated',
      icon: <Award className="w-3.5 h-3.5" />,
      iconWrap: hod.pendingAppraisals > 0 ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500',
      tone: hod.pendingAppraisals > 0 ? ('warn' as const) : ('good' as const),
    },
  ];

  const TONE_BADGE = {
    good: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    warn: 'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    crit: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all min-w-0 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium truncate">{k.label}</span>
            <div className={cn('p-1 rounded-md shrink-0', k.iconWrap)}>
              {k.icon}
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {k.value}
            </span>
            {k.sub && <span className="text-xs text-slate-400 ml-1">{k.sub}</span>}
          </div>
          {k.meter !== undefined ? (
            <div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, k.meter)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-full',
                  k.tone ? TONE_BADGE[k.tone] : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                )}
              >
                {k.note}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* =========================================================================
   HOD Alerts Panel
   ========================================================================= */
const ALERT_ICONS = {
  crit: <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
  warn: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  info: <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
};

const ALERT_BG = {
  crit: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50',
  warn: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50',
  info: 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/50',
};

export const HodAlertsPanel: React.FC<{
  hod: DashboardHodOverview;
  onNavigate: OnNavigate;
  className?: string;
  maxHeight?: string;
}> = ({ hod, onNavigate, className, maxHeight = 'max-h-[340px]' }) => (
  <div className={cn('flex flex-col gap-3', className)}>
    <div className="flex items-baseline justify-between gap-2 px-1">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department Alerts</h2>
      <span className="text-xs text-slate-400 font-mono">{hod.alerts.length} item{hod.alerts.length !== 1 ? 's' : ''}</span>
    </div>
    {hod.alerts.length === 0 ? (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">No alerts — your department is on track!</p>
      </div>
    ) : (
      <ul className={cn('flex flex-col gap-2 overflow-y-auto pr-4 mr-0.5', maxHeight)}>
        {hod.alerts.map((alert) => (
          <li key={alert.id} className={cn('rounded-xl border p-3 flex items-start gap-2.5 transition-colors', ALERT_BG[alert.type])}>
            {ALERT_ICONS[alert.type]}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">{alert.title}</p>
              {alert.detail && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{alert.detail}</p>}
            </div>
            {alert.actionLabel && alert.link && (
              <button
                type="button"
                onClick={() => onNavigate(alert.link!.view, alert.link!.params)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer shrink-0 ml-1"
              >
                {alert.actionLabel}
              </button>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

/* =========================================================================
   HOD Department Member Table
   ========================================================================= */
export const HodDeptMemberTable: React.FC<{
  hod: DashboardHodOverview;
  onOpenReview?: (employeeId: string) => void;
  className?: string;
}> = ({ hod, onOpenReview, className }) => {
  const stageLabel = (stage?: string): { label: string; tone: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' } => {
    switch (stage) {
      case 'MANAGER': return { label: 'With Manager', tone: 'warning' };
      case 'HOD': return { label: 'With You (HOD)', tone: 'info' };
      case 'HR': return { label: 'With HR', tone: 'primary' };
      case 'CLOSED': return { label: 'Closed', tone: 'success' };
      default: return { label: 'No Review', tone: 'default' };
    }
  };

  return (
    <section className={cn(CARD, 'flex flex-col gap-3 min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Department Members</h2>
          <p className="text-[11px] text-slate-400">Current review stages and performance indicators</p>
        </div>
        <span className="text-xs text-slate-400 font-mono">{hod.totalEmployees} employees</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2.5 pr-3 font-semibold">Employee</th>
              <th className="py-2.5 pr-3 font-semibold">Manager</th>
              <th className="py-2.5 pr-3 font-semibold">Review Stage</th>
              <th className="py-2.5 pr-3 font-semibold text-right">Last Score</th>
              <th className="py-2.5 font-semibold">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {hod.departmentMembers.map((m) => {
              const badge = stageLabel(m.stage);
              return (
                <tr
                  key={m.employeeId}
                  onClick={m.stage === 'HOD' && onOpenReview ? () => onOpenReview(m.employeeId) : undefined}
                  className={cn(m.stage === 'HOD' && onOpenReview && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors')}
                >
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{m.name}</span>
                    {m.designationName && <span className="block text-[11px] text-slate-400">{m.designationName}</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {m.managerName || <span className="text-slate-300 dark:text-slate-600">–</span>}
                  </td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge status={badge.label} tone={badge.tone} />
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-slate-800 dark:text-slate-100">
                    {m.lastScore !== undefined ? m.lastScore.toFixed(2) : <span className="text-slate-300 dark:text-slate-600">–</span>}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    {m.onPip && <StatusBadge status="On PIP" tone="warning" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hod.departmentMembers.length === 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">No department members found.</p>
        )}
      </div>
    </section>
  );
};

/* =========================================================================
   HOD Performance Distribution (bar chart)
   ========================================================================= */
const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};
const RATING_COLORS: Record<number, string> = {
  1: 'bg-rose-500',
  2: 'bg-amber-400',
  3: 'bg-sky-500',
  4: 'bg-indigo-500',
  5: 'bg-emerald-500',
};

export const HodPerformanceCard: React.FC<{
  hod: DashboardHodOverview;
  onNavigate: OnNavigate;
  className?: string;
}> = ({ hod, className }) => {
  const maxCount = Math.max(1, ...hod.performanceDistribution.map((d) => Math.max(d.count, d.benchmark)));
  const totalScored = hod.performanceDistribution.reduce((s, d) => s + d.count, 0);

  return (
    <section className={cn(CARD, 'flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Performance Distribution</h2>
          <p className="text-[11px] text-slate-400">Current cycle ratings vs benchmark</p>
        </div>
        <span className="text-xs text-slate-400 font-mono">{totalScored} rated</span>
      </div>

      {totalScored === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No scored reviews yet for this cycle.</p>
      ) : (
        <div className="flex flex-col gap-2.5 my-auto">
          {[...hod.performanceDistribution].reverse().map((d) => (
            <div key={d.rating} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-2 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{RATING_LABELS[d.rating]}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{d.count}</span>
                </div>
                <div className="relative h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn('absolute left-0 top-0 h-full rounded-full opacity-30', RATING_COLORS[d.rating])}
                    style={{ width: `${(d.benchmark / maxCount) * 100}%` }}
                  />
                  <div
                    className={cn('absolute left-0 top-0 h-full rounded-full transition-all duration-500', RATING_COLORS[d.rating])}
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right text-[11px] font-mono text-slate-400">
                {totalScored > 0 ? `${Math.round((d.count / totalScored) * 100)}%` : '–'}
              </div>
            </div>
          ))}
        </div>
      )}

      {hod.averageScore !== null && (
        <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Dept. Average</span>
          <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
            {hod.averageScore.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">/ 5</span>
          </span>
        </div>
      )}
    </section>
  );
};

/* =========================================================================
   HOD Rating Spread
   ========================================================================= */
export const HodRatingSpread: React.FC<{ hod: DashboardHodOverview; className?: string }> = ({ hod, className }) => {
  const rows = [
    { label: 'Outstanding', hint: '≥ 4.5', value: hod.ratingSpread.outstanding, bar: 'bg-emerald-500' },
    { label: 'Exceeds', hint: '≥ 3.8', value: hod.ratingSpread.exceeds, bar: 'bg-indigo-500' },
    { label: 'Meets', hint: '≥ 2.8', value: hod.ratingSpread.meets, bar: 'bg-sky-500' },
    { label: 'Needs Improvement', hint: '< 2.8', value: hod.ratingSpread.needsImprovement, bar: 'bg-rose-500' },
    { label: 'Not yet rated', hint: '', value: hod.ratingSpread.unrated, bar: 'bg-slate-300 dark:bg-slate-600' },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className={cn(CARD, 'flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Department Rating Spread</h2>
          <p className="text-[11px] text-slate-400">Latest evaluated score brackets</p>
        </div>
        <span className="text-xs text-slate-400 font-mono">Scores</span>
      </div>
      <div className="flex flex-col gap-2.5 my-auto">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)_1.5rem] items-center gap-2.5 text-xs">
            <span className="text-slate-700 dark:text-slate-200 truncate">
              {r.label} {r.hint && <span className="text-slate-400 text-[10px]">{r.hint}</span>}
            </span>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-500', r.bar)} style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <span className="text-right font-mono text-slate-600 dark:text-slate-300">{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* =========================================================================
   HOD Recent Activity Panel
   ========================================================================= */
export const HodRecentActivity: React.FC<{ hod: DashboardHodOverview; className?: string }> = ({ hod, className }) => (
  <section className={cn(CARD, 'flex flex-col gap-3', className)}>
    <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
        <p className="text-[11px] text-slate-400">Audit trail of department review actions</p>
      </div>
      <span className="text-xs text-slate-400 font-medium">{hod.departmentName}</span>
    </div>
    {hod.recentActivity.length === 0 ? (
      <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No recent activity in your department.</p>
    ) : (
      <ul className="flex flex-col gap-3 overflow-y-auto max-h-[220px] pr-4">
        {hod.recentActivity.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
              {item.initials}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-800 dark:text-slate-100 leading-snug">{item.description}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.relativeTime}</p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

/* =========================================================================
   HOD Quick Actions (Modernized, sleek, role-tailored tiles)
   ========================================================================= */
export const HodQuickActions: React.FC<{ onNavigate: OnNavigate; className?: string }> = ({ onNavigate, className }) => {
  const actions: {
    label: string;
    sub: string;
    view: DashboardTaskLink['view'];
    params?: DashboardTaskLink['params'];
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      label: 'HOD Reviews',
      sub: 'Score pending reviews',
      view: 'reviews',
      icon: FileCheck,
    },
    {
      label: 'Dept Appraisals',
      sub: 'Annual calibration',
      view: 'appraisals',
      icon: Award,
    },
    {
      label: 'Department KRAs',
      sub: 'Review team objectives',
      view: 'kras',
      icon: Target,
    },
    {
      label: 'Member Directory',
      sub: 'Staff & managers',
      view: 'employees',
      icon: Users,
    },
    {
      label: 'Performance Report',
      sub: 'Department analytics',
      view: 'reports',
      icon: FileText,
    },
    {
      label: 'Self-Service Portal',
      sub: 'Personal goals & reviews',
      view: 'portal',
      icon: UserCheck,
    },
  ];

  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick actions</h2>
          <span className="text-[11px] text-slate-400">Department</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                type="button"
                onClick={() => onNavigate(act.view, act.params)}
                className="flex items-start gap-2.5 p-2 text-left rounded-lg border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/80 hover:shadow-xs transition-all cursor-pointer group min-w-0"
              >
                <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {act.label}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                    {act.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 mt-3">
        <span>Direct navigation</span>
        <button
          type="button"
          onClick={() => onNavigate('reviews')}
          className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
        >
          All reviews →
        </button>
      </div>
    </section>
  );
};

/* =========================================================================
   Unified HOD Action & Priority Hub (Combines Action Queue & Department Alerts)
   ========================================================================= */
interface HodActionCenterProps {
  tasks: DashboardTask[];
  hod: DashboardHodOverview;
  nextDeadline?: { label: string; date: string };
  onNavigate: OnNavigate;
  className?: string;
}

export const HodActionCenter: React.FC<HodActionCenterProps> = ({
  tasks,
  hod,
  nextDeadline,
  onNavigate,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'alerts'>('tasks');

  return (
    <section className={cn(CARD, className)}>
      <div>
        {/* Segmented Header Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-2',
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <span>⚡ Needs Your Action</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
                  tasks.length > 0
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                )}
              >
                {tasks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-2',
                activeTab === 'alerts'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <span>⚠️ Department Alerts</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
                  hod.alerts.length > 0
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                )}
              >
                {hod.alerts.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Notification Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'tasks' ? (
          <ActionQueue
            tasks={tasks}
            nextDeadline={nextDeadline}
            onOpen={(link) => onNavigate(link.view, link.params)}
            className="border-0 shadow-none p-0 bg-transparent"
            hideHeaderTitle={true}
          />
        ) : (
          <HodAlertsPanel
            hod={hod}
            onNavigate={onNavigate}
            className="border-0 shadow-none p-0 bg-transparent"
          />
        )}
      </div>
    </section>
  );
};


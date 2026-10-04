import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  FileCheck,
  FileText,
  History,
  Info,
  Layers,
  PieChart,
  RefreshCw,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  UploadCloud,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  DashboardActivityItem,
  DashboardAppraisalHealth,
  DashboardComplianceStatus,
  DashboardDepartmentProgress,
  DashboardHrOverview,
  DashboardRatingDistribution,
  DashboardTask,
  DashboardTaskLink,
  DashboardUpcomingEvent,
} from '../../types';
import { cn } from '../../utils/cn';
import { ActionQueue } from './ActionQueue';

const CARD = 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-4 shadow-xs min-w-0 h-full flex flex-col justify-between transition-all';

/* =========================================================================
   1. Department Progress Table
   ========================================================================= */

interface DepartmentProgressTableProps {
  hr: DashboardHrOverview;
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const DepartmentProgressTable: React.FC<DepartmentProgressTableProps> = ({
  hr,
  onNavigate,
  className,
}) => {
  const depts = hr.departmentProgress || [];

  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Review cycle progress by department</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Completion status across active business units
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reviews')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {depts.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
            No department review data available for the active period.
          </p>
        ) : (
          <div className="max-h-[220px] overflow-y-auto pr-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                  <th className="py-1.5 pr-2 font-medium">Department</th>
                  <th className="py-1.5 px-2 font-medium">Completion</th>
                  <th className="py-1.5 px-2 text-center font-medium">KRA</th>
                  <th className="py-1.5 pl-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {depts.map((d) => {
                  const hasReviews = d.reviewsInitiated > 0;
                  const barWidth = hasReviews ? Math.min(100, Math.max(0, d.completionRate)) : 0;
                  const barColor =
                    d.completionRate >= 80
                      ? 'bg-emerald-500'
                      : d.completionRate >= 40
                      ? 'bg-amber-500'
                      : hasReviews
                      ? 'bg-rose-500'
                      : 'bg-slate-200 dark:bg-slate-700';

                  const statusBadge =
                    d.status === 'Completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                      : d.status === 'In Progress'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

                  return (
                    <tr key={d.departmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 pr-2">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate leading-tight">
                          {d.departmentName}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {d.totalEmployees} employee{d.totalEmployees === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 sm:w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500', barColor)}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums text-[11px]">
                            {d.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-medium tabular-nums text-slate-700 dark:text-slate-300 text-[11px]">
                        {d.kraCoverageRate}%
                      </td>
                      <td className="py-2 pl-2 text-right whitespace-nowrap">
                        <span className={cn('inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold border', statusBadge)}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>{depts.length} departments active</span>
        <span>{depts.filter((d) => d.status === 'Completed').length} completed</span>
      </div>
    </section>
  );
};

/* =========================================================================
   2. Appraisal Health Donut Chart Card
   ========================================================================= */

interface AppraisalHealthCardProps {
  health: DashboardAppraisalHealth;
  periodName?: string;
  cycleBreakdowns?: Record<
    string,
    {
      key: string;
      label: string;
      appraisalHealth: DashboardAppraisalHealth;
      performanceDistribution: DashboardRatingDistribution[];
      totalStaff: number;
      averageScore?: number | null;
      highPerformersCount?: number;
    }
  >;
  selectedCycle?: string;
  onSelectCycle?: (cycle: string) => void;
  onNavigate?: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const AppraisalHealthCard: React.FC<AppraisalHealthCardProps> = ({
  health,
  periodName = 'Q3 2026',
  cycleBreakdowns,
  selectedCycle,
  onSelectCycle,
  onNavigate,
  className,
}) => {
  const [internalPeriod, setInternalPeriod] = useState<string>(selectedCycle || periodName || 'Q3 2026');

  const activeKey = selectedCycle !== undefined ? selectedCycle : internalPeriod;

  const handlePeriodChange = (val: string) => {
    setInternalPeriod(val);
    onSelectCycle?.(val);
  };

  const activeCycleData = cycleBreakdowns ? (cycleBreakdowns[activeKey] || cycleBreakdowns[activeKey.trim()]) : undefined;
  const currentHealth = activeCycleData?.appraisalHealth || health;

  const stages = [
    { label: 'Draft', count: currentHealth.draft, color: '#94a3b8' }, // Slate 400
    { label: 'Self Review', count: currentHealth.selfReview, color: '#38bdf8' }, // Sky 400
    { label: 'Manager Review', count: currentHealth.managerReview, color: '#f59e0b' }, // Amber 500
    { label: 'HR Review', count: currentHealth.hrReview, color: '#818cf8' }, // Indigo 400
    { label: 'Calibration', count: currentHealth.calibration, color: '#f43f5e' }, // Rose 500
    { label: 'Locked', count: currentHealth.locked, color: '#10b981' }, // Emerald 500
  ];

  const total = Math.max(1, currentHealth.totalEmployees || stages.reduce((s, x) => s + x.count, 0));
  const lockedPct = Math.round((currentHealth.locked / total) * 100);
  const calibrationPct = Math.round((currentHealth.calibration / total) * 100);

  // Compute SVG Donut Chart slices
  let cumulativeAngle = 0;
  const radius = 38;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * radius;

  const slices = stages.map((stage) => {
    const fraction = total > 0 ? stage.count / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    return {
      ...stage,
      strokeDasharray,
      strokeDashoffset,
      fraction,
    };
  });

  const cycleOptions = cycleBreakdowns && Object.keys(cycleBreakdowns).length > 0
    ? Object.values(cycleBreakdowns).map((c) => ({ value: c.key, label: c.label }))
    : [
        { value: 'Q3 2026', label: 'Q3 2026 (September Cycle)' },
        { value: 'Q2 2026', label: 'Q2 2026 (June Cycle)' },
        { value: '2026-Q4 (Oct - Dec)', label: '2026-Q4 (Oct - Dec)' },
        { value: 'Q1 2026', label: 'Q1 2026 (Jan - Apr)' },
        { value: 'All Cycles', label: 'All Cycles (2026)' },
      ];

  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-indigo-500" />
            <span>Appraisal health</span>
          </h2>
          <div className="relative">
            <select
              value={activeKey}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded px-2 py-1 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              {cycleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Donut and Stage Legend */}
        <div className="flex items-center gap-3 py-1">
          {/* SVG Donut */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {slices.map((slice) => (
                <circle
                  key={slice.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="butt"
                  fill="transparent"
                  className="transition-all duration-700"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-none">
                {currentHealth.totalEmployees}
              </span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">Total Staff</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 text-xs flex-1 min-w-0">
            {stages.map((st) => (
              <div key={st.label} className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: st.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 text-[10px] truncate">
                    {st.label}
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums text-[10px]">
                  {st.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Progress Bar (Fills up space) */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-medium text-slate-600 dark:text-slate-400">Stage Progress Distribution</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{lockedPct}% completed</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {currentHealth.locked > 0 && (
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(currentHealth.locked / total) * 100}%` }}
                title={`Locked: ${currentHealth.locked}`}
              />
            )}
            {currentHealth.calibration > 0 && (
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${(currentHealth.calibration / total) * 100}%` }}
                title={`Calibration: ${currentHealth.calibration}`}
              />
            )}
            {currentHealth.hrReview > 0 && (
              <div
                className="bg-indigo-400 h-full transition-all duration-500"
                style={{ width: `${(currentHealth.hrReview / total) * 100}%` }}
                title={`HR Review: ${currentHealth.hrReview}`}
              />
            )}
            {currentHealth.managerReview > 0 && (
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${(currentHealth.managerReview / total) * 100}%` }}
                title={`Manager Review: ${currentHealth.managerReview}`}
              />
            )}
            {currentHealth.selfReview > 0 && (
              <div
                className="bg-sky-400 h-full transition-all duration-500"
                style={{ width: `${(currentHealth.selfReview / total) * 100}%` }}
                title={`Self Review: ${currentHealth.selfReview}`}
              />
            )}
          </div>
        </div>

        {/* Milestone Highlight Tiles (Fills up space) */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded p-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Calibration</span>
              <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-1 rounded">{calibrationPct}%</span>
            </div>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 leading-none">
              {currentHealth.calibration} <span className="text-[9px] font-normal text-slate-400">pending</span>
            </p>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded p-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Locked</span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1 rounded">{lockedPct}%</span>
            </div>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 leading-none">
              {currentHealth.locked} <span className="text-[9px] font-normal text-slate-400">finalized</span>
            </p>
          </div>
        </div>

        {/* Direct Action Link */}
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('appraisals')}
            className="w-full mt-2 py-1 px-2 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Calibrate Annual Appraisals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Calibration: {currentHealth.calibration}</span>
        <span>Locked: {currentHealth.locked}</span>
      </div>
    </section>
  );
};

/* =========================================================================
   3. Performance Distribution Bar Chart Card
   ========================================================================= */

interface PerformanceDistributionCardProps {
  distribution: DashboardRatingDistribution[];
  periodName?: string;
  cycleBreakdowns?: Record<
    string,
    {
      key: string;
      label: string;
      appraisalHealth: DashboardAppraisalHealth;
      performanceDistribution: DashboardRatingDistribution[];
      totalStaff: number;
      averageScore?: number | null;
      highPerformersCount?: number;
    }
  >;
  selectedCycle?: string;
  onSelectCycle?: (cycle: string) => void;
  onNavigate?: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const PerformanceDistributionCard: React.FC<PerformanceDistributionCardProps> = ({
  distribution,
  periodName = 'Q3 2026',
  cycleBreakdowns,
  selectedCycle,
  onSelectCycle,
  onNavigate,
  className,
}) => {
  const [internalPeriod, setInternalPeriod] = useState<string>(selectedCycle || periodName || 'Q3 2026');

  const activeKey = selectedCycle !== undefined ? selectedCycle : internalPeriod;

  const handlePeriodChange = (val: string) => {
    setInternalPeriod(val);
    onSelectCycle?.(val);
  };

  const activeCycleData = cycleBreakdowns ? (cycleBreakdowns[activeKey] || cycleBreakdowns[activeKey.trim()]) : undefined;
  const currentDistribution = activeCycleData?.performanceDistribution || distribution;
  const cohortTotal = activeCycleData?.totalStaff || activeCycleData?.appraisalHealth?.totalEmployees;

  const maxVal = Math.max(1, ...currentDistribution.map((d) => Math.max(d.count, d.benchmark)));
  const totalRatings = currentDistribution.reduce((s, d) => s + d.count, 0);

  const avgScore = activeCycleData?.averageScore !== undefined && activeCycleData?.averageScore !== null
    ? activeCycleData.averageScore.toFixed(2)
    : totalRatings > 0
      ? (currentDistribution.reduce((s, d) => s + (d.rating * d.count), 0) / totalRatings).toFixed(2)
      : '—';

  const highPerformers = activeCycleData?.highPerformersCount !== undefined
    ? activeCycleData.highPerformersCount
    : (currentDistribution.find((d) => d.rating === 4)?.count || 0) + (currentDistribution.find((d) => d.rating === 5)?.count || 0);

  const highPct = totalRatings > 0 ? Math.round((highPerformers / totalRatings) * 100) : 0;

  const cycleOptions = cycleBreakdowns && Object.keys(cycleBreakdowns).length > 0
    ? Object.values(cycleBreakdowns).map((c) => ({ value: c.key, label: c.label }))
    : [
        { value: 'Q3 2026', label: 'Q3 2026 (September Cycle)' },
        { value: 'Q2 2026', label: 'Q2 2026 (June Cycle)' },
        { value: '2026-Q4 (Oct - Dec)', label: '2026-Q4 (Oct - Dec)' },
        { value: 'Q1 2026', label: 'Q1 2026 (Jan - Apr)' },
        { value: 'All Cycles', label: 'All Cycles (2026)' },
      ];

  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>Performance distribution</span>
          </h2>
          <div className="relative">
            <select
              value={activeKey}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded px-2 py-1 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              {cycleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
          <span>Actual ratings vs company benchmark target</span>
          <span className="text-[10px] text-slate-400 font-medium font-mono">
            {totalRatings > 0 ? `${totalRatings} evaluated` : '0 evaluated'}
          </span>
        </p>

        {/* Chart Visual */}
        <div className="pt-2 pb-1">
          <div className="h-28 flex items-end justify-between gap-2.5 px-2 border-b border-slate-200 dark:border-slate-700 relative">
            <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 dark:border-slate-800 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 dark:border-slate-800 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 dark:border-slate-800 pointer-events-none" />

            {currentDistribution.map((d) => {
              const actualHeight = (d.count / maxVal) * 100;
              const benchmarkHeight = (d.benchmark / maxVal) * 100;

              return (
                <div key={d.rating} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div
                    className="absolute w-full border-t-2 border-dashed border-indigo-400 z-10 transition-all duration-300"
                    style={{ bottom: `${benchmarkHeight}%` }}
                    title={`Benchmark Target: ${d.benchmark} staff`}
                  />

                  {d.count > 0 ? (
                    <div
                      className="w-full max-w-[24px] bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 rounded-t transition-all duration-500 relative flex items-start justify-center group-hover:shadow-md cursor-pointer"
                      style={{ height: `${Math.max(14, actualHeight)}%` }}
                      title={`Rating ${d.rating}: ${d.count} employee(s) (Benchmark: ${d.benchmark})`}
                    >
                      <span className="text-[9px] font-bold text-white -mt-3.5">
                        {d.count}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="w-full max-w-[24px] h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-0.5"
                      title={`Rating ${d.rating}: 0 staff (Benchmark: ${d.benchmark})`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div className="flex items-center justify-between gap-2.5 px-2 pt-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {currentDistribution.map((d) => (
              <div key={d.rating} className="flex-1 text-center">
                Rating {d.rating}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-2 flex items-center justify-center gap-5 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500" />
            <span>Actual Distribution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 border-t-2 border-dashed border-indigo-400" />
            <span>Benchmark Curve</span>
          </div>
        </div>

        {/* Performance Metric Tiles (AVERAGE SCORE & HIGH PERFORMERS from reference design) */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg p-2">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              AVERAGE SCORE
            </span>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 leading-none">
              {avgScore} <span className="text-[10px] font-normal text-slate-400">/ 5.0</span>
            </p>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg p-2">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              HIGH PERFORMERS
            </span>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 leading-none">
              {highPerformers} <span className="text-[10px] font-normal text-slate-400 font-sans">({highPct}%)</span>
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Bell curve: {totalRatings > 0 ? 'Normal' : 'Pending scores'}
        </span>
        {onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate('appraisals')}
            className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold inline-flex items-center gap-1"
          >
            <span>Detailed scores</span>
            <span>→</span>
          </button>
        ) : (
          <span>Target aligned</span>
        )}
      </div>
    </section>
  );
};

/* =========================================================================
   4. Recent Activity Card
   ========================================================================= */

interface RecentActivityCardProps {
  activity: DashboardActivityItem[];
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  activity,
  onNavigate,
  className,
}) => {
  const avatarColors = [
    'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
    'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
    'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
    'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
  ];

  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-500" />
            <span>Recent activity</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activity.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
            No recent activity logs recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[220px] overflow-y-auto pr-3.5">
            {activity.map((item, idx) => {
              const colorClass = avatarColors[idx % avatarColors.length];

              return (
                <div key={item.id} className="py-2 first:pt-0.5 last:pb-0.5 flex items-start gap-2.5">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]',
                      colorClass
                    )}
                  >
                    {item.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.actorName}
                      </span>{' '}
                      {item.description}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.relativeTime}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Audit stream active</span>
        <span>Latest updates shown</span>
      </div>
    </section>
  );
};

/* =========================================================================
   5. Upcoming Deadlines & Events Card
   ========================================================================= */

interface UpcomingEventsCardProps {
  events: DashboardUpcomingEvent[];
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
  events,
  onNavigate,
  className,
}) => {
  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Upcoming deadlines & events</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('reviews')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
            No upcoming deadlines scheduled.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[220px] overflow-y-auto pr-3.5">
            {events.map((ev) => {
              const isNear = ev.daysRemaining <= 7;

              return (
                <div key={ev.id} className="py-2 first:pt-0.5 last:pb-0.5 flex items-center gap-2.5">
                  {/* Date Block */}
                  <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 leading-tight">
                    <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {ev.dateMonth}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {ev.dateDay}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                      {ev.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {ev.category} · {ev.timeRange}
                    </p>
                  </div>

                  {/* Days Pill */}
                  <span
                    className={cn(
                      'text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap tabular-nums',
                      isNear
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {ev.daysText}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>{events.length} milestones track</span>
        <span>Review cycle calendar</span>
      </div>
    </section>
  );
};

/* =========================================================================
   6. Compliance & Audit Status Card
   ========================================================================= */

interface ComplianceAuditCardProps {
  compliance: DashboardComplianceStatus;
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const ComplianceAuditCard: React.FC<ComplianceAuditCardProps> = ({
  compliance,
  onNavigate,
  className,
}) => {
  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Compliance & audit</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* Item 1: Last Audit Event */}
          <div className="py-2 first:pt-0.5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <History className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Last audit event
              </p>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 leading-snug">
                {compliance.lastAuditEvent?.description || 'Review cycle updated'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                by {compliance.lastAuditEvent?.actorName || 'HR Admin'} ·{' '}
                {compliance.lastAuditEvent?.relativeTime || 'Recently'}
              </p>
            </div>
          </div>

          {/* Item 2: Workflow Status */}
          <div className="py-2 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Workflow status
              </p>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {compliance.workflowStatus?.statusText || 'All workflows are active'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {compliance.workflowStatus?.pendingIssuesCount === 0
                  ? 'No bottlenecks detected'
                  : `${compliance.workflowStatus?.pendingIssuesCount} pending issues`}
              </p>
            </div>
          </div>

          {/* Item 3: Last Data Sync */}
          <div className="py-2 last:pb-0.5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Last data sync
              </p>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                {compliance.lastDataSync?.statusText || 'Employee data synchronized'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {compliance.lastDataSync?.formattedTime || 'Today'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>System health: Normal</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% compliant</span>
      </div>
    </section>
  );
};

/* =========================================================================
   7. Alerts Panel ("Attention Needed") -> REDIRECTS TO NOTIFICATIONS CENTER
   ========================================================================= */

interface AlertsPanelProps {
  alerts: DashboardHrOverview['alerts'];
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onNavigate, className }) => {
  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Attention needed</span>
            <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-[11px] font-bold inline-flex items-center justify-center">
              {alerts.length}
            </span>
          </h2>
          {/* Explicitly redirects to Notifications Center per user requirement */}
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
            title="Open Notifications Center"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>No critical alerts. All operations are up to date!</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[220px] overflow-y-auto pr-4">
            {alerts.map((a) => {
              const isCrit = a.type === 'crit';
              const isWarn = a.type === 'warn';

              return (
                <div key={a.id} className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-2.5">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
                      isCrit
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : isWarn
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    )}
                  >
                    {isCrit ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Info className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                      {a.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {a.detail}
                    </p>
                  </div>

                  {a.link && (
                    <button
                      type="button"
                      onClick={() => onNavigate(a.link!.view, a.link!.params)}
                      className={cn(
                        'text-[11px] font-semibold shrink-0 self-center px-2 py-1 rounded border transition-colors cursor-pointer mr-2',
                        a.actionLabel === 'Fix'
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100'
                      )}
                    >
                      {a.actionLabel || 'View'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>{alerts.length} priority notifications</span>
        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
        >
          Manage alerts →
        </button>
      </div>
    </section>
  );
};

/* =========================================================================
   8. Quick Actions Panel (8 Action Buttons Grid)
   ========================================================================= */

interface QuickActionsProps {
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const QuickActionsPanel: React.FC<QuickActionsProps> = ({ onNavigate, className }) => {
  const actions: {
    label: string;
    sub: string;
    view: DashboardTaskLink['view'];
    params?: DashboardTaskLink['params'];
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      label: 'Quarterly Reviews',
      sub: 'Monitor evaluations & scores',
      view: 'reviews',
      icon: FileCheck,
    },
    {
      label: 'Annual Appraisals',
      sub: 'Calibrate salary proposals',
      view: 'appraisals',
      icon: Award,
    },
    {
      label: 'Goal Templates',
      sub: 'Configure rubrics & metrics',
      view: 'kras',
      icon: Target,
    },
    {
      label: 'Employee Directory',
      sub: 'Staff records & reporting',
      view: 'employees',
      icon: Users,
    },
    {
      label: 'Create Review Cycle',
      sub: 'Initialize evaluation periods',
      view: 'reviews',
      params: { openCreate: true },
      icon: Calendar,
    },
    {
      label: 'Assign KRAs',
      sub: 'Map templates to employees',
      view: 'kras',
      params: { openAssign: true },
      icon: UserCheck,
    },
    {
      label: 'Run Report',
      sub: 'Export analytics & audit logs',
      view: 'reports',
      icon: FileText,
    },
    {
      label: 'Bulk Import',
      sub: 'Upload CSV employee data',
      view: 'bulk',
      icon: UploadCloud,
    },
  ];

  return (
    <section className={cn(CARD, className)}>
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick actions</h2>
          <span className="text-[11px] text-slate-400">8 workflows</span>
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

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Direct navigation</span>
        <button
          type="button"
          onClick={() => onNavigate('reviews')}
          className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
        >
          All cycles →
        </button>
      </div>
    </section>
  );
};

/* =========================================================================
   9. Unified HR Action & Priority Hub (Combines Action Queue & Attention Alerts)
   ========================================================================= */

interface HrActionCenterProps {
  tasks: DashboardTask[];
  alerts: DashboardHrOverview['alerts'];
  nextDeadline?: { label: string; date: string };
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
  className?: string;
}

export const HrActionCenter: React.FC<HrActionCenterProps> = ({
  tasks,
  alerts,
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
              <span>⚠️ Attention Needed</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
                  alerts.length > 0
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                )}
              >
                {alerts.length}
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
          <AlertsPanel
            alerts={alerts}
            onNavigate={onNavigate}
            className="border-0 shadow-none p-0 bg-transparent"
          />
        )}
      </div>
    </section>
  );
};

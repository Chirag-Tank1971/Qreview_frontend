import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { DashboardHrOverview, DashboardSummary, DashboardTaskLink } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { EmptyState } from '../ui/EmptyState';
import { PageSkeletonLoader } from '../ui/PageSkeletonLoader';
import { ActionQueue } from './ActionQueue';
import {
  EmployeeGrowthGuideCard,
  EmployeeQuickActions,
  KraList,
  ReviewTracker,
  ScoreTrend,
} from './MyReviewWidgets';
import {
  ManagerAlertsPanel,
  ManagerQuickActions,
  RatingSpread,
  TeamHealthCard,
  TeamStatusTable,
} from './TeamWidgets';
import {
  AlertsPanel,
  AppraisalHealthCard,
  ComplianceAuditCard,
  DepartmentProgressTable,
  HrActionCenter,
  PerformanceDistributionCard,
  QuickActionsPanel,
  RecentActivityCard,
  UpcomingEventsCard,
} from './HrWidgets';
import {
  HodActionCenter,
  HodAlertsPanel,
  HodDeptMemberTable,
  HodKpiStrip,
  HodPerformanceCard,
  HodQuickActions,
  HodRatingSpread,
  HodRecentActivity,
} from './HodWidgets';
import {
  AdminAlertsPanel,
  AdminAttentionCard,
  AdminKpiStrip,
  AdminMasterBreakdownTable,
  AdminQuickActions,
  AdminRecentActivity,
  AdminSecurityFeedCard,
  AdminSystemDiagnosticsCard,
  AdminSystemHealth,
  AdminTopActionsRow,
  AdminUpcomingEventsCard,
  DepartmentDistributionCard,
  HeadcountOverviewCard,
  ReviewCycleProgressCard,
} from './AdminWidgets';
import { RATING_BAND_LABELS, daysUntil, formatMonthYear, formatShortDate, greeting } from './format';

type Lens = 'admin' | 'hr' | 'hod' | 'team' | 'me';

/* =========================================================================
   Cycle Banner (3-Card Layout matching Reference Image)
   ========================================================================= */

const CycleBanner: React.FC<{
  period: NonNullable<DashboardSummary['period']>;
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
}> = ({ period, onNavigate }) => {
  const days = period.daysRemaining !== undefined ? period.daysRemaining : daysUntil(period.dueDate);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Cycle Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {period.name}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                {period.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {formatShortDate(period.startDate)} – {formatShortDate(period.endDate)} · Reviews due {formatShortDate(period.dueDate)}
            </p>
          </div>
        </div>

        {/* Center: Sleek Progress Bar */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Review cycle status</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {period.completionRate || 100}% complete
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, period.completionRate || 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">All reviews scheduled for this cycle</p>
        </div>

        {/* Right: Days Remaining & Quick Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">
              {days} days
            </p>
            <p className="text-[10px] text-slate-400">until reviews are due</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reviews')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer"
          >
            Manage Cycle →
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   6 HR KPI Cards Strip (Breathable & Streamlined)
   ========================================================================= */

const HrKpiStrip: React.FC<{ hr: DashboardHrOverview }> = ({ hr }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Active Employees */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium truncate">Active Employees</span>
          <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {hr.totalEmployees}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            in {hr.totalDepartments} departments
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
            ↑ {hr.employeeTrendPercent}%
          </span>
          <span className="text-[10px] text-slate-400 truncate">vs last cycle</span>
        </div>
      </div>

      {/* 2. Cycle Completion */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium truncate">Cycle Completion</span>
          <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {hr.completionRate}%
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {hr.reviewsCompleted}/{hr.reviewsTotal} completed
          </p>
        </div>
        <div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, hr.completionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Pending Approvals */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium truncate">Pending Approvals</span>
          <div className="p-1 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shrink-0">
            <FileCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {hr.reviewsPendingHr}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">reviews</p>
        </div>
        <div>
          {hr.reviewsPendingHr === 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              ✓ All approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
              Requires HR sign-off
            </span>
          )}
        </div>
      </div>

      {/* 4. Annual Appraisals */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium truncate">Annual Appraisals</span>
          <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {hr.pendingAppraisals}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">pending calibration</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center text-[10px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
            ▲ {hr.appraisalsTrendPercent}%
          </span>
          <span className="text-[10px] text-slate-400 truncate">action required</span>
        </div>
      </div>

      {/* 5. KRA Coverage */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium truncate">KRA Coverage</span>
          <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {hr.kraCoverageRate}%
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {hr.totalEmployees - hr.employeesWithoutKras} of {hr.totalEmployees} staff
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded',
              hr.kraCoverageLabel === 'Low'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            )}
          >
            {hr.kraCoverageLabel}
          </span>
          <span className="text-[10px] text-slate-400 truncate">assign templates</span>
        </div>
      </div>

      {/* 6. Review On-time Rate */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium truncate">Review On-time</span>
          <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {hr.reviewOnTimeRate}%
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">on-time submissions</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
            ↑ {hr.reviewOnTimeTrendPercent}%
          </span>
          <span className="text-[10px] text-slate-400 truncate">vs target</span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   Standard Team and Personal KPI Strips
   ========================================================================= */

interface Kpi {
  label: string;
  value: string;
  unit?: string;
  note: string;
  tone?: 'good' | 'warn' | 'crit';
  meter?: number;
  compact?: boolean;
}

const NOTE_TONE = {
  good: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  crit: 'text-rose-700 dark:text-rose-400',
};

const StandardKpiStrip: React.FC<{ kpis: Kpi[] }> = ({ kpis }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
    {kpis.map((k) => (
      <div key={k.label} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{k.label}</p>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-bold text-slate-900 dark:text-white',
              k.compact ? 'text-base leading-snug' : 'text-2xl font-mono truncate'
            )}
          >
            {k.value}
          </span>
          {k.unit && <span className="text-xs text-slate-500 dark:text-slate-400">{k.unit}</span>}
        </p>
        {k.meter !== undefined && (
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, k.meter)}%` }} />
          </div>
        )}
        <p className={cn('mt-2 text-[11px]', k.tone ? NOTE_TONE[k.tone] : 'text-slate-500 dark:text-slate-400')}>{k.note}</p>
      </div>
    ))}
  </div>
);

function teamKpis(data: DashboardSummary): Kpi[] {
  const team = data.team!;
  const overdue = data.tasks.filter((t) => t.urgency === 'OVERDUE').length;
  const pct = (n: number) => (team.reviewsInPeriod > 0 ? (n / team.reviewsInPeriod) * 100 : 0);
  const toScore = team.reviewsInPeriod - team.scoredByManager;
  return [
    {
      label: 'Reviews scored',
      value: String(team.scoredByManager),
      unit: `/ ${team.reviewsInPeriod}`,
      meter: pct(team.scoredByManager),
      note: team.reviewsInPeriod === 0 ? 'No reviews this quarter yet' : toScore > 0 ? `${toScore} still with you` : 'All submitted',
    },
    {
      label: 'Self-assessments in',
      value: String(team.selfSubmitted),
      unit: `/ ${team.reviewsInPeriod}`,
      meter: pct(team.selfSubmitted),
      note: `${team.size} direct report${team.size === 1 ? '' : 's'}`,
    },
    {
      label: 'Team average',
      value: team.averageScore > 0 ? team.averageScore.toFixed(2) : '–',
      unit: team.averageScore > 0 ? '/ 5' : undefined,
      note: 'Latest evaluated quarter per person',
    },
    {
      label: 'Overdue tasks',
      value: String(overdue),
      note: overdue > 0 ? 'Past their due date' : 'Nothing overdue',
      tone: overdue > 0 ? 'crit' : 'good',
    },
  ];
}

function myKpis(me: NonNullable<DashboardSummary['me']>): Kpi[] {
  const totalWeight = me.kras.reduce((s, k) => s + (k.weight || 0), 0);
  return [
    {
      label: 'Rolling score',
      value: me.rollingScore > 0 ? me.rollingScore.toFixed(2) : '–',
      unit: me.rollingScore > 0 ? '/ 5' : undefined,
      note: me.evaluatedQuarters > 0 ? `Last ${me.evaluatedQuarters} evaluated quarter${me.evaluatedQuarters === 1 ? '' : 's'}` : 'No evaluated quarters yet',
    },
    {
      label: 'Rating band',
      value: me.ratingBand ? RATING_BAND_LABELS[me.ratingBand] || me.ratingBand : '–',
      compact: Boolean(me.ratingBand),
      note: me.ratingBand ? 'Implied by your rolling score' : 'Shown after your first evaluated quarter',
      tone: me.ratingBand === 'OUTSTANDING' || me.ratingBand === 'EXCEEDS_EXPECTATIONS' ? 'good' : me.ratingBand === 'NEEDS_IMPROVEMENT' ? 'warn' : undefined,
    },
    {
      label: 'Active KRAs',
      value: String(me.kras.length),
      note: me.kras.length > 0 ? `Weights total ${totalWeight}%` : 'None assigned yet',
      tone: me.kras.length > 0 && totalWeight !== 100 ? 'warn' : undefined,
    },
    {
      label: 'Next appraisal',
      value: me.nextAppraisal ? formatMonthYear(me.nextAppraisal.month, me.nextAppraisal.year) : '–',
      note: me.nextAppraisal?.cycleName || 'No appraisal cycle assigned',
    },
  ];
}

/* =========================================================================
   Main DashboardView Component
   ========================================================================= */

interface DashboardViewProps {
  onNavigate: (view: DashboardTaskLink['view'], params?: DashboardTaskLink['params']) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lens, setLens] = useState<Lens | null>(null);
  const [healthCycle, setHealthCycle] = useState<string>('Q3 2026');
  const [distributionCycle, setDistributionCycle] = useState<string>('Q3 2026');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await api.getDashboardSummary());
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, user?.id, user?.role]);

  if (isLoading && !data) return <PageSkeletonLoader variant="generic" />;

  if (error && !data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your dashboard"
        description={error}
        action={{ label: 'Try again', onClick: load, icon: RefreshCw }}
      />
    );
  }

  if (!data) return null;

  const hasAdmin = Boolean(data.admin);
  const hasHr = Boolean(data.hr);
  const hasHod = Boolean(data.hod);
  const hasTeam = Boolean(data.team);
  const hasMe = Boolean(data.me);

  // Default lens: based on role & available payloads
  const defaultLens: Lens =
    (user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGEMENT') && hasAdmin
      ? 'admin'
      : hasHr && user?.role === 'HR'
      ? 'hr'
      : hasHod
      ? 'hod'
      : hasAdmin
      ? 'admin'
      : hasHr
      ? 'hr'
      : hasTeam
      ? 'team'
      : 'me';
  const activeLens: Lens = lens || defaultLens;

  const availableLenses: { key: Lens; label: string }[] = [];
  if (hasAdmin) availableLenses.push({ key: 'admin', label: 'System Admin' });
  if (hasHr) availableLenses.push({ key: 'hr', label: 'HR Overview' });
  if (hasHod) availableLenses.push({ key: 'hod', label: 'My Department' });
  if (hasTeam) availableLenses.push({ key: 'team', label: 'My team' });
  if (hasMe) availableLenses.push({ key: 'me', label: 'My own review' });

  const firstName = (data.me?.employee.name || user?.name || '').split(' ')[0];
  const subtitle =
    activeLens === 'admin' && data.admin
      ? `System Administration · ${data.admin.totalUsers} users · ${data.admin.totalEmployees} employees across ${data.admin.totalDepartments} departments`
      : activeLens === 'hr' && data.hr
      ? `HR Overview · ${data.hr.totalEmployees} active employees across ${data.hr.totalDepartments} departments`
      : activeLens === 'hod' && data.hod
      ? `HOD · ${data.hod.departmentName} · ${data.hod.totalEmployees} employees`
      : activeLens === 'team' && data.team
      ? `Manager · ${data.team.size} direct report${data.team.size === 1 ? '' : 's'}${data.me?.employee.departmentName ? ` · ${data.me.employee.departmentName}` : ''}`
      : [data.me?.employee.designationName, data.me?.employee.departmentName].filter(Boolean).join(' · ');

  const nextDeadline = data.period
    ? { label: `${data.period.name} reviews due`, date: formatShortDate(data.period.dueDate) }
    : undefined;

  return (
    <div className="space-y-4">
      {/* Top Header Row with Title, Lens Switcher, Refresh, and CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {availableLenses.length > 1 && (
            <div
              className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
              role="group"
              aria-label="Dashboard view"
            >
              {availableLenses.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  aria-pressed={activeLens === l.key}
                  onClick={() => setLens(l.key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                    activeLens === l.key
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-60"
            aria-label="Refresh dashboard"
            title="Refresh"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>

          {activeLens === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('employees')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <span>Manage Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {activeLens === 'hr' && (
            <button
              type="button"
              onClick={() => onNavigate('reviews')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <span>View Review Cycle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {activeLens === 'hod' && (
            <button
              type="button"
              onClick={() => onNavigate('reviews')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <span>Pending HOD Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {activeLens === 'team' && (
            <button
              type="button"
              onClick={() => onNavigate('reviews')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <span>Score Team Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Review Cycle Period Banner */}
      {data.period && <CycleBanner period={data.period} onNavigate={onNavigate} />}

      {/* KPI Metric Strips */}
      {activeLens === 'admin' && data.admin ? (
        <AdminKpiStrip admin={data.admin} onNavigate={(view, params) => onNavigate(view, params)} />
      ) : activeLens === 'hr' && data.hr ? (
        <HrKpiStrip hr={data.hr} />
      ) : activeLens === 'hod' && data.hod ? (
        <HodKpiStrip hod={data.hod} />
      ) : activeLens === 'team' && data.team ? (
        <StandardKpiStrip kpis={teamKpis(data)} />
      ) : data.me ? (
        <StandardKpiStrip kpis={myKpis(data.me)} />
      ) : null}

      {/* Main Content Layout */}
      {activeLens === 'admin' && data.admin ? (
        <div className="space-y-3.5">
          {/* Tier 1: Headcount Chart + Dept Distribution + Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <HeadcountOverviewCard admin={data.admin} className="lg:col-span-1" />
            <DepartmentDistributionCard admin={data.admin} className="lg:col-span-1" />
            <AdminUpcomingEventsCard
              admin={data.admin}
              onNavigate={(view, params) => onNavigate(view, params)}
            />
          </div>

          {/* Tier 2: Review Cycle Progress + Attention + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <ReviewCycleProgressCard
              admin={data.admin}
              onNavigate={(view, params) => onNavigate(view, params)}
            />
            <AdminAttentionCard
              admin={data.admin}
              onNavigate={(view, params) => onNavigate(view, params)}
            />
            <AdminQuickActions
              onNavigate={(view, params) => onNavigate(view, params)}
            />
          </div>

          {/* Tier 3: Recent Activity + System Health + Top Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <AdminRecentActivity
              admin={data.admin}
              onNavigate={(view, params) => onNavigate(view, params)}
            />
            <AdminSystemHealth admin={data.admin} />
            <AdminTopActionsRow
              admin={data.admin}
              onNavigate={(view, params) => onNavigate(view, params)}
            />
          </div>
        </div>

      ) : activeLens === 'hr' && data.hr ? (
        <div className="space-y-5">
          {/* Tier 1: Unified Action & Priority Hub (2 Cols) + Quick Actions (1 Col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <HrActionCenter
              tasks={data.tasks}
              alerts={data.hr.alerts}
              nextDeadline={nextDeadline}
              onNavigate={(view, params) => onNavigate(view, params)}
              className="lg:col-span-2"
            />
            <QuickActionsPanel
              onNavigate={(view, params) => onNavigate(view, params)}
              className="lg:col-span-1"
            />
          </div>

          {/* Section 1: Cycle Performance & Review Analytics */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cycle Performance & Review Analytics
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Department completion rates, appraisal stages, and rating distributions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <DepartmentProgressTable
                hr={data.hr}
                onNavigate={(view, params) => onNavigate(view, params)}
              />
              <AppraisalHealthCard
                health={data.hr.appraisalHealth}
                periodName={data.period?.name}
                cycleBreakdowns={data.hr.cycleBreakdowns}
                selectedCycle={healthCycle}
                onSelectCycle={setHealthCycle}
                onNavigate={(view, params) => onNavigate(view, params)}
              />
              <PerformanceDistributionCard
                distribution={data.hr.performanceDistribution}
                periodName={data.period?.name}
                cycleBreakdowns={data.hr.cycleBreakdowns}
                selectedCycle={distributionCycle}
                onSelectCycle={setDistributionCycle}
                onNavigate={(view, params) => onNavigate(view, params)}
              />
            </div>
          </div>

          {/* Section 2: Governance, Deadlines & Audit Logs */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Governance, Deadlines & Audit Logs
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time audit trail, scheduled review milestones, and system compliance status
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <RecentActivityCard
                activity={data.hr.recentActivity}
                onNavigate={(view, params) => onNavigate(view, params)}
              />
              <UpcomingEventsCard
                events={data.hr.upcomingEvents}
                onNavigate={(view, params) => onNavigate(view, params)}
              />
              <ComplianceAuditCard
                compliance={data.hr.compliance}
                onNavigate={(view, params) => onNavigate(view, params)}
              />
            </div>
          </div>
        </div>
      ) : activeLens === 'hod' && data.hod ? (
        <div className="space-y-5">
          {/* Tier 1: Action Center (2 Cols) + Quick Actions (1 Col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <HodActionCenter
              tasks={data.tasks}
              hod={data.hod}
              nextDeadline={nextDeadline}
              onNavigate={(view, params) => onNavigate(view, params)}
              className="lg:col-span-2"
            />
            <HodQuickActions
              onNavigate={(view, params) => onNavigate(view, params)}
              className="lg:col-span-1"
            />
          </div>

          {/* Section 1: Department Performance & Member Directory */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Department Performance & Member Directory
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time review progress, evaluation stages, and distribution benchmarks
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <HodDeptMemberTable
                hod={data.hod}
                onOpenReview={(empId) => onNavigate('reviews', { employeeId: empId })}
                className="lg:col-span-2"
              />
              <HodPerformanceCard
                hod={data.hod}
                onNavigate={(view, params) => onNavigate(view, params)}
                className="lg:col-span-1"
              />
            </div>
          </div>

          {/* Section 2: Ratings Distribution & Team Activity */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ratings Distribution & Department Activity
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Score brackets and live audit events across {data.hod.departmentName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <HodRatingSpread hod={data.hod} className="lg:col-span-1" />
              <HodRecentActivity hod={data.hod} className="lg:col-span-2" />
            </div>
          </div>
        </div>
      ) : activeLens === 'team' && data.team ? (
        <div className="space-y-3.5">
          {/* Tier 1: Action Queue, Manager Alerts, Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <ActionQueue
              tasks={data.tasks}
              nextDeadline={nextDeadline}
              onOpen={(link) => onNavigate(link.view, link.params)}
            />
            <ManagerAlertsPanel
              team={data.team}
              onNavigate={(view, params) => onNavigate(view, params)}
            />
            <ManagerQuickActions
              onNavigate={(view, params) => onNavigate(view, params)}
            />
          </div>

          {/* Tier 2: Team Member Table, Rating Spread */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <TeamStatusTable
              team={data.team}
              onOpenReview={(reviewId) => onNavigate('reviews', { reviewId })}
              className="lg:col-span-2"
            />
            <RatingSpread team={data.team} />
          </div>

          {/* Tier 3: Review Completion & Cadence Health Card */}
          <div className="grid grid-cols-1 gap-3.5 items-stretch">
            <TeamHealthCard team={data.team} />
          </div>
        </div>
      ) : data.me ? (
        <div className="space-y-3.5">
          {/* Tier 1: Action Queue, Review Progress Tracker, Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <ActionQueue
              tasks={data.tasks}
              nextDeadline={nextDeadline}
              onOpen={(link) => onNavigate(link.view, link.params)}
            />
            <ReviewTracker me={data.me} />
            <EmployeeQuickActions
              onNavigate={(view, params) => onNavigate(view, params)}
            />
          </div>

          {/* Tier 2: KRA List, Score Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            <KraList
              kras={data.me.kras}
              onNavigate={(view, params) => onNavigate(view, params)}
              className="lg:col-span-2"
            />
            <ScoreTrend history={data.me.scoreHistory} />
          </div>

          {/* Tier 3: Growth & Appraisal Readiness Guide */}
          <div className="grid grid-cols-1 gap-3.5 items-stretch">
            <EmployeeGrowthGuideCard me={data.me} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your account isn't linked to an employee record, so there is no personal review to show.
        </p>
      )}
    </div>
  );
};

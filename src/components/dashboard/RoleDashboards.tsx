import React from 'react';
import { ArrowRight, Award, FileText, Target } from 'lucide-react';
import type {
  DashboardAdminOverview,
  DashboardHodOverview,
  DashboardHrOverview,
  DashboardMyReview,
  DashboardSummary,
  DashboardTeam,
} from '../../types';
import { cn } from '../../utils/cn';
import {
  Card,
  DatesCard,
  Navigate,
  PeopleCard,
  PersonRow,
  PipelineCard,
  PipelineStage,
  ProgressListCard,
  RATING_ROWS,
  RatingCard,
  StatRow,
  TodoCard,
  countTodo,
} from './DashboardKit';
import { RATING_BAND_LABELS, formatMonthYear } from './format';
import { CalibrationCard, CoverageCard, DataHealthCard, EmailDeliveryCard, ReviewersBehindCard } from './InsightCards';

const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
const score = (n?: number | null) => (n && n > 0 ? n.toFixed(2) : '–');

/** Same four stage colours everywhere so "with HOD" always looks the same. */
const stageColors = {
  self: 'bg-slate-300 dark:bg-slate-600',
  manager: 'bg-amber-400',
  hod: 'bg-violet-500',
  hr: 'bg-sky-500',
  done: 'bg-emerald-500',
};

function hrDates(hr: DashboardHrOverview | null | undefined) {
  return (hr?.upcomingEvents || []).map((e) => ({
    id: e.id,
    title: e.title,
    detail: e.category,
    month: e.dateMonth,
    day: e.dateDay,
    when: e.daysText,
  }));
}

/* =========================================================================
   Employee — "My review"
   ========================================================================= */

const STEPS = ['Self-assessment', 'Manager', 'HOD', 'HR', 'Done'];

const MyReviewCard: React.FC<{ me: DashboardMyReview; data: DashboardSummary; onNavigate: Navigate; className?: string }> = ({
  me,
  data,
  onNavigate,
  className,
}) => {
  const r = me.currentReview;
  const step = !r
    ? -1
    : r.stage === 'CLOSED'
    ? 4
    : r.stage === 'HR'
    ? 3
    : r.stage === 'HOD'
    ? 2
    : r.isSelfSubmitted
    ? 1
    : 0;
  const selfTask = data.tasks.find((t) => t.type === 'SELF_ASSESSMENT');
  const statusLine = !r
    ? 'No review has been opened for you this quarter yet.'
    : step === 0
    ? 'Your self-assessment is waiting for you.'
    : step === 4
    ? `Completed${r.finalScore ? ` · final score ${r.finalScore.toFixed(2)} / 5` : ''}`
    : `With your ${STEPS[step].toLowerCase()} — nothing needed from you right now.`;

  return (
    <Card title={r ? `My ${r.periodName} review` : 'My review'} className={className}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{statusLine}</p>

      {r && (
        <ol className="mt-5 grid grid-cols-5 gap-1.5">
          {STEPS.map((label, i) => (
            <li key={label} className="min-w-0">
              <div
                className={cn(
                  'h-1.5 rounded-full',
                  i < step || step === 4 ? 'bg-emerald-500' : i === step ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'
                )}
              />
              <p
                className={cn(
                  'mt-1.5 text-[11px] truncate',
                  i === step ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-400'
                )}
              >
                {label}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-auto pt-5 flex flex-wrap gap-2">
        {step === 0 && selfTask ? (
          <button
            type="button"
            onClick={() => onNavigate(selfTask.link.view, selfTask.link.params)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          >
            Start self-assessment <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('reviews')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            View my reviews <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
};

/** Tiny inline sparkline for the score history. */
const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  if (values.length < 2) return null;
  const w = 160;
  const h = 40;
  const min = Math.min(...values, 1);
  const max = Math.max(...values, 5);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - ((v - min) / (max - min || 1)) * h] as const);
  return (
    <svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} className="w-full h-10 overflow-visible" aria-hidden>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="text-indigo-500" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" className="fill-indigo-500" />
    </svg>
  );
};

const MyScoreCard: React.FC<{ me: DashboardMyReview; className?: string }> = ({ me, className }) => {
  const history = me.scoreHistory.slice(-6);
  const last = history[history.length - 1]?.score;
  const prev = history[history.length - 2]?.score;
  const delta = last !== undefined && prev !== undefined ? last - prev : null;
  return (
    <Card title="My performance" subtitle={me.evaluatedQuarters ? `Average of last ${me.evaluatedQuarters} evaluated quarter${me.evaluatedQuarters === 1 ? '' : 's'}` : undefined} className={className}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">{score(me.rollingScore)}</span>
        {me.rollingScore > 0 && <span className="text-sm text-slate-400">/ 5</span>}
      </div>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        {me.ratingBand && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            {RATING_BAND_LABELS[me.ratingBand] || me.ratingBand}
          </span>
        )}
        {delta !== null && delta !== 0 && (
          <span className={cn('text-xs font-medium', delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)} vs last quarter
          </span>
        )}
        {!me.rollingScore && <span className="text-xs text-slate-500 dark:text-slate-400">Shown after your first evaluated quarter.</span>}
      </div>
      {history.length >= 2 && (
        <div className="mt-auto pt-4">
          <Sparkline values={history.map((h) => h.score)} />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>{history[0].periodName}</span>
            <span>{history[history.length - 1].periodName}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

const APPRAISAL_STATUS: Record<string, string> = {
  HR_APPROVED: 'Approved by HR',
  HOD_CALIBRATED: 'Calibrated by HOD',
  MANAGER_RECOMMENDED: 'Recommended by manager',
};

const MyAppraisalCard: React.FC<{ me: DashboardMyReview; onOpenLetter: () => void; className?: string }> = ({ me, onOpenLetter, className }) => {
  const a = me.activeAppraisal;
  return (
    <Card title="Annual appraisal" className={className}>
      {a ? (
        <>
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">FY {a.appraisalYear}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {a.isLocked ? 'Released' : APPRAISAL_STATUS[a.status] || 'In progress'}
              </p>
            </div>
          </div>
          {a.isLocked && a.hrApprovedIncrement !== undefined && (
            <p className="mt-4 text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">+{a.hrApprovedIncrement}%</p>
          )}
          {a.isLocked && (
            <button
              type="button"
              onClick={onOpenLetter}
              className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> {a.acknowledged ? 'View letter' : 'View & acknowledge letter'}
            </button>
          )}
        </>
      ) : me.nextAppraisal ? (
        <>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{formatMonthYear(me.nextAppraisal.month, me.nextAppraisal.year)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your next appraisal{me.nextAppraisal.cycleName ? ` · ${me.nextAppraisal.cycleName}` : ''}</p>
        </>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">No appraisal cycle assigned yet.</p>
      )}
    </Card>
  );
};

const MyKrasCard: React.FC<{ me: DashboardMyReview; onNavigate: Navigate; className?: string }> = ({ me, onNavigate, className }) => (
  <Card
    title="My KRAs"
    subtitle={me.kras.length ? `${me.kras.length} goals · weights add up to ${me.kras.reduce((s, k) => s + (k.weight || 0), 0)}%` : undefined}
    action={{ label: 'Details', onClick: () => onNavigate('reviews') }}
    className={className}
  >
    {me.kras.length === 0 ? (
      <p className="text-xs text-slate-500 dark:text-slate-400">No KRAs assigned yet.</p>
    ) : (
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {me.kras.map((k) => (
          <li key={k.title} className="flex items-center gap-3 min-w-0">
            <Target className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            <span className="flex-1 min-w-0 text-sm text-slate-800 dark:text-slate-200 truncate" title={k.title}>
              {k.title}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">{k.weight}%</span>
            <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {k.lastRating ? `${k.lastRating}` : '–'}
            </span>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

export const EmployeeDashboard: React.FC<{ data: DashboardSummary; me: DashboardMyReview; onNavigate: Navigate; onOpenLetter: () => void }> = ({
  data,
  me,
  onNavigate,
  onOpenLetter,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <MyReviewCard me={me} data={data} onNavigate={onNavigate} className="lg:col-span-2" />
      <MyScoreCard me={me} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <TodoCard tasks={data.tasks} onNavigate={onNavigate} className="lg:col-span-2" />
      <MyAppraisalCard me={me} onOpenLetter={onOpenLetter} />
    </div>
    <MyKrasCard me={me} onNavigate={onNavigate} />
  </div>
);

/* =========================================================================
   Manager — "My team"
   ========================================================================= */

function teamPeople(team: DashboardTeam, onNavigate: Navigate): PersonRow[] {
  const order = { MANAGER: 0, NONE: 1, HOD: 2, HR: 3, CLOSED: 4, SELF: 5 } as Record<string, number>;
  return team.members
    .map<PersonRow>((m) => ({
      id: m.employeeId,
      name: m.name,
      subtitle: [m.designationName, m.reviewId && !m.isSelfSubmitted && m.stage === 'MANAGER' ? 'self-assessment pending' : undefined]
        .filter(Boolean)
        .join(' · '),
      stage: (m.reviewId ? m.stage || 'MANAGER' : 'NONE') as PersonRow['stage'],
      score: m.lastScore,
      flag: m.onPip ? 'PIP' : undefined,
      onClick: m.reviewId ? () => onNavigate('reviews', { reviewId: m.reviewId! }) : undefined,
    }))
    .sort((a, b) => (order[a.stage] ?? 9) - (order[b.stage] ?? 9));
}

export const ManagerDashboard: React.FC<{ data: DashboardSummary; team: DashboardTeam; onNavigate: Navigate }> = ({ data, team, onNavigate }) => {
  const withMe = team.members.filter((m) => m.reviewId && (m.stage || 'MANAGER') === 'MANAGER').length;
  const overdue = data.tasks.filter((t) => t.urgency === 'OVERDUE').length;
  const spread = team.ratingSpread;
  return (
    <div className="space-y-4">
      <StatRow
        stats={[
          {
            label: 'Reviews waiting on you',
            value: String(withMe),
            hint: withMe ? 'Score and submit them' : 'All submitted',
            tone: withMe ? 'warn' : 'good',
            onClick: () => onNavigate('reviews'),
          },
          {
            label: 'Reviews submitted',
            value: String(team.scoredByManager),
            suffix: `/ ${team.reviewsInPeriod}`,
            progress: pct(team.scoredByManager, team.reviewsInPeriod),
          },
          {
            label: 'Self-assessments in',
            value: String(team.selfSubmitted),
            suffix: `/ ${team.reviewsInPeriod}`,
            progress: pct(team.selfSubmitted, team.reviewsInPeriod),
          },
          {
            label: 'Team average',
            value: score(team.averageScore),
            suffix: team.averageScore > 0 ? '/ 5' : undefined,
            hint: overdue ? `${overdue} overdue task${overdue === 1 ? '' : 's'}` : `${team.size} direct report${team.size === 1 ? '' : 's'}`,
            tone: overdue ? 'bad' : 'default',
          },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <TodoCard tasks={data.tasks} alerts={team.alerts} onNavigate={onNavigate} className="lg:col-span-2" />
        <RatingCard
          title="Team ratings"
          subtitle={team.periodName}
          rows={RATING_ROWS.map((r) => ({ label: r.label, color: r.color, count: spread[r.key] }))}
          footnote={spread.unrated ? `${spread.unrated} not rated yet` : undefined}
        />
      </div>
      <PeopleCard
        title="My team"
        subtitle={team.periodName ? `${team.periodName} review status` : undefined}
        people={teamPeople(team, onNavigate)}
        action={{ label: 'All reviews', onClick: () => onNavigate('reviews') }}
      />
    </div>
  );
};

/* =========================================================================
   HOD — "My department"
   ========================================================================= */

export const HodDashboard: React.FC<{ data: DashboardSummary; hod: DashboardHodOverview; onNavigate: Navigate }> = ({ data, hod, onNavigate }) => {
  const count = (stage: string) => hod.departmentMembers.filter((m) => m.stage === stage).length;
  const notStarted = hod.departmentMembers.filter((m) => !m.stage).length;
  const stages: PipelineStage[] = [
    { label: 'Not started', count: notStarted, color: stageColors.self },
    { label: 'With managers', count: count('MANAGER'), color: stageColors.manager },
    { label: 'With you', count: count('HOD'), color: stageColors.hod },
    { label: 'With HR', count: count('HR'), color: stageColors.hr },
    { label: 'Completed', count: count('CLOSED'), color: stageColors.done },
  ];
  const people: PersonRow[] = hod.departmentMembers
    .map<PersonRow>((m) => ({
      id: m.employeeId,
      name: m.name,
      subtitle: [m.designationName, m.managerName ? `Manager: ${m.managerName}` : undefined].filter(Boolean).join(' · '),
      stage: (m.stage || 'NONE') as PersonRow['stage'],
      score: m.lastScore,
      flag: m.onPip ? 'PIP' : undefined,
      onClick: () => onNavigate('reviews', { employeeId: m.employeeId }),
    }))
    .sort((a, b) => (a.stage === 'HOD' ? -1 : 0) - (b.stage === 'HOD' ? -1 : 0));
  const spread = hod.ratingSpread;

  return (
    <div className="space-y-4">
      <StatRow
        stats={[
          {
            label: 'Waiting for your scoring',
            value: String(hod.reviewsPendingHod),
            hint: hod.reviewsPendingHod ? 'Open HOD reviews' : 'Nothing pending',
            tone: hod.reviewsPendingHod ? 'warn' : 'good',
            onClick: () => onNavigate('reviews'),
          },
          {
            label: 'Department completion',
            value: `${Math.round(hod.completionRate)}%`,
            progress: hod.completionRate,
            hint: `${hod.reviewsCompleted} of ${hod.reviewsTotal} reviews done`,
          },
          { label: 'Department average', value: score(hod.averageScore), suffix: hod.averageScore ? '/ 5' : undefined, hint: `${hod.totalEmployees} employees` },
          { label: 'High performers', value: String(hod.highPerformersCount), hint: 'Rated 4 and above' },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <TodoCard tasks={data.tasks} alerts={hod.alerts} onNavigate={onNavigate} className="lg:col-span-2" />
        <PipelineCard subtitle={hod.departmentName} stages={stages} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <PeopleCard title="Department members" subtitle="Reviews waiting for you are listed first" people={people} className="lg:col-span-2" />
        <RatingCard
          title="Department ratings"
          rows={RATING_ROWS.map((r) => ({ label: r.label, color: r.color, count: spread[r.key] }))}
          footnote={spread.unrated ? `${spread.unrated} not rated yet` : undefined}
        />
      </div>
    </div>
  );
};

/* =========================================================================
   HR — "Organisation"
   ========================================================================= */

function hrStages(hr: DashboardHrOverview): PipelineStage[] {
  return [
    { label: 'With managers', count: hr.reviewsPendingManager, color: stageColors.manager },
    { label: 'With HODs', count: hr.reviewsPendingHod, color: stageColors.hod },
    { label: 'Waiting for HR sign-off', count: hr.reviewsPendingHr, color: stageColors.hr },
    { label: 'Completed', count: hr.reviewsCompleted, color: stageColors.done },
  ];
}

export const HrDashboard: React.FC<{ data: DashboardSummary; hr: DashboardHrOverview; onNavigate: Navigate; onRefresh: () => void }> = ({
  data,
  hr,
  onNavigate,
  onRefresh,
}) => {
  // Alerts that repeat an existing task (appraisals to calibrate, KRAs to assign) are dropped.
  const hasTask = (type: string) => data.tasks.some((t) => t.type === type);
  const alerts = hr.alerts.filter(
    (a) => !(hasTask('CALIBRATE_APPRAISAL') && a.id === 'alert_pending_appraisals') && !(hasTask('ASSIGN_KRAS') && a.id === 'alert_missing_kras')
  );
  return (
  <div className="space-y-4">
    <StatRow
      stats={[
        {
          label: 'Waiting for your sign-off',
          value: String(hr.reviewsPendingHr),
          hint: hr.reviewsPendingHr ? 'Approve or return' : 'Nothing pending',
          tone: hr.reviewsPendingHr ? 'warn' : 'good',
          onClick: () => onNavigate('reviews'),
        },
        {
          label: 'Cycle completion',
          value: `${Math.round(hr.completionRate)}%`,
          progress: hr.completionRate,
          hint: `${hr.reviewsCompleted} of ${hr.reviewsTotal} reviews`,
        },
        {
          label: 'Appraisals in progress',
          value: String(hr.pendingAppraisals),
          hint: 'Annual increments not yet final',
          onClick: () => onNavigate('appraisals'),
        },
        {
          label: 'KRA coverage',
          value: `${Math.round(hr.kraCoverageRate)}%`,
          progress: hr.kraCoverageRate,
          hint: hr.employeesWithoutKras ? `${hr.employeesWithoutKras} without KRAs` : 'Everyone has KRAs',
          tone: hr.employeesWithoutKras ? 'warn' : 'good',
          onClick: () => onNavigate('kras'),
        },
      ]}
    />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <TodoCard tasks={data.tasks} alerts={alerts} onNavigate={onNavigate} className="lg:col-span-2" />
      <PipelineCard subtitle={`${hr.reviewsTotal} reviews this cycle`} stages={hrStages(hr)} action={{ label: 'Open', onClick: () => onNavigate('reviews') }} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <CoverageCard coverage={hr.coverage} onNavigate={onNavigate} />
      <ReviewersBehindCard backlog={hr.reviewerBacklog} onReminded={onRefresh} />
      <CalibrationCard calibration={hr.calibration} onNavigate={onNavigate} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <ProgressListCard
        title="Departments"
        subtitle="Completed reviews out of employees, furthest behind first"
        className="lg:col-span-2"
        // Measured against headcount (completed ÷ employees) so every row is comparable and
        // matches the coverage and Admin figures — not against only the reviews that exist.
        rows={hr.departmentProgress
          .filter((d) => d.totalEmployees > 0)
          .map((d) => ({
            key: d.departmentId,
            label: d.departmentName,
            detail: `${d.reviewsCompleted}/${d.totalEmployees} done${d.reviewsInitiated < d.totalEmployees ? ` · ${d.totalEmployees - d.reviewsInitiated} without review` : ''}`,
            percent: (d.reviewsCompleted / d.totalEmployees) * 100,
          }))}
        action={{ label: 'Reports', onClick: () => onNavigate('reports') }}
      />
      <DatesCard events={hrDates(hr)} />
    </div>
  </div>
  );
};

/* =========================================================================
   Admin — "System"
   ========================================================================= */

export const AdminDashboard: React.FC<{ data: DashboardSummary; admin: DashboardAdminOverview; onNavigate: Navigate }> = ({
  data,
  admin,
  onNavigate,
}) => {
  const hr = data.hr;
  const reviewed = admin.reviewCycleProgress.reduce((s, d) => s + d.reviewed, 0);
  const inScope = admin.reviewCycleProgress.reduce((s, d) => s + d.totalEmployees, 0);
  const completion = hr ? hr.completionRate : pct(reviewed, inScope);
  // Attention items that repeat an existing task (appraisals to calibrate, KRAs to assign) are dropped.
  const hasTask = (type: string) => data.tasks.some((t) => t.type === type);
  const attention = admin.attentionItems
    .filter((a) => !(hasTask('CALIBRATE_APPRAISAL') && a.id === 'attn_pending_appraisals') && !(hasTask('ASSIGN_KRAS') && a.id === 'attn_no_kra'))
    .map((a) => ({
    id: a.id,
    type: (a.color === 'red' ? 'crit' : a.color === 'amber' ? 'warn' : 'info') as 'crit' | 'warn' | 'info',
    title: a.title,
    detail: a.detail,
    link: a.link,
  }));
  // admin.alerts only repeats what attentionItems already say (missing managers, deadline),
  // so the attention items are the single source here.
  const todoCount = countTodo(data.tasks, attention);
  const joinerText = [
    admin.newJoinersThisMonth ? `+${admin.newJoinersThisMonth} joined` : '',
    admin.exitsThisMonth ? `−${admin.exitsThisMonth} left` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-4">
      <StatRow
        stats={[
          {
            label: 'Active employees',
            value: String(admin.totalEmployees),
            hint: joinerText ? `${joinerText} this month` : `${admin.totalDepartments} departments`,
            onClick: () => onNavigate('employees'),
          },
          {
            label: 'Users',
            value: String(admin.activeUsers),
            suffix: `/ ${admin.totalUsers}`,
            hint: 'active accounts',
          },
          {
            label: 'Review cycle completion',
            value: `${Math.round(completion)}%`,
            progress: completion,
            hint: admin.activePeriodName,
            onClick: () => onNavigate('reviews'),
          },
          {
            label: 'Needs attention',
            value: String(todoCount),
            hint: todoCount ? 'Tasks and setup issues' : 'All clear',
            tone: todoCount ? 'warn' : 'good',
          },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <TodoCard title="Needs attention" tasks={data.tasks} alerts={attention} onNavigate={onNavigate} className="lg:col-span-2" />
        {hr ? (
          <PipelineCard subtitle={`${hr.reviewsTotal} reviews this cycle`} stages={hrStages(hr)} action={{ label: 'Open', onClick: () => onNavigate('reviews') }} />
        ) : (
          <DatesCard events={[]} />
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <CoverageCard coverage={hr?.coverage ?? null} onNavigate={onNavigate} />
        <DataHealthCard items={admin.dataHealth} onNavigate={onNavigate} />
        <EmailDeliveryCard email={admin.emailDelivery} onNavigate={onNavigate} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <ProgressListCard
          title="Departments"
          subtitle="Completed reviews out of employees, furthest behind first"
          className="lg:col-span-2"
          rows={admin.reviewCycleProgress.filter((d) => d.totalEmployees > 0).map((d) => ({
            key: d.departmentId,
            label: d.departmentName,
            detail: `${d.reviewed}/${d.totalEmployees} done`,
            percent: d.completionRate,
          }))}
          action={{ label: 'Hierarchy', onClick: () => onNavigate('hierarchy') }}
        />
        <DatesCard events={hrDates(hr)} />
      </div>
    </div>
  );
};

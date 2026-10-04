import React from 'react';
import type { DashboardMyReview } from '../../types';
import { cn } from '../../utils/cn';
import { formatShortDate } from './format';

const CARD = 'bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs';

type StepState = 'done' | 'current' | 'todo' | 'skipped';

function trackerSteps(review: NonNullable<DashboardMyReview['currentReview']>, me: DashboardMyReview) {
  const order = ['MANAGER', 'HOD', 'HR', 'CLOSED'] as const;
  const reached = order.indexOf(review.stage);
  const stepState = (index: number): StepState => (reached > index ? 'done' : reached === index ? 'current' : 'todo');

  const selfState: StepState = review.isSelfSubmitted
    ? 'done'
    : review.stage === 'MANAGER'
      ? 'current'
      : 'skipped';

  return [
    { label: 'Self-assessment', state: selfState, note: review.isSelfSubmitted ? 'Submitted' : selfState === 'skipped' ? 'Not submitted' : 'Waiting on you' },
    { label: 'Manager', state: review.stage === 'MANAGER' && !review.isSelfSubmitted ? 'todo' : stepState(0), note: me.employee.managerName || 'Reporting manager' },
    { label: 'HOD', state: stepState(1), note: me.employee.hodName || 'Head of department' },
    { label: 'HR', state: stepState(2), note: 'HR team' },
    { label: 'Closed', state: review.stage === 'CLOSED' ? 'done' : 'todo', note: review.finalScore ? `Score ${review.finalScore.toFixed(2)}` : 'Score released' },
  ] as { label: string; state: StepState; note: string }[];
}

const DOT: Record<StepState, string> = {
  done: 'bg-emerald-500',
  current: 'bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-950',
  todo: 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700',
  skipped: 'bg-slate-300 dark:bg-slate-600',
};

export const ReviewTracker: React.FC<{ me: DashboardMyReview; className?: string }> = ({ me, className }) => {
  const review = me.currentReview;
  return (
    <section className={cn(CARD, 'flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Your review progress</h2>
        {review && <span className="text-xs text-slate-400">{review.periodName}</span>}
      </div>
      {!review ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No quarterly review has been created for you yet.</p>
      ) : (
        <>
          <ol className="flex flex-col">
            {trackerSteps(review, me).map((step, i, steps) => (
              <li key={step.label} className="grid grid-cols-[12px_minmax(0,1fr)_auto] gap-x-3">
                <span className="flex flex-col items-center">
                  <span className={cn('w-3 h-3 rounded-full mt-0.5 shrink-0', DOT[step.state])} />
                  {i < steps.length - 1 && <span className="w-px flex-1 bg-slate-200 dark:bg-slate-700 my-1" />}
                </span>
                <span className={cn('text-xs font-semibold pb-3', step.state === 'todo' ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100')}>
                  {step.label}
                </span>
                <span className={cn('text-[11px] text-right truncate', step.state === 'current' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-500 dark:text-slate-400')}>
                  {step.note}
                </span>
              </li>
            ))}
          </ol>
          {review.dueDate && review.stage !== 'CLOSED' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Reviews for this quarter are due {formatShortDate(review.dueDate)}.</p>
          )}
        </>
      )}
    </section>
  );
};

export const KraList: React.FC<{
  kras: DashboardMyReview['kras'];
  onNavigate?: (view: any, params?: any) => void;
  className?: string;
}> = ({ kras, onNavigate, className }) => {
  const totalWeight = kras.reduce((sum, k) => sum + (k.weight || 0), 0);

  return (
    <section className={cn(CARD, 'flex flex-col gap-3 min-w-0', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Performance Goals & Objectives (KRAs)</h2>
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/70 px-2 py-0.5 rounded-full">
              {kras.length} Goal{kras.length === 1 ? '' : 's'} Assigned
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active deliverables, target rubrics and latest evaluation ratings
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Total Weight: <strong className="font-semibold text-slate-900 dark:text-white">{totalWeight}%</strong>
          </span>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('portal', { subTab: 'kras' })}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View Full Workspace</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {kras.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
          No KRAs are assigned to you yet. Ask HR to assign a KRA scorecard.
        </p>
      ) : (
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 pr-3 font-semibold w-8">#</th>
                <th className="py-2 pr-3 font-semibold">Objective & Deliverable</th>
                <th className="py-2 pr-3 font-semibold w-32">Weight</th>
                <th className="py-2 font-semibold text-right w-28">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {kras.map((kra, i) => (
                <tr key={`${kra.title}-${i}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 pr-2 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                  <td className="py-2.5 pr-3">
                    <span className="text-slate-800 dark:text-slate-100 font-medium block">
                      {kra.title}
                    </span>
                    {kra.description && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 line-clamp-1">
                        {kra.description}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(kra.weight, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-700 dark:text-slate-200 font-medium">{kra.weight}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    {kra.lastRating ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        {kra.lastRating.toFixed(1)} / 5.0
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

// Chart geometry (SVG user units).
const W = 320;
const H = 150;
const PAD = { left: 28, right: 12, top: 12, bottom: 26 };
const Y_TICKS = [1, 2, 3, 4, 5];
const EXCEEDS_THRESHOLD = 3.8;

export const ScoreTrend: React.FC<{ history: DashboardMyReview['scoreHistory']; className?: string }> = ({ history, className }) => {
  const x = (i: number) => PAD.left + (history.length === 1 ? (W - PAD.left - PAD.right) / 2 : (i * (W - PAD.left - PAD.right)) / (history.length - 1));
  const y = (v: number) => PAD.top + ((5 - v) * (H - PAD.top - PAD.bottom)) / 4;
  const path = history.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.score)}`).join(' ');
  const last = history[history.length - 1];

  return (
    <section className={cn(CARD, 'flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quarterly score</h2>
        <span className="text-xs text-slate-400">Evaluated quarters</span>
      </div>
      {history.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Your score appears here once a quarter has been evaluated.</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{last.score.toFixed(2)}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{last.periodName}</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Quarterly score trend">
            {Y_TICKS.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{t}</text>
              </g>
            ))}
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(EXCEEDS_THRESHOLD)}
              y2={y(EXCEEDS_THRESHOLD)}
              className="stroke-emerald-500"
              strokeDasharray="4 3"
              strokeWidth={1}
            />
            {history.length > 1 && <path d={path} fill="none" className="stroke-indigo-500" strokeWidth={2} />}
            {history.map((p, i) => (
              <circle
                key={`${p.periodName}-${i}`}
                cx={x(i)}
                cy={y(p.score)}
                r={i === history.length - 1 ? 4.5 : 3}
                className={i === history.length - 1 ? 'fill-indigo-500 stroke-indigo-500' : 'fill-white dark:fill-slate-900 stroke-indigo-500'}
                strokeWidth={2}
              >
                <title>{`${p.periodName}: ${p.score.toFixed(2)}`}</title>
              </circle>
            ))}
            {history.map((p, i) => {
              // Keep the outermost labels inside the frame.
              const anchor = history.length > 1 && i === 0 ? 'start' : history.length > 1 && i === history.length - 1 ? 'end' : 'middle';
              const labelX = anchor === 'start' ? x(i) - 4 : anchor === 'end' ? x(i) + 4 : x(i);
              return (
                <text key={`l-${p.periodName}-${i}`} x={labelX} y={H - 8} textAnchor={anchor} className="fill-slate-400 text-[10px]">
                  {p.periodName.replace(/\s*\(.*\)$/, '')}
                </text>
              );
            })}
          </svg>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="w-4 border-t border-dashed border-emerald-500" />
            Exceeds expectations band starts at {EXCEEDS_THRESHOLD}
          </p>
        </>
      )}
    </section>
  );
};

/* =========================================================================
   Employee Quick Actions
   ========================================================================= */
export const EmployeeQuickActions: React.FC<{
  onNavigate: (view: any, params?: any) => void;
  className?: string;
}> = ({ onNavigate, className }) => {
  return (
    <section className={cn(CARD, 'flex flex-col gap-3 min-w-0', className)}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <button
          type="button"
          onClick={() => onNavigate('portal', { subTab: 'reviews', openSelfAssess: true })}
          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400">Quarterly</span>
            <span className="text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-xs">→</span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">Self-Assessment</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Submit your evaluation</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('portal', { subTab: 'appraisal', openLetter: true })}
          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Letters</span>
            <span className="text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-xs">→</span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">Appraisal Letter</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">View signed letter</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('portal', { subTab: 'kras' })}
          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-semibold text-sky-600 dark:text-sky-400">Goals</span>
            <span className="text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 text-xs">→</span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">KRA Objectives</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Review targets & weight</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reviews')}
          className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">Timeline</span>
            <span className="text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 text-xs">→</span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">Review History</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Track past cycles</span>
          </div>
        </button>
      </div>
    </section>
  );
};

/* =========================================================================
   Employee Growth & Appraisal Readiness Guide
   ========================================================================= */
export const EmployeeGrowthGuideCard: React.FC<{
  me: DashboardMyReview;
  className?: string;
}> = ({ me, className }) => {
  const current = me.currentReview;
  const isPendingSelf = current && !current.isSelfSubmitted && current.stage === 'MANAGER';

  return (
    <section className={cn(CARD, 'flex flex-col gap-3 min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Appraisal Readiness & Tips</h2>
        <span className="text-xs font-medium text-slate-400">{me.employee.cycleName || 'Quarterly Cycle'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs flex-1">
        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block mb-1">
            Self-Assessment
          </span>
          <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
            {isPendingSelf
              ? 'Your self-evaluation is open. Quantify your accomplishments and reference specific metrics for each KRA.'
              : 'Self-assessment is locked or submitted for this cycle. Your manager evaluation is in progress.'}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block mb-1">
            Rolling Performance
          </span>
          <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
            {me.evaluatedQuarters > 0
              ? `Your rolling average score is ${me.rollingScore.toFixed(2)} / 5 based on ${me.evaluatedQuarters} evaluated quarter${me.evaluatedQuarters === 1 ? '' : 's'}.`
              : 'Rolling score will be computed once your first quarterly evaluation is finalized by HR.'}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide block mb-1">
            Annual Increment Cycle
          </span>
          <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
            {me.nextAppraisal
              ? `Your annual appraisal window is scheduled for Month ${me.nextAppraisal.month}, ${me.nextAppraisal.year} under ${me.nextAppraisal.cycleName || 'your cycle'}.`
              : 'Annual appraisal cycle is mapped to your department hiring anniversary.'}
          </p>
        </div>
      </div>
    </section>
  );
};


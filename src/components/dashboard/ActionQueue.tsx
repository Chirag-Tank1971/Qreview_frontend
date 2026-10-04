import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import type { DashboardTask, DashboardTaskLink, DashboardTaskType, DashboardUrgency } from '../../types';
import { cn } from '../../utils/cn';
import { dueLabel } from './format';
import { api } from '../../services/api';

const ACTION_LABELS: Record<DashboardTaskType, string> = {
  SELF_ASSESSMENT: 'Start',
  ACKNOWLEDGE_APPRAISAL: 'View letter',
  ACKNOWLEDGE_PIP: 'Review plan',
  SCORE_REVIEW: 'Score',
  HOD_SCORE_REVIEW: 'Score',
  HR_FINALIZE_REVIEW: 'Finalize',
  REVISE_RETURNED_REVIEW: 'Revise',
  RECOMMEND_INCREMENT: 'Recommend',
  CALIBRATE_APPRAISAL: 'Calibrate',
  ASSIGN_KRAS: 'Assign KRAs',
  REVIEW_WORKFLOW: 'Review',
  PIP_CHECKIN: 'Log check-in',
  NOTIFICATION: 'View',
};

// Batches of this many identical "score" tasks collapse into one expandable row.
const GROUP_THRESHOLD = 3;

type Filter = 'ALL' | 'OVERDUE' | 'DUE_SOON';

type QueueRow =
  | { kind: 'task'; task: DashboardTask }
  | { kind: 'group'; key: string; tasks: DashboardTask[] };

function groupRows(tasks: DashboardTask[]): QueueRow[] {
  const scoreBuckets = new Map<string, DashboardTask[]>();
  for (const task of tasks) {
    if (task.type !== 'SCORE_REVIEW') continue;
    const key = `${task.urgency}|${task.dueDate || ''}`;
    scoreBuckets.set(key, [...(scoreBuckets.get(key) || []), task]);
  }

  const rows: QueueRow[] = [];
  const emitted = new Set<string>();
  for (const task of tasks) {
    const key = `${task.urgency}|${task.dueDate || ''}`;
    const bucket = task.type === 'SCORE_REVIEW' ? scoreBuckets.get(key) : undefined;
    if (bucket && bucket.length > GROUP_THRESHOLD) {
      if (!emitted.has(key)) {
        emitted.add(key);
        rows.push({ kind: 'group', key, tasks: bucket });
      }
    } else {
      rows.push({ kind: 'task', task });
    }
  }
  return rows;
}

interface TaskRowProps {
  task: DashboardTask;
  onOpen: (link: DashboardTaskLink) => void;
  nested?: boolean;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onOpen, nested }) => {
  const isHigh = task.priority === 'High' || task.urgency === 'OVERDUE';
  const isMed = task.priority === 'Medium' || task.urgency === 'DUE_SOON';

  const stripeColor = isHigh
    ? 'bg-rose-500'
    : isMed
    ? 'bg-amber-500'
    : 'bg-slate-300 dark:bg-slate-600';

  const badgeText = task.dueText
    ? `${task.priority || (isHigh ? 'High' : isMed ? 'Medium' : 'Low')} · ${task.dueText}`
    : dueLabel(task.urgency, task.dueDate);

  const badgeStyle = isHigh
    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
    : isMed
    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

  const actionBtnStyle = isHigh
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
    : isMed
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700';

  const handleAction = () => {
    if (task.notificationId) {
      api.markNotificationRead(task.notificationId).catch(() => {});
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      }
    }
    onOpen(task.link);
  };

  return (
    <li
      className={cn(
        'grid grid-cols-[3px_minmax(0,1fr)] sm:grid-cols-[3px_minmax(0,1fr)_auto] gap-x-2.5 gap-y-2 py-2.5 items-center',
        nested && 'pl-3'
      )}
    >
      <span className={cn('rounded-full self-stretch my-0.5', stripeColor)} />
      <div className="min-w-0 pr-2">
        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
          {task.title}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug truncate">
          {task.detail}
        </p>
      </div>
      <div className="col-start-2 sm:col-start-3 flex items-center gap-2.5 justify-between sm:justify-end mr-2">
        {badgeText && (
          <span
            className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap tabular-nums',
              badgeStyle
            )}
          >
            {badgeText}
          </span>
        )}
        <button
          type="button"
          onClick={handleAction}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap',
            actionBtnStyle
          )}
        >
          {ACTION_LABELS[task.type] || 'Action'}
        </button>
      </div>
    </li>
  );
};

interface ActionQueueProps {
  tasks: DashboardTask[];
  nextDeadline?: { label: string; date: string };
  onOpen: (link: DashboardTaskLink) => void;
  className?: string;
  hideHeaderTitle?: boolean;
}

export const ActionQueue: React.FC<ActionQueueProps> = ({
  tasks,
  nextDeadline,
  onOpen,
  className,
  hideHeaderTitle,
}) => {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const counts = useMemo(
    () => ({
      ALL: tasks.length,
      OVERDUE: tasks.filter((t) => t.urgency === 'OVERDUE' || t.priority === 'High').length,
      DUE_SOON: tasks.filter((t) => t.urgency === 'DUE_SOON' || t.priority === 'Medium').length,
    }),
    [tasks]
  );

  const rows = useMemo(() => {
    let filtered = tasks;
    if (filter === 'OVERDUE') {
      filtered = tasks.filter((t) => t.urgency === 'OVERDUE' || t.priority === 'High');
    } else if (filter === 'DUE_SOON') {
      filtered = tasks.filter((t) => t.urgency === 'DUE_SOON' || t.priority === 'Medium');
    }
    return groupRows(filtered);
  }, [tasks, filter]);

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const filters: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'OVERDUE', label: 'Overdue' },
    { id: 'DUE_SOON', label: 'Due soon' },
  ];

  return (
    <section
      className={cn(
        'bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs h-full flex flex-col justify-between min-w-0',
        className
      )}
    >
      <div>
        <div className={cn(
          'flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2',
          !hideHeaderTitle && 'border-b border-slate-100 dark:border-slate-800'
        )}>
          {!hideHeaderTitle ? (
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Needs your action</span>
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-[11px] font-bold inline-flex items-center justify-center">
                  {tasks.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => onOpen({ view: 'notifications' })}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5 ml-1"
                title="Open Notifications Center"
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">
              Tasks requiring action ({rows.length})
            </span>
          )}
          {tasks.length > 0 && (
            <div className="flex gap-1" role="group" aria-label="Filter tasks">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full transition-colors cursor-pointer tabular-nums',
                    filter === f.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {f.label} {counts[f.id]}
                </button>
              ))}
            </div>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8 gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">You're all caught up</p>
            {nextDeadline && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Next deadline: {nextDeadline.label} on {nextDeadline.date}
              </p>
            )}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">Nothing in this filter.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[220px] overflow-y-auto pr-4">
            {rows.map((row) => {
              if (row.kind === 'task') return <TaskRow key={row.task.id} task={row.task} onOpen={onOpen} />;
              const first = row.tasks[0];
              const isOpen = openGroups.has(row.key);
              const due = dueLabel(first.urgency, first.dueDate);
              return (
                <li key={row.key} className="py-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(row.key)}
                    aria-expanded={isOpen}
                    className="w-full grid grid-cols-[3px_minmax(0,1fr)_auto] gap-2.5 py-1.5 text-left cursor-pointer"
                  >
                    <span className="rounded-full self-stretch bg-indigo-500 my-0.5" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        Score {row.tasks.length} reviews
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {row.tasks.map((t) => t.employeeName).join(', ')}
                      </span>
                    </span>
                    {due && (
                      <span className="self-center text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                        {due}
                      </span>
                    )}
                  </button>
                  {isOpen && (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {row.tasks.map((t) => (
                        <TaskRow key={t.id} task={t} onOpen={onOpen} nested />
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>{counts.ALL} items queued</span>
        <button
          type="button"
          onClick={() => onOpen({ view: 'notifications' })}
          className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
        >
          Notifications center →
        </button>
      </div>
    </section>
  );
};

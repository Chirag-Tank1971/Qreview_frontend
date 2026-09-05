import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Employee,
  Appraisal,
  EmployeeReview,
} from '../types';
import { api } from '../services/api';
import {
  Zap,
  CheckCircle2,
  Clock,
  Award,
  FileText,
  Star,
  ChevronRight,
  RefreshCw,
  Scale,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ActionItem {
  id: string;
  type: 'LETTER_SIGN' | 'SELF_ASSESSMENT' | 'MANAGER_SCORING' | 'HOD_CALIBRATE' | 'HR_APPROVE' | 'GENERAL';
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeColor: string;
  actionButtonLabel: string;
  onAction: () => void;
  urgency: 'HIGH' | 'MEDIUM' | 'NORMAL';
}

interface ActionCenterInboxProps {
  currentUser: User | null;
  currentEmployee: Employee | null;
  activeAppraisal?: Appraisal | null;
  reviews?: EmployeeReview[];
  onOpenSelfAssessment: (review: EmployeeReview) => void;
  onOpenAppraisalLetter: (appraisal: Appraisal) => void;
  onNavigateToReviews: (options?: any) => void;
  onNavigateToAppraisals: (options?: any) => void;
  onRefreshData?: () => void;
}

export const ActionCenterInbox: React.FC<ActionCenterInboxProps> = ({
  currentUser,
  currentEmployee,
  activeAppraisal,
  reviews = [],
  onOpenSelfAssessment,
  onOpenAppraisalLetter,
  onNavigateToReviews,
  onNavigateToAppraisals,
  onRefreshData,
}) => {
  const [teamActions, setTeamActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Fetch pending manager / leadership actions
  const fetchLeadershipActions = useCallback(async () => {
    if (!currentUser) return;
    const isLeadership = ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD', 'MANAGEMENT'].includes(currentUser.role);
    if (!isLeadership) return;

    try {
      setLoading(true);
      const items: ActionItem[] = [];

      // Execute all 3 leadership queries concurrently in parallel
      const [allReviews, pendingCalibrations, pendingHr] = await Promise.all([
        ['SUPER_ADMIN', 'HR', 'MANAGER', 'HOD'].includes(currentUser.role)
          ? api.getReviews({ status: 'MANAGER_PENDING' }).catch(() => [])
          : Promise.resolve([]),
        ['SUPER_ADMIN', 'HOD'].includes(currentUser.role)
          ? api.getAppraisals({ status: 'MANAGER_RECOMMENDED' }).catch(() => [])
          : Promise.resolve([]),
        ['SUPER_ADMIN', 'HR'].includes(currentUser.role)
          ? api.getAppraisals({ status: 'HOD_CALIBRATED' }).catch(() => [])
          : Promise.resolve([]),
      ]);

      // 1. Manager Pending Reviews (Team direct reports)
      if (Array.isArray(allReviews) && allReviews.length > 0) {
        const myPending = currentUser.role === 'MANAGER' && currentUser.employeeId
          ? allReviews.filter((r) => r.managerId === currentUser.employeeId || r.managerId === currentUser.id)
          : allReviews.slice(0, 8);

        myPending.forEach((r) => {
          items.push({
            id: `rev_score_${r.id}`,
            type: 'MANAGER_SCORING',
            title: `Score Review: ${r.employeeName}`,
            subtitle: `${r.reviewPeriodName || 'Quarterly Review'} • Awaiting your ratings & feedback`,
            badgeLabel: 'Scoring Pending',
            badgeColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
            actionButtonLabel: 'Score Review',
            urgency: 'HIGH',
            onAction: () => onNavigateToReviews({ reviewId: r.id }),
          });
        });
      }

      // 2. HOD Calibrations Pending
      if (Array.isArray(pendingCalibrations) && pendingCalibrations.length > 0) {
        const hodItems = currentUser.role === 'HOD' && currentEmployee?.departmentId
          ? pendingCalibrations.filter((a) => a.departmentId === currentEmployee.departmentId)
          : pendingCalibrations.slice(0, 5);

        hodItems.forEach((a) => {
          items.push({
            id: `app_calib_${a.id}`,
            type: 'HOD_CALIBRATE',
            title: `Calibrate: ${a.employeeName}`,
            subtitle: `${a.cycleName || 'Annual Cycle'} • Recommended by manager, awaiting your calibration`,
            badgeLabel: 'Calibration Due',
            badgeColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            actionButtonLabel: 'Calibrate',
            urgency: 'MEDIUM',
            onAction: () => onNavigateToAppraisals({ appraisalId: a.id, openDetail: true }),
          });
        });
      }

      // 3. HR Final Approvals Pending
      if (Array.isArray(pendingHr) && pendingHr.length > 0) {
        pendingHr.slice(0, 5).forEach((a) => {
          items.push({
            id: `app_hr_${a.id}`,
            type: 'HR_APPROVE',
            title: `Approve: ${a.employeeName}`,
            subtitle: `${a.cycleName || 'Annual Cycle'} • Calibrated by HOD, awaiting final HR sign-off`,
            badgeLabel: 'HR Approval Due',
            badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            actionButtonLabel: 'Review & Approve',
            urgency: 'MEDIUM',
            onAction: () => onNavigateToAppraisals({ appraisalId: a.id, openDetail: true }),
          });
        });
      }

      setTeamActions(items);
    } catch (err) {
      console.warn('Failed to fetch action center leadership items:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentEmployee, onNavigateToReviews, onNavigateToAppraisals]);

  useEffect(() => {
    fetchLeadershipActions();
  }, [fetchLeadershipActions]);

  // Aggregate Personal Tasks from current employee state
  const personalActions: ActionItem[] = [];

  // A. Digital Signature Required on Appraisal Letter
  if (activeAppraisal && activeAppraisal.isLocked && !activeAppraisal.employeeAcknowledgement?.acknowledged) {
    personalActions.push({
      id: `app_sign_${activeAppraisal.id}`,
      type: 'LETTER_SIGN',
      title: 'Sign Annual Appraisal Letter',
      subtitle: `${activeAppraisal.cycleName || 'Annual Appraisal'} (${activeAppraisal.appraisalYear}) letter is finalized and waiting for your signature.`,
      badgeLabel: 'Signature Required',
      badgeColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      actionButtonLabel: 'Review & Sign Letter',
      urgency: 'HIGH',
      onAction: () => onOpenAppraisalLetter(activeAppraisal),
    });
  }

  // B. Quarterly Self-Assessment Pending
  const pendingSelfReview = (reviews as EmployeeReview[]).find(
    (r: EmployeeReview) => (r.status === 'ASSIGNED' || !r.selfSubmittedAt) && r.status !== 'CLOSED' && r.status !== 'HR_COMPLETED'
  );
  if (pendingSelfReview) {
    personalActions.push({
      id: `self_rev_${pendingSelfReview.id}`,
      type: 'SELF_ASSESSMENT',
      title: `Complete Self-Review: ${pendingSelfReview.reviewPeriodName}`,
      subtitle: 'Submit your quarterly self-assessment ratings and achievements for your manager.',
      badgeLabel: 'Self-Review Due',
      badgeColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      actionButtonLabel: 'Start Self-Review',
      urgency: 'HIGH',
      onAction: () => onOpenSelfAssessment(pendingSelfReview),
    });
  }

  // Combine personal and team actions
  const allActions = [...personalActions, ...teamActions];

  const getActionIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'LETTER_SIGN':
        return <Award className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'SELF_ASSESSMENT':
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'MANAGER_SCORING':
        return <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'HOD_CALIBRATE':
        return <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'HR_APPROVE':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  // Zero State: All caught up
  if (allActions.length === 0) {
    return (
      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
              <span>All caught up!</span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                0 Pending Tasks
              </span>
            </h4>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 mt-0.5">
              You have no pending self-reviews, manager evaluations, or appraisal signatures requiring action.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchLeadershipActions();
            onRefreshData?.();
          }}
          title="Check for new tasks"
          className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/5 via-indigo-500/5 to-violet-500/5 dark:from-amber-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border border-indigo-200/90 dark:border-indigo-900/50 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Needs Your Attention
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {allActions.length} Pending
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Action items and review approvals waiting on you
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              fetchLeadershipActions();
              onRefreshData?.();
            }}
            title="Refresh action tasks"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <span>{isCollapsed ? 'Show' : 'Minimize'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Action Cards Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allActions.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {getActionIcon(item.type)}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badgeLabel}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1 line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <button
                onClick={item.onAction}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <span>{item.actionButtonLabel}</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

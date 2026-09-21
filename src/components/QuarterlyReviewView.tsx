import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  EmployeeReview,
  ReviewPeriod,
  ReviewSummaryStats,
  Department,
  Cycle,
  Employee,
  User,
  ReviewStatus,
  EmployeeStatus,
} from '../types';
import { api } from '../services/api';
import { ReviewScoringModal } from './ReviewScoringModal';
import { BatchGenerateReviewsModal } from './BatchGenerateReviewsModal';
import { InitiateReviewModal } from './InitiateReviewModal';
import { CycleBadge } from './ui/CycleBadge';
import { PageSkeletonLoader } from './ui/PageSkeletonLoader';
import { toast } from '../context/ToastContext';
import {
  Sparkles,
  Search,
  Filter,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCw,
  Building2,
  Layers,
  ArrowUpDown,
  Download,
  FileCheck,
  AlertCircle,
  Eye,
  Edit3,
  Lock,
  ChevronRight,
  TrendingUp,
  BarChart3,
  UserCheck,
  LayoutGrid,
  List,
  Settings2,
  ShieldAlert,
  Play,
  AlertTriangle,
} from 'lucide-react';

export interface ReviewViewConfig {
  status?: string;
  periodId?: string;
  departmentId?: string;
  cycleId?: string;
  reviewId?: string;
  myReportsOnly?: boolean;
}

interface QuarterlyReviewViewProps {
  currentUser: User | null;
  departments: Department[];
  cycles: Cycle[];
  employees: Employee[];
  initialConfig?: ReviewViewConfig | null;
  onClearInitialConfig?: () => void;
}

export const QuarterlyReviewView: React.FC<QuarterlyReviewViewProps> = ({
  currentUser,
  departments,
  cycles,
  employees,
  initialConfig,
  onClearInitialConfig,
}) => {
  const [reviews, setReviews] = useState<EmployeeReview[]>([]);
  const [periods, setPeriods] = useState<ReviewPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [stats, setStats] = useState<ReviewSummaryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>(currentUser?.role === 'HOD' ? 'HOD_PENDING' : 'ALL');
  const [appraisalDueOnly, setAppraisalDueOnly] = useState<boolean>(false);
  const [myReportsOnly, setMyReportsOnly] = useState<boolean>(false);
  const [hideInactive, setHideInactive] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Modals
  const [activeReviewForScoring, setActiveReviewForScoring] = useState<EmployeeReview | null>(null);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState<boolean>(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState<boolean>(false);
  const [updatingPeriodId, setUpdatingPeriodId] = useState<string | null>(null);
  const handledReviewIdRef = useRef<string | null>(null);
  const openedViaDirectActionRef = useRef<boolean>(false);

  // Synchronize initialConfig
  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.reviewId) {
        // When navigating directly to a specific employee review, open the modal
        // but DO NOT restrict the underlying table to a single status filter,
        // so the full cohort remains accessible when the modal closes.
        openedViaDirectActionRef.current = true;
        setFilterStatus('ALL');
        setFilterDepartmentId('ALL');
        setSearchQuery('');
        setAppraisalDueOnly(false);
        setMyReportsOnly(false);
      } else if (initialConfig.status) {
        let normalized = initialConfig.status;
        if (normalized === 'SELF_ASSESSED') normalized = 'MANAGER_PENDING';
        const validStatuses = ['ALL', 'MANAGER_PENDING', 'MANAGER_COMPLETED', 'HOD_PENDING', 'HR_PENDING', 'HR_COMPLETED', 'CLOSED', 'RETURNED', 'ASSIGNED', 'DRAFT'];
        if (!validStatuses.includes(normalized)) normalized = 'ALL';
        setFilterStatus(normalized);
      }

      if (initialConfig.periodId) setSelectedPeriodId(initialConfig.periodId);
      if (!initialConfig.reviewId && initialConfig.departmentId) setFilterDepartmentId(initialConfig.departmentId);
      if (!initialConfig.reviewId && initialConfig.myReportsOnly !== undefined) setMyReportsOnly(initialConfig.myReportsOnly);

      if (initialConfig.reviewId && initialConfig.reviewId !== handledReviewIdRef.current) {
        handledReviewIdRef.current = initialConfig.reviewId;
        const targetId = initialConfig.reviewId;
        (async () => {
          try {
            const single = await api.getReviewById(targetId);
            if (single) {
              setActiveReviewForScoring(single);
              setIsScoringModalOpen(true);
              return;
            }
          } catch {
            // Fallback to search in all reviews
          }
          try {
            const res = await api.getReviews();
            const match = res?.find((r) => r.id === targetId);
            if (match) {
              setActiveReviewForScoring(match);
              setIsScoringModalOpen(true);
            }
          } catch (err) {
            console.warn('Could not auto-open review', err);
          }
        })();
      }
      onClearInitialConfig?.();
    }
  }, [initialConfig, onClearInitialConfig]);

  const isSuperAdminOrHr = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HR';

  // Load Review Periods on Mount or when currentUser changes
  useEffect(() => {
    loadReviewPeriods();
  }, [currentUser]);

  const loadReviewPeriods = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getReviewPeriods();
      const periodList = data || [];
      setPeriods(periodList);
      if (periodList.length > 0) {
        // If current selectedPeriodId exists in new list, retain it; otherwise select active or first
        const validExisting = periodList.find((p) => p.id === selectedPeriodId);
        if (validExisting) {
          loadReviewsAndStats(selectedPeriodId);
        } else {
          const active = periodList.find((p) => p.status === 'ACTIVE');
          const fallback = active ? active.id : periodList[0].id;
          setSelectedPeriodId(fallback);
          loadReviewsAndStats(fallback);
        }
      } else {
        setReviews([]);
        setStats(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to load review periods:', err);
      setErrorMessage(err.message || 'Failed to load review periods. Please retry.');
      setLoading(false);
    }
  };

  // Load Reviews and Stats whenever period or filters change
  useEffect(() => {
    if (selectedPeriodId) {
      loadReviewsAndStats(selectedPeriodId);
    }
  }, [selectedPeriodId, filterDepartmentId, filterStatus, myReportsOnly]);

  const loadReviewsAndStats = async (periodIdToFetch?: string) => {
    const targetPeriodId = periodIdToFetch || selectedPeriodId;
    if (!targetPeriodId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const [reviewsData, statsData] = await Promise.all([
        api.getReviews({
          periodId: targetPeriodId,
          departmentId: filterDepartmentId !== 'ALL' ? filterDepartmentId : undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
          onlyMine: myReportsOnly,
        }),
        api.getReviewStats({
          periodId: targetPeriodId,
          departmentId: filterDepartmentId !== 'ALL' ? filterDepartmentId : undefined,
        }),
      ]);

      setReviews(reviewsData || []);
      setStats(statsData || null);
    } catch (err: any) {
      console.error('Failed to load review cohort:', err);
      setErrorMessage(err.message || 'Failed to load review records.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered reviews in memory for search & appraisal due toggle
  const displayedReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (hideInactive && r.employeeStatus === 'INACTIVE') return false;
      if (appraisalDueOnly && !r.isAppraisalMonthDue) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.employeeName.toLowerCase().includes(q);
        const matchesCode = r.employeeCode.toLowerCase().includes(q);
        const matchesDept = r.departmentName.toLowerCase().includes(q);
        const matchesDesig = r.designationName.toLowerCase().includes(q);
        const matchesMgr = r.managerName.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept && !matchesDesig && !matchesMgr) return false;
      }
      return true;
    });
  }, [reviews, searchQuery, appraisalDueOnly, hideInactive]);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const handleOpenScoring = async (review: EmployeeReview) => {
    setActiveReviewForScoring(review);
    setIsScoringModalOpen(true);
    try {
      const fresh = await api.getReviewById(review.id);
      if (fresh) {
        setActiveReviewForScoring(fresh);
      }
    } catch {
      // quiet fallback to review passed in
    }
  };

  const handleUpdatePeriodStatus = async (periodId: string, newStatus: 'ACTIVE' | 'LOCKED' | 'UPCOMING') => {
    setUpdatingPeriodId(periodId);
    try {
      await api.updateReviewPeriod(periodId, { status: newStatus });
      toast.success(`Period status updated to ${newStatus}`);
      await loadReviewPeriods();
    } catch (err: any) {
      console.error('Failed to update period status:', err);
      toast.error(err.message || 'Failed to update period status');
    } finally {
      setUpdatingPeriodId(null);
    }
  };

  const handleModalClose = () => {
    setIsScoringModalOpen(false);
    setActiveReviewForScoring(null);
    handledReviewIdRef.current = null;
    if (openedViaDirectActionRef.current) {
      openedViaDirectActionRef.current = false;
      setFilterStatus('ALL');
      setFilterDepartmentId('ALL');
      setSearchQuery('');
    }
    onClearInitialConfig?.();
    loadReviewsAndStats();
  };

  const handleModalSaved = () => {
    setIsScoringModalOpen(false);
    setActiveReviewForScoring(null);
    handledReviewIdRef.current = null;
    if (openedViaDirectActionRef.current) {
      openedViaDirectActionRef.current = false;
      setFilterStatus('ALL');
      setFilterDepartmentId('ALL');
      setSearchQuery('');
    }
    onClearInitialConfig?.();
    loadReviewsAndStats();
  };

  const handleExportCSV = () => {
    if (reviews.length === 0) return;
    const headers = [
      'Review ID',
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      'Cycle',
      'Appraisal Due',
      'Manager',
      'Final Score',
      'Status',
      'Last Updated',
    ];

    const rows = reviews.map((r) => [
      r.id,
      r.employeeCode,
      `"${r.employeeName}"`,
      `"${r.departmentName}"`,
      `"${r.designationName}"`,
      r.cycleCode,
      r.isAppraisalMonthDue ? 'YES' : 'NO',
      `"${r.managerName}"`,
      r.finalScore || 0,
      r.status,
      new Date(r.updatedAt || r.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quarterly_Reviews_${selectedPeriod?.name || 'Cohort'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${reviews.length} reviews to CSV.`, 'Export Complete');
  };

  // Helper for status badge styling
  const getStatusBadge = (status: ReviewStatus, managerName?: string, hodId?: string) => {
    switch (status) {
      case 'DRAFT':
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Draft</span>
          </span>
        );
      case 'MANAGER_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Manager Pending</span>
          </span>
        );
      case 'MANAGER_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Mgr Submitted</span>
          </span>
        );
      case 'HOD_PENDING':
        if (!hodId) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60 w-max">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>No HOD Assigned</span>
              </span>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span>HOD Pending</span>
          </span>
        );
      case 'HR_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>HR Review</span>
          </span>
        );
      case 'HR_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>HR Approved</span>
          </span>
        );
      case 'RETURNED':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 w-max">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Returned</span>
            </span>
            {managerName && <span className="text-[9px] text-slate-400 font-medium px-1">to {managerName.split(' ')[0]}</span>}
          </div>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Closed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  // Helper for employee employment status badge
  const getEmployeeStatusBadge = (empStatus?: EmployeeStatus) => {
    if (!empStatus || empStatus === 'ACTIVE') return null;
    switch (empStatus) {
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Inactive</span>
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Notice</span>
          </span>
        );
      case 'PROBATION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Probation</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Helper for score badge
  const getScoreBadge = (score?: number) => {
    if (!score || score === 0) {
      return <span className="text-xs text-slate-400 font-medium">Pending</span>;
    }
    let color: string;
    if (score >= 4.5) color = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    else if (score >= 3.5) color = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
    else if (score >= 2.5) color = 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
    else color = 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';

    return (
      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${color}`}>
        {score.toFixed(2)} / 5.0
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3.5 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => loadReviewPeriods()}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. NATIVE PAGE HEADER: TITLE, PERIOD SELECTOR & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              {currentUser?.role === 'EMPLOYEE' ? 'My Performance Reviews' : 'Team Reviews'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Quarterly Cadence
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Goal assessment, manager evaluation scoring, and rolling appraisal calibration.
          </p>
        </div>

        {/* PERIOD SELECTOR & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Period Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              disabled={periods.length === 0}
              aria-label="Select quarterly review period"
              className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-0 focus:ring-0 focus:outline-none cursor-pointer pr-1 disabled:opacity-50"
            >
              {periods.length === 0 ? (
                <option value="">No Active Periods</option>
              ) : (
                periods.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {p.name} {p.status === 'ACTIVE' ? '• Active' : `(${p.status})`}
                  </option>
                ))
              )}
            </select>
            {selectedPeriod && (
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                selectedPeriod.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}>
                {selectedPeriod.status}
              </span>
            )}
          </div>

          <button
            onClick={() => loadReviewPeriods()}
            title="Refresh review records"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={reviews.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>

          {isSuperAdminOrHr && (
            <>
              <button
                onClick={() => setIsPeriodModalOpen(true)}
                title="Manage Review Period Lifecycles"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Periods</span>
              </button>

              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>Initiate Batch</span>
              </button>

              <button
                onClick={() => setIsInitiateModalOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Initiate single employee review with tenure check and manual override"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-200" />
                <span>Initiate Review</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. STATS & ANALYTICS CARDS */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Cohort Reviews */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-indigo-500 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Cohort Reviews</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{stats.total}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">records</span>
            </div>
            <div className="mt-2 flex items-center text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
              <span className="text-amber-700 dark:text-amber-400 font-medium">{stats.managerPending} pending mgr</span>
              <span>•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{stats.closed} closed</span>
            </div>
          </div>

          {/* Card 2: Evaluation Progress */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-sky-500 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Manager Completion</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{stats.completionRate}%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">completed</span>
            </div>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          {/* Card 3: Average Cohort Score */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-emerald-500 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Avg Weighted Score</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {stats.averageScore > 0 ? stats.averageScore.toFixed(2) : '—'}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">/ 5.00</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {stats.distribution.outstanding} Outstanding • {stats.distribution.exceeds} Exceeds
            </div>
          </div>

          {/* Card 4: Appraisal Triggers */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-amber-500 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Appraisal Month Due</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {reviews.filter((r) => r.isAppraisalMonthDue).length}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">cohort employees</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Annual cycle appraisal calibration active
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTERS & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* SEARCH */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name, code, designation, manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
          </div>

          {/* DEPARTMENT FILTER */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dept:</span>
            <select
              value={filterDepartmentId}
              onChange={(e) => setFilterDepartmentId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:border-indigo-500"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS FILTER */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:border-indigo-500"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Statuses</option>
              <option value="MANAGER_PENDING" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Manager Pending</option>
              <option value="MANAGER_COMPLETED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Manager Completed</option>
              <option value="HOD_PENDING" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">HOD Pending</option>
              <option value="HR_PENDING" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">HR Pending</option>
              <option value="HR_COMPLETED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">HR Completed</option>
              <option value="ASSIGNED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Assigned</option>
              <option value="RETURNED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Returned</option>
              <option value="CLOSED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Closed & Locked</option>
              <option value="DRAFT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Draft</option>
            </select>
          </div>

          {/* QUICK TOGGLES */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAppraisalDueOnly(!appraisalDueOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
                appraisalDueOnly
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Appraisal Due Only</span>
            </button>

            {currentUser?.role === 'MANAGER' && (
              <button
                onClick={() => setMyReportsOnly(!myReportsOnly)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  myReportsOnly
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                My Direct Reports
              </button>
            )}

            <button
              onClick={() => setHideInactive(!hideInactive)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
                hideInactive
                  ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="Filter out inactive or offboarded employees"
            >
              <span>Hide Inactive</span>
            </button>
          </div>
        </div>

        {/* RESULTS COUNT & VIEW TOGGLE */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{displayedReviews.length}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{reviews.length}</strong> reviews
            </span>
            {(filterStatus !== 'ALL' || filterDepartmentId !== 'ALL' || appraisalDueOnly || searchQuery.trim() || myReportsOnly || hideInactive) && (
              <button
                onClick={() => {
                  setFilterStatus('ALL');
                  setFilterDepartmentId('ALL');
                  setAppraisalDueOnly(false);
                  setMyReportsOnly(false);
                  setHideInactive(false);
                  setSearchQuery('');
                }}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
            {appraisalDueOnly && (
              <span className="text-amber-700 dark:text-amber-400 font-medium ml-2">Filtering for Cycle appraisal due cohort</span>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. REVIEWS DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading && reviews.length === 0 ? (
          <div className="p-4">
            <PageSkeletonLoader variant="table" rowCount={6} />
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center space-y-3">
            <FileCheck className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">No quarterly reviews found</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {filterStatus !== 'ALL' || filterDepartmentId !== 'ALL' || appraisalDueOnly || searchQuery.trim() || myReportsOnly || hideInactive
                ? 'No review sheets match your current search or filters for this period.'
                : 'No review sheets exist for this period. Initiate a new batch for this period to generate reviews.'}
            </p>
            {(filterStatus !== 'ALL' || filterDepartmentId !== 'ALL' || appraisalDueOnly || searchQuery.trim() || myReportsOnly || hideInactive) && (
              <button
                onClick={() => {
                  setFilterStatus('ALL');
                  setFilterDepartmentId('ALL');
                  setAppraisalDueOnly(false);
                  setMyReportsOnly(false);
                  setHideInactive(false);
                  setSearchQuery('');
                }}
                className="mt-1 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
            {isSuperAdminOrHr && !searchQuery && filterStatus === 'ALL' && (
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
              >
                Generate Reviews Now
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-950/40">
            {displayedReviews.map((r) => {
              const isPendingMyAction =
                ((currentUser?.role === 'REPORTING_MANAGER' || currentUser?.role === 'MANAGER') && r.status === 'MANAGER_PENDING') ||
                (currentUser?.role === 'HOD' && r.status === 'HOD_PENDING' && r.hodId === currentUser?.employeeId);
              const scoredKraCount = r.kraSnapshot?.filter((k) => (k.rating || 0) > 0).length || 0;
              return (
                <div
                  key={r.id}
                  onClick={() => handleOpenScoring(r)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 group ${
                    isPendingMyAction ? 'border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-500/10 dark:ring-indigo-500/20' : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Top: Identity & Status */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                          style={{ backgroundColor: r.cycleColor || '#4f46e5' }}
                        >
                          {r.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {r.employeeName}
                            </h4>
                            {getEmployeeStatusBadge(r.employeeStatus)}
                            {r.isAppraisalMonthDue && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Appraisal Due this Quarter" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {r.employeeCode} • {r.designationName}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0">{getStatusBadge(r.status, r.managerName, r.hodId)}</span>
                    </div>

                    {/* Department & Cycle */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{r.departmentName}</span>
                      </span>
                      <CycleBadge code={r.cycleCode} />
                    </div>

                    {/* Scores & Progress */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                            Weighted Score
                          </span>
                          <div className="mt-0.5">{getScoreBadge(r.finalScore)}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                            Scored KRAs
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {scoredKraCount} / {r.kraSnapshot?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            r.status === 'MANAGER_SUBMITTED'
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{
                            width: `${
                              r.kraSnapshot?.length
                                ? Math.round((scoredKraCount / r.kraSnapshot.length) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {r.employeeStatus === 'INACTIVE' ? (
                      <div className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 cursor-not-allowed">
                        <span>Offboarded / Inactive</span>
                        <button
                          onClick={() => handleOpenScoring(r)}
                          className="ml-2 underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-[11px] cursor-pointer"
                        >
                          View History
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenScoring(r)}
                        className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          isPendingMyAction
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>
                          {currentUser?.role === 'HOD'
                            ? isPendingMyAction
                              ? 'Review Now'
                              : 'View Review'
                            : isPendingMyAction
                            ? 'Score Review Now'
                            : 'Open Review Sheet'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Appraisal Cycle</th>
                  <th className="py-3 px-4">KRA Snapshot</th>
                  <th className="py-3 px-4">Weighted Score</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedReviews.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenScoring(r)}
                  >
                    {/* Employee Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0"
                          style={{ backgroundColor: r.cycleColor || '#1e3a8a' }}
                        >
                          {r.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {r.employeeName}
                            </span>
                            {getEmployeeStatusBadge(r.employeeStatus)}
                            {r.isAppraisalMonthDue && (
                              <span
                                title="Appraisal Due this Quarter"
                                className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                              />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{r.employeeCode}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department & Designation */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{r.designationName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.departmentName}</div>
                    </td>

                    {/* Appraisal Cycle */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <CycleBadge code={r.cycleCode} />
                      </div>
                      {r.isAppraisalMonthDue && (
                        <span className="inline-block mt-0.5 text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                          Appraisal Due
                        </span>
                      )}
                    </td>

                    {/* KRA Snapshot */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                        <span>{r.kraSnapshot?.length || 0} KRAs locked</span>
                      </span>
                    </td>

                    {/* Final Weighted Score */}
                    <td className="py-3 px-4">{getScoreBadge(r.finalScore)}</td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(r.status, r.managerName, r.hodId)}</td>

                    {/* Manager */}
                    <td className="py-3 px-4">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{r.managerName}</span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {r.employeeStatus === 'INACTIVE' ? (
                        <button
                          onClick={() => handleOpenScoring(r)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <span>View History</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenScoring(r)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>
                            {currentUser?.role === 'HOD'
                              ? r.status === 'HOD_PENDING' && r.hodId === currentUser?.employeeId
                                ? 'Review Now'
                                : 'View Review'
                              : 'Score / View'}
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODALS */}
      {isScoringModalOpen && activeReviewForScoring && (
        <ReviewScoringModal
          review={activeReviewForScoring}
          currentUser={currentUser}
          isOpen={isScoringModalOpen}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
        />
      )}

      {isBatchModalOpen && (
        <BatchGenerateReviewsModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          onGenerated={() => {
            setIsBatchModalOpen(false);
            loadReviewsAndStats();
          }}
          periods={periods}
          departments={departments}
          cycles={cycles}
          employees={employees}
        />
      )}

      {isInitiateModalOpen && (
        <InitiateReviewModal
          isOpen={isInitiateModalOpen}
          onClose={() => setIsInitiateModalOpen(false)}
          onGenerated={() => {
            setIsInitiateModalOpen(false);
            loadReviewsAndStats();
          }}
          periods={periods}
          employees={employees}
          initialPeriodId={selectedPeriodId}
        />
      )}

      {/* 6. PERIOD LIFECYCLE MANAGEMENT MODAL (HR / SUPER ADMIN) */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Review Period Lifecycle Control
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Activate the current quarter, lock historical periods, or stage upcoming evaluation cycles.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPeriodModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {periods.map((period) => {
                const isCurrentSelected = period.id === selectedPeriodId;
                const isUpdating = updatingPeriodId === period.id;

                return (
                  <div
                    key={period.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      period.status === 'ACTIVE'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                        : period.status === 'LOCKED'
                        ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-800/40'
                        : 'bg-slate-50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {period.name}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          period.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : period.status === 'LOCKED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}>
                          {period.status}
                        </span>
                        {isCurrentSelected && (
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium border border-indigo-200 dark:border-indigo-800">
                            Viewing
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Span: {period.startDate} to {period.endDate}</span>
                        <span>•</span>
                        <span>Due: {period.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {period.status !== 'ACTIVE' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdatePeriodStatus(period.id, 'ACTIVE')}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center space-x-1 disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Make Active</span>
                        </button>
                      )}

                      {period.status !== 'LOCKED' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdatePeriodStatus(period.id, 'LOCKED')}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/80 rounded-lg border border-amber-300 dark:border-amber-800 transition-colors flex items-center space-x-1 disabled:opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lock Period</span>
                        </button>
                      )}

                      {period.status !== 'UPCOMING' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdatePeriodStatus(period.id, 'UPCOMING')}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50"
                        >
                          Set Upcoming
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start space-x-3 text-xs text-slate-600 dark:text-slate-400">
              <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p>
                <strong>Enterprise Policy:</strong> When setting a period to <strong>ACTIVE</strong>, any currently active period is automatically safely transitioned to <strong>LOCKED</strong>. All existing employee evaluation submissions and manager appraisals remain permanently archived.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPeriodModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

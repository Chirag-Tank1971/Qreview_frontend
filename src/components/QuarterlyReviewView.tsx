import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  EmployeeReview,
  ReviewPeriod,
  ReviewSummaryStats,
  Department,
  Cycle,
  Employee,
  User,
  ReviewStatus,
} from '../types';
import { api } from '../services/api';
import { ReviewScoringModal } from './ReviewScoringModal';
import { BatchGenerateReviewsModal } from './BatchGenerateReviewsModal';
import { InitiateReviewModal } from './InitiateReviewModal';
import { AssignKraModal } from './AssignKraModal';
import { CustomKraRow } from './CustomKraScorecardModal';
import { CycleBadge } from './ui/CycleBadge';
import { StatusBadge, EmployeeStatusBadge } from './ui/StatusBadge';
import { PageSkeletonLoader } from './ui/PageSkeletonLoader';
import { toast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Sparkles,
  Search,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  RotateCw,
  Building2,
  Download,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  Clock,
  Edit3,
  Lock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  UserCheck,
  LayoutGrid,
  List,
  Settings2,
  Play,
  Loader2,
  Mail,
  UserPlus,
  MoreVertical,
  Plus,
  Check,
  Filter,
  X,
  BarChart2,
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

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('ALL');
  const [filterManagerId, setFilterManagerId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>(currentUser?.role === 'HOD' ? 'HOD_PENDING' : 'ALL');
  const [appraisalDueOnly, setAppraisalDueOnly] = useState<boolean>(false);
  const [myReportsOnly, setMyReportsOnly] = useState<boolean>(false);
  const [hideInactive, setHideInactive] = useState<boolean>(false);
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  // View & Pagination
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const isMobile = useIsMobile();
  const effectiveViewMode = isMobile ? 'cards' : viewMode;

  // Batch Selection
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<{ review: EmployeeReview; top: number; right: number } | null>(null);

  // Modals
  const [activeReviewForScoring, setActiveReviewForScoring] = useState<EmployeeReview | null>(null);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState<boolean>(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState<boolean>(false);
  const [isAssignKraModalOpen, setIsAssignKraModalOpen] = useState<boolean>(false);
  const [preselectedEmpForKra, setPreselectedEmpForKra] = useState<Employee | null>(null);
  const [assignKraInitialKras, setAssignKraInitialKras] = useState<CustomKraRow[]>([]);

  const [updatingPeriodId, setUpdatingPeriodId] = useState<string | null>(null);
  const [updatingTargetStatus, setUpdatingTargetStatus] = useState<'ACTIVE' | 'LOCKED' | 'UPCOMING' | null>(null);
  const handledReviewIdRef = useRef<string | null>(null);
  const openedViaDirectActionRef = useRef<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isSuperAdminOrHr = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HR';
  const isEmployeeRole = currentUser?.role === 'EMPLOYEE';

  // Close 3-dot floating menu on outside click, window scroll or resize
  useEffect(() => {
    if (!menuAnchor) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAnchor(null);
      }
    };
    const handleScrollOrResize = () => {
      setMenuAnchor(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [menuAnchor]);

  // Synchronize initialConfig
  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.reviewId) {
        openedViaDirectActionRef.current = true;
        setFilterStatus('ALL');
        setFilterDepartmentId('ALL');
        setFilterManagerId('ALL');
        setSearchQuery('');
        setAppraisalDueOnly(false);
        setMyReportsOnly(false);
      } else if (initialConfig.status) {
        let normalized = initialConfig.status;
        if (normalized === 'SELF_ASSESSED') normalized = 'MANAGER_PENDING';
        const validStatuses = [
          'ALL',
          'MANAGER_PENDING',
          'MANAGER_COMPLETED',
          'HOD_PENDING',
          'HR_PENDING',
          'HR_COMPLETED',
          'CLOSED',
          'RETURNED',
          'ASSIGNED',
          'DRAFT',
        ];
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
            // fallback
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
  }, [selectedPeriodId, filterDepartmentId, filterStatus, filterManagerId, myReportsOnly]);

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
          managerId: filterManagerId !== 'ALL' ? filterManagerId : undefined,
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

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  // Available Managers dynamically derived from real reviews + employees in DB
  const availableManagers = useMemo(() => {
    const map = new Map<string, string>();
    reviews.forEach((r) => {
      if (r.managerId && r.managerName) {
        map.set(r.managerId, r.managerName);
      }
    });
    employees.forEach((e) => {
      if (e.managerId && e.managerName) {
        map.set(e.managerId, e.managerName);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [reviews, employees]);

  // Filtered reviews in memory for search & appraisal due toggle & inactive toggle
  const displayedReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (hideInactive && r.employeeStatus === 'INACTIVE') return false;
      if (appraisalDueOnly && !r.isAppraisalMonthDue) return false;
      if (filterManagerId !== 'ALL' && r.managerId !== filterManagerId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.employeeName?.toLowerCase().includes(q);
        const matchesCode = r.employeeCode?.toLowerCase().includes(q);
        const matchesDept = r.departmentName?.toLowerCase().includes(q);
        const matchesDesig = r.designationName?.toLowerCase().includes(q);
        const matchesMgr = r.managerName?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept && !matchesDesig && !matchesMgr) return false;
      }
      return true;
    });
  }, [reviews, searchQuery, appraisalDueOnly, hideInactive, filterManagerId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedReviewIds([]);
  }, [searchQuery, filterDepartmentId, filterManagerId, filterStatus, appraisalDueOnly, myReportsOnly, hideInactive, selectedPeriodId]);

  // Paginated reviews
  const totalPages = Math.max(1, Math.ceil(displayedReviews.length / pageSize));
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedReviews.slice(start, start + pageSize);
  }, [displayedReviews, currentPage, pageSize]);

  // ==========================================
  // REAL DATA METRICS & CALCULATIONS (NO DUMMY DATA)
  // ==========================================
  const liveMetrics = useMemo(() => {
    const total = reviews.length;
    const now = new Date();

    const completed = reviews.filter((r) => r.status === 'CLOSED' || r.status === 'HR_COMPLETED');
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    const managerPending = reviews.filter((r) => r.status === 'MANAGER_PENDING');
    const hodPending = reviews.filter((r) => r.status === 'HOD_PENDING');
    const hrPending = reviews.filter((r) => r.status === 'HR_PENDING');
    const returned = reviews.filter((r) => r.status === 'RETURNED');
    const totalPending = managerPending.length + hodPending.length + hrPending.length + returned.length;
    const pendingRate = total > 0 ? Math.round((totalPending / total) * 100) : 0;

    const overdueList = reviews.filter((r) => {
      if (r.status === 'CLOSED' || r.status === 'HR_COMPLETED') return false;
      const dueStr = (r as any).dueDate || selectedPeriod?.dueDate || selectedPeriod?.endDate;
      if (!dueStr) return false;
      return new Date(dueStr) < now;
    });
    const overdueCount = overdueList.length;
    const overdueRate = total > 0 ? Math.round((overdueCount / total) * 100) : 0;

    const scoredList = reviews.filter((r) => (r.finalScore || 0) > 0);
    const avgScore = scoredList.length > 0
      ? scoredList.reduce((acc, r) => acc + (r.finalScore || 0), 0) / scoredList.length
      : stats?.averageScore || 0;

    const activeEmployeesCount = employees.filter((e) => e.status !== 'INACTIVE').length;
    const cohortCoveragePct = activeEmployeesCount > 0 ? Math.min(100, Math.round((total / activeEmployeesCount) * 100)) : 0;

    return {
      total,
      completedCount: completed.length,
      completionRate,
      totalPending,
      pendingRate,
      managerPendingCount: managerPending.length,
      hodPendingCount: hodPending.length,
      hrPendingCount: hrPending.length,
      returnedCount: returned.length,
      overdueCount,
      overdueRate,
      scoredCount: scoredList.length,
      avgScore,
      activeEmployeesCount,
      cohortCoveragePct,
    };
  }, [reviews, selectedPeriod, stats, employees]);

  // Stage Progress: Dynamic real counts & percentages across evaluation stages
  const stageProgress = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        self: { count: 0, pct: 0 },
        manager: { count: 0, pct: 0 },
        hr: { count: 0, pct: 0 },
        finalized: { count: 0, pct: 0 },
      };
    }

    const selfCount = reviews.filter(
      (r) => r.isSelfSubmitted || (r.status !== 'DRAFT' && r.status !== 'ASSIGNED')
    ).length;

    const managerCount = reviews.filter((r) =>
      ['MANAGER_COMPLETED', 'HOD_PENDING', 'HR_PENDING', 'HR_COMPLETED', 'CLOSED'].includes(r.status)
    ).length;

    const hrCount = reviews.filter((r) =>
      ['HR_PENDING', 'HR_COMPLETED', 'CLOSED'].includes(r.status)
    ).length;

    const finalizedCount = reviews.filter(
      (r) => r.status === 'CLOSED' || r.status === 'HR_COMPLETED'
    ).length;

    return {
      self: { count: selfCount, pct: Math.round((selfCount / total) * 100) },
      manager: { count: managerCount, pct: Math.round((managerCount / total) * 100) },
      hr: { count: hrCount, pct: Math.round((hrCount / total) * 100) },
      finalized: { count: finalizedCount, pct: Math.round((finalizedCount / total) * 100) },
    };
  }, [reviews]);

  // Review Health: Dynamic Donut Chart data based on deadlines and completion
  const healthData = useMemo(() => {
    const total = reviews.length;
    const now = new Date();
    let onTrack = 0;
    let dueSoon = 0;
    let overdue = 0;
    let notStarted = 0;

    reviews.forEach((r) => {
      if (r.status === 'CLOSED' || r.status === 'HR_COMPLETED') {
        onTrack++;
        return;
      }
      if (r.status === 'DRAFT' || r.status === 'ASSIGNED') {
        notStarted++;
        return;
      }
      const dueStr = (r as any).dueDate || selectedPeriod?.dueDate || selectedPeriod?.endDate;
      if (!dueStr) {
        onTrack++;
        return;
      }
      const due = new Date(dueStr);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        overdue++;
      } else if (diffDays <= 7) {
        dueSoon++;
      } else {
        onTrack++;
      }
    });

    const onTrackPct = total ? Math.round((onTrack / total) * 100) : 0;
    const dueSoonPct = total ? Math.round((dueSoon / total) * 100) : 0;
    const overduePct = total ? Math.round((overdue / total) * 100) : 0;
    const notStartedPct = total ? Math.round((notStarted / total) * 100) : 0;

    return {
      total,
      onTrack,
      dueSoon,
      overdue,
      notStarted,
      onTrackPct,
      dueSoonPct,
      overduePct,
      notStartedPct,
      chartData: [
        { name: 'On Track', value: onTrack, color: '#10b981', pct: onTrackPct },
        { name: 'Due Soon', value: dueSoon, color: '#f59e0b', pct: dueSoonPct },
        { name: 'Overdue', value: overdue, color: '#ef4444', pct: overduePct },
        { name: 'Not Started', value: notStarted, color: '#94a3b8', pct: notStartedPct },
      ].filter((d) => d.value > 0),
    };
  }, [reviews, selectedPeriod]);

  // KRA Coverage: Dynamic Donut Chart data based on kraSnapshot presence
  const kraCoverageData = useMemo(() => {
    const total = reviews.length;
    const withKra = reviews.filter((r) => r.kraSnapshot && r.kraSnapshot.length > 0).length;
    const withoutKra = Math.max(0, total - withKra);
    const withKraPct = total > 0 ? Math.round((withKra / total) * 100) : 0;
    const withoutKraPct = total > 0 ? Math.round((withoutKra / total) * 100) : 0;

    return {
      total,
      withKra,
      withoutKra,
      withKraPct,
      withoutKraPct,
      chartData: [
        { name: 'With KRA', value: withKra, color: '#6366f1', pct: withKraPct },
        { name: 'Without KRA', value: withoutKra, color: '#cbd5e1', pct: withoutKraPct },
      ].filter((d) => d.value > 0),
    };
  }, [reviews]);

  // Status badge tone & label helper
  const getReviewStatusTone = (status: ReviewStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
    switch (status) {
      case 'CLOSED':
      case 'HR_COMPLETED':
        return 'success';
      case 'MANAGER_PENDING':
      case 'HOD_PENDING':
        return 'warning';
      case 'RETURNED':
        return 'danger';
      case 'HR_PENDING':
      case 'MANAGER_COMPLETED':
        return 'info';
      case 'ASSIGNED':
      case 'DRAFT':
      default:
        return 'default';
    }
  };

  const getReviewStatusLabel = (status: ReviewStatus): string => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      ASSIGNED: 'Not Started',
      MANAGER_PENDING: 'Manager Pending',
      MANAGER_COMPLETED: 'Mgr Submitted',
      HOD_PENDING: 'HOD Pending',
      HR_PENDING: 'HR Calibration',
      RETURNED: 'Returned',
      HR_COMPLETED: 'Finalized',
      CLOSED: 'Closed & Locked',
    };
    return labels[status] || status;
  };

  // Review stage pill helper
  const getReviewStage = (review: EmployeeReview) => {
    if (review.status === 'CLOSED' || review.status === 'HR_COMPLETED') {
      return {
        label: 'Finalized',
        className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      };
    }
    if (review.status === 'HR_PENDING') {
      return {
        label: 'HR Review',
        className: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
      };
    }
    if (review.status === 'HOD_PENDING') {
      return {
        label: 'HOD Review',
        className: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
      };
    }
    if (review.status === 'MANAGER_COMPLETED') {
      return {
        label: 'Manager Review',
        className: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
      };
    }
    if (review.status === 'MANAGER_PENDING') {
      return review.isSelfSubmitted
        ? {
            label: 'Manager Review',
            className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          }
        : {
            label: 'Self Review',
            className: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
          };
    }
    if (review.status === 'RETURNED') {
      return {
        label: 'Returned',
        className: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
      };
    }
    return {
      label: 'Draft',
      className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    };
  };

  // Due date display & urgency helper
  const getDueDateInfo = (review: EmployeeReview) => {
    const dateStr = (review as any).dueDate || selectedPeriod?.dueDate || selectedPeriod?.endDate;
    if (!dateStr) return { text: '—', isOverdue: false, isSoon: false };

    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isCompleted = review.status === 'CLOSED' || review.status === 'HR_COMPLETED';

    if (isCompleted) {
      return { text: formatted, isOverdue: false, isSoon: false, isCompleted: true };
    }

    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: formatted, isOverdue: true, isSoon: false, diffDays: Math.abs(diffDays) };
    }
    if (diffDays <= 3) {
      return { text: formatted, isOverdue: false, isSoon: true, diffDays };
    }
    return { text: formatted, isOverdue: false, isSoon: false, diffDays };
  };

  // Score badge helper
  const renderScoreBadge = (score?: number) => {
    if (!score || score === 0) {
      return <span className="text-xs text-slate-400 font-mono">—</span>;
    }
    let color = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    if (score >= 4.5) color = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    else if (score >= 3.5) color = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
    else if (score >= 2.5) color = 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
    else color = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';

    return (
      <span className={`inline-flex items-center text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${color}`}>
        {score.toFixed(2)}
      </span>
    );
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviewIds(paginatedReviews.map((r) => r.id));
    } else {
      setSelectedReviewIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedReviewIds((prev) => [...prev, id]);
    } else {
      setSelectedReviewIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllPageSelected = paginatedReviews.length > 0 && paginatedReviews.every((r) => selectedReviewIds.includes(r.id));

  // Batch Reminder
  const handleBatchSendReminder = () => {
    if (selectedReviewIds.length === 0) return;
    toast.success(`Reminder notifications sent to ${selectedReviewIds.length} review participant(s).`, 'Reminders Dispatched');
    setSelectedReviewIds([]);
  };

  // Open Assign KRA Modal for selected employee or row
  const handleOpenAssignKra = (employeeId?: string, defaultKras?: CustomKraRow[]) => {
    const targetEmpId = employeeId || (selectedReviewIds.length > 0 ? reviews.find((r) => r.id === selectedReviewIds[0])?.employeeId : undefined);
    if (targetEmpId) {
      const found = employees.find((e) => e.id === targetEmpId);
      setPreselectedEmpForKra(found || null);

      if (defaultKras && defaultKras.length > 0) {
        setAssignKraInitialKras(defaultKras);
      } else {
        const empReview = reviews.find((r) => r.employeeId === targetEmpId && r.kraSnapshot?.length > 0);
        if (empReview?.kraSnapshot?.length) {
          setAssignKraInitialKras(
            empReview.kraSnapshot.map((k, idx) => ({
              id: k.id || `kra_${idx}`,
              title: k.kraName || k.title || '',
              weight: k.weight ?? 0,
              target: k.targetSnapshot || '100% Target SLA',
              description: k.description || '',
              measurementCriteria: k.measurementCriteria || '',
            }))
          );
        } else {
          setAssignKraInitialKras([]);
        }
      }
    } else {
      setPreselectedEmpForKra(null);
      setAssignKraInitialKras([]);
    }
    setIsAssignKraModalOpen(true);
  };

  // Scoring Modal Handlers
  const handleOpenScoring = async (review: EmployeeReview) => {
    setActiveReviewForScoring(review);
    setIsScoringModalOpen(true);
    try {
      const fresh = await api.getReviewById(review.id);
      if (fresh) {
        setActiveReviewForScoring(fresh);
      }
    } catch {
      // quiet fallback
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
      setFilterManagerId('ALL');
      setSearchQuery('');
    }
    onClearInitialConfig?.();
    loadReviewsAndStats();
  };

  // Export CSV
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
      'Due Date',
      'Last Updated',
    ];

    const rows = displayedReviews.map((r) => [
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
      (r as any).dueDate || selectedPeriod?.dueDate || '',
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
    toast.success(`Exported ${displayedReviews.length} reviews to CSV.`, 'Export Complete');
  };

  // Period Status Change
  const handleUpdatePeriodStatus = async (periodId: string, newStatus: 'ACTIVE' | 'LOCKED' | 'UPCOMING') => {
    setUpdatingPeriodId(periodId);
    setUpdatingTargetStatus(newStatus);
    try {
      await api.updateReviewPeriod(periodId, { status: newStatus });
      toast.success(`Period status updated to ${newStatus}`);
      await loadReviewPeriods();
    } catch (err: any) {
      console.error('Failed to update period status:', err);
      toast.error(err.message || 'Failed to update period status');
    } finally {
      setUpdatingPeriodId(null);
      setUpdatingTargetStatus(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => loadReviewPeriods()}
            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {isEmployeeRole ? 'My Reviews' : 'Quarterly Reviews'}
          </h1>

          {/* Active Period Status Pill */}
          {selectedPeriod && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full border shadow-2xs ${
                selectedPeriod.status === 'ACTIVE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                  : selectedPeriod.status === 'LOCKED'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  selectedPeriod.status === 'ACTIVE'
                    ? 'bg-emerald-500 animate-pulse'
                    : selectedPeriod.status === 'LOCKED'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>{selectedPeriod.name}</span>
            </span>
          )}
        </div>

        {/* PERIOD SELECTOR & ACTIONS */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {/* Period Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadReviewPeriods()}
            title="Refresh review records"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export */}
          <button
            onClick={handleExportCSV}
            disabled={reviews.length === 0}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-2xs transition-colors flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>

          {isSuperAdminOrHr && (
            <>
              {/* Periods Control */}
              <button
                onClick={() => setIsPeriodModalOpen(true)}
                title="Manage Review Period Lifecycles"
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Periods</span>
              </button>

              {/* Initiate Batch */}
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>Initiate Batch</span>
              </button>

              {/* Initiate Single Review */}
              <button
                onClick={() => setIsInitiateModalOpen(true)}
                className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
                title="Initiate single employee review"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-200" />
                <span>Initiate Review</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. COMPACT 5-CARD KPI STRIP (FITS IN SINGLE TIGHT ROW) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Card 1: Total Reviews */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">Total Reviews</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono leading-none">{liveMetrics.total}</span>
              <span className="text-[10px] text-slate-400 font-medium">({liveMetrics.cohortCoveragePct}% cov)</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Completion Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">Completion</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono leading-none">{liveMetrics.completionRate}%</span>
              <span className="text-[10px] text-slate-400">({liveMetrics.completedCount}/{liveMetrics.total})</span>
            </div>
            <div className="mt-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-emerald-500 h-1 rounded-full transition-all duration-500" style={{ width: `${liveMetrics.completionRate}%` }} />
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Pending Reviews */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">Pending Action</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono leading-none">{liveMetrics.totalPending}</span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{liveMetrics.pendingRate}%</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Overdue Reviews */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">Overdue</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono leading-none">{liveMetrics.overdueCount}</span>
              <span className={`text-[10px] font-semibold ${liveMetrics.overdueCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {liveMetrics.overdueCount > 0 ? `${liveMetrics.overdueRate}%` : 'On schedule'}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 5: Average Score */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 shadow-2xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">Avg Score</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono leading-none">
                {liveMetrics.avgScore > 0 ? liveMetrics.avgScore.toFixed(2) : '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/ 5.00</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. VISUAL ANALYTICS PANELS (FIXED COMPACT LAYOUT WITH PROMINENT CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Panel 1: Review Stage Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Stage Progress</h3>
            <span className="text-[10px] text-slate-400 font-mono">{liveMetrics.total} total</span>
          </div>

          <div className="space-y-2 py-0.5">
            {/* Stage 1: Self Review */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">Self Review</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                  <strong>{stageProgress.self.count}</strong> / {liveMetrics.total} ({stageProgress.self.pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${stageProgress.self.pct}%` }} />
              </div>
            </div>

            {/* Stage 2: Manager Review */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">Manager Review</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                  <strong>{stageProgress.manager.count}</strong> / {liveMetrics.total} ({stageProgress.manager.pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${stageProgress.manager.pct}%` }} />
              </div>
            </div>

            {/* Stage 3: HR Review */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">HR Calibration</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                  <strong>{stageProgress.hr.count}</strong> / {liveMetrics.total} ({stageProgress.hr.pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${stageProgress.hr.pct}%` }} />
              </div>
            </div>

            {/* Stage 4: Finalized */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">Finalized & Locked</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                  <strong>{stageProgress.finalized.count}</strong> / {liveMetrics.total} ({stageProgress.finalized.pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${stageProgress.finalized.pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Review Health */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Review Health</h3>
            <span className="text-[10px] text-slate-400">Due: {selectedPeriod?.dueDate || '—'}</span>
          </div>

          <div className="flex items-center gap-4 py-1">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              {healthData.total === 0 ? (
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                  No data
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthData.chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {healthData.chartData.map((entry, index) => (
                          <Cell key={`h-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any, name: any) => [`${val} reviews`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono leading-none">
                      {healthData.onTrackPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 leading-none">
                      On Track
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col justify-center gap-2 flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>On Track</span>
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px]">{healthData.onTrack}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Due Soon</span>
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px]">{healthData.dueSoon}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>Overdue</span>
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px]">{healthData.overdue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span>Not Started</span>
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px]">{healthData.notStarted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: KRA Coverage */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">KRA Coverage</h3>
            {isSuperAdminOrHr && kraCoverageData.withoutKra > 0 && (
              <button
                onClick={() => handleOpenAssignKra()}
                className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                + Assign
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 py-1">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              {kraCoverageData.total === 0 ? (
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                  No data
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={kraCoverageData.chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {kraCoverageData.chartData.map((entry, index) => (
                          <Cell key={`k-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any, name: any) => [`${val} reviews`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono leading-none">
                      {kraCoverageData.withKraPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 leading-none">
                      Covered
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col justify-center gap-2.5 flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span>With KRA</span>
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px]">{kraCoverageData.withKra}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                  <span>Without KRA</span>
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px]">{kraCoverageData.withoutKra}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800 leading-tight">
                {kraCoverageData.withoutKra === 0 ? '100% scorecards assigned' : `${kraCoverageData.withoutKra} pending scorecard`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. COMPACT SEARCH, FILTERS & BATCH OPERATIONS TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3 py-2 shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, code, role, or manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400 font-medium">Dept:</span>
            <select
              value={filterDepartmentId}
              onChange={(e) => setFilterDepartmentId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Manager Filter */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400 font-medium">Manager:</span>
            <select
              value={filterManagerId}
              onChange={(e) => setFilterManagerId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 focus:border-indigo-500 cursor-pointer max-w-[130px]"
            >
              <option value="ALL">All Managers</option>
              {availableManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="MANAGER_PENDING">Manager Pending</option>
              <option value="MANAGER_COMPLETED">Manager Completed</option>
              <option value="HOD_PENDING">HOD Pending</option>
              <option value="HR_PENDING">HR Calibration</option>
              <option value="HR_COMPLETED">Finalized</option>
              <option value="ASSIGNED">Not Started</option>
              <option value="RETURNED">Returned</option>
              <option value="CLOSED">Closed & Locked</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          {/* Quick Filters Toggle */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
              showMoreFilters || appraisalDueOnly || myReportsOnly || hideInactive
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Filters</span>
          </button>

          {/* View Mode Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3 h-3" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* Expandable Filter Row */}
        {showMoreFilters && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAppraisalDueOnly(!appraisalDueOnly)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
                appraisalDueOnly
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Appraisal Due Only</span>
            </button>

            {currentUser?.role === 'MANAGER' && (
              <button
                onClick={() => setMyReportsOnly(!myReportsOnly)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  myReportsOnly
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                My Direct Reports
              </button>
            )}

            <button
              onClick={() => setHideInactive(!hideInactive)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
                hideInactive
                  ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>Hide Inactive</span>
            </button>

            {(filterStatus !== 'ALL' ||
              filterDepartmentId !== 'ALL' ||
              filterManagerId !== 'ALL' ||
              appraisalDueOnly ||
              searchQuery.trim() ||
              myReportsOnly ||
              hideInactive) && (
              <button
                onClick={() => {
                  setFilterStatus('ALL');
                  setFilterDepartmentId('ALL');
                  setFilterManagerId('ALL');
                  setAppraisalDueOnly(false);
                  setMyReportsOnly(false);
                  setHideInactive(false);
                  setSearchQuery('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-2 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* BATCH OPERATIONS BAR (Active when rows selected) */}
        {selectedReviewIds.length > 0 && (
          <div className="bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                {selectedReviewIds.length} review(s) selected
              </span>
              <button
                onClick={() => setSelectedReviewIds([])}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                Deselect All
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {isSuperAdminOrHr && (
                <button
                  onClick={() => handleOpenAssignKra()}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Assign KRA</span>
                </button>
              )}

              <button
                onClick={handleBatchSendReminder}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Mail className="w-3 h-3 text-slate-500" />
                <span>Send Reminder</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. DATA TABLE & CARDS VIEW (PROMINENTLY DISPLAYED ON LOAD) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading && reviews.length === 0 ? (
          <div className="p-4">
            <PageSkeletonLoader variant="table" rowCount={6} />
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center space-y-2.5">
            <FileCheck className="w-9 h-9 text-slate-300 dark:text-slate-600" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">No quarterly reviews found</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {filterStatus !== 'ALL' || filterDepartmentId !== 'ALL' || filterManagerId !== 'ALL' || appraisalDueOnly || searchQuery.trim() || myReportsOnly || hideInactive
                ? 'No review sheets match your current search or filters for this period.'
                : 'No review sheets exist for this period yet. Initiate a new batch for this period to generate reviews from active employee master data.'}
            </p>
            {isSuperAdminOrHr && !searchQuery && filterStatus === 'ALL' && (
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="mt-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Reviews Now</span>
              </button>
            )}
          </div>
        ) : effectiveViewMode === 'cards' ? (
          /* Cards View */
          <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            {paginatedReviews.map((r) => {
              const isPendingMyAction =
                (r.status === 'MANAGER_PENDING' && (r.managerId === currentUser?.employeeId || r.managerId === currentUser?.id)) ||
                (r.status === 'HOD_PENDING' && r.hodId === currentUser?.employeeId);
              const scoredKraCount = r.kraSnapshot?.filter((k) => (k.rating || 0) > 0).length || 0;
              const totalKras = r.kraSnapshot?.length || 0;
              const stage = getReviewStage(r);
              const dueInfo = getDueDateInfo(r);

              return (
                <div
                  key={r.id}
                  onClick={() => handleOpenScoring(r)}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-3.5 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-3 group ${
                    isPendingMyAction
                      ? 'border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-500/10'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0"
                          style={{ backgroundColor: r.cycleColor || '#4f46e5' }}
                        >
                          {r.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {r.employeeName}
                            </h4>
                            <EmployeeStatusBadge status={r.employeeStatus} />
                            {r.isAppraisalMonthDue && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Appraisal Due this Quarter" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {r.employeeCode} • {r.designationName}
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={getReviewStatusLabel(r.status)} tone={getReviewStatusTone(r.status)} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{r.departmentName}</span>
                      </span>
                      <CycleBadge code={r.cycleCode} />
                    </div>

                    {/* Stage & Manager */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${stage.className}`}>
                        {stage.label}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                        Mgr: <strong className="text-slate-700 dark:text-slate-300">{r.managerName || '—'}</strong>
                      </span>
                    </div>

                    {/* Scores & Progress */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
                            Weighted Score
                          </span>
                          <div className="mt-0.5">{renderScoreBadge(r.finalScore)}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
                            KRAs Scored
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            <strong>{scoredKraCount}</strong> / {totalKras}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 bg-indigo-500"
                          style={{
                            width: `${totalKras ? Math.round((scoredKraCount / totalKras) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Due Date Indicator */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due: {dueInfo.text}</span>
                      </span>
                      {dueInfo.isOverdue && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">Overdue ({dueInfo.diffDays}d)</span>
                      )}
                      {dueInfo.isSoon && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Due in {dueInfo.diffDays}d</span>
                      )}
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenScoring(r)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isPendingMyAction
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>
                        {currentUser?.role === 'HOD'
                          ? isPendingMyAction
                            ? 'Review Now'
                            : 'View Review'
                          : isPendingMyAction
                          ? 'Score Review'
                          : 'Open Sheet'}
                      </span>
                      <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 backdrop-blur-md bg-slate-50/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all reviews on page"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Manager</th>
                  <th className="py-2.5 px-3">Review Stage</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">KRAs</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedReviews.map((r) => {
                  const isPendingMyAction =
                    (r.status === 'MANAGER_PENDING' && (r.managerId === currentUser?.employeeId || r.managerId === currentUser?.id)) ||
                    (r.status === 'HOD_PENDING' && r.hodId === currentUser?.employeeId);
                  const isSelected = selectedReviewIds.includes(r.id);
                  const stage = getReviewStage(r);
                  const dueInfo = getDueDateInfo(r);
                  const totalKras = r.kraSnapshot?.length || 0;
                  const scoredKraCount = r.kraSnapshot?.filter((k) => (k.rating || 0) > 0).length || 0;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleOpenScoring(r)}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(r.id, e.target.checked)}
                          aria-label={`Select ${r.employeeName}`}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0"
                            style={{ backgroundColor: r.cycleColor || '#4f46e5' }}
                          >
                            {r.employeeName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {r.employeeName}
                              </span>
                              <EmployeeStatusBadge status={r.employeeStatus} />
                              {r.isAppraisalMonthDue && (
                                <span title="Appraisal Due this Quarter" className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {r.employeeCode || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-2 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[130px]">
                          {r.departmentName}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[130px]">
                          {r.designationName}
                        </div>
                      </td>

                      {/* Manager */}
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {r.managerName?.charAt(0) || 'M'}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px]">
                            {r.managerName || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Review Stage */}
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stage.className}`}>
                          {stage.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        <StatusBadge status={getReviewStatusLabel(r.status)} tone={getReviewStatusTone(r.status)} size="sm" />
                      </td>

                      {/* KRAs */}
                      <td className="py-2 px-3">
                        {totalKras === 0 ? (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded-full border border-amber-200 dark:border-amber-800/60">
                            0 KRAs
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{scoredKraCount}</strong> / {totalKras}
                          </span>
                        )}
                      </td>

                      {/* Final Weighted Score */}
                      <td className="py-2 px-3">{renderScoreBadge(r.finalScore)}</td>

                      {/* Due Date */}
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className={`w-3 h-3 ${dueInfo.isOverdue ? 'text-rose-500' : dueInfo.isSoon ? 'text-amber-500' : 'text-slate-400'}`} />
                          <span className={`font-mono text-xs ${dueInfo.isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : dueInfo.isSoon ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                            {dueInfo.text}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          {totalKras === 0 && isSuperAdminOrHr ? (
                            <button
                              onClick={() => handleOpenAssignKra(r.employeeId)}
                              className="px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Assign KRA Scorecard"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Assign</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenScoring(r)}
                              className={`px-2 py-0.5 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
                                isPendingMyAction
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-2xs'
                                  : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800'
                              }`}
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>
                                {currentUser?.role === 'HOD' && r.status === 'HOD_PENDING'
                                  ? 'Review'
                                  : isPendingMyAction
                                  ? 'Score'
                                  : 'View'}
                              </span>
                            </button>
                          )}

                          {/* 3-dot action button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (menuAnchor?.review.id === r.id) {
                                setMenuAnchor(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const estimatedHeight = 125;
                                const fitsBelow = rect.bottom + estimatedHeight + 10 <= window.innerHeight;
                                const top = fitsBelow ? rect.bottom + 4 : Math.max(10, rect.top - estimatedHeight - 4);
                                const right = Math.max(12, window.innerWidth - rect.right);
                                setMenuAnchor({ review: r, top, right });
                              }
                            }}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              menuAnchor?.review.id === r.id
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. COMPACT PAGINATION CONTROLS */}
        {displayedReviews.length > 0 && (
          <div className="px-3.5 py-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <span>
                Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, displayedReviews.length)}</strong> of{' '}
                <strong>{displayedReviews.length}</strong> employees
              </span>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-center">
              <div className="flex items-center space-x-1">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-0.5 focus:border-indigo-500 cursor-pointer text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-6 h-6 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === p
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating 3-Dot Options Menu via Portal directly into document.body */}
      {menuAnchor &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${menuAnchor.top}px`,
              right: `${menuAnchor.right}px`,
              zIndex: 99999,
            }}
            className="w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const target = menuAnchor.review;
                setMenuAnchor(null);
                handleOpenScoring(target);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center space-x-2.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Open Evaluation</span>
            </button>

            {isSuperAdminOrHr && (
              <button
                type="button"
                onClick={() => {
                  const target = menuAnchor.review;
                  setMenuAnchor(null);
                  const reviewKras: CustomKraRow[] = (target.kraSnapshot || []).map((k, idx) => ({
                    id: k.id || `kra_${idx}`,
                    title: k.kraName || k.title || '',
                    weight: k.weight ?? 0,
                    target: k.targetSnapshot || '100% Target SLA',
                    description: k.description || '',
                    measurementCriteria: k.measurementCriteria || '',
                  }));
                  handleOpenAssignKra(target.employeeId, reviewKras.length > 0 ? reviewKras : undefined);
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center space-x-2.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                <span>Assign / Edit KRA</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const target = menuAnchor.review;
                setMenuAnchor(null);
                toast.success(`Reminder sent to ${target.employeeName} and manager.`, 'Reminder Sent');
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center space-x-2.5 transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Send Reminder</span>
            </button>
          </div>,
          document.body
        )}

      {/* 7. MODALS */}
      {/* Scoring Modal */}
      {isScoringModalOpen && activeReviewForScoring && (
        <ReviewScoringModal
          review={activeReviewForScoring}
          currentUser={currentUser}
          isOpen={isScoringModalOpen}
          onClose={handleModalClose}
          onSaved={handleModalClose}
        />
      )}

      {/* Batch Generate Reviews Modal */}
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
        />
      )}

      {/* Initiate Single Review Modal */}
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

      {/* Assign KRA Modal */}
      {isAssignKraModalOpen && (
        <AssignKraModal
          isOpen={isAssignKraModalOpen}
          onClose={() => {
            setIsAssignKraModalOpen(false);
            setPreselectedEmpForKra(null);
            setAssignKraInitialKras([]);
          }}
          employees={employees}
          cycles={cycles}
          preselectedEmployee={preselectedEmpForKra}
          initialKras={assignKraInitialKras}
          onAssigned={() => {
            setIsAssignKraModalOpen(false);
            setPreselectedEmpForKra(null);
            setAssignKraInitialKras([]);
            loadReviewsAndStats();
          }}
        />
      )}

      {/* Period Lifecycle Modal */}
      <PeriodLifecycleModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        updatingPeriodId={updatingPeriodId}
        updatingTargetStatus={updatingTargetStatus}
        handleUpdatePeriodStatus={handleUpdatePeriodStatus}
      />
    </div>
  );
};

interface PeriodLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  periods: ReviewPeriod[];
  selectedPeriodId: string;
  updatingPeriodId: string | null;
  updatingTargetStatus: string | null;
  handleUpdatePeriodStatus: (periodId: string, newStatus: 'UPCOMING' | 'ACTIVE' | 'LOCKED') => void;
}

const PeriodLifecycleModal: React.FC<PeriodLifecycleModalProps> = ({
  isOpen,
  onClose,
  periods,
  selectedPeriodId,
  updatingPeriodId,
  updatingTargetStatus,
  handleUpdatePeriodStatus,
}) => {
  const { isMounted, handleClose, handleBackdropClick, backdropClass, cardClass } = useModalAnimation({
    isOpen,
    onClose,
  });

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs ${backdropClass}`}
      onClick={handleBackdropClick}
    >
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 ${cardClass}`}>
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
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
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
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        period.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : period.status === 'LOCKED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
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
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isUpdating && updatingTargetStatus === 'ACTIVE' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>Make Active</span>
                    </button>
                  )}

                  {period.status !== 'LOCKED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdatePeriodStatus(period.id, 'LOCKED')}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/80 rounded-lg border border-amber-300 dark:border-amber-800 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isUpdating && updatingTargetStatus === 'LOCKED' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      <span>Lock Period</span>
                    </button>
                  )}

                  {period.status !== 'UPCOMING' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdatePeriodStatus(period.id, 'UPCOMING')}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isUpdating && updatingTargetStatus === 'UPCOMING' && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>Set Upcoming</span>
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
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  DollarSign,
  Users,
  CheckCircle2,
  Lock,
  FileText,
  Sliders,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Building2,
  Briefcase,
  HelpCircle,
  Archive,
  Download,
  FileSpreadsheet,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  Appraisal,
  AppraisalSummaryStats,
  Cycle,
  Department,
  Designation,
  User as AuthUser,
  EmployeeStatus,
} from '../types';
import { api } from '../services/api';
import { InitiateAppraisalModal } from './InitiateAppraisalModal';
import { AppraisalDetailModal } from './AppraisalDetailModal';
import { AppraisalLetterModal } from './AppraisalLetterModal';
import { BatchLetterExportModal } from './BatchLetterExportModal';
import { BellCurveBudgetAnalytics } from './BellCurveBudgetAnalytics';
import { CycleBadge } from './ui/CycleBadge';
import { downloadAppraisalPdf, downloadPayrollCsv } from '../utils/letterExport';

export interface AppraisalViewConfig {
  activeSection?: 'appraisals' | 'bellCurveAnalytics';
  cycleId?: string;
  year?: number;
  departmentId?: string;
  status?: string;
  appraisalId?: string;
  openLetter?: boolean;
  openDetail?: boolean;
}

interface AppraisalManagementViewProps {
  currentUser: AuthUser | null;
  departments: Department[];
  cycles: Cycle[];
  designations: Designation[];
  initialConfig?: AppraisalViewConfig | null;
  onClearInitialConfig?: () => void;
}

export const AppraisalManagementView: React.FC<AppraisalManagementViewProps> = ({
  currentUser,
  departments,
  cycles,
  designations,
  initialConfig,
  onClearInitialConfig,
}) => {
  const [activeSection, setActiveSection] = useState<'appraisals' | 'bellCurveAnalytics'>('appraisals');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [stats, setStats] = useState<AppraisalSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCycleId, setSelectedCycleId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyMine, setOnlyMine] = useState<boolean>(false);
  const [hideInactive, setHideInactive] = useState<boolean>(false);

  // Modals
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState<boolean>(false);
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState<boolean>(false);
  const [selectedAppraisalForDetail, setSelectedAppraisalForDetail] = useState<Appraisal | null>(null);
  const [selectedAppraisalForLetter, setSelectedAppraisalForLetter] = useState<Appraisal | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // Sync initialConfig if provided
  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.activeSection) setActiveSection(initialConfig.activeSection);
      if (initialConfig.cycleId) setSelectedCycleId(initialConfig.cycleId);
      if (initialConfig.year) setSelectedYear(initialConfig.year);
      if (initialConfig.departmentId) setSelectedDepartmentId(initialConfig.departmentId);
      if (initialConfig.status) {
        let normStatus = initialConfig.status;
        if (normStatus === 'CALIBRATED') normStatus = 'HOD_CALIBRATED';
        if (normStatus === 'RECOMMENDED') normStatus = 'MANAGER_RECOMMENDED';
        setSelectedStatus(normStatus);
      }
      if (initialConfig.appraisalId) {
        // Direct fetch guarantees opening the modal regardless of current active table filters
        api.getAppraisal(initialConfig.appraisalId)
          .then((appr) => {
            if (appr) {
              if (initialConfig.openLetter) {
                setSelectedAppraisalForLetter(appr);
              } else {
                setSelectedAppraisalForDetail(appr);
              }
            }
          })
          .catch(() => {
            api.getAppraisals().then((res) => {
              const match = res?.find((a) => a.id === initialConfig.appraisalId);
              if (match) {
                if (initialConfig.openLetter) {
                  setSelectedAppraisalForLetter(match);
                } else {
                  setSelectedAppraisalForDetail(match);
                }
              }
            }).catch((err) => console.warn('Could not auto-open appraisal record', err));
          });
      }
      onClearInitialConfig?.();
    }
  }, [initialConfig, onClearInitialConfig]);

  const userRole = currentUser?.role || 'EMPLOYEE';
  const canInitiate = userRole === 'SUPER_ADMIN' || userRole === 'HR';
  const canBatchExport = userRole === 'SUPER_ADMIN' || userRole === 'HR' || userRole === 'EXECUTIVE_MANAGEMENT';
  const canViewBellCurve = ['SUPER_ADMIN', 'HR', 'HOD', 'MANAGEMENT'].includes(userRole);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appraisalsRes, statsRes] = await Promise.all([
        api.getAppraisals({
          cycleId: selectedCycleId,
          year: selectedYear,
          departmentId: selectedDepartmentId,
          status: selectedStatus,
          search: searchQuery,
          onlyMine,
        }),
        api.getAppraisalStats({
          cycleId: selectedCycleId,
          year: selectedYear,
          departmentId: selectedDepartmentId,
        }),
      ]);
      setAppraisals(appraisalsRes);
      setStats(statsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load appraisals data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCycleId, selectedYear, selectedDepartmentId, selectedStatus, searchQuery, onlyMine]);

  const currencySymbol = '₹';

  // Helper for employment status badge
  const getEmployeeStatusBadge = (empStatus?: EmployeeStatus) => {
    if (!empStatus || empStatus === 'ACTIVE') return null;
    if (empStatus === 'INACTIVE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          OFFBOARDED
        </span>
      );
    }
    if (empStatus === 'NOTICE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          SERVING NOTICE
        </span>
      );
    }
    if (empStatus === 'PROBATION') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          PROBATION
        </span>
      );
    }
    return null;
  };

  // Filtered appraisals according to hideInactive
  const displayedAppraisals = appraisals.filter((a) => {
    if (hideInactive && a.employeeStatus === 'INACTIVE') return false;
    return true;
  });

  // Quick single PDF download helper
  const handleQuickDownloadPdf = async (appraisal: Appraisal, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingPdfId(appraisal.id);
    try {
      await downloadAppraisalPdf(appraisal);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setSelectedAppraisalForLetter(appraisal);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const getAppraisalStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Pending Mgr</span>
          </span>
        );
      case 'MANAGER_RECOMMENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Mgr Recommended</span>
          </span>
        );
      case 'HOD_CALIBRATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>HOD Calibrated</span>
          </span>
        );
      case 'HR_APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>HR Approved</span>
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-slate-100">
            <Lock className="w-3 h-3" />
            <span>Locked & Released</span>
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

  return (
    <div className="space-y-6">
      {/* Native Page Header: Title, Subtitle, and Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              Appraisals & Increments
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Annual Calibration
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rolling 4-quarter performance rollups, 8-Cycle cohort grouping, and official compensation letters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh Appraisals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canBatchExport && (
            <button
              onClick={() => setIsBatchExportModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Bulk export formatted PDF letters, ZIP archives, and payroll sheets"
            >
              <Archive className="w-3.5 h-3.5 text-slate-400" />
              <span>Batch Export Letters</span>
            </button>
          )}

          {canInitiate && (
            <button
              onClick={() => setIsInitiateModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
              <span>Initiate 8-Cycle Cohort</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode Toggle: Annual Appraisals vs Bell Curve Calibration & Budget Controls */}
      {canViewBellCurve && (
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80 overflow-x-auto w-max max-w-full">
          <button
            onClick={() => setActiveSection('appraisals')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'appraisals'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Appraisal & Increment List</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-semibold">
              {appraisals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('bellCurveAnalytics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'bellCurveAnalytics'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Bell Curve & Budget Calibration</span>
          </button>
        </div>
      )}

      {canViewBellCurve && activeSection === 'bellCurveAnalytics' ? (
        <BellCurveBudgetAnalytics
          departments={departments}
          cycles={cycles}
          onOpenCalibrationModal={() => setActiveSection('appraisals')}
        />
      ) : (
        <>
          {/* KPI & Metric Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Total Appraisals */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-indigo-500 rounded-lg shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Cohort Size</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{stats.total}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>{stats.locked} locked / released</span>
                </div>
              </div>

              {/* Average 4-Quarter Score */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-amber-500 rounded-lg shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Avg 4-Qtr Score</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{stats.averageScore.toFixed(2)}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Scale of 5.00</div>
              </div>

              {/* Average Increment % */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-emerald-500 rounded-lg shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Avg Increment</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">+{stats.averageIncrement}%</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Performance-calibrated</div>
              </div>

              {/* Total Budget Increment Impact */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-sky-500 rounded-lg shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Annual CTC Revision</span>
                  <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  +{currencySymbol}{(stats.totalIncrementBudgetImpact / 100000).toFixed(2)}L
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Payroll budget impact</div>
              </div>

              {/* Promotions */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-purple-500 rounded-lg shadow-2xs space-y-1 col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Promotions</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 font-mono">{stats.promotionsCount}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Role level upgrades</div>
              </div>
            </div>
          )}

          {/* Standard Increment Matrix Reference Bar */}
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Increment Matrix Guideline:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md text-[11px] font-medium">
                <strong className="font-semibold">Outstanding (4.50+):</strong> 15% - 20%
              </span>
              <span className="px-2.5 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 rounded-md text-[11px] font-medium">
                <strong className="font-semibold">Exceeds (3.80 - 4.49):</strong> 10% - 14%
              </span>
              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-md text-[11px] font-medium">
                <strong className="font-semibold">Meets (2.80 - 3.79):</strong> 5% - 9%
              </span>
              <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-md text-[11px] font-medium">
                <strong className="font-semibold">Improvement (&lt;2.80):</strong> 0% - 4%
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Cycle Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Cycle (A - H)
            </label>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All 8 Cycles</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {c.name} (Month {c.appraisalMonth})
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Fiscal Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value={2026} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">2026 (Current)</option>
              <option value={2025} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">2025</option>
              <option value={2027} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">2027</option>
            </select>
          </div>

          {/* Department Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Department
            </label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Workflow Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Statuses</option>
              <option value="PENDING" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Pending Manager</option>
              <option value="MANAGER_RECOMMENDED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Manager Recommended</option>
              <option value="HOD_CALIBRATED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">HOD Calibrated</option>
              <option value="HR_APPROVED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">HR Approved</option>
              <option value="LOCKED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Locked & Released</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Search Employee
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, code, title..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Appraisals Data List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Header with Title, Count, and View Mode Switcher */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Appraisal Candidates & Compensation Records
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {displayedAppraisals.length} {displayedAppraisals.length === 1 ? 'Record' : 'Records'}
              {hideInactive && ` (${appraisals.length - displayedAppraisals.length} inactive hidden)`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Hide Inactive Toggle */}
            <button
              type="button"
              onClick={() => setHideInactive(!hideInactive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                hideInactive
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-2xs font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Hide Inactive</span>
            </button>
            {/* View Mode Switcher (Cards vs Table) */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500">Loading appraisal cohorts...</p>
          </div>
        ) : displayedAppraisals.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No Appraisals Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                No active appraisal records match your filters. Click "Initiate 8-Cycle Cohort" to batch generate appraisals for employees in their designated appraisal month.
              </p>
            </div>
            {canInitiate && (
              <button
                onClick={() => setIsInitiateModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Initiate Appraisal Cycle
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            {displayedAppraisals.map((appr) => {
              const incPct = appr.approvedIncrementPercentage ?? appr.proposedIncrementPercentage ?? appr.recommendedIncrementPercentage ?? 0;
              const currentCtc = appr.currentCtc || 0;
              const revisedCtc = appr.revisedCtc || (currentCtc + Math.round((currentCtc * incPct) / 100));
              const isEligibleForLetter = appr.status === 'HR_APPROVED' || appr.status === 'LOCKED' || appr.isLocked;
              const isPendingMyAction =
                ((currentUser?.role === 'REPORTING_MANAGER' || currentUser?.role === 'MANAGER') && appr.status === 'PENDING') ||
                (['SUPER_ADMIN', 'HR'].includes(currentUser?.role || '') && (appr.status === 'MANAGER_RECOMMENDED' || appr.status === 'HOD_CALIBRATED'));

              return (
                <div
                  key={appr.id}
                  onClick={() => setSelectedAppraisalForDetail(appr)}
                  className={`bg-white dark:bg-slate-900 rounded-lg border p-4 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 group ${
                    isPendingMyAction ? 'border-indigo-400 dark:border-indigo-500/50 ring-2 ring-indigo-500/10 dark:ring-indigo-500/20' : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Top: Identity & Status */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                          style={{ backgroundColor: appr.cycleColor || '#4f46e5' }}
                        >
                          {appr.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {appr.employeeName}
                            </h4>
                            {getEmployeeStatusBadge(appr.employeeStatus)}
                            {appr.promoted && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                                <Briefcase className="w-2.5 h-2.5" /> Promoted
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {appr.employeeCode} • {appr.designationName}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0">{getAppraisalStatusBadge(appr.status)}</span>
                    </div>

                    {/* Department & Cycle Info */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{appr.departmentName}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <CycleBadge code={appr.cycleCode || appr.cycleName?.replace('Cycle ', '')} />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">M{appr.appraisalMonth}</span>
                      </div>
                    </div>

                    {/* Performance & Score Box */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                            4-Qtr Rolling Score
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                              {appr.averageQuarterlyScore.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">/ 5.00</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                            Rating Band
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mt-0.5 ${
                              appr.averageQuarterlyScore <= 0 || (!appr.finalRating && (!appr.recommendedRating || appr.recommendedRating === 'PENDING'))
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                : appr.averageQuarterlyScore >= 4.5
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : appr.averageQuarterlyScore >= 3.8
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : appr.averageQuarterlyScore >= 2.8
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                            }`}
                          >
                            {(appr.finalRating || appr.recommendedRating || 'PENDING').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            appr.averageQuarterlyScore >= 4.5
                              ? 'bg-emerald-500'
                              : appr.averageQuarterlyScore >= 3.8
                              ? 'bg-blue-500'
                              : appr.averageQuarterlyScore >= 2.8
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (appr.averageQuarterlyScore / 5) * 100)}%` }}
                        />
                      </div>

                      {/* Compensation revision row */}
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">Revised CTC</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono line-through">
                              {currencySymbol}{(currentCtc / 100000).toFixed(2)}L
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                              → {currencySymbol}{(revisedCtc / 100000).toFixed(2)}L
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">Increment</span>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {incPct > 0 ? (
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-mono">
                                +{incPct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quarters Pills (if available) */}
                      {appr.quarterlyHistory && appr.quarterlyHistory.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">4-Qtr Breakdown:</span>
                          <div className="flex items-center gap-1 font-mono">
                            {appr.quarterlyHistory.map((q, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-semibold text-[10px]"
                                title={`${q.quarterName || `Q${idx + 1}`}: ${q.score ? q.score.toFixed(2) : '--'}`}
                              >
                                {q.quarterName ? q.quarterName.slice(-2) : `Q${idx + 1}`}:{q.score ? q.score.toFixed(1) : '--'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-1 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {isEligibleForLetter && (
                        <>
                          <button
                            type="button"
                            disabled={downloadingPdfId === appr.id}
                            onClick={(e) => handleQuickDownloadPdf(appr, e)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                            title="Download Official PDF Letter"
                          >
                            {downloadingPdfId === appr.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedAppraisalForLetter(appr)}
                            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 rounded-xl transition-colors cursor-pointer"
                            title="View Appraisal Letterhead Document"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedAppraisalForDetail(appr)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isPendingMyAction
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>
                        {currentUser?.role === 'HOD'
                          ? 'View Appraisal'
                          : (currentUser?.role === 'REPORTING_MANAGER' || currentUser?.role === 'MANAGER') && appr.status === 'PENDING'
                          ? 'Recommend Increment'
                          : ['SUPER_ADMIN', 'HR'].includes(currentUser?.role || '') && (appr.status === 'MANAGER_RECOMMENDED' || appr.status === 'HOD_CALIBRATED')
                          ? 'Review & Approve'
                          : 'View Appraisal'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-3">8-Cycle</th>
                  <th className="py-3.5 px-3 text-center">4-Qtr Rolling Score</th>
                  <th className="py-3.5 px-3">Rating Band</th>
                  <th className="py-3.5 px-3 text-right">Current CTC</th>
                  <th className="py-3.5 px-3 text-right">Increment %</th>
                  <th className="py-3.5 px-3 text-right">Revised CTC</th>
                  <th className="py-3.5 px-3 text-center">Workflow Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {displayedAppraisals.map((appr) => {
                  const incPct = appr.approvedIncrementPercentage ?? appr.proposedIncrementPercentage ?? 0;
                  const currentCtc = appr.currentCtc || 0;
                  const revisedCtc = appr.revisedCtc || (currentCtc + Math.round((currentCtc * incPct) / 100));
                  const isEligibleForLetter = appr.status === 'HR_APPROVED' || appr.status === 'LOCKED' || appr.isLocked;

                  return (
                    <tr
                      key={appr.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedAppraisalForDetail(appr)}
                    >
                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {appr.employeeName}
                            </span>
                            {getEmployeeStatusBadge(appr.employeeStatus)}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                            <span>{appr.employeeCode}</span>
                            <span>•</span>
                            <span>{appr.designationName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{appr.departmentName}</div>
                        </div>
                      </td>

                      {/* 8-Cycle */}
                      <td className="py-3.5 px-3">
                        <CycleBadge code={appr.cycleCode || appr.cycleName?.replace('Cycle ', '')} />
                      </td>

                      {/* 4-Quarter Rolling Score */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {appr.averageQuarterlyScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {appr.quarterlyHistory?.length || 4} Quarters
                          </span>
                        </div>
                      </td>

                      {/* Rating Band */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block ${
                              appr.averageQuarterlyScore <= 0 || (!appr.finalRating && (!appr.recommendedRating || appr.recommendedRating === 'PENDING'))
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                : appr.averageQuarterlyScore >= 4.5
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : appr.averageQuarterlyScore >= 3.8
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : appr.averageQuarterlyScore >= 2.8
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                            }`}
                          >
                            {(appr.finalRating || appr.recommendedRating || 'PENDING').replace(/_/g, ' ')}
                          </span>
                          {appr.promotionRecommended && (
                            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-500" />
                              <span>Promoted</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Current CTC */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {appr.currency || '₹'}{currentCtc.toLocaleString()}
                      </td>

                      {/* Increment % */}
                      <td className="py-3.5 px-3 text-right">
                        {incPct > 0 ? (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">
                            +{incPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            --
                          </span>
                        )}
                      </td>

                      {/* Revised CTC */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {appr.currency || '₹'}{revisedCtc.toLocaleString()}
                      </td>

                      {/* Workflow Stage */}
                      <td className="py-3.5 px-3 text-center">
                        {getAppraisalStatusBadge(appr.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {isEligibleForLetter && (
                            <>
                              {/* Direct PDF Download Button */}
                              <button
                                type="button"
                                disabled={downloadingPdfId === appr.id}
                                onClick={(e) => handleQuickDownloadPdf(appr, e)}
                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Download Official PDF Letter (.pdf)"
                              >
                                {downloadingPdfId === appr.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>

                              {/* View Full Letter Modal */}
                              <button
                                type="button"
                                onClick={() => setSelectedAppraisalForLetter(appr)}
                                className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                                title="View Appraisal Letterhead Document"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedAppraisalForDetail(appr)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            <span>{currentUser?.role === 'HOD' ? 'View' : 'Review / Calibrate'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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
      </div>
      </>
      )}

      {/* Initiate 8-Cycle Modal */}
      {isInitiateModalOpen && (
        <InitiateAppraisalModal
          cycles={cycles}
          onClose={() => setIsInitiateModalOpen(false)}
          onSuccess={() => {
            setIsInitiateModalOpen(false);
            loadData();
          }}
        />
      )}

      {/* Batch Letter Export Modal */}
      {isBatchExportModalOpen && (
        <BatchLetterExportModal
          appraisals={appraisals}
          departments={departments}
          cycles={cycles}
          onClose={() => setIsBatchExportModalOpen(false)}
        />
      )}

      {/* Detail / Multi-stage Calibration Modal */}
      {selectedAppraisalForDetail && (
        <AppraisalDetailModal
          appraisal={selectedAppraisalForDetail}
          currentUser={currentUser}
          designations={designations}
          onClose={() => setSelectedAppraisalForDetail(null)}
          onRefresh={() => {
            setSelectedAppraisalForDetail(null);
            loadData();
          }}
        />
      )}

      {/* Printable Appraisal Letter Modal */}
      {selectedAppraisalForLetter && (
        <AppraisalLetterModal
          appraisal={selectedAppraisalForLetter}
          onClose={() => setSelectedAppraisalForLetter(null)}
        />
      )}
    </div>
  );
};

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
} from 'lucide-react';
import {
  Appraisal,
  AppraisalSummaryStats,
  Cycle,
  Department,
  Designation,
  User as AuthUser,
} from '../types';
import { api } from '../services/api';
import { InitiateAppraisalModal } from './InitiateAppraisalModal';
import { AppraisalDetailModal } from './AppraisalDetailModal';
import { AppraisalLetterModal } from './AppraisalLetterModal';
import { BatchLetterExportModal } from './BatchLetterExportModal';
import { BellCurveBudgetAnalytics } from './BellCurveBudgetAnalytics';
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
}

export const AppraisalManagementView: React.FC<AppraisalManagementViewProps> = ({
  currentUser,
  departments,
  cycles,
  designations,
  initialConfig,
}) => {
  const [activeSection, setActiveSection] = useState<'appraisals' | 'bellCurveAnalytics'>('appraisals');
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
      if (initialConfig.status) setSelectedStatus(initialConfig.status);
      if (initialConfig.appraisalId) {
        api.getAppraisals().then((res) => {
          const match = res?.find((a) => a.id === initialConfig.appraisalId);
          if (match) {
            if (initialConfig.openLetter) {
              setSelectedAppraisalForLetter(match);
            } else if (initialConfig.openDetail) {
              setSelectedAppraisalForDetail(match);
            }
          }
        }).catch((err) => console.warn('Could not auto-open appraisal record', err));
      }
    }
  }, [initialConfig]);

  const userRole = currentUser?.role || 'EMPLOYEE';
  const canInitiate = userRole === 'SUPER_ADMIN' || userRole === 'HR';
  const canBatchExport = userRole === 'SUPER_ADMIN' || userRole === 'HR' || userRole === 'EXECUTIVE_MANAGEMENT';

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
      console.error('Failed to load appraisals:', err);
      setError(err.message || 'Failed to load annual appraisals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCycleId, selectedYear, selectedDepartmentId, selectedStatus, searchQuery, onlyMine]);

  const currencySymbol = '₹';

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

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wide">
              Official Letter Engine & Batch Export
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Annual Appraisal & Salary Increment Calibration
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Automated rolling 4-quarter performance rollups, 8-Cycle (A-H) annual cohort grouping, manager & HOD budget calibration, high-resolution PDF compensation letters, and batch ZIP/CSV payroll exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5"
            title="Refresh Appraisals"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {canBatchExport && (
            <button
              onClick={() => setIsBatchExportModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              title="Bulk export formatted PDF letters, ZIP archives, and payroll sheets"
            >
              <Archive className="w-4 h-4" />
              <span>Batch Export Letters</span>
            </button>
          )}

          {canInitiate && (
            <button
              onClick={() => setIsInitiateModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Initiate 8-Cycle Cohort</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode Toggle: Annual Appraisals vs Bell Curve Calibration & Budget Controls */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto">
        <button
          onClick={() => setActiveSection('appraisals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeSection === 'appraisals'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>Annual Appraisal & Increment Calibration List</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-semibold">
            {appraisals.length} Records
          </span>
        </button>

        <button
          onClick={() => setActiveSection('bellCurveAnalytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeSection === 'bellCurveAnalytics'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
          <span>Bell Curve Calibration, Budget Pools & Executive Analytics</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded font-semibold border border-purple-200">
            Analytics
          </span>
        </button>
      </div>

      {activeSection === 'bellCurveAnalytics' ? (
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
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cohort Size</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{stats.total}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>{stats.locked} Locked / Released</span>
            </div>
          </div>

          {/* Average 4-Quarter Score */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Avg 4-Qtr Score</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{stats.averageScore.toFixed(2)}</div>
            <div className="text-[11px] text-emerald-600 font-medium">Out of 5.00 composite scale</div>
          </div>

          {/* Average Increment % */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Increment</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono">+{stats.averageIncrement}%</div>
            <div className="text-[11px] text-slate-500">Performance-calibrated avg</div>
          </div>

          {/* Total Budget Increment Impact */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Annual CTC Revision</span>
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              +{currencySymbol}{(stats.totalIncrementBudgetImpact / 100000).toFixed(2)}L
            </div>
            <div className="text-[11px] text-slate-500">Total payroll impact</div>
          </div>

          {/* Promotions */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Promotions</span>
              <Briefcase className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700 font-mono">{stats.promotionsCount}</div>
            <div className="text-[11px] text-slate-500">Elevated to higher levels</div>
          </div>
        </div>
      )}

      {/* Standard Increment Matrix Reference Card */}
      <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>8-Cycle Performance Increment Matrix Reference:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px]">
            <span className="font-bold text-emerald-800">Outstanding (4.50+):</span>{' '}
            <span className="text-emerald-700 font-mono font-semibold">15% - 20%</span>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px]">
            <span className="font-bold text-blue-800">Exceeds (3.80 - 4.49):</span>{' '}
            <span className="text-blue-700 font-mono font-semibold">10% - 14%</span>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px]">
            <span className="font-bold text-amber-800">Meets (2.80 - 3.79):</span>{' '}
            <span className="text-amber-700 font-mono font-semibold">5% - 9%</span>
          </div>
          <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-[11px]">
            <span className="font-bold text-red-800">Improvement (&lt;2.80):</span>{' '}
            <span className="text-red-700 font-mono font-semibold">0% - 4%</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Cycle Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Cycle (A - H)
            </label>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All 8 Cycles</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Month {c.appraisalMonth})
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Fiscal Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value={2026}>2026 (Current)</option>
              <option value={2025}>2025</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Department Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Department
            </label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Workflow Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Manager</option>
              <option value="MANAGER_RECOMMENDED">Manager Recommended</option>
              <option value="HOD_CALIBRATED">HOD Calibrated</option>
              <option value="HR_APPROVED">HR Approved</option>
              <option value="LOCKED">Locked & Released</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Search Employee
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, code, title..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Appraisals Data List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500">Loading appraisal cohorts...</p>
          </div>
        ) : appraisals.length === 0 ? (
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {appraisals.map((appr) => {
                  const incPct = appr.approvedIncrementPercentage || appr.proposedIncrementPercentage || 12;
                  const currentCtc = appr.currentCtc || 1800000;
                  const revisedCtc = appr.revisedCtc || currentCtc + Math.round((currentCtc * incPct) / 100);
                  const isEligibleForLetter = appr.status === 'HR_APPROVED' || appr.status === 'LOCKED' || appr.isLocked;

                  return (
                    <tr
                      key={appr.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedAppraisalForDetail(appr)}
                    >
                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                            {appr.employeeName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                            <span>{appr.employeeCode}</span>
                            <span>•</span>
                            <span>{appr.designationName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{appr.departmentName}</div>
                        </div>
                      </td>

                      {/* 8-Cycle */}
                      <td className="py-3.5 px-3">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-semibold border inline-flex items-center gap-1"
                          style={{
                            backgroundColor: `${appr.cycleColor || '#4f46e5'}15`,
                            color: appr.cycleColor || '#4f46e5',
                            borderColor: `${appr.cycleColor || '#4f46e5'}30`,
                          }}
                        >
                          <span>{appr.cycleName}</span>
                        </span>
                      </td>

                      {/* 4-Quarter Rolling Score */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {appr.averageQuarterlyScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {appr.quarterlyHistory?.length || 4} Quarters
                          </span>
                        </div>
                      </td>

                      {/* Rating Band */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block ${
                              appr.averageQuarterlyScore >= 4.5
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : appr.averageQuarterlyScore >= 3.8
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : appr.averageQuarterlyScore >= 2.8
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {(appr.finalRating || appr.recommendedRating).replace(/_/g, ' ')}
                          </span>
                          {appr.promotionRecommended && (
                            <div className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-500" />
                              <span>Promoted</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Current CTC */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        {appr.currency || '₹'}{currentCtc.toLocaleString()}
                      </td>

                      {/* Increment % */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          +{incPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Revised CTC */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {appr.currency || '₹'}{revisedCtc.toLocaleString()}
                      </td>

                      {/* Workflow Stage */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block ${
                            appr.status === 'LOCKED'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : appr.status === 'HR_APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : appr.status === 'HOD_CALIBRATED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : appr.status === 'MANAGER_RECOMMENDED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {appr.status === 'PENDING'
                            ? 'Pending Manager'
                            : appr.status === 'MANAGER_RECOMMENDED'
                            ? 'Mgr Recommended'
                            : appr.status === 'HOD_CALIBRATED'
                            ? 'HOD Calibrated'
                            : appr.status === 'HR_APPROVED'
                            ? 'HR Approved'
                            : 'Locked'}
                        </span>
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
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Download Official PDF Letter (.pdf)"
                              >
                                {downloadingPdfId === appr.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>

                              {/* View Full Letter Modal */}
                              <button
                                type="button"
                                onClick={() => setSelectedAppraisalForLetter(appr)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Appraisal Letterhead Document"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedAppraisalForDetail(appr)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <span>Calibrate</span>
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

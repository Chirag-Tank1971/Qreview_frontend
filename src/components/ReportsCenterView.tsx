import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Award,
  Users,
  Building2,
  Calendar,
  Layers,
  Shield,
  Sliders,
  ChevronRight,
  ArrowUpDown,
  Tag,
  Briefcase,
  UserCheck,
  Check,
} from 'lucide-react';
import { Department, Cycle } from '../types';
import { api } from '../services/api';

export interface ReportsViewConfig {
  reportType?: ReportType;
  departmentId?: string;
  cycleId?: string;
}

interface ReportsCenterViewProps {
  departments: Department[];
  cycles: Cycle[];
  initialConfig?: ReportsViewConfig | null;
}

type ReportType =
  | 'quarterly-status'
  | 'pending-overdue'
  | 'employee-history'
  | 'department-performance'
  | 'manager-completion'
  | 'appraisal-due'
  | 'rating-trend'
  | 'kra-performance'
  | 'audit-trail';

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({ departments, cycles, initialConfig }) => {
  const [activeReport, setActiveReport] = useState<ReportType>('quarterly-status');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Filter States
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCycle, setSelectedCycle] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedAuditModule, setSelectedAuditModule] = useState<string>('ALL');

  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.reportType) setActiveReport(initialConfig.reportType);
      if (initialConfig.departmentId) setSelectedDept(initialConfig.departmentId);
      if (initialConfig.cycleId) setSelectedCycle(initialConfig.cycleId);
    }
  }, [initialConfig]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (activeReport === 'quarterly-status') {
        const res = await api.getQuarterlyStatusReport({
          departmentId: selectedDept,
          cycleId: selectedCycle,
          status: selectedStatus,
        });
        setData(res);
      } else if (activeReport === 'pending-overdue') {
        const res = await api.getPendingOverdueReport({
          departmentId: selectedDept,
          cycleId: selectedCycle,
        });
        setData(res);
      } else if (activeReport === 'employee-history') {
        const res = await api.getEmployeeHistoryReport({
          departmentId: selectedDept,
          cycleId: selectedCycle,
          search: searchQuery,
        });
        setData(res);
      } else if (activeReport === 'department-performance') {
        const res = await api.getDepartmentPerformanceReport();
        setData(res);
      } else if (activeReport === 'manager-completion') {
        const res = await api.getManagerCompletionReport();
        setData(res);
      } else if (activeReport === 'appraisal-due') {
        const res = await api.getAppraisalDueReport({
          cycleId: selectedCycle,
          year: selectedYear,
        });
        setData(res);
      } else if (activeReport === 'rating-trend') {
        const res = await api.getRatingTrendReport();
        setData(res);
      } else if (activeReport === 'kra-performance') {
        const res = await api.getKraPerformanceReport();
        setData(res);
      } else if (activeReport === 'audit-trail') {
        const res = await api.getAuditTrailReport({
          module: selectedAuditModule,
          limit: 150,
        });
        setData(res);
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReport, selectedDept, selectedCycle, selectedStatus, selectedYear, selectedAuditModule]);

  // Export to CSV generator
  const exportToCsv = () => {
    if (!data) return;
    let headers: string[] = [];
    let rows: any[] = [];
    const filename = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'quarterly-status' && data.reportData) {
      headers = ['Employee Code', 'Employee Name', 'Department', 'Designation', 'Manager', 'Cycle', 'Period', 'Status', 'Final Score', 'Overdue'];
      rows = data.reportData.map((r: any) => [
        r.employeeCode,
        r.employeeName,
        r.departmentName,
        r.designationName,
        r.managerName,
        r.cycleCode,
        r.periodName,
        r.status,
        r.finalScore,
        r.isOverdue ? 'YES' : 'NO',
      ]);
    } else if (activeReport === 'pending-overdue' && data.reportData) {
      headers = ['Employee Code', 'Employee Name', 'Department', 'Manager', 'Pending With', 'Days Aging', 'Status', 'Due Date'];
      rows = data.reportData.map((r: any) => [
        r.employeeCode,
        r.employeeName,
        r.departmentName,
        r.managerName,
        r.pendingWith,
        r.daysAging,
        r.status,
        r.dueDate,
      ]);
    } else if (activeReport === 'employee-history' && data.reportData) {
      headers = ['Employee Code', 'Employee Name', 'Department', 'Designation', 'Cycle', 'Q1 Score', 'Q2 Score', 'Q3 Score', 'Q4 Score', 'Avg Score', 'Band', 'Appraisal Status'];
      rows = data.reportData.map((r: any) => [
        r.employeeCode,
        r.employeeName,
        r.departmentName,
        r.designationName,
        r.cycleCode,
        r.q1Score ?? '-',
        r.q2Score ?? '-',
        r.q3Score ?? '-',
        r.q4Score ?? '-',
        r.averageQuarterlyScore,
        r.performanceBand,
        r.latestAppraisalStatus,
      ]);
    } else if (activeReport === 'department-performance' && data.reportData) {
      headers = ['Department Name', 'Headcount', 'Total Reviews', 'Completed', 'Completion %', 'Avg Score', 'Outstanding (4.5+)', 'Exceeds (3.8-4.49)', 'Meets (2.8-3.79)', 'Needs Imp (<2.8)'];
      rows = data.reportData.map((r: any) => [
        r.departmentName,
        r.headcount,
        r.totalReviews,
        r.completedReviews,
        `${r.completionRate}%`,
        r.averageScore,
        r.outstandingCount,
        r.exceedsCount,
        r.meetsCount,
        r.needsImpCount,
      ]);
    } else if (activeReport === 'manager-completion' && data.reportData) {
      headers = ['Manager Name', 'Department', 'Total Assigned', 'Submitted', 'Closed', 'Returned', 'Overdue', 'Completion Rate', 'Avg Score Awarded'];
      rows = data.reportData.map((r: any) => [
        r.managerName,
        r.departmentName,
        r.totalAssigned,
        r.submittedCount,
        r.closedCount,
        r.returnedCount,
        r.overdueCount,
        `${r.completionRate}%`,
        r.avgScoreAwarded,
      ]);
    } else if (activeReport === 'appraisal-due' && data.reportData) {
      headers = ['Employee Code', 'Employee Name', 'Department', 'Designation', 'Cycle', 'Appraisal Month', 'Current CTC', '4-Qtr Avg Score', 'Proposed Increment', 'Approved Increment', 'Revised CTC', 'Status'];
      rows = data.reportData.map((r: any) => [
        r.employeeCode,
        r.employeeName,
        r.departmentName,
        r.designationName,
        r.cycleCode,
        r.appraisalMonthName,
        r.currentCtc,
        r.averageQuarterlyScore,
        `${r.proposedIncrement}%`,
        r.approvedIncrement ? `${r.approvedIncrement}%` : '-',
        r.revisedCtc,
        r.appraisalStatus,
      ]);
    } else if (activeReport === 'kra-performance' && data.reportData) {
      headers = ['KRA Name', 'Occurrences', 'Avg Weight %', 'Avg Score Rating', 'Ratings Count', 'Mastery Level'];
      rows = data.reportData.map((r: any) => [
        r.kraName,
        r.occurrencesCount,
        `${r.averageWeightPercent}%`,
        r.averageRating,
        r.ratingCount,
        r.masteryLevel,
      ]);
    } else if (activeReport === 'audit-trail' && data.logs) {
      headers = ['Timestamp', 'Module', 'Action', 'Record ID', 'Old Value', 'New Value', 'Performer User ID'];
      rows = data.logs.map((l: any) => [
        l.createdAt,
        l.module,
        l.action,
        l.recordId,
        typeof l.oldValue === 'object' ? JSON.stringify(l.oldValue) : String(l.oldValue || '-'),
        typeof l.newValue === 'object' ? JSON.stringify(l.newValue) : String(l.newValue || '-'),
        l.userId || 'SYSTEM',
      ]);
    }

    if (headers.length === 0) return;

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportNavItems: Array<{ id: ReportType; label: string; icon: any; category: string }> = [
    { id: 'quarterly-status', label: '1. Quarterly Review Status', icon: CheckCircle2, category: 'Reviews' },
    { id: 'pending-overdue', label: '2. Pending & Overdue Reviews', icon: Clock, category: 'Reviews' },
    { id: 'employee-history', label: '3. Employee Performance History', icon: Users, category: 'Performance' },
    { id: 'department-performance', label: '4. Department Performance', icon: Building2, category: 'Performance' },
    { id: 'manager-completion', label: '5. Manager-wise Completion', icon: UserCheck, category: 'Operations' },
    { id: 'appraisal-due', label: '6. 8-Cycle Appraisal Due', icon: Award, category: 'Appraisals' },
    { id: 'rating-trend', label: '7. Quarterly Rating Trends', icon: TrendingUp, category: 'Analytics' },
    { id: 'kra-performance', label: '8. KRA-wise Competency Matrix', icon: Sliders, category: 'Analytics' },
    { id: 'audit-trail', label: '9. System Compliance Audit Log', icon: Shield, category: 'Compliance' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Dedicated Reports Center</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                Section 16 Specification
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate, filter, inspect, and export all 9 mandatory organization, review, cycle, and audit compliance reports
            </p>
          </div>
        </div>

        {/* Global Export Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReportData}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={exportToCsv}
            disabled={loading || !data}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Reports Directory Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
        {reportNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeReport === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveReport(item.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-slate-400 dark:text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.category}
                </span>
              </div>
              <div className="text-xs font-bold leading-snug">{item.label}</div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Filters Bar */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Filters:</span>
          </div>

          {/* Department Filter (Applicable to most) */}
          {['quarterly-status', 'pending-overdue', 'employee-history'].includes(activeReport) && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Cycle Filter (A-H) */}
          {['quarterly-status', 'pending-overdue', 'employee-history', 'appraisal-due'].includes(activeReport) && (
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All 8 Cycles (A - H)</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {c.name.startsWith('Cycle') ? c.name : `Cycle ${c.code} (${c.name})`}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          {activeReport === 'quarterly-status' && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Review Statuses</option>
              <option value="ASSIGNED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">ASSIGNED</option>
              <option value="MANAGER_PENDING" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">MANAGER_PENDING</option>
              <option value="HR_PENDING" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">HR_PENDING</option>
              <option value="RETURNED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">RETURNED</option>
              <option value="CLOSED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">CLOSED</option>
            </select>
          )}

          {/* Audit Module Filter */}
          {activeReport === 'audit-trail' && (
            <select
              value={selectedAuditModule}
              onChange={(e) => setSelectedAuditModule(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All System Modules</option>
              <option value="REVIEWS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">REVIEWS</option>
              <option value="APPRAISALS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">APPRAISALS</option>
              <option value="KRAS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">KRAS</option>
              <option value="EMPLOYEES" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">EMPLOYEES</option>
              <option value="CYCLES" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">CYCLES</option>
            </select>
          )}

          {/* Year Filter */}
          {activeReport === 'appraisal-due' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={2026} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">FY 2026</option>
              <option value={2025} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">FY 2025</option>
            </select>
          )}

          {/* Search for employee history */}
          {activeReport === 'employee-history' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search employee code/name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>
          )}
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-semibold">
          Active Report: <strong className="text-slate-900 dark:text-white">{activeReport.replace('-', ' ').toUpperCase()}</strong>
        </span>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
          <p>Compiling specification report rows...</p>
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          No report records found for selected criteria.
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. QUARTERLY STATUS REPORT TABLE */}
          {/* ========================================================================= */}
          {activeReport === 'quarterly-status' && data.reportData && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              {data.summary && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Reviews</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{data.summary.total}</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Completed (Closed)</span>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">{data.summary.completed}</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Manager Pending</span>
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400 font-mono">{data.summary.managerPending}</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">HR Pending</span>
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-400 font-mono">{data.summary.hrPending}</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Returned Reviews</span>
                    <div className="text-lg font-bold text-rose-700 dark:text-rose-400 font-mono">{data.summary.returned}</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Avg Score</span>
                    <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400 font-mono">{data.summary.averageScore} / 5.0</div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Department & Role</th>
                        <th className="px-4 py-3">Manager</th>
                        <th className="px-4 py-3">Cycle</th>
                        <th className="px-4 py-3">Review Period</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Final Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.reportData.map((row: any, idx: number) => (
                        <tr key={row.id || row.reviewId || row.employeeId || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            <div>{row.employeeName}</div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{row.employeeCode}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            <div>{row.departmentName}</div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{row.designationName}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium">{row.managerName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold rounded">
                              Cycle {row.cycleCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.periodName}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.status === 'CLOSED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : row.status === 'RETURNED'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : row.status === 'HR_PENDING'
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {row.finalScore > 0 ? (
                              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded font-semibold border border-indigo-200 dark:border-indigo-800">
                                {Number(row.finalScore).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PENDING & OVERDUE REVIEWS REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'pending-overdue' && data.reportData && (
            <div className="space-y-4">
              {data.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Pending Reviews</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{data.summary.totalPending}</div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Pending with Manager</span>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">{data.summary.managerPendingCount}</div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Pending with HR Approval</span>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 font-mono">{data.summary.hrPendingCount}</div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Critical Overdue (&gt; 30 Days)</span>
                    <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 font-mono">{data.summary.criticalOverdueCount}</div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Manager / Assignee</th>
                        <th className="px-4 py-3">Bottleneck / Pending With</th>
                        <th className="px-4 py-3">Days Aging</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.reportData.map((row: any, idx: number) => (
                        <tr key={row.id || row.reviewId || row.employeeId || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            <div>{row.employeeName}</div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{row.employeeCode}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.departmentName}</td>
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{row.managerName}</td>
                          <td className="px-4 py-3 font-semibold text-indigo-700 dark:text-indigo-400">{row.pendingWith}</td>
                          <td className="px-4 py-3 font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                row.daysAging > 30
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {row.daysAging} Days
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{row.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. EMPLOYEE PERFORMANCE HISTORY REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'employee-history' && data.reportData && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Department & Role</th>
                      <th className="px-4 py-3">Cycle</th>
                      <th className="px-3 py-3 text-center">Q1</th>
                      <th className="px-3 py-3 text-center">Q2</th>
                      <th className="px-3 py-3 text-center">Q3</th>
                      <th className="px-3 py-3 text-center">Q4</th>
                      <th className="px-4 py-3 text-center">4-Qtr Average</th>
                      <th className="px-4 py-3">Performance Band</th>
                      <th className="px-4 py-3">Appraisal Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.reportData.map((row: any, idx: number) => (
                      <tr key={row.employeeId || row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <div>{row.employeeName}</div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{row.employeeCode}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <div>{row.departmentName}</div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{row.designationName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold rounded">
                            Cycle {row.cycleCode}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                          {row.q1Score ? row.q1Score.toFixed(2) : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                          {row.q2Score ? row.q2Score.toFixed(2) : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                          {row.q3Score ? row.q3Score.toFixed(2) : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                          {row.q4Score ? row.q4Score.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded font-semibold border border-indigo-200 dark:border-indigo-800">
                            {(row.averageQuarterlyScore ?? 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.performanceBand === 'OUTSTANDING'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : row.performanceBand === 'EXCEEDS'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : row.performanceBand === 'MEETS'
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {row.performanceBand}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {row.latestAppraisalStatus}
                          {row.approvedIncrement && (
                            <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                              (+{row.approvedIncrement}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. DEPARTMENT PERFORMANCE REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'department-performance' && data.reportData && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Headcount</th>
                        <th className="px-4 py-3">Reviews</th>
                        <th className="px-4 py-3">Completion %</th>
                        <th className="px-4 py-3">Average Score</th>
                        <th className="px-4 py-3">Outstanding (4.5+)</th>
                        <th className="px-4 py-3">Exceeds (3.8-4.49)</th>
                        <th className="px-4 py-3">Meets (2.8-3.79)</th>
                        <th className="px-4 py-3">Needs Imp (&lt;2.8)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.reportData.map((row: any, idx: number) => (
                        <tr key={row.departmentId || row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.departmentName}</td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{row.headcount} emp</td>
                          <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{row.totalReviews}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{row.completionRate}%</td>
                          <td className="px-4 py-3 font-mono font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                            {(row.averageScore ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{row.outstandingCount}</td>
                          <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-bold">{row.exceedsCount}</td>
                          <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{row.meetsCount}</td>
                          <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400 font-bold">{row.needsImpCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. MANAGER-WISE COMPLETION REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'manager-completion' && data.reportData && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Manager</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Total Assigned</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Closed</th>
                      <th className="px-4 py-3">Returned</th>
                      <th className="px-4 py-3">Overdue</th>
                      <th className="px-4 py-3">Completion Rate</th>
                      <th className="px-4 py-3 text-right">Avg Score Awarded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.reportData.map((row: any, idx: number) => (
                      <tr key={row.managerId || row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.managerName}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.departmentName}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{row.totalAssigned}</td>
                        <td className="px-4 py-3 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{row.submittedCount}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{row.closedCount}</td>
                        <td className="px-4 py-3 font-mono text-rose-600 dark:text-rose-400 font-bold">{row.returnedCount}</td>
                        <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400 font-bold">{row.overdueCount}</td>
                        <td className="px-4 py-3 font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              row.completionRate >= 80
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {row.completionRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {(row.avgScoreAwarded ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. 8-CYCLE APPRAISAL DUE REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'appraisal-due' && data.reportData && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Department & Role</th>
                      <th className="px-4 py-3">8-Cycle Schedule</th>
                      <th className="px-4 py-3">Current CTC</th>
                      <th className="px-4 py-3">4-Qtr Average</th>
                      <th className="px-4 py-3">Proposed Increment</th>
                      <th className="px-4 py-3">Approved / Revised CTC</th>
                      <th className="px-4 py-3">Appraisal Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.reportData.map((row: any, idx: number) => (
                      <tr key={row.employeeId || row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <div>{row.employeeName}</div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{row.employeeCode}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <div>{row.departmentName}</div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{row.designationName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">Cycle {row.cycleCode}</div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Month: {row.appraisalMonthName}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          ₹{(((row.currentCtc ?? 0) / 100000)).toFixed(2)}L
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {(row.averageQuarterlyScore ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-700 dark:text-amber-400">+{row.proposedIncrement ?? 0}%</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{(((row.revisedCtc ?? 0) / 100000)).toFixed(2)}L
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.isLocked
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {row.appraisalStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. QUARTERLY RATING TRENDS REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'rating-trend' && data.trends && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {data.trends.map((t: any, idx: number) => (
                  <div key={t.quarter || idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.quarter}</h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                        {(t.averageScore ?? 0).toFixed(2)} / 5.0
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t.totalReviews} Total Reviews Conducted</div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Outstanding (4.5+)</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{t.distribution.outstanding}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 dark:text-blue-400 font-semibold">Exceeds (3.8-4.49)</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{t.distribution.exceeds}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-700 dark:text-indigo-400 font-semibold">Meets (2.8-3.79)</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{t.distribution.meets}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">Needs Improvement (&lt;2.8)</span>
                        <strong className="font-mono text-slate-900 dark:text-white">{t.distribution.needsImp}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. KRA-WISE PERFORMANCE REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'kra-performance' && data.reportData && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">KRA Competency Title</th>
                      <th className="px-4 py-3">Occurrences in Reviews</th>
                      <th className="px-4 py-3">Avg Weight %</th>
                      <th className="px-4 py-3">Avg Rating Awarded</th>
                      <th className="px-4 py-3">Mastery Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.reportData.map((row: any, idx: number) => (
                      <tr key={row.kraName || row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.kraName}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{row.occurrencesCount} times</td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 font-medium">{row.averageWeightPercent}%</td>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                          {(row.averageRating ?? 0).toFixed(2)} / 5.0
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.masteryLevel === 'HIGH_PROFICIENCY'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : row.masteryLevel === 'COMPETENT'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {row.masteryLevel.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. SYSTEM COMPLIANCE AUDIT LOG EXPLORER */}
          {/* ========================================================================= */}
          {activeReport === 'audit-trail' && data.logs && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs space-y-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Module</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Record ID</th>
                      <th className="px-4 py-3">Value Transition / Remarks</th>
                      <th className="px-4 py-3">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {data.logs.map((log: any, idx: number) => (
                      <tr key={log.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-bold">
                            {log.module}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-700 dark:text-indigo-400">{log.action}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.recordId}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-sans max-w-sm truncate">
                          {log.oldValue || log.newValue ? (
                            <span>
                              {String(log.oldValue || '-')} <span className="text-slate-400 font-mono">→</span>{' '}
                              <strong className="text-slate-900 dark:text-white">{String(log.newValue || '-')}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">{log.action} executed successfully</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.userId || 'SYSTEM'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

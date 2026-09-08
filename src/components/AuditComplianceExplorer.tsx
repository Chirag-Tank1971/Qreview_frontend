import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  History,
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Building,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Fingerprint,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Info,
  RefreshCw,
  Scale,
  DollarSign,
  TrendingUp,
  Award,
  AlertOctagon,
  Layers,
  Check,
  X,
  ExternalLink,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  AuditLogEntry,
  AuditTimelineEvent,
  ComplianceFlag,
  ComplianceRiskReport,
  AuditFilterParams,
  AuditSummaryMetrics,
  AuditModule,
  AuditSeverity,
  User as UserType,
  Employee,
} from '../types';
import { api } from '../services/api';
import {
  printAuditCertificate,
  downloadAuditCertificatePdf,
  exportAuditLogsToExcel,
  exportAuditLogsToCsv,
} from '../utils/auditExport';

interface AuditComplianceExplorerProps {
  currentUser?: UserType | null;
  onNavigateToEmployee?: (employeeId: string) => void;
}

export const AuditComplianceExplorer: React.FC<AuditComplianceExplorerProps> = ({
  currentUser,
  onNavigateToEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'compliance' | 'logs' | 'certificate'>('timeline');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<AuditSummaryMetrics | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceRiskReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [timelineData, setTimelineData] = useState<{ employee: any; timeline: AuditTimelineEvent[] } | null>(null);

  // Filtering states for Master Audit Log
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<AuditModule | 'ALL'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'ALL'>('ALL');
  const [isFlaggedOnly, setIsFlaggedOnly] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Resolution modal state
  const [selectedFlagForResolution, setSelectedFlagForResolution] = useState<ComplianceFlag | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);

  // Printing and PDF export states
  const [isPrintingCert, setIsPrintingCert] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [certActionSuccess, setCertActionSuccess] = useState<string | null>(null);

  // Load core data
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [summaryRes, healthRes, logsRes, empRes] = await Promise.all([
        api.getAuditSummary(),
        api.getComplianceHealthReport(),
        api.getAuditLogs(),
        api.getEmployees(),
      ]);

      if (summaryRes.success) setMetrics(summaryRes.metrics);
      if (healthRes.success) setComplianceReport(healthRes.report);
      if (logsRes.success) setAuditLogs(logsRes.logs);
      if (Array.isArray(empRes) && empRes.length > 0) {
        setEmployees(empRes);
        setSelectedEmployeeId((prev) => (prev && empRes.some((e) => e.id === prev) ? prev : empRes[0].id));
      }
    } catch (err) {
      console.error('Failed to load audit data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load employee timeline whenever selected employee changes
  useEffect(() => {
    if (!selectedEmployeeId) return;
    const fetchTimeline = async () => {
      try {
        const res = await api.getEmployeeAuditTimeline(selectedEmployeeId);
        if (res.success) {
          setTimelineData({ employee: res.employee, timeline: res.timeline });
        }
      } catch (err) {
        console.error('Failed to load employee timeline:', err);
      }
    };
    fetchTimeline();
  }, [selectedEmployeeId]);

  // Handle Log Filters
  const handleApplyLogFilters = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        searchTerm,
        module: selectedModule,
        severity: selectedSeverity,
        isFlaggedOnly,
      });
      if (res.success) setAuditLogs(res.logs);
    } catch (err) {
      console.error('Failed to apply filters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve compliance flag
  const handleConfirmResolution = async () => {
    if (!selectedFlagForResolution) return;
    setIsResolving(true);
    try {
      const res = await api.resolveComplianceFlag(
        selectedFlagForResolution.id,
        resolutionNote || 'Reviewed and validated by compliance management.'
      );
      if (res.success) {
        setResolutionSuccess(`Flag "${selectedFlagForResolution.title}" resolved.`);
        setSelectedFlagForResolution(null);
        setResolutionNote('');
        loadData();
        setTimeout(() => setResolutionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to resolve flag:', err);
    } finally {
      setIsResolving(false);
    }
  };

  // Print Official Certificate handler
  const handlePrintCertificate = () => {
    setIsPrintingCert(true);
    setCertActionSuccess(null);
    try {
      const certData = {
        metrics,
        generatedAt: new Date().toLocaleString(),
        certificateNumber: `AUD-GOV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        signatoryName: currentUser?.name || 'Pooja Iyer',
        signatoryTitle: 'Head of Global People Operations & HR Compliance',
        organizationName: 'ENTERPRISE PERFORMANCE MANAGEMENT',
      };
      const printed = printAuditCertificate(certData);
      if (printed) {
        setCertActionSuccess('Print dialog initiated. Document rendered.');
      } else {
        setCertActionSuccess('Certificate PDF downloaded directly.');
      }
      setTimeout(() => setCertActionSuccess(null), 4000);
    } catch (err) {
      console.error('Print certificate error:', err);
    } finally {
      setTimeout(() => setIsPrintingCert(false), 800);
    }
  };

  // Download Official Certificate as PDF
  const handleDownloadCertificatePdf = () => {
    setIsDownloadingPdf(true);
    setCertActionSuccess(null);
    try {
      const certData = {
        metrics,
        generatedAt: new Date().toLocaleString(),
        certificateNumber: `AUD-GOV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        signatoryName: currentUser?.name || 'Pooja Iyer',
        signatoryTitle: 'Head of Global People Operations & HR Compliance',
        organizationName: 'ENTERPRISE PERFORMANCE MANAGEMENT',
      };
      downloadAuditCertificatePdf(certData);
      setCertActionSuccess('Official Certificate PDF generated and downloaded.');
      setTimeout(() => setCertActionSuccess(null), 4000);
    } catch (err) {
      console.error('Download certificate error:', err);
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 800);
    }
  };

  // Export Audit Data (Excel or CSV)
  const handleExportData = async (format: 'csv' | 'xlsx') => {
    try {
      if (format === 'xlsx') {
        if (auditLogs && auditLogs.length > 0) {
          exportAuditLogsToExcel(auditLogs);
          return;
        }
      } else if (format === 'csv') {
        if (auditLogs && auditLogs.length > 0) {
          exportAuditLogsToCsv(auditLogs);
          return;
        }
      }

      const exportRes = await api.exportAuditReport({ module: selectedModule, format });
      if (exportRes && exportRes.rows) {
        if (format === 'xlsx') {
          exportAuditLogsToExcel(exportRes.rows);
        } else {
          exportAuditLogsToCsv(exportRes.rows);
        }
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Governance Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Audit Trail & Compliance Timeline Explorer
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                ISO & HR Compliant
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              Immutable chronological record of appraisal lifecycle events, score overrides, HOD bell-curve calibrations,
              budget decisions, and digital letter signatures.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300/80 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Refresh Ledger</span>
            </button>

            <button
              onClick={() => handleExportData('xlsx')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-300 dark:border-slate-700 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Audit Excel</span>
            </button>

            <button
              onClick={handlePrintCertificate}
              disabled={isPrintingCert}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-all shadow-xs"
            >
              {isPrintingCert ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>Print Certificate</span>
            </button>
          </div>
        </div>

        {/* Governance Key Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
              <span>Total Logged Events</span>
              <History className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{metrics?.totalLogs || 0}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Immutable audit trail</div>
          </div>

          <div className="p-3.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 text-xs font-medium mb-1">
              <span>Calibration Overrides</span>
              <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-indigo-900 dark:text-indigo-200">{metrics?.calibrationsCount || 0}</div>
            <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">HOD rating adjustments</div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-1">
              <span>Signed Letters</span>
              <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200">{metrics?.letterAcknowledgementsCount || 0}</div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">With IP & timestamp</div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-medium mb-1">
              <span>Active Compliance Flags</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-900 dark:text-amber-200">{metrics?.flaggedAnomaliesCount || 0}</div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">Requires resolution</div>
          </div>

          <div className="p-3.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/50">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-medium mb-1">
              <span>Score Discrepancies</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-900 dark:text-rose-200">
              {complianceReport?.criticalFlagsCount || 0}
            </div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">&gt;0.8 rating shift</div>
          </div>

          <div className="p-3.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50">
            <div className="flex items-center justify-between text-teal-700 dark:text-teal-400 text-xs font-medium mb-1">
              <span>Compliance Health</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-teal-900 dark:text-teal-200">{metrics?.complianceScore || 92}%</span>
              <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-1 rounded">
                {complianceReport?.riskLevel || 'LOW'}
              </span>
            </div>
            <div className="text-[11px] text-teal-700/80 dark:text-teal-400/80 mt-0.5">Audit readiness score</div>
          </div>
        </div>
      </div>

      {/* Resolution Notification Toast */}
      {resolutionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{resolutionSuccess}</span>
          </div>
          <button onClick={() => setResolutionSuccess(null)} className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Appraisal Lifecycle Timeline</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[10px]">
            Before/After Diff
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'compliance'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Compliance Health & Anomalies</span>
          {complianceReport && complianceReport.totalActiveFlags > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded text-[10px] font-bold">
              {complianceReport.totalActiveFlags} Flags
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <Fingerprint className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          <span>Master Audit Event Stream</span>
          <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px]">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('certificate')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'certificate'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Audit Governance Certificate</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: APPRAISAL LIFECYCLE TIMELINE & DIFF
          ========================================== */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Employee Selector Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-slate-400" />
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Employee for Full Audit Audit Trail:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-100 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {emp.name || (emp as any).fullName} ({emp.employeeCode}) - {emp.departmentName} [{emp.cycleName || emp.cycleCode || 'Cycle'}]
                  </option>
                ))}
              </select>
            </div>

            {timelineData?.employee && (
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">{timelineData.employee.designation}</span>
                <span>•</span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                  {timelineData.employee.department}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded font-semibold border border-indigo-200 dark:border-indigo-800">
                  {timelineData.employee.cycle}
                </span>
              </div>
            )}
          </div>

          {/* Chronological Step Journey */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Chronological Appraisal Evolution & Decision Trail
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every stage is cryptographically recorded with actor identity, timestamp, before/after score metrics, and justification.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Lifecycle Verified</span>
              </span>
            </div>

            {timelineData?.timeline ? (
              <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {timelineData.timeline.map((event, idx) => {
                  const isOverridden = event.status === 'OVERRIDDEN';
                  const isPending = event.status === 'PENDING';
                  const isFlagged = event.status === 'FLAGGED';

                  return (
                    <div key={event.id} className="relative group">
                      {/* Timeline Node Icon */}
                      <div
                        className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 ${
                          isOverridden
                            ? 'border-amber-500 text-amber-600 dark:text-amber-400 ring-4 ring-amber-50 dark:ring-amber-950/40'
                            : isFlagged
                            ? 'border-rose-500 text-rose-600 dark:text-rose-400 ring-4 ring-rose-50 dark:ring-rose-950/40'
                            : isPending
                            ? 'border-slate-300 dark:border-slate-700 text-slate-400'
                            : 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                        }`}
                      >
                        {isOverridden ? (
                          <Scale className="w-3 h-3" />
                        ) : isFlagged ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : isPending ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <Check className="w-3 h-3 stroke-[3]" />
                        )}
                      </div>

                      {/* Content Card */}
                      <div
                        className={`rounded-xl border p-4 transition-all ${
                          isOverridden
                            ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/50 shadow-xs'
                            : isFlagged
                            ? 'bg-rose-50/30 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/50 shadow-xs'
                            : isPending
                            ? 'bg-slate-50/60 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                            : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{event.stageName}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isOverridden
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : isFlagged
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                  : isPending
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <strong className="text-slate-700 dark:text-slate-200">{event.actorName}</strong> ({event.actorRole})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {event.timestamp !== 'PENDING'
                                ? new Date(event.timestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Pending'}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-200 font-medium mb-2">{event.title}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{event.description}</p>

                        {/* Before and After Score Comparison Diff Panel */}
                        {(event.scoreBefore !== undefined || isOverridden) && (
                          <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Score Differential & Justification Trace</span>
                              </span>
                              {event.scoreBefore !== undefined && event.scoreAfter !== undefined && (
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    (event.scoreAfter ?? 0) < (event.scoreBefore ?? 0)
                                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  }`}
                                >
                                  Delta: {(((event.scoreAfter ?? 0) - (event.scoreBefore ?? 0)) > 0 ? '+' : '')}
                                  {Math.abs((event.scoreAfter ?? 0) - (event.scoreBefore ?? 0)).toFixed(2)} pts
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                  Original / Manager Rating
                                </div>
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                  {event.scoreBefore != null ? `${Number(event.scoreBefore).toFixed(2)} / 5.0` : 'Initial Baseline'}
                                </div>
                              </div>

                              <div
                                className={`p-2.5 rounded border text-xs ${
                                  isOverridden
                                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                                    : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                                }`}
                              >
                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                  Calibrated / Final Outcome
                                </div>
                                <div className="text-sm font-bold mt-0.5">
                                  {event.scoreAfter != null ? `${Number(event.scoreAfter).toFixed(2)} / 5.0` : 'Pending'}
                                </div>
                              </div>
                            </div>

                            {event.changeReason && (
                              <div className="p-2.5 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 mt-2 flex items-start gap-2">
                                <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="font-semibold text-amber-950 dark:text-amber-200">Calibration Reason: </strong>
                                  <span>{event.changeReason}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Digital Signature & Metadata Stamp */}
                        {event.details && (
                          <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                            {event.details.signatureHash && (
                              <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                <Fingerprint className="w-3 h-3 text-slate-400" />
                                <span>Hash: {event.details.signatureHash}</span>
                              </span>
                            )}
                            {event.details.ipAddress && (
                              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <span>IP: {event.details.ipAddress}</span>
                              </span>
                            )}
                            {event.details.newCtc && (
                              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                                <DollarSign className="w-3 h-3" />
                                <span>New Revised CTC: ₹{(event.details.newCtc / 100000).toFixed(2)}L p.a.</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading appraisal lifecycle events...</div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: COMPLIANCE HEALTH & ANOMALIES
          ========================================== */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Risk Overview Box */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800/60">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Governance Compliance Flags</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Automated rules detecting process violations and deviations</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {complianceReport?.totalActiveFlags || 0} Open Flags
                </span>
              </div>

              {/* Flags List */}
              <div className="space-y-3.5">
                {complianceReport?.flags.map((flag) => {
                  const isResolved = flag.isResolved;

                  return (
                    <div
                      key={flag.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isResolved
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                          : flag.severity === 'CRITICAL'
                          ? 'bg-rose-50/40 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 shadow-xs'
                          : 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isResolved
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  : flag.severity === 'CRITICAL'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {isResolved ? 'RESOLVED' : flag.severity}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{flag.title}</span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{flag.description}</p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Target: {flag.employeeName} ({flag.department})
                            </span>
                            <span>•</span>
                            <span>Detected: {new Date(flag.detectedAt).toLocaleDateString()}</span>
                            {flag.impactMetric && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-indigo-700 dark:text-indigo-400">{flag.impactMetric}</span>
                              </>
                            )}
                          </div>

                          {/* Resolved Note if exists */}
                          {isResolved && (
                            <div className="mt-2.5 p-2 rounded bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <strong>Resolved by {flag.resolvedBy}: </strong>
                                <span>{flag.resolutionNote}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {!isResolved && (
                          <button
                            onClick={() => setSelectedFlagForResolution(flag)}
                            className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-2xs"
                          >
                            Resolve & Sign Off
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Risk Matrix */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Building className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Risk Index</h3>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Aggregated audit risk score evaluated across calibration deviation variance and pending signature latencies.
              </p>

              <div className="space-y-4 pt-2">
                {complianceReport?.departmentRiskBreakdown.map((dept) => {
                  const isHigh = dept.riskScore > 50;
                  const isMed = dept.riskScore > 20 && dept.riskScore <= 50;

                  return (
                    <div key={dept.department} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{dept.department}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isHigh
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : isMed
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {dept.riskScore}% Risk
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">{dept.flagsCount} flags</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${dept.riskScore}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-100">Automated Remediation Rules:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Overrides &gt; 0.8 automatically trigger HOD escalation review.</li>
                  <li>Letters unacknowledged after 14 days trigger daily automated push reminders.</li>
                  <li>Overdue quarterly submissions block appraisal cycle progression.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: MASTER AUDIT EVENT STREAM
          ========================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyLogFilters()}
                placeholder="Search audit trail by actor, employee, description, or action..."
                className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Modules</option>
                <option value="KRA_MANAGEMENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">KRA Management</option>
                <option value="QUARTERLY_REVIEW" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Quarterly Reviews</option>
                <option value="CALIBRATION" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Calibration</option>
                <option value="BUDGET_INCREMENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Budget & Increment</option>
                <option value="LETTERS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Digital Letters</option>
                <option value="BULK_IMPORT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Bulk Import</option>
                <option value="CYCLE_ADMIN" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Cycle Admin</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Severities</option>
                <option value="CRITICAL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Critical</option>
                <option value="WARNING" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Warning</option>
                <option value="NOTICE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Notice</option>
                <option value="INFO" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Info</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer select-none px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={isFlaggedOnly}
                  onChange={(e) => setIsFlaggedOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-amber-700 dark:text-amber-400">Flagged Only</span>
              </label>

              <button
                onClick={handleApplyLogFilters}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-2xs dark:border dark:border-slate-700 cursor-pointer"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Master Event Table */}
          <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Timestamp (UTC)</th>
                  <th className="py-3 px-3.5">Module & Action</th>
                  <th className="py-3 px-3.5">Actor</th>
                  <th className="py-3 px-3.5">Target Employee / Cohort</th>
                  <th className="py-3 px-3.5">Audit Summary & Diff</th>
                  <th className="py-3 px-3.5">Severity</th>
                  <th className="py-3 px-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {auditLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${log.isFlaggedCompliance ? 'bg-amber-50/20 dark:bg-amber-950/20' : ''}`}>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{log.actionType}</div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{log.module}</span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{log.actorName}</div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Role: {log.actorRole}</span>
                        </td>

                        <td className="py-3 px-3.5">
                          {log.targetEmployeeName ? (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{log.targetEmployeeName}</div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{log.targetDepartment}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">System Level</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 max-w-xs">
                          <div className="truncate text-slate-800 dark:text-slate-200 font-medium" title={log.description}>
                            {log.description}
                          </div>
                          {log.diffSummary && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 truncate" title={log.diffSummary}>
                              {log.diffSummary}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.severity === 'CRITICAL'
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : log.severity === 'WARNING'
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : log.severity === 'NOTICE'
                                ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Forensic Metadata Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                          <td colSpan={7} className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Previous State Payload
                                </div>
                                <pre className="text-[11px] font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 overflow-x-auto">
                                  {log.previousValue
                                    ? JSON.stringify(log.previousValue, null, 2)
                                    : 'No previous state (Initial creation)'}
                                </pre>
                              </div>

                              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Committed State Payload
                                </div>
                                <pre className="text-[11px] font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 overflow-x-auto">
                                  {log.newValue ? JSON.stringify(log.newValue, null, 2) : 'N/A'}
                                </pre>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                              <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                              <span>•</span>
                              <span>User-Agent: {log.userAgent || 'Chrome/128'}</span>
                              <span>•</span>
                              <span>Log ID: {log.id}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: FORMAL COMPLIANCE CERTIFICATION
          ========================================== */}
      {activeTab === 'certificate' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Enterprise Appraisal Governance Certificate
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              This document certifies that the 8-Cycle Quarterly Performance Management & Appraisal framework has been
              conducted in accordance with statutory compliance and internal HR governance standards.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total Audit Entries</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{metrics?.totalLogs || 0}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Calibration Integrity</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">100% Traceable</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Digital Signatures</div>
              <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">OTP / IP Verified</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Audit Compliance Index</div>
              <div className="text-lg font-bold text-teal-700 dark:text-teal-400 mt-0.5">{metrics?.complianceScore || 92}%</div>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Statutory Audit Statements:</h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Score Immutability: </strong>
                  <span>
                    Quarterly review ratings submitted by reporting managers are cryptographically locked upon submission.
                    All subsequent HOD bell-curve adjustments are permanently stored as distinct delta events with mandatory written justifications.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Payroll Budget Reconciliation: </strong>
                  <span>
                    Total merit increment outlays are capped against executive-approved departmental budget pools, preventing unauthorized salary commitments.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Employee Acknowledgment Trail: </strong>
                  <span>
                    Appraisal and increment letters released to the employee self-service portal record browser session fingerprints, IPv4/IPv6 addresses, and cryptographic hashes upon digital acceptance.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Verification Seal */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800 dark:text-white">
                {currentUser?.name || 'Pooja Iyer'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Head of Global People Operations & HR Compliance
              </div>
              <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                [Digitally Signed • Token #HR-GOV-901]
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-600 dark:border-emerald-500 flex flex-col items-center justify-center p-1 text-[7px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-tighter">
                <span>OFFICIAL</span>
                <span>AUDIT SEAL</span>
                <span>ISO COMPLIANT</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 mt-1">
                CERT #AUD-GOV-{new Date().getFullYear()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800 dark:text-white">
                Vikramaditya Rao
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Chief Executive Officer & Board Chair
              </div>
              <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                [Executive Ratification Confirmed]
              </div>
            </div>
          </div>

          {certActionSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{certActionSuccess}</span>
            </div>
          )}

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Generated on: <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date().toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                id="btn-download-certificate-pdf"
                onClick={handleDownloadCertificatePdf}
                disabled={isDownloadingPdf}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Download Official PDF</span>
              </button>

              <button
                id="btn-print-official-certificate"
                onClick={handlePrintCertificate}
                disabled={isPrintingCert}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isPrintingCert ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>Print Official Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedFlagForResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resolve Compliance Flag</h3>
              </div>
              <button
                onClick={() => setSelectedFlagForResolution(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold">{selectedFlagForResolution.title}</div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">{selectedFlagForResolution.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Compliance Resolution Note / Sign-Off Justification:
              </label>
              <textarea
                rows={4}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Enter audit explanation, compensating controls, or approval references..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedFlagForResolution(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                disabled={isResolving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {isResolving ? 'Committing...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

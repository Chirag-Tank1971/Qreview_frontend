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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp_dev_1');
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
      if (Array.isArray(empRes)) {
        setEmployees(empRes);
        if (empRes.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(empRes[0].id);
        }
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/80">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Audit Trail & Compliance Timeline Explorer
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-300">
                ISO & HR Compliant
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-3xl">
              Immutable chronological record of appraisal lifecycle events, score overrides, HOD bell-curve calibrations,
              budget decisions, and digital letter signatures.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300/80"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Refresh Ledger</span>
            </button>

            <button
              onClick={() => handleExportData('xlsx')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-300 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Audit Excel</span>
            </button>

            <button
              onClick={handlePrintCertificate}
              disabled={isPrintingCert}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs"
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Total Logged Events</span>
              <History className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900">{metrics?.totalLogs || 0}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Immutable audit trail</div>
          </div>

          <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-200/60">
            <div className="flex items-center justify-between text-indigo-700 text-xs font-medium mb-1">
              <span>Calibration Overrides</span>
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-indigo-900">{metrics?.calibrationsCount || 0}</div>
            <div className="text-[11px] text-indigo-700/80 mt-0.5">HOD rating adjustments</div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-medium mb-1">
              <span>Signed Letters</span>
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-900">{metrics?.letterAcknowledgementsCount || 0}</div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">With IP & timestamp</div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/60">
            <div className="flex items-center justify-between text-amber-700 text-xs font-medium mb-1">
              <span>Active Compliance Flags</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-900">{metrics?.flaggedAnomaliesCount || 0}</div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">Requires resolution</div>
          </div>

          <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-200/60">
            <div className="flex items-center justify-between text-rose-700 text-xs font-medium mb-1">
              <span>Score Discrepancies</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-bold text-rose-900">
              {complianceReport?.criticalFlagsCount || 0}
            </div>
            <div className="text-[11px] text-rose-700/80 mt-0.5">&gt;0.8 rating shift</div>
          </div>

          <div className="p-3.5 rounded-lg bg-teal-50/60 border border-teal-200/60">
            <div className="flex items-center justify-between text-teal-700 text-xs font-medium mb-1">
              <span>Compliance Health</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-teal-900">{metrics?.complianceScore || 92}%</span>
              <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-1 rounded">
                {complianceReport?.riskLevel || 'LOW'}
              </span>
            </div>
            <div className="text-[11px] text-teal-700/80 mt-0.5">Audit readiness score</div>
          </div>
        </div>
      </div>

      {/* Resolution Notification Toast */}
      {resolutionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{resolutionSuccess}</span>
          </div>
          <button onClick={() => setResolutionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span>Appraisal Lifecycle Timeline</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px]">
            Before/After Diff
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'compliance'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Compliance Health & Anomalies</span>
          {complianceReport && complianceReport.totalActiveFlags > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
              {complianceReport.totalActiveFlags} Flags
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Fingerprint className="w-4 h-4 text-slate-700" />
          <span>Master Audit Event Stream</span>
          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px]">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('certificate')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'certificate'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <span>Audit Governance Certificate</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: APPRAISAL LIFECYCLE TIMELINE & DIFF
          ========================================== */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Employee Selector Bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-slate-400" />
              <label className="text-xs font-semibold text-slate-700">Select Employee for Full Audit Audit Trail:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode}) - {emp.departmentName} [{emp.cycleName || 'Cycle'}]
                  </option>
                ))}
              </select>
            </div>

            {timelineData?.employee && (
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{timelineData.employee.designation}</span>
                <span>•</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                  {timelineData.employee.department}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold border border-indigo-200">
                  {timelineData.employee.cycle}
                </span>
              </div>
            )}
          </div>

          {/* Chronological Step Journey */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900">
                  Chronological Appraisal Evolution & Decision Trail
                </h3>
                <p className="text-xs text-slate-500">
                  Every stage is cryptographically recorded with actor identity, timestamp, before/after score metrics, and justification.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lifecycle Verified</span>
              </span>
            </div>

            {timelineData?.timeline ? (
              <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timelineData.timeline.map((event, idx) => {
                  const isOverridden = event.status === 'OVERRIDDEN';
                  const isPending = event.status === 'PENDING';
                  const isFlagged = event.status === 'FLAGGED';

                  return (
                    <div key={event.id} className="relative group">
                      {/* Timeline Node Icon */}
                      <div
                        className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white ${
                          isOverridden
                            ? 'border-amber-500 text-amber-600 ring-4 ring-amber-50'
                            : isFlagged
                            ? 'border-rose-500 text-rose-600 ring-4 ring-rose-50'
                            : isPending
                            ? 'border-slate-300 text-slate-400'
                            : 'border-emerald-600 text-emerald-600 ring-4 ring-emerald-50'
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
                            ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                            : isFlagged
                            ? 'bg-rose-50/30 border-rose-200/80 shadow-xs'
                            : isPending
                            ? 'bg-slate-50/60 border-dashed border-slate-300 text-slate-500'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{event.stageName}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isOverridden
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isFlagged
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : isPending
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <strong className="text-slate-700">{event.actorName}</strong> ({event.actorRole})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-500">
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

                        <div className="text-xs text-slate-700 font-medium mb-2">{event.title}</div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">{event.description}</p>

                        {/* Before and After Score Comparison Diff Panel */}
                        {(event.scoreBefore !== undefined || isOverridden) && (
                          <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-2">
                            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Score Differential & Justification Trace</span>
                              </span>
                              {event.scoreBefore !== undefined && event.scoreAfter !== undefined && (
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    (event.scoreAfter ?? 0) < (event.scoreBefore ?? 0)
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  Delta: {(((event.scoreAfter ?? 0) - (event.scoreBefore ?? 0)) > 0 ? '+' : '')}
                                  {Math.abs((event.scoreAfter ?? 0) - (event.scoreBefore ?? 0)).toFixed(2)} pts
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                  Original / Manager Rating
                                </div>
                                <div className="text-sm font-bold text-slate-800 mt-0.5">
                                  {event.scoreBefore != null ? `${Number(event.scoreBefore).toFixed(2)} / 5.0` : 'Initial Baseline'}
                                </div>
                              </div>

                              <div
                                className={`p-2.5 rounded border text-xs ${
                                  isOverridden
                                    ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                                    : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                }`}
                              >
                                <div className="text-[10px] font-semibold text-slate-500 uppercase">
                                  Calibrated / Final Outcome
                                </div>
                                <div className="text-sm font-bold mt-0.5">
                                  {event.scoreAfter != null ? `${Number(event.scoreAfter).toFixed(2)} / 5.0` : 'Pending'}
                                </div>
                              </div>
                            </div>

                            {event.changeReason && (
                              <div className="p-2.5 rounded bg-amber-50/60 border border-amber-200 text-xs text-amber-900 mt-2 flex items-start gap-2">
                                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="font-semibold text-amber-950">Calibration Reason: </strong>
                                  <span>{event.changeReason}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Digital Signature & Metadata Stamp */}
                        {event.details && (
                          <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
                            {event.details.signatureHash && (
                              <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                <Fingerprint className="w-3 h-3 text-slate-400" />
                                <span>Hash: {event.details.signatureHash}</span>
                              </span>
                            )}
                            {event.details.ipAddress && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <span>IP: {event.details.ipAddress}</span>
                              </span>
                            )}
                            {event.details.newCtc && (
                              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
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
              <div className="text-center py-12 text-slate-400">Loading appraisal lifecycle events...</div>
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
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Active Governance Compliance Flags</h3>
                    <p className="text-xs text-slate-500">Automated rules detecting process violations and deviations</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
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
                          ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                          : flag.severity === 'CRITICAL'
                          ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                          : 'bg-amber-50/40 border-amber-200 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isResolved
                                  ? 'bg-slate-200 text-slate-700'
                                  : flag.severity === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {isResolved ? 'RESOLVED' : flag.severity}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{flag.title}</span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">{flag.description}</p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 flex-wrap">
                            <span className="font-semibold text-slate-700">
                              Target: {flag.employeeName} ({flag.department})
                            </span>
                            <span>•</span>
                            <span>Detected: {new Date(flag.detectedAt).toLocaleDateString()}</span>
                            {flag.impactMetric && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-indigo-700">{flag.impactMetric}</span>
                              </>
                            )}
                          </div>

                          {/* Resolved Note if exists */}
                          {isResolved && (
                            <div className="mt-2.5 p-2 rounded bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
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
                            className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
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
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Department Risk Index</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Aggregated audit risk score evaluated across calibration deviation variance and pending signature latencies.
              </p>

              <div className="space-y-4 pt-2">
                {complianceReport?.departmentRiskBreakdown.map((dept) => {
                  const isHigh = dept.riskScore > 50;
                  const isMed = dept.riskScore > 20 && dept.riskScore <= 50;

                  return (
                    <div key={dept.department} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{dept.department}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800'
                                : isMed
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {dept.riskScore}% Risk
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{dept.flagsCount} flags</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
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

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Automated Remediation Rules:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500">
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
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyLogFilters()}
                placeholder="Search audit trail by actor, employee, description, or action..."
                className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
              >
                <option value="ALL">All Modules</option>
                <option value="KRA_MANAGEMENT">KRA Management</option>
                <option value="QUARTERLY_REVIEW">Quarterly Reviews</option>
                <option value="CALIBRATION">Calibration</option>
                <option value="BUDGET_INCREMENT">Budget & Increment</option>
                <option value="LETTERS">Digital Letters</option>
                <option value="BULK_IMPORT">Bulk Import</option>
                <option value="CYCLE_ADMIN">Cycle Admin</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="NOTICE">Notice</option>
                <option value="INFO">Info</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={isFlaggedOnly}
                  onChange={(e) => setIsFlaggedOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-amber-700">Flagged Only</span>
              </label>

              <button
                onClick={handleApplyLogFilters}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Master Event Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${log.isFlaggedCompliance ? 'bg-amber-50/20' : ''}`}>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900">{log.actionType}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{log.module}</span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-800">{log.actorName}</div>
                          <span className="text-[10px] text-slate-500">Role: {log.actorRole}</span>
                        </td>

                        <td className="py-3 px-3.5">
                          {log.targetEmployeeName ? (
                            <div>
                              <div className="font-semibold text-slate-800">{log.targetEmployeeName}</div>
                              <span className="text-[10px] text-slate-500">{log.targetDepartment}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">System Level</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 max-w-xs">
                          <div className="truncate text-slate-800 font-medium" title={log.description}>
                            {log.description}
                          </div>
                          {log.diffSummary && (
                            <div className="text-[10px] text-emerald-700 font-mono mt-0.5 truncate" title={log.diffSummary}>
                              {log.diffSummary}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : log.severity === 'WARNING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : log.severity === 'NOTICE'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Forensic Metadata Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Previous State Payload
                                </div>
                                <pre className="text-[11px] font-mono bg-slate-50 p-2.5 rounded border border-slate-200/80 text-slate-700 overflow-x-auto">
                                  {log.previousValue
                                    ? JSON.stringify(log.previousValue, null, 2)
                                    : 'No previous state (Initial creation)'}
                                </pre>
                              </div>

                              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Committed State Payload
                                </div>
                                <pre className="text-[11px] font-mono bg-slate-50 p-2.5 rounded border border-slate-200/80 text-slate-700 overflow-x-auto">
                                  {log.newValue ? JSON.stringify(log.newValue, null, 2) : 'N/A'}
                                </pre>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 font-mono">
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
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2 pb-6 border-b border-slate-200">
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Enterprise Appraisal Governance Certificate
            </h2>
            <p className="text-xs text-slate-500 max-w-xl mx-auto">
              This document certifies that the 8-Cycle Quarterly Performance Management & Appraisal framework has been
              conducted in accordance with statutory compliance and internal HR governance standards.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total Audit Entries</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{metrics?.totalLogs || 0}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Calibration Integrity</div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">100% Traceable</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Digital Signatures</div>
              <div className="text-lg font-bold text-indigo-700 mt-0.5">OTP / IP Verified</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Audit Compliance Index</div>
              <div className="text-lg font-bold text-teal-700 mt-0.5">{metrics?.complianceScore || 92}%</div>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-bold text-slate-900 text-sm">Statutory Audit Statements:</h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Score Immutability: </strong>
                  <span>
                    Quarterly review ratings submitted by reporting managers are cryptographically locked upon submission.
                    All subsequent HOD bell-curve adjustments are permanently stored as distinct delta events with mandatory written justifications.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Payroll Budget Reconciliation: </strong>
                  <span>
                    Total merit increment outlays are capped against executive-approved departmental budget pools, preventing unauthorized salary commitments.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Employee Acknowledgment Trail: </strong>
                  <span>
                    Appraisal and increment letters released to the employee self-service portal record browser session fingerprints, IPv4/IPv6 addresses, and cryptographic hashes upon digital acceptance.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Verification Seal */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800">
                {currentUser?.name || 'Pooja Iyer'}
              </div>
              <div className="text-[10px] text-slate-500">
                Head of Global People Operations & HR Compliance
              </div>
              <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-1">
                [Digitally Signed • Token #HR-GOV-901]
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-600 flex flex-col items-center justify-center p-1 text-[7px] font-extrabold text-emerald-800 uppercase tracking-tighter">
                <span>OFFICIAL</span>
                <span>AUDIT SEAL</span>
                <span>ISO COMPLIANT</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 mt-1">
                CERT #AUD-GOV-{new Date().getFullYear()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800">
                Vikramaditya Rao
              </div>
              <div className="text-[10px] text-slate-500">
                Chief Executive Officer & Board Chair
              </div>
              <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-1">
                [Executive Ratification Confirmed]
              </div>
            </div>
          </div>

          {certActionSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{certActionSuccess}</span>
            </div>
          )}

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Generated on: <span className="font-semibold text-slate-800">{new Date().toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                id="btn-download-certificate-pdf"
                onClick={handleDownloadCertificatePdf}
                disabled={isDownloadingPdf}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
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
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Resolve Compliance Flag</h3>
              </div>
              <button
                onClick={() => setSelectedFlagForResolution(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold">{selectedFlagForResolution.title}</div>
              <p className="text-[11px] text-amber-800">{selectedFlagForResolution.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Compliance Resolution Note / Sign-Off Justification:
              </label>
              <textarea
                rows={4}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Enter audit explanation, compensating controls, or approval references..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedFlagForResolution(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                disabled={isResolving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
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

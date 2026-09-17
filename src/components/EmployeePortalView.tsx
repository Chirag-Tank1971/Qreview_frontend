import React, { useState, useEffect } from 'react';
import {
  User,
  Employee,
  EmployeeReview,
  Appraisal,
  KraTemplate,
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { SelfAssessmentModal } from './SelfAssessmentModal';
import { AppraisalLetterModal } from './AppraisalLetterModal';
import { downloadAppraisalPdf } from '../utils/letterExport';
import { CycleBadge } from './ui/CycleBadge';
import { PageSkeletonLoader } from './ui/PageSkeletonLoader';
import {
  Sparkles,
  Award,
  Calendar,
  Layers,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Download,
  ChevronRight,
  UserCheck,
  Building2,
  Briefcase,
  Star,
  CheckSquare,
  ShieldCheck,
  ExternalLink,
  ArrowUpRight,
  Info,
  RefreshCw,
  Sliders,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
} from 'lucide-react';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const calculateTenure = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const joinDate = new Date(dateStr);
    if (isNaN(joinDate.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''} tenure`;
    }
    if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''} tenure`;
    }
    return 'New Hire (< 1 mo)';
  } catch {
    return '';
  }
};

export interface EmployeePortalConfig {
  subTab?: 'appraisal' | 'reviews' | 'kras' | 'growth';
  employeeId?: string;
  reviewId?: string;
  periodId?: string;
  appraisalId?: string;
  openLetter?: boolean;
  openSelfAssess?: boolean;
}

interface EmployeePortalViewProps {
  onNavigateToAppraisals?: (options?: any) => void;
  onNavigateToReviews?: (options?: any) => void;
  initialConfig?: EmployeePortalConfig | null;
  employees?: Employee[];
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({
  onNavigateToAppraisals,
  onNavigateToReviews,
  initialConfig,
  employees: propEmployees,
}) => {
  const { user, employeeProfile } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>(propEmployees || []);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [essData, setEssData] = useState<{
    employee: Employee | null;
    activeAppraisal: Appraisal | null;
    allAppraisals: Appraisal[];
    reviews: EmployeeReview[];
    activeKraTemplate: KraTemplate | null;
    performanceHistory: any[];
    actionItems: any[];
    metrics: any;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'appraisal' | 'reviews' | 'kras' | 'growth'>('appraisal');

  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.subTab) setActiveTab(initialConfig.subTab);
      if (initialConfig.employeeId) setSelectedEmployeeId(initialConfig.employeeId);
    }
  }, [initialConfig]);

  // Modals
  const [selectedReviewForSelfAssess, setSelectedReviewForSelfAssess] = useState<EmployeeReview | null>(null);
  const [selectedAppraisalForLetter, setSelectedAppraisalForLetter] = useState<Appraisal | null>(null);

  // Auto-open review modal or appraisal letter when deep-linked via notifications
  useEffect(() => {
    if (initialConfig && essData?.reviews && essData.reviews.length > 0) {
      if (initialConfig.reviewId) {
        const matched = essData.reviews.find((r) => r.id === initialConfig.reviewId);
        if (matched) {
          setSelectedReviewForSelfAssess(matched);
        }
      } else if (initialConfig.openSelfAssess) {
        const pending = essData.reviews.find((r) => !r.isClosed && !r.isSelfSubmitted);
        if (pending) {
          setSelectedReviewForSelfAssess(pending);
        }
      }
    }
  }, [initialConfig, essData?.reviews]);

  useEffect(() => {
    if (initialConfig?.openLetter && essData?.allAppraisals && essData.allAppraisals.length > 0) {
      if (initialConfig.appraisalId) {
        const matched = essData.allAppraisals.find((a) => a.id === initialConfig.appraisalId);
        if (matched) setSelectedAppraisalForLetter(matched);
      } else if (essData.activeAppraisal) {
        setSelectedAppraisalForLetter(essData.activeAppraisal);
      }
    }
  }, [initialConfig, essData?.allAppraisals, essData?.activeAppraisal]);

  // Acknowledgement form state
  const [ackAccepted, setAckAccepted] = useState(false);
  const [ackComments, setAckComments] = useState('');
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);
  const [ackSuccessMessage, setAckSuccessMessage] = useState<string | null>(null);

  // Fetch all employees for quick switcher
  useEffect(() => {
    async function loadEmployees() {
      try {
        const emps = (propEmployees && propEmployees.length > 0)
          ? propEmployees
          : await api.getEmployees();
        setEmployees(emps);
        if (employeeProfile?.id) {
          setSelectedEmployeeId(employeeProfile.id);
        } else if (!selectedEmployeeId && emps.length > 0) {
          setSelectedEmployeeId(emps[0].id);
        }
      } catch (err) {
        console.error('Failed to load employee list for ESS:', err);
      }
    }
    loadEmployees();
  }, [employeeProfile, propEmployees]);

  // Fetch ESS data whenever selectedEmployeeId changes
  useEffect(() => {
    if (!selectedEmployeeId) return;
    loadEssOverview(selectedEmployeeId);
  }, [selectedEmployeeId]);

  const loadEssOverview = async (empId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setAckSuccessMessage(null);
      const data = await api.getEssOverview(empId);
      setEssData(data);
    } catch (err: any) {
      console.error('Failed to fetch ESS data:', err);
      setError(err.message || 'Failed to load Employee Self-Service data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (appraisalId: string) => {
    if (!ackAccepted) {
      toast.warning('Please check the acknowledgement confirmation box before submitting.', 'Confirmation Required');
      return;
    }
    try {
      setIsSubmittingAck(true);
      const updated = await api.acknowledgeAppraisal(appraisalId, ackComments);
      setAckSuccessMessage('Appraisal letter successfully acknowledged and digitally signed.');
      toast.success('Appraisal letter digitally acknowledged and signed.', 'Acknowledgement Confirmed');
      if (essData) {
        setEssData({
          ...essData,
          activeAppraisal: updated,
          metrics: {
            ...essData.metrics,
            hasAcknowledgedAppraisal: true,
          },
        });
      }
    } catch (err: any) {
      console.error('Failed to acknowledge appraisal:', err);
      toast.error(err.message || 'Failed to submit acknowledgement.', 'Acknowledgement Error');
    } finally {
      setIsSubmittingAck(false);
    }
  };

  const currentEmp = essData?.employee;
  const activeAppraisal = essData?.activeAppraisal;
  const reviews = essData?.reviews || [];
  const activeKra = essData?.activeKraTemplate;
  const metrics = essData?.metrics;
  const isLetterLocked = activeAppraisal?.isLocked;
  const isAcknowledged = Boolean(activeAppraisal?.employeeAcknowledgement?.acknowledged);
  const isStage1Done = Boolean(activeAppraisal && ['MANAGER_RECOMMENDED', 'HOD_CALIBRATED', 'HR_APPROVED', 'COMPLETED', 'LOCKED', 'APPROVED'].includes(activeAppraisal.status));
  const isStage2Done = Boolean(activeAppraisal && ['HOD_CALIBRATED', 'HR_APPROVED', 'COMPLETED', 'LOCKED', 'APPROVED'].includes(activeAppraisal.status));
  const isStage3Done = Boolean(activeAppraisal && ['HR_APPROVED', 'COMPLETED', 'LOCKED', 'APPROVED'].includes(activeAppraisal.status));

  if (isLoading && !essData) {
    return <PageSkeletonLoader variant="portal" />;
  }

  return (
    <div className="space-y-6">
      {/* Native Page Header & Employee Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              My Workspace
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Self-Service Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal appraisals, quarterly reviews, compensation letters, and KRA goals.
          </p>
        </div>

        {/* Administrative Employee Record Selector (Only for Admins/HR) */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 w-full sm:w-auto min-w-0">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0 flex items-center gap-1.5 pl-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Viewing:</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="flex-1 min-w-0 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[4px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer truncate sm:max-w-[240px] md:max-w-[280px]"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedEmployeeId && loadEssOverview(selectedEmployeeId)}
              title="Refresh Data"
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-[4px] hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Loading profile data...</p>
        </div>
      ) : error ? (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-[8px] flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      ) : currentEmp ? (
        <>
          {/* Executive Employee Identity & Cohort Profile Card */}
          <div key={currentEmp.id} className="bg-white dark:bg-slate-900 rounded-[8px] p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Identity Details */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[6px] flex items-center justify-center font-semibold text-lg text-white bg-blue-600 dark:bg-blue-500 shrink-0">
                  {currentEmp.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                      {currentEmp.name}
                    </h3>
                    <span className="text-xs font-medium px-1.5 py-0.2 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
                      {currentEmp.employeeCode}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] border ${
                      currentEmp.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : currentEmp.status === 'PROBATION'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {currentEmp.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentEmp.designationName} • {currentEmp.departmentName}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>Manager: <strong className="text-slate-800 dark:text-slate-200 font-medium">{currentEmp.managerName || 'Unassigned'}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>HOD: <strong className="text-slate-800 dark:text-slate-200 font-medium">{currentEmp.hodName || 'Unassigned'}</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Cycle Cohort & CTC Highlight */}
              <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-2.5 w-full lg:w-auto lg:flex lg:items-center">
                {/* 8-Cycle Badge */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-[6px] p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    Appraisal Cohort
                  </span>
                  <div className="flex items-center justify-center">
                    <CycleBadge code={currentEmp.cycleCode} />
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                    Annual: {currentEmp.cycleCode === 'F' ? 'September' : currentEmp.cycleCode === 'D' ? 'June' : 'Quarterly'}
                  </span>
                </div>

                {/* Current CTC Badge */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-[6px] p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">
                    Current Fixed CTC
                  </span>
                  <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 truncate">
                    {currentEmp.currency || '₹'}{(currentEmp.currentCtc || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 tabular-nums truncate">
                    ≈ {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 0) / 12).toLocaleString('en-IN')} / mo
                  </span>
                </div>

                {/* Composite Rolling Score */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-[6px] p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">
                    Quarterly Avg
                  </span>
                  <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500 shrink-0" />
                    <span>{metrics?.averageScore && metrics.averageScore > 0 ? metrics.averageScore.toFixed(2) : '—'}</span>
                    {metrics?.averageScore && metrics.averageScore > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ 5</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5 tabular-nums">
                    {metrics?.completedReviewsCount && metrics.completedReviewsCount > 0
                      ? `${metrics.completedReviewsCount} Quarters`
                      : 'Pending Reviews'}
                  </span>
                </div>
              </div>
            </div>

            {/* Extended Service Record & Employee Details Grid */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {/* 1. Date of Joining & Tenure */}
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[6px] p-2.5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400">Joining Date</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate tabular-nums">
                  {formatDate(currentEmp.joiningDate)}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  {calculateTenure(currentEmp.joiningDate) || 'Service Record'}
                </span>
              </div>

              {/* 2. Department & Unit */}
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[6px] p-2.5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400">Department</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={currentEmp.departmentName}>
                  {currentEmp.departmentName || 'General'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate" title={currentEmp.designationName}>
                  {currentEmp.designationName || 'Staff'}
                </span>
              </div>

              {/* 3. Corporate Work Email */}
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[6px] p-2.5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400">Work Email</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={currentEmp.email}>
                  {currentEmp.email || '—'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  SSO Linked
                </span>
              </div>

              {/* 4. Contact Phone */}
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[6px] p-2.5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400">Direct Line</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate tabular-nums">
                  {currentEmp.phone || 'Not Registered'}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                  Official Contact
                </span>
              </div>

              {/* 5. Work Location */}
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[6px] p-2.5 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400">Location</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={currentEmp.location}>
                  {currentEmp.location || 'Headquarters'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  Primary Facility
                </span>
              </div>

              {/* 6. Employment Status */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 border-t-2 border-t-purple-500/70 animate-badge-in animate-stagger-7">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <div className="w-5 h-5 rounded-md bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    currentEmp.status === 'ACTIVE' ? 'bg-emerald-500' :
                    currentEmp.status === 'PROBATION' ? 'bg-amber-500' :
                    'bg-slate-400'
                  }`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentEmp.status || 'ACTIVE'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                  {currentEmp.cycleName || `Cycle ${currentEmp.cycleCode}`}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          {/* SUB-TABS NAVIGATION BAR */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-[6px] border border-slate-200 dark:border-slate-800 overflow-x-auto select-none">
            <button
              onClick={() => setActiveTab('appraisal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'appraisal'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>Annual Appraisal & Letter</span>
              {activeAppraisal?.isLocked && !isAcknowledged && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'reviews'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Quarterly Reviews</span>
              <span className="text-[10px] tabular-nums px-1.5 py-0.2 rounded-[4px] bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {reviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('kras')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'kras'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned Goals (KRAs)</span>
            </button>

            <button
              onClick={() => setActiveTab('growth')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'growth'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>Growth Trajectory</span>
            </button>
          </div>

          {/* TAB 1: ANNUAL APPRAISAL & LETTER SIGN-OFF */}
          {activeTab === 'appraisal' && (
            <div key="tab-appraisal" className="space-y-4">
              {activeAppraisal ? (
                <div className="space-y-4">
                  {/* Status Progress Bar */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-[8px] border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {activeAppraisal.cycleName} • Annual Appraisal Cycle ({activeAppraisal.appraisalYear})
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Composite 4-quarter performance calibration and compensation revision workflow
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-[4px] text-xs font-medium border ${
                            activeAppraisal.isLocked
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : activeAppraisal.status === 'HR_APPROVED'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {activeAppraisal.isLocked
                            ? '✓ LOCKED & RELEASED'
                            : activeAppraisal.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Multi-Stage Stepper */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-3 rounded-[6px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">STAGE 1</span>
                          {isStage1Done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Manager Recommendation</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {isStage1Done
                            ? `Proposed: +${activeAppraisal.proposedIncrementPercentage ?? 0}%`
                            : 'Pending Review'}
                        </div>
                      </div>

                      <div className="p-3 rounded-[6px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">STAGE 2</span>
                          {isStage2Done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">Pending</span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">HOD Calibration</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isStage2Done ? 'Budget Cleared' : 'Awaiting Calibration'}
                        </div>
                      </div>

                      <div className="p-3 rounded-[6px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">STAGE 3</span>
                          {isStage3Done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">Pending</span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">HR Final Approval</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isStage3Done ? 'Increment Approved' : 'Pending Sign-off'}
                        </div>
                      </div>

                      <div className="p-3 rounded-[6px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">STAGE 4</span>
                          {activeAppraisal.isLocked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">Pending</span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Letter Release</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {activeAppraisal.isLocked ? 'Letter Published' : 'In Progress'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Letter & Compensation Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider block">
                          Compensation Letter Release
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {activeAppraisal.isLocked ? 'Appraisal Letter Available' : 'Compensation Proposal Under Review'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Rolling 4-Quarter Composite Score:{' '}
                          <strong className="text-slate-900 dark:text-white tabular-nums">
                            {activeAppraisal.averageQuarterlyScore && activeAppraisal.averageQuarterlyScore > 0
                              ? `${activeAppraisal.averageQuarterlyScore.toFixed(2)} / 5.00`
                              : 'Pending Reviews'}
                          </strong>
                        </p>
                      </div>

                      {activeAppraisal.isLocked && (
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => downloadAppraisalPdf(activeAppraisal)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-[6px] transition-colors cursor-pointer"
                            title="Download official PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>

                          <button
                            onClick={() => setSelectedAppraisalForLetter(activeAppraisal)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[6px] transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Letter</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Promotion Announcement if applicable */}
                    {activeAppraisal.promotionRecommended && (
                      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                        <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <h4 className="text-xs font-semibold">Promotion Approved</h4>
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            Promoted to{' '}
                            <strong>{activeAppraisal.promotionDesignationName || 'Lead Specialist'}</strong> effective{' '}
                            <strong>{activeAppraisal.effectiveDate || `${activeAppraisal.appraisalYear}-10-01`}</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Table of Revised Compensation */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-[6px] space-y-1">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Current Annual CTC
                          </span>
                          <div className="text-base font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                            {activeAppraisal.currency}{activeAppraisal.currentCtc?.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                            ≈ {activeAppraisal.currency}{Math.round((activeAppraisal.currentCtc || 0) / 12).toLocaleString()} / mo
                          </span>
                        </div>

                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-[6px] space-y-1">
                          <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                            {isStage3Done ? 'Approved Increment' : 'Increment Status'}
                          </span>
                          {isStage3Done ? (
                            <>
                              <div className="text-base font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums flex items-center gap-1.5">
                                <span>+{(activeAppraisal.approvedIncrementPercentage ?? activeAppraisal.proposedIncrementPercentage ?? 0)}%</span>
                                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                                  (+{activeAppraisal.currency}{(activeAppraisal.incrementAmount || 0).toLocaleString()})
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 tabular-nums">
                                +{activeAppraisal.currency}{Math.round((activeAppraisal.incrementAmount || 0) / 12).toLocaleString()} / mo increase
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="text-base font-semibold text-slate-500 dark:text-slate-400">
                                Under Review
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Calibration in progress
                              </span>
                            </>
                          )}
                        </div>

                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-[6px] space-y-1">
                          <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                            {isStage3Done ? 'Revised Annual CTC' : 'Projected CTC'}
                          </span>
                          {isStage3Done ? (
                            <>
                              <div className="text-base font-semibold text-blue-900 dark:text-blue-200 tabular-nums">
                                {activeAppraisal.currency}{(activeAppraisal.revisedCtc || activeAppraisal.currentCtc)?.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-blue-700 dark:text-blue-300 tabular-nums">
                                ≈ {activeAppraisal.currency}{Math.round(((activeAppraisal.revisedCtc || activeAppraisal.currentCtc) || 0) / 12).toLocaleString()} / mo
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="text-base font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                {activeAppraisal.currency}{activeAppraisal.currentCtc?.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Current baseline
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DIGITAL ACKNOWLEDGEMENT MODULE */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="max-w-3xl mx-auto">
                        {isAcknowledged ? (
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-[6px] space-y-2">
                            <div className="flex items-center gap-2.5">
                              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <div>
                                <h4 className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                                  Appraisal Letter Digitally Acknowledged & Signed
                                </h4>
                                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                                  Signed by <strong>{activeAppraisal.employeeAcknowledgement?.acknowledgedByName || currentEmp.name}</strong> on{' '}
                                  {new Date(activeAppraisal.employeeAcknowledgement?.acknowledgedAt || '').toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            {activeAppraisal.employeeAcknowledgement?.comments && (
                              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-[4px] border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 italic">
                                "{activeAppraisal.employeeAcknowledgement.comments}"
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60 tabular-nums">
                              <span>Security Ref: SEC-ACK-{activeAppraisal.id.substr(-6).toUpperCase()}</span>
                              <span>Status: Recorded in Master Audit Trail</span>
                            </div>
                          </div>
                        ) : activeAppraisal.isLocked ? (
                          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] space-y-3">
                            <div className="flex items-center gap-2.5">
                              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <div>
                                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                                  Digital Letter Acceptance Required
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Please review your appraisal details and digitally sign to confirm acceptance of the revised terms.
                                </p>
                              </div>
                            </div>

                            {ackSuccessMessage && (
                              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-[4px] text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>{ackSuccessMessage}</span>
                              </div>
                            )}

                            <div className="space-y-2.5 pt-1">
                              <label className="flex items-start gap-2.5 p-2.5 rounded-[4px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={ackAccepted}
                                  onChange={(e) => setAckAccepted(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                  I, <strong>{currentEmp.name}</strong>, hereby acknowledge receipt of my Annual Performance Appraisal Letter for Cycle <strong>{activeAppraisal.cycleName} ({activeAppraisal.appraisalYear})</strong> and confirm my acceptance of the performance evaluation rating and revised compensation structure effective <strong>{activeAppraisal.effectiveDate || `${activeAppraisal.appraisalYear}-10-01`}</strong>.
                                </span>
                              </label>

                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                                  Employee Feedback / Note (Optional):
                                </label>
                                <input
                                  type="text"
                                  value={ackComments}
                                  onChange={(e) => setAckComments(e.target.value)}
                                  placeholder="e.g. Grateful for the mentorship and excited for the upcoming roadmap."
                                  className="w-full text-xs p-2 rounded-[4px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAppraisalForLetter(activeAppraisal)}
                                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Preview Full Letter First</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={!ackAccepted || isSubmittingAck}
                                  onClick={() => handleAcknowledge(activeAppraisal.id)}
                                  className={`px-3.5 py-1.5 text-xs font-medium rounded-[6px] transition-colors cursor-pointer flex items-center gap-2 ${
                                    ackAccepted && !isSubmittingAck
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                  }`}
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>{isSubmittingAck ? 'Signing...' : 'Sign & Digitally Acknowledge'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-[6px] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
                            Appraisal review is currently in calibration stages. Digital acknowledgement will open once HR finalizes and locks the cycle letter.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current Active Baseline Compensation Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Active Base CTC
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Pre-Increment Baseline
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">Current Compensation Structure</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Annual appraisal calibration will occur in your cohort's designated evaluation month.
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] px-4 py-2.5 text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">
                          Current Fixed Annual CTC
                        </span>
                        <div className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                          {currentEmp.currency || '₹'}{(currentEmp.currentCtc || 1600000).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums block mt-0.5">
                          ≈ {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) / 12).toLocaleString('en-IN')} / month
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Component Breakdown */}
                      <div>
                        <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                          Monthly & Annual Salary Components
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-[6px] p-3">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Basic Salary (50%)</span>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                              {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) * 0.5).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums block">
                              {currentEmp.currency || '₹'}{Math.round(((currentEmp.currentCtc || 1600000) * 0.5) / 12).toLocaleString('en-IN')}/mo
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-[6px] p-3">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">House Rent (HRA 25%)</span>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                              {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) * 0.25).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums block">
                              {currentEmp.currency || '₹'}{Math.round(((currentEmp.currentCtc || 1600000) * 0.25) / 12).toLocaleString('en-IN')}/mo
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-[6px] p-3">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Special Allowance (20%)</span>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                              {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) * 0.2).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums block">
                              {currentEmp.currency || '₹'}{Math.round(((currentEmp.currentCtc || 1600000) * 0.2) / 12).toLocaleString('en-IN')}/mo
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-[6px] p-3">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Provident Fund (5%)</span>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                              {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) * 0.05).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums block">
                              {currentEmp.currency || '₹'}{Math.round(((currentEmp.currentCtc || 1600000) * 0.05) / 12).toLocaleString('en-IN')}/mo
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 8-Cycle Appraisal Framework info */}
                      <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-[6px] p-3 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <h6 className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                            Upcoming Appraisal Cohort: {currentEmp.cycleName || `Cycle ${currentEmp.cycleCode}`}
                          </h6>
                          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            Under the 8-Cycle Distributed Framework, employees in this cohort are calibrated annually during their scheduled review window. Your quarterly review scores contribute to the rolling performance score used during calibration.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUARTERLY REVIEWS & SELF-EVALUATION */}
          {activeTab === 'reviews' && (
            <div key="tab-reviews" className="space-y-6 animate-entrance animate-stagger-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Quarterly Performance Reviews & Self-Assessments
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Submit quarterly self-ratings, review manager feedback, and inspect rolling evaluation scores
                    </p>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {reviews.length} Quarterly Cycles Tracked
                  </span>
                </div>

                {reviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    No quarterly review records found for this employee.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((rev) => {
                      const isRevClosed = rev.isClosed;
                      const hasSelfSubmitted = rev.isSelfSubmitted;
                      const hasManagerSubmitted = Boolean(rev.submittedAt) || (rev.status !== 'ASSIGNED' && rev.status !== 'MANAGER_PENDING' && rev.status !== 'DRAFT');

                      return (
                        <div
                          key={rev.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] p-4 transition-colors space-y-3"
                        >
                          {/* Quarter Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {rev.reviewPeriodName}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium border ${
                                    isRevClosed
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : hasManagerSubmitted
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                      : hasSelfSubmitted
                                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  {isRevClosed
                                    ? '✓ COMPLETED'
                                    : hasManagerSubmitted
                                    ? '✓ EVALUATED'
                                    : hasSelfSubmitted
                                    ? 'IN REVIEW'
                                    : 'ACTION REQUIRED'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Reviewer: {rev.managerName || 'Reporting Manager'}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                Final Score
                              </span>
                              <div className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                                {hasManagerSubmitted && rev.finalScore ? (
                                  <span>{rev.finalScore.toFixed(2)} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ 5.0</span></span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-sm font-normal">-- / 5.0</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Scores Comparison Row */}
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Self-Rating
                              </span>
                              <div className="font-semibold text-blue-700 dark:text-blue-300 tabular-nums mt-0.5">
                                {rev.selfScore ? `${rev.selfScore.toFixed(2)} / 5.0` : 'Not submitted'}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Manager Score
                              </span>
                              <div className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                                {hasManagerSubmitted && rev.finalScore ? `${rev.finalScore.toFixed(2)} / 5.0` : 'Pending review'}
                              </div>
                            </div>
                          </div>

                          {/* Feedback Highlights if available */}
                          {rev.strengths && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-100 dark:border-slate-800 space-y-0.5">
                              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                Manager Feedback:
                              </span>
                              <p className="italic line-clamp-2">"{rev.strengths}"</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {rev.kraSnapshot?.length || 0} KRAs Scored
                            </span>

                            <button
                              onClick={() => setSelectedReviewForSelfAssess(rev)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                            >
                              <span>
                                {isRevClosed || hasManagerSubmitted
                                  ? 'View Breakdown'
                                  : hasSelfSubmitted
                                  ? 'Edit Self-Assessment'
                                  : 'Start Self-Assessment'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNED KRAS & GOALS */}
          {activeTab === 'kras' && (
            <div key="tab-kras" className="space-y-6 animate-entrance animate-stagger-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Assigned Performance KRA Framework
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeKra ? activeKra.title || activeKra.name : 'Software Engineering Core KRA'} (Mapped to {currentEmp.designationName})
                    </p>
                  </div>

                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full font-mono">
                    Total Weight: 100%
                  </span>
                </div>

                {/* KRA Items List */}
                <div className="space-y-2.5">
                  {(activeKra?.items || (reviews[0]?.kraSnapshot) || []).map((kra: any, idx: number) => (
                    <div
                      key={kra.id || idx}
                      className="p-3.5 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 tabular-nums">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                              {kra.kraName || kra.title}
                            </h4>
                            {kra.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{kra.description}</p>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums self-start">
                          Weight: {kra.weight}%
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-start gap-1.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">Target:</span>
                          <span className="text-slate-600 dark:text-slate-400">{kra.target || kra.targetSnapshot || 'Sprint deliverables on time'}</span>
                        </div>
                        {kra.measurementCriteria && (
                          <div className="flex items-start gap-1.5 pt-0.5">
                            <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">Rubric:</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">{kra.measurementCriteria}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERFORMANCE & GROWTH TRAJECTORY */}
          {activeTab === 'growth' && (
            <div key="tab-growth" className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[8px] border border-slate-200 dark:border-slate-800 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Longitudinal Performance & Career Trajectory
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Historical evaluation scores, CTC milestones, and department performance benchmarks
                  </p>
                </div>

                {/* Score Progression Bars */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Quarterly Score Progression
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {reviews.map((r, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-[6px] border border-slate-200 dark:border-slate-800 text-center space-y-1.5"
                      >
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">{r.reviewPeriodName}</span>
                        <div className="text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
                          {r.finalScore ? r.finalScore.toFixed(2) : '--'}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${((r.finalScore || 0) / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block tabular-nums">
                          Self: {r.selfScore ? `${r.selfScore.toFixed(2)}` : '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTC Milestones */}
                <div className="space-y-2.5 pt-1">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Compensation Progression Timeline
                  </h4>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-[6px] border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span>Joining Baseline CTC ({new Date(currentEmp.joiningDate || '').getFullYear()})</span>
                      <span className="tabular-nums">{currentEmp.currency}15,00,000</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1" />
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
                      <span>Current Fixed CTC (Post-Calibration)</span>
                      <span className="tabular-nums text-sm font-semibold">{currentEmp.currency}{currentEmp.currentCtc?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* SELF ASSESSMENT MODAL */}
      {selectedReviewForSelfAssess && (
        <SelfAssessmentModal
          review={selectedReviewForSelfAssess}
          onClose={() => setSelectedReviewForSelfAssess(null)}
          onSuccess={(updatedReview) => {
            if (essData) {
              setEssData({
                ...essData,
                reviews: essData.reviews.map((r) =>
                  r.id === updatedReview.id ? updatedReview : r
                ),
              });
            }
            setSelectedReviewForSelfAssess(null);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('notifications-updated'));
            }
          }}
        />
      )}

      {/* APPRAISAL LETTER MODAL */}
      {selectedAppraisalForLetter && (
        <AppraisalLetterModal
          appraisal={selectedAppraisalForLetter}
          onClose={() => setSelectedAppraisalForLetter(null)}
        />
      )}
    </div>
  );
};

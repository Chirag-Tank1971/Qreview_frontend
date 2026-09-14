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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Native Page Header & Employee Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              My Space
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
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
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto min-w-0">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0 flex items-center gap-1.5 pl-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Viewing:</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="flex-1 min-w-0 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs truncate sm:max-w-[240px] md:max-w-[280px]"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedEmployeeId && loadEssOverview(selectedEmployeeId)}
              title="Refresh Data"
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Loading profile data...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      ) : currentEmp ? (
        <>
          {/* Executive Employee Identity & Cohort Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Identity Details */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white bg-blue-600 dark:bg-blue-500 shadow-xs shrink-0">
                  {currentEmp.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      {currentEmp.name}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {currentEmp.employeeCode}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      currentEmp.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : currentEmp.status === 'PROBATION'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {currentEmp.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {currentEmp.designationName} • {currentEmp.departmentName}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Manager: <strong className="text-slate-800 dark:text-slate-200">{currentEmp.managerName || 'Unassigned'}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>HOD: <strong className="text-slate-800 dark:text-slate-200">{currentEmp.hodName || 'Unassigned'}</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Cycle Cohort & CTC Highlight */}
              <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-2.5 w-full lg:w-auto lg:flex lg:items-center">
                {/* 8-Cycle Badge */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-center">
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
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 border-t-2 border-t-emerald-500 rounded-xl p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">
                    Current Fixed CTC
                  </span>
                  <div className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 truncate">
                    {currentEmp.currency || '₹'}{(currentEmp.currentCtc || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono truncate">
                    ≈ {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 0) / 12).toLocaleString('en-IN')} / mo
                  </span>
                </div>

                {/* Composite Rolling Score */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 border-t-2 border-t-indigo-500 rounded-xl p-2.5 sm:p-3 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">
                    Quarterly Avg
                  </span>
                  <div className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500 shrink-0" />
                    <span>{metrics?.averageScore && metrics.averageScore > 0 ? metrics.averageScore.toFixed(2) : '—'}</span>
                    {metrics?.averageScore && metrics.averageScore > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">/ 5</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    {metrics?.completedReviewsCount && metrics.completedReviewsCount > 0
                      ? `${metrics.completedReviewsCount} Quarters`
                      : 'Pending Reviews'}
                  </span>
                </div>
              </div>
            </div>

            {/* Extended Service Record & Employee Details Grid */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {/* 1. Date of Joining & Tenure */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 border-t-2 border-t-indigo-500/70">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <CalendarDays className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Joining Date</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formatDate(currentEmp.joiningDate)}
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block truncate">
                  {calculateTenure(currentEmp.joiningDate) || 'Service Record'}
                </span>
              </div>

              {/* 2. Department & Unit */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 border-t-2 border-t-sky-500/70">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <div className="w-5 h-5 rounded-md bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                    <Building2 className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Department</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={currentEmp.departmentName}>
                  {currentEmp.departmentName || 'General'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate" title={currentEmp.designationName}>
                  {currentEmp.designationName || 'Staff'}
                </span>
              </div>

              {/* 3. Corporate Work Email */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 border-t-2 border-t-emerald-500/70">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Mail className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Work Email</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={currentEmp.email}>
                  {currentEmp.email || '—'}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block truncate">
                  SSO Linked
                </span>
              </div>

              {/* 4. Contact Phone */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 border-t-2 border-t-teal-500/70">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <div className="w-5 h-5 rounded-md bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                    <Phone className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Direct Line</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentEmp.phone || 'Not Registered'}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                  Official Contact
                </span>
              </div>

              {/* 5. Work Location */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 border-t-2 border-t-amber-500/70">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <div className="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Location</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={currentEmp.location}>
                  {currentEmp.location || 'Headquarters'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  Primary Facility
                </span>
              </div>

              {/* 6. Employment Status */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 border-t-2 border-t-purple-500/70">
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
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto overscroll-x-contain w-max max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => setActiveTab('appraisal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'appraisal'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>Annual Appraisal & Letter</span>
              {activeAppraisal?.isLocked && !isAcknowledged && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'reviews'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Quarterly Reviews</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {reviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('kras')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'kras'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned Goals (KRAs)</span>
            </button>

            <button
              onClick={() => setActiveTab('growth')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer shrink-0 ${
                activeTab === 'growth'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>Growth Trajectory</span>
            </button>
          </div>

          {/* TAB 1: ANNUAL APPRAISAL & LETTER SIGN-OFF */}
          {activeTab === 'appraisal' && (
            <div className="space-y-6">
              {activeAppraisal ? (
                <div className="space-y-6">
                  {/* Status Progress Bar */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {activeAppraisal.cycleName} • Annual Appraisal Cycle ({activeAppraisal.appraisalYear})
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Composite 4-quarter performance calibration and compensation revision workflow
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Lifecycle Status:</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            activeAppraisal.isLocked
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : activeAppraisal.status === 'HR_APPROVED'
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
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
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">STAGE 1</span>
                                {isStage1Done ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
                                )}
                              </div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Manager Recommendation</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {isStage1Done
                                  ? `Proposed: +${activeAppraisal.proposedIncrementPercentage ?? 0}%`
                                  : 'Pending Review'}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">STAGE 2</span>
                                {isStage2Done ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Pending</span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">HOD Department Calibration</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {isStage2Done ? 'Budget Cleared & Approved' : 'Awaiting Calibration'}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">STAGE 3</span>
                                {isStage3Done ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Pending</span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">HR Final Approval</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {isStage3Done ? 'Letter Formatted & Verified' : 'Awaiting HR Lock'}
                              </div>
                            </div>

                            <div
                              className={`p-3 rounded-xl border space-y-1 ${
                                activeAppraisal.isLocked
                                  ? isAcknowledged
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                    : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold">STAGE 4</span>
                                {isAcknowledged ? (
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : activeAppraisal.isLocked ? (
                                  <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 animate-pulse" />
                                ) : (
                                  <span className="text-[10px]">Pending</span>
                                )}
                              </div>
                              <div className="text-xs font-bold">
                                {isAcknowledged ? 'Digitally Acknowledged' : 'Employee Sign-off'}
                              </div>
                              <div className="text-[10px]">
                                {isAcknowledged ? 'Completed' : activeAppraisal.isLocked ? 'Action Required' : 'Awaiting HR Release'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Compensation Revision Highlights Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                          <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-transparent dark:border-slate-800">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                                Official Compensation Revision Summary
                              </span>
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span>Annual Performance Rating:</span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
                                  {activeAppraisal.finalRating && activeAppraisal.finalRating !== 'PENDING'
                                    ? activeAppraisal.finalRating
                                    : activeAppraisal.recommendedRating && activeAppraisal.recommendedRating !== 'PENDING'
                                    ? activeAppraisal.recommendedRating
                                    : 'PENDING EVALUATION'}
                                </span>
                              </h3>
                              <p className="text-xs text-slate-400">
                                Rolling 4-Quarter Composite Score:{' '}
                                <strong className="text-white font-mono">
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
                                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                                  title="Download official branded PDF"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download PDF</span>
                                </button>

                                <button
                                  onClick={() => setSelectedAppraisalForLetter(activeAppraisal)}
                                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>View Letter</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Promotion Announcement if applicable */}
                          {activeAppraisal.promotionRecommended && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center gap-3 text-amber-900 dark:text-amber-200">
                              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <div>
                                <h4 className="text-xs font-bold">🎉 Congratulations on your Promotion!</h4>
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                  You have been promoted to{' '}
                                  <strong>{activeAppraisal.promotionDesignationName || 'Lead Specialist'}</strong> effective{' '}
                                  <strong>{activeAppraisal.effectiveDate || `${activeAppraisal.appraisalYear}-10-01`}</strong>.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Table of Revised Compensation */}
                          <div className="p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Current Annual CTC
                                </span>
                                <div className="text-lg font-bold text-slate-700 dark:text-slate-200 font-mono">
                                  {activeAppraisal.currency}{activeAppraisal.currentCtc?.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  ≈ {activeAppraisal.currency}{Math.round((activeAppraisal.currentCtc || 0) / 12).toLocaleString()} / month
                                </span>
                              </div>

                              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                  {isStage3Done ? 'Approved Increment' : 'Increment Status'}
                                </span>
                                {isStage3Done ? (
                                  <>
                                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-1.5">
                                      <span>+{(activeAppraisal.approvedIncrementPercentage ?? activeAppraisal.proposedIncrementPercentage ?? 0)}%</span>
                                      <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                                        (+{activeAppraisal.currency}{(activeAppraisal.incrementAmount || 0).toLocaleString()})
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                      +{activeAppraisal.currency}{Math.round((activeAppraisal.incrementAmount || 0) / 12).toLocaleString()} / month increase
                                    </span>
                                  </>
                                ) : isStage1Done && (activeAppraisal.proposedIncrementPercentage || 0) > 0 ? (
                                  <>
                                    <div className="text-lg font-bold text-amber-700 dark:text-amber-300 font-mono flex items-center gap-1.5">
                                      <span>+{activeAppraisal.proposedIncrementPercentage}%</span>
                                      <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                                        (Proposed)
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                      Under review in calibration stages
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-lg font-bold text-slate-500 dark:text-slate-400 font-mono">
                                      Pending
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      Review cycle in progress
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                  {isStage3Done ? 'Revised Annual Fixed CTC' : 'Projected CTC'}
                                </span>
                                {isStage3Done ? (
                                  <>
                                    <div className="text-xl font-extrabold text-indigo-950 dark:text-indigo-200 font-mono">
                                      {activeAppraisal.currency}{(activeAppraisal.revisedCtc || activeAppraisal.currentCtc)?.toLocaleString()}
                                    </div>
                                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                                      ≈ {activeAppraisal.currency}{Math.round(((activeAppraisal.revisedCtc || activeAppraisal.currentCtc) || 0) / 12).toLocaleString()} / month (Effective {activeAppraisal.effectiveDate || `${activeAppraisal.appraisalYear}-10-01`})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-xl font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                                      {activeAppraisal.currency}{activeAppraisal.currentCtc?.toLocaleString()}
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                      Current base (Revision pending approval)
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                    {/* DIGITAL ACKNOWLEDGEMENT MODULE */}
                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                      <div className="max-w-3xl mx-auto">
                        {isAcknowledged ? (
                          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                <ShieldCheck className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                                  ✓ Appraisal Letter Digitally Acknowledged & Signed
                                </h4>
                                <p className="text-xs text-emerald-800 dark:text-emerald-300">
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
                              <div className="p-3 bg-white/70 dark:bg-slate-900/80 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 italic">
                                "{activeAppraisal.employeeAcknowledgement.comments}"
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60 font-mono">
                              <span>Security Reference: SEC-ACK-{activeAppraisal.id.substr(-6).toUpperCase()}</span>
                              <span>Status: Recorded in Master Audit Trail</span>
                            </div>
                          </div>
                        ) : activeAppraisal.isLocked ? (
                          <div className="p-5 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-4 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                <CheckSquare className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  Digital Letter Acceptance & Acknowledgement Required
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Please review your appraisal details and digitally sign to confirm acceptance of the revised terms.
                                </p>
                              </div>
                            </div>

                            {ackSuccessMessage && (
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>{ackSuccessMessage}</span>
                              </div>
                            )}

                            <div className="space-y-3 pt-2">
                              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={ackAccepted}
                                  onChange={(e) => setAckAccepted(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded text-slate-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                                />
                                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                  I, <strong>{currentEmp.name}</strong>, hereby acknowledge receipt of my Annual Performance Appraisal Letter for Cycle <strong>{activeAppraisal.cycleName} ({activeAppraisal.appraisalYear})</strong> and confirm my acceptance of the performance evaluation rating and revised compensation structure effective <strong>{activeAppraisal.effectiveDate || `${activeAppraisal.appraisalYear}-10-01`}</strong>.
                                </span>
                              </label>

                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                  Employee Feedback / Note (Optional):
                                </label>
                                <input
                                  type="text"
                                  value={ackComments}
                                  onChange={(e) => setAckComments(e.target.value)}
                                  placeholder="e.g. Grateful for the mentorship and excited for the upcoming roadmap."
                                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAppraisalForLetter(activeAppraisal)}
                                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Preview Full Letter First</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={!ackAccepted || isSubmittingAck}
                                  onClick={() => handleAcknowledge(activeAppraisal.id)}
                                  className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                                    ackAccepted && !isSubmittingAck
                                      ? 'bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white'
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
                          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-600 dark:text-slate-400">
                            Appraisal review is currently in calibration stages. Digital acknowledgement will open once HR finalizes and locks the cycle letter.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Active Baseline Compensation Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-transparent dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active Base CTC
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Pre-Increment Baseline
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white">Current Compensation Structure</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Annual appraisal calibration will occur in your cohort's designated evaluation month.
                        </p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl px-5 py-3 text-right">
                        <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold block">
                          Current Fixed Annual CTC
                        </span>
                        <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                          {currentEmp.currency || '₹'}{(currentEmp.currentCtc || 1600000).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-300 font-mono block mt-0.5">
                          ≈ {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) / 12).toLocaleString('en-IN')} / month
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Component Breakdown */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                          Monthly & Annual Salary Components
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Basic Salary (50%)</span>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">
                              {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) * 0.5).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                              {currentEmp.currency || '₹'}{Math.round(((currentEmp.currentCtc || 1600000) * 0.5) / 12).toLocaleString('en-IN')}/mo
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">House Rent (HRA 25%)</span>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">
                              {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) * 0.25).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                              {currentEmp.currency || '₹'}{Math.round(((currentEmp.currentCtc || 1600000) * 0.25) / 12).toLocaleString('en-IN')}/mo
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Special Allowance (20%)</span>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">
                              {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) * 0.2).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                              {currentEmp.currency || '₹'}{Math.round(((currentEmp.currentCtc || 1600000) * 0.2) / 12).toLocaleString('en-IN')}/mo
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Provident Fund (5%)</span>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-1">
                              {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) * 0.05).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                              {currentEmp.currency || '₹'}{Math.round(((currentEmp.currentCtc || 1600000) * 0.05) / 12).toLocaleString('en-IN')}/mo
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 8-Cycle Appraisal Framework info */}
                      <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <h6 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                            Upcoming Appraisal Cohort: {currentEmp.cycleName || `Cycle ${currentEmp.cycleCode}`}
                          </h6>
                          <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
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
            <div className="space-y-6">
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
                          className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl p-5 transition-all space-y-4 shadow-2xs"
                        >
                          {/* Quarter Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {rev.reviewPeriodName}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
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
                                    ? '✓ MANAGER EVALUATED'
                                    : hasSelfSubmitted
                                    ? 'MANAGER EVALUATION'
                                    : 'SELF-ASSESSMENT DUE'}
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
                              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                                {hasManagerSubmitted && rev.finalScore ? (
                                  <span>{rev.finalScore.toFixed(2)} <span className="text-xs text-slate-400 dark:text-slate-500">/ 5.0</span></span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-sm">-- / 5.0</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Scores Comparison Row */}
                          <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                Your Self-Rating
                              </span>
                              <div className="font-bold text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">
                                {rev.selfScore ? `${rev.selfScore.toFixed(2)} / 5.0` : 'Not submitted'}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                Manager Score
                              </span>
                              <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                                {hasManagerSubmitted && rev.finalScore ? `${rev.finalScore.toFixed(2)} / 5.0` : 'Pending review'}
                              </div>
                            </div>
                          </div>

                          {/* Feedback Highlights if available */}
                          {rev.strengths && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                Manager Strengths Highlight:
                              </span>
                              <p className="italic line-clamp-2">"{rev.strengths}"</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="pt-1 flex items-center justify-between border-t border-slate-200 dark:border-slate-700/80">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {rev.kraSnapshot?.length || 0} KRAs Scored
                            </span>

                            <button
                              onClick={() => setSelectedReviewForSelfAssess(rev)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white transition-all shadow-2xs cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>
                                {isRevClosed || hasManagerSubmitted
                                  ? 'View Review Breakdown'
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
            <div className="space-y-6">
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
                <div className="space-y-3">
                  {(activeKra?.items || (reviews[0]?.kraSnapshot) || []).map((kra: any, idx: number) => (
                    <div
                      key={kra.id || idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all space-y-2.5 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {kra.kraName || kra.title}
                            </h4>
                            {kra.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{kra.description}</p>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono self-start">
                          Weight: {kra.weight}%
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Target Metric:</span>
                          <span className="text-slate-600 dark:text-slate-400">{kra.target || kra.targetSnapshot || 'Sprint deliverables on time'}</span>
                        </div>
                        {kra.measurementCriteria && (
                          <div className="flex items-start gap-1.5 pt-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Evaluation Rubric:</span>
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
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Longitudinal Performance & Career Trajectory
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Historical evaluation scores, CTC milestones, and department performance benchmarks
                  </p>
                </div>

                {/* Score Progression Bars */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Quarterly Score Progression
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {reviews.map((r, i) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">{r.reviewPeriodName}</span>
                        <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                          {r.finalScore ? r.finalScore.toFixed(2) : '--'}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${((r.finalScore || 0) / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                          Self: {r.selfScore ? `${r.selfScore.toFixed(2)}` : '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTC Milestones */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Compensation Progression Timeline
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span>Joining Baseline CTC ({new Date(currentEmp.joiningDate || '').getFullYear()})</span>
                      <span className="font-mono">{currentEmp.currency}15,00,000</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5" />
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-300">
                      <span>Current Fixed CTC (Post-Calibration)</span>
                      <span className="font-mono text-base">{currentEmp.currency}{currentEmp.currentCtc?.toLocaleString()}</span>
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

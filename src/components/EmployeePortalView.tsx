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
import { ActionCenterInbox } from './ActionCenterInbox';
import { downloadAppraisalPdf } from '../utils/letterExport';
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
} from 'lucide-react';

export interface EmployeePortalConfig {
  subTab?: 'appraisal' | 'reviews' | 'kras' | 'growth';
  employeeId?: string;
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Employee Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Employee Self-Service (ESS) & Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View annual appraisal decisions, digitally acknowledge compensation revisions, submit quarterly self-assessments, and track KRA milestones.
          </p>
        </div>

        {/* Administrative Employee Record Selector (Only for Admins/HR) */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Viewing Employee:</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs max-w-[200px] sm:max-w-[260px] md:max-w-[300px] truncate"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {emp.name} ({emp.employeeCode} • {emp.cycleCode ? `Cycle ${emp.cycleCode}` : ''} • {emp.departmentName.split(' ')[0]})
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedEmployeeId && loadEssOverview(selectedEmployeeId)}
              title="Refresh Data"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-all shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loading Employee Self-Service Dashboard...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      ) : currentEmp ? (
        <>
          {/* Top Priority Action Center Inbox */}
          <ActionCenterInbox
            currentUser={user}
            currentEmployee={currentEmp}
            activeAppraisal={activeAppraisal}
            reviews={reviews}
            onOpenSelfAssessment={(review) => setSelectedReviewForSelfAssess(review)}
            onOpenAppraisalLetter={(appraisal) => setSelectedAppraisalForLetter(appraisal)}
            onNavigateToReviews={(opts) => onNavigateToReviews?.(opts)}
            onNavigateToAppraisals={(opts) => onNavigateToAppraisals?.(opts)}
            onRefreshData={() => selectedEmployeeId && loadEssOverview(selectedEmployeeId)}
          />

          {/* Executive Employee Identity & Cohort Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Identity Details */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                  {currentEmp.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {currentEmp.name}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {currentEmp.employeeCode}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {currentEmp.designationName} • {currentEmp.departmentName}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Manager: <strong className="text-slate-800 dark:text-slate-200">{currentEmp.managerName || 'Rohan Deshmukh'}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>HOD: <strong className="text-slate-800 dark:text-slate-200">{currentEmp.hodName || 'Vikram Mehta'}</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Cycle Cohort & CTC Highlight */}
              <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-start lg:justify-end">
                {/* 8-Cycle Badge */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-center min-w-[130px]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">
                    Appraisal Cohort
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5 mt-0.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentEmp.cycleColor || '#c2410c' }}
                    />
                    <span>{currentEmp.cycleName || `Cycle ${currentEmp.cycleCode}`}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    Annual Month: {currentEmp.cycleCode === 'F' ? 'September' : currentEmp.cycleCode === 'D' ? 'June' : 'Quarterly'}
                  </span>
                </div>

                {/* Current CTC Badge */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-center min-w-[140px]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">
                    Current Fixed CTC
                  </span>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {currentEmp.currency || '₹'}{(currentEmp.currentCtc || 1600000).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                    ≈ {currentEmp.currency || '₹'}{Math.round((currentEmp.currentCtc || 1600000) / 12).toLocaleString('en-IN')} / month
                  </span>
                </div>

                {/* Composite Rolling Score */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-center min-w-[120px]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">
                    Quarterly Avg
                  </span>
                  <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{metrics?.averageScore && metrics.averageScore > 0 ? metrics.averageScore.toFixed(2) : '4.50'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">/ 5</span>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    {metrics?.completedReviewsCount || 4} Quarters Scored
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-2xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('appraisal')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'appraisal'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Annual Appraisal & Letter Sign-Off</span>
              {activeAppraisal?.isLocked && !isAcknowledged && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'reviews'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Quarterly Reviews & Self-Evaluation</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {reviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('kras')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'kras'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Assigned KRAs & Goals</span>
            </button>

            <button
              onClick={() => setActiveTab('growth')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'growth'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Performance & Growth Trajectory</span>
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Manager Recommendation</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Proposed: +{activeAppraisal.proposedIncrementPercentage || 12}%
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">STAGE 2</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">HOD Department Calibration</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Budget Cleared & Approved</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">STAGE 3</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">HR Final Approval</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Letter Formatted & Verified</div>
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
                            {activeAppraisal.finalRating || activeAppraisal.recommendedRating}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Rolling 4-Quarter Composite Score:{' '}
                          <strong className="text-white font-mono">{activeAppraisal.averageQuarterlyScore.toFixed(2)} / 5.00</strong>
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
                            Previous Annual CTC
                          </span>
                          <div className="text-lg font-bold text-slate-700 dark:text-slate-200 font-mono">
                            {activeAppraisal.currency}{activeAppraisal.currentCtc?.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ≈ {activeAppraisal.currency}{Math.round(activeAppraisal.currentCtc / 12).toLocaleString()} / month
                          </span>
                        </div>

                        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                            Approved Increment
                          </span>
                          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-1.5">
                            <span>+{activeAppraisal.approvedIncrementPercentage || activeAppraisal.proposedIncrementPercentage}%</span>
                            <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                              (+{activeAppraisal.currency}{activeAppraisal.incrementAmount?.toLocaleString()})
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            +{activeAppraisal.currency}{Math.round((activeAppraisal.incrementAmount || 0) / 12).toLocaleString()} / month increase
                          </span>
                        </div>

                        <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                            Revised Annual Fixed CTC
                          </span>
                          <div className="text-xl font-extrabold text-indigo-950 dark:text-indigo-200 font-mono">
                            {activeAppraisal.currency}{activeAppraisal.revisedCtc?.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                            ≈ {activeAppraisal.currency}{Math.round(activeAppraisal.revisedCtc / 12).toLocaleString()} / month (Effective {activeAppraisal.effectiveDate || `${activeAppraisal.appraisalYear}-10-01`})
                          </span>
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
                                      : hasSelfSubmitted
                                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  {isRevClosed
                                    ? '✓ COMPLETED'
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
                                {rev.finalScore ? (
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
                                {rev.finalScore ? `${rev.finalScore.toFixed(2)} / 5.0` : 'Pending review'}
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
                              <span>{isRevClosed ? 'View Review Breakdown' : hasSelfSubmitted ? 'Edit Self-Assessment' : 'Start Self-Assessment'}</span>
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

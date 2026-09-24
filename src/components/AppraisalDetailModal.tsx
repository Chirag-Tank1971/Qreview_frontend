import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Award,
  TrendingUp,
  CheckCircle2,
  Lock,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Building2,
  DollarSign,
  ChevronRight,
  Sparkles,
  Sliders,
  Send,
  Loader2,
  ShieldCheck,
  Briefcase,
  RotateCcw,
} from 'lucide-react';
import { Appraisal, Designation, User as AuthUser, EmployeeStatus } from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import { AppraisalLetterModal } from './AppraisalLetterModal';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface AppraisalDetailModalProps {
  appraisal: Appraisal;
  currentUser: AuthUser | null;
  designations: Designation[];
  onClose: () => void;
  onRefresh: () => void;
}

export const AppraisalDetailModal: React.FC<AppraisalDetailModalProps> = ({
  appraisal,
  currentUser,
  designations,
  onClose,
  onRefresh,
}) => {
  const { isMounted, handleClose, handleBackdropClick, backdropClass, cardClass } = useModalAnimation({
    isOpen: true,
    onClose,
  });

  const [activeTab, setActiveTab] = useState<'breakdown' | 'calibrate' | 'audit'>('calibrate');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showLetterModal, setShowLetterModal] = useState<boolean>(false);
  const [confirmActionType, setConfirmActionType] = useState<'MANAGER' | 'HOD' | 'HOD_RETURN' | 'HR_APPROVE' | 'LOCK' | null>(null);
  const [hodReturnReason, setHodReturnReason] = useState<string>('');

  // Form states
  const [incrementPercent, setIncrementPercent] = useState<number>(
    appraisal.approvedIncrementPercentage ??
      appraisal.proposedIncrementPercentage ??
      appraisal.suggestedIncrementMin ??
      (appraisal.averageQuarterlyScore > 0 ? 10 : 0)
  );
  const [promotionRecommended, setPromotionRecommended] = useState<boolean>(
    appraisal.promotionRecommended || false
  );
  const [promotionDesignationId, setPromotionDesignationId] = useState<string>(
    appraisal.promotionDesignationId || ''
  );
  const [justification, setJustification] = useState<string>(
    appraisal.managerRecommendation?.justification || ''
  );
  const [strengthsSummary, setStrengthsSummary] = useState<string>(
    appraisal.managerRecommendation?.strengthsSummary || ''
  );
  const [hodNotes, setHodNotes] = useState<string>(
    appraisal.hodCalibration?.notes || ''
  );
  const [hrNotes, setHrNotes] = useState<string>(
    appraisal.hrApproval?.notes || ''
  );
  const [effectiveDate, setEffectiveDate] = useState<string>(
    appraisal.effectiveDate || `${appraisal.appraisalYear}-10-01`
  );

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmActionType) {
          setConfirmActionType(null);
        } else if (!showLetterModal) {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmActionType, showLetterModal, handleClose]);

  const currencySymbol = appraisal.currency || '₹';
  const currentCtc = appraisal.currentCtc || 1800000;
  const incrementAmount = Math.round((currentCtc * incrementPercent) / 100);
  const calculatedRevisedCtc = currentCtc + incrementAmount;
  const currentMonthly = Math.round(currentCtc / 12);
  const revisedMonthly = Math.round(calculatedRevisedCtc / 12);
  const monthlyIncrement = revisedMonthly - currentMonthly;

  const userRole = currentUser?.role || 'EMPLOYEE';
  // Capability is derived from the actual manager/HOD relationship on this appraisal,
  // not from the user's single account-level role label — the same person can hold
  // both capacities (e.g. when they are both the reporting manager and the HOD).
  const canActInElevatedCapacity = userRole !== 'EMPLOYEE';
  const isManager =
    canActInElevatedCapacity &&
    (appraisal.managerId === currentUser?.employeeId || appraisal.managerId === currentUser?.id);
  const isHod = canActInElevatedCapacity && appraisal.hodId === currentUser?.employeeId;
  const isHr = userRole === 'HR' || userRole === 'SUPER_ADMIN';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isLocked = appraisal.isLocked || appraisal.status === 'LOCKED';
  const canHodAct =
    isHod &&
    ['MANAGER_RECOMMENDED', 'HOD_CALIBRATED'].includes(appraisal.status) &&
    !isLocked;
  const canEdit = !isLocked && (isHr || isManager || canHodAct);

  // Filter promotion designations strictly to the employee's current department
  const departmentDesignations = React.useMemo(() => {
    // 1. Filter designations matching employee's current department
    const deptList = designations.filter((d) => {
      const matchId = appraisal.departmentId && d.departmentId === appraisal.departmentId;
      const matchName =
        appraisal.departmentName &&
        d.departmentName &&
        d.departmentName.trim().toLowerCase() === appraisal.departmentName.trim().toLowerCase();
      return Boolean(matchId || matchName);
    });

    const targetList = deptList.length > 0 ? deptList : designations;

    // 2. Exclude employee's current designation so user doesn't recommend promotion to their existing role
    const eligibleList = targetList.filter((d) => {
      if (d.id === promotionDesignationId) return true;
      const isCurrent =
        (appraisal.designationId && d.id === appraisal.designationId) ||
        (appraisal.designationName && d.name.trim().toLowerCase() === appraisal.designationName.trim().toLowerCase());
      return !isCurrent;
    });

    const finalOptions = eligibleList.length > 0 ? eligibleList : targetList;

    // 3. Sort by hierarchy level ascending
    return [...finalOptions].sort((a, b) => a.level - b.level);
  }, [
    designations,
    appraisal.departmentId,
    appraisal.departmentName,
    appraisal.designationId,
    appraisal.designationName,
    promotionDesignationId,
  ]);

  // Helper for employment status badge
  const getEmployeeStatusBadge = (empStatus?: EmployeeStatus) => {
    if (!empStatus || empStatus === 'ACTIVE') return null;
    if (empStatus === 'INACTIVE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          OFFBOARDED / INACTIVE
        </span>
      );
    }
    if (empStatus === 'NOTICE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          SERVING NOTICE
        </span>
      );
    }
    if (empStatus === 'PROBATION') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          PROBATION
        </span>
      );
    }
    return null;
  };

  const isRestrictedFromIncrement = appraisal.employeeStatus === 'INACTIVE' || appraisal.employeeStatus === 'NOTICE';

  // Manager Recommendation Submit
  const handleManagerSubmit = async () => {
    if (isRestrictedFromIncrement) {
      const msg = `Cannot submit appraisal recommendation for an employee with status: ${appraisal.employeeStatus}.`;
      setError(msg);
      toast.error(msg, 'Action Restricted');
      setConfirmActionType(null);
      return;
    }
    if (!justification.trim()) {
      const msg = 'Please provide a manager recommendation justification before submitting.';
      setError(msg);
      toast.warning(msg, 'Justification Required');
      setConfirmActionType(null);
      return;
    }
    if (promotionRecommended && !promotionDesignationId) {
      const msg = 'Please select the proposed promoted designation level.';
      setError(msg);
      toast.warning(msg, 'Designation Required');
      setConfirmActionType(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const selectedDes = designations.find((d) => d.id === promotionDesignationId);
      await api.submitManagerRecommendation(appraisal.id, {
        suggestedIncrementPercent: incrementPercent,
        promotionRecommended,
        promotionDesignationId: promotionRecommended ? promotionDesignationId : undefined,
        promotionDesignationName: promotionRecommended ? selectedDes?.name : undefined,
        justification,
        strengthsSummary,
      });
      setConfirmActionType(null);
      toast.success(`Manager recommendation submitted for ${appraisal.employeeName}.`, 'Recommendation Saved');
      onRefresh();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to submit recommendation';
      setError(errMsg);
      toast.error(errMsg, 'Submission Error');
      setConfirmActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HOD Calibration Submit
  const handleHodSubmit = async () => {
    if (isRestrictedFromIncrement) {
      const msg = `Cannot calibrate appraisal for an employee with status: ${appraisal.employeeStatus}.`;
      setError(msg);
      toast.error(msg, 'Action Restricted');
      setConfirmActionType(null);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitHodCalibration(appraisal.id, {
        calibratedIncrementPercent: incrementPercent,
        promotionApproved: promotionRecommended,
        notes: hodNotes.trim() || 'HOD departmental calibration and budget alignment completed.',
      });
      setConfirmActionType(null);
      toast.success(`HOD calibration saved at +${incrementPercent}% increment.`, 'Calibration Saved');
      onRefresh();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to submit HOD calibration';
      setError(errMsg);
      toast.error(errMsg, 'Calibration Error');
      setConfirmActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HOD Return to Manager
  const handleHodReturn = async () => {
    if (!hodReturnReason.trim()) {
      const msg = 'Please provide a reason for returning this appraisal to the manager.';
      setError(msg);
      toast.warning(msg, 'Reason Required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.returnAppraisalToManager(appraisal.id, { reason: hodReturnReason.trim() });
      setConfirmActionType(null);
      setHodReturnReason('');
      toast.success(`Appraisal returned to manager for ${appraisal.employeeName}.`, 'Returned to Manager');
      onRefresh();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to return appraisal to manager';
      setError(errMsg);
      toast.error(errMsg, 'Return Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // HR Approval Submit
  const handleHrApprove = async () => {
    if (isRestrictedFromIncrement) {
      const msg = `Cannot approve appraisal for an employee with status: ${appraisal.employeeStatus}.`;
      setError(msg);
      toast.error(msg, 'Action Restricted');
      setConfirmActionType(null);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitHrApproval(appraisal.id, {
        finalIncrementPercent: incrementPercent,
        finalRating: appraisal.finalRating || appraisal.recommendedRating || 'MEETS_EXPECTATIONS',
        revisedCtc: calculatedRevisedCtc,
        effectiveDate,
        notes: hrNotes,
      });
      setConfirmActionType(null);
      toast.success(`HR approved appraisal for ${appraisal.employeeName} (+${incrementPercent}%).`, 'Appraisal Approved');
      onRefresh();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to submit HR approval';
      setError(errMsg);
      toast.error(errMsg, 'Approval Error');
      setConfirmActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Lock Appraisal (Final Lock & Release)
  const handleExecuteLock = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.lockAppraisal(appraisal.id, {
        finalIncrementPercent: incrementPercent,
        finalRating: appraisal.finalRating || appraisal.recommendedRating,
        revisedCtc: calculatedRevisedCtc,
        effectiveDate,
        promotionApproved: promotionRecommended,
        promotionDesignationId: promotionRecommended ? promotionDesignationId : undefined,
        promotionDesignationName: promotionRecommended
          ? designations.find((d) => d.id === promotionDesignationId)?.name || appraisal.promotionDesignationName
          : undefined,
        notes: hrNotes,
      });
      setConfirmActionType(null);
      toast.success(`Appraisal officially locked and compensation letter released!`, 'Letter Released');
      onRefresh();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to lock appraisal';
      setError(errMsg);
      toast.error(errMsg, 'Lock Error');
      setConfirmActionType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenConfirm = (type: 'MANAGER' | 'HOD' | 'HOD_RETURN' | 'HR_APPROVE' | 'LOCK') => {
    setError(null);
    if (type === 'HOD_RETURN') {
      setHodReturnReason('');
    }
    if (type === 'MANAGER') {
      if (!justification.trim()) {
        const msg = 'Please provide a manager recommendation justification before submitting.';
        setError(msg);
        toast.warning(msg, 'Justification Required');
        return;
      }
      if (promotionRecommended && !promotionDesignationId) {
        const msg = 'Please select the proposed promoted designation level.';
        setError(msg);
        toast.warning(msg, 'Designation Required');
        return;
      }
    }
    setConfirmActionType(type);
  };

  const handleExecuteConfirmAction = () => {
    if (confirmActionType === 'MANAGER') {
      handleManagerSubmit();
    } else if (confirmActionType === 'HOD') {
      handleHodSubmit();
    } else if (confirmActionType === 'HOD_RETURN') {
      handleHodReturn();
    } else if (confirmActionType === 'HR_APPROVE') {
      handleHrApprove();
    } else if (confirmActionType === 'LOCK') {
      handleExecuteLock();
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9990] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 ${backdropClass}`}
        onClick={handleBackdropClick}
      >
        <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col ${cardClass}`}>
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-white">{appraisal.employeeName}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-white/10 text-slate-300">
                    {appraisal.employeeCode}
                  </span>
                  {getEmployeeStatusBadge(appraisal.employeeStatus)}
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold border"
                    style={{
                      backgroundColor: `${appraisal.cycleColor || '#4f46e5'}20`,
                      color: appraisal.cycleColor || '#818cf8',
                      borderColor: `${appraisal.cycleColor || '#4f46e5'}40`,
                    }}
                  >
                    {appraisal.cycleName} • {appraisal.appraisalYear}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {appraisal.designationName} • {appraisal.departmentName} • Rolling Score:{' '}
                  <strong className="text-indigo-300 font-mono">{appraisal.averageQuarterlyScore.toFixed(2)} / 5.0</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(appraisal.status === 'HR_APPROVED' || appraisal.status === 'LOCKED' || appraisal.isLocked) && (
                <button
                  type="button"
                  onClick={() => setShowLetterModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">View Appraisal Letter</span>
                  <span className="sm:hidden">Letter</span>
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* HOD RETURNED BANNER */}
          {appraisal.status === 'PENDING' && appraisal.hodReturn && (
            <div className="px-6 py-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Returned by HOD {appraisal.hodReturn.returnedByName}
                  {appraisal.hodReturn.returnedAt ? ` on ${new Date(appraisal.hodReturn.returnedAt).toLocaleDateString()}` : ''}
                </p>
                <p className="text-rose-800 dark:text-rose-300 text-[11px] mt-0.5">
                  Reason: {appraisal.hodReturn.reason}
                </p>
              </div>
            </div>
          )}

          {/* INACTIVE / NOTICE RESTRICTION BANNER */}
          {isRestrictedFromIncrement && (
            <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {appraisal.employeeStatus === 'INACTIVE'
                    ? 'Employee is Offboarded / Inactive'
                    : 'Employee is Serving Notice Period'}
                </p>
                <p className="text-amber-800 dark:text-amber-300 text-[11px] mt-0.5">
                  Annual salary increment recommendations, budget calibration, and promotions are restricted for employees with employment status <strong className="uppercase">{appraisal.employeeStatus}</strong>. Historical performance records remain accessible for audit and compliance.
                </p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="px-3 sm:px-6 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 shrink-0">
            <div className="flex gap-1 sm:gap-2 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setActiveTab('calibrate')}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'calibrate'
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>Salary Calibration & Recommendation</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('breakdown')}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'breakdown'
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>4-Quarter Review Performance History ({appraisal.quarterlyHistory?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Multi-Stage Sign-Off Audit Trail</span>
              </button>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2 pb-2 sm:pb-0">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                  appraisal.status === 'LOCKED'
                    ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700'
                    : appraisal.status === 'HR_APPROVED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                    : appraisal.status === 'HOD_CALIBRATED'
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60'
                    : appraisal.status === 'MANAGER_RECOMMENDED'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Workflow: {appraisal.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50 dark:bg-slate-900/60">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: CALIBRATION & SALARY REVISION */}
            {activeTab === 'calibrate' && (
              <div className="space-y-6">
                {/* When Locked: Prominent Approved & Locked Master Banner */}
                {isLocked && (
                  <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Appraisal Approved & Locked</h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Immutable Record
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          All approved compensation settings, revised CTC ({currencySymbol}{calculatedRevisedCtc.toLocaleString()}), and designation are permanently locked in the system.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLetterModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Official Appraisal Letter</span>
                    </button>
                  </div>
                )}

                {/* Rolling Score & Recommended Matrix Guideline Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Rolling 4-Quarter Score
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-indigo-950 dark:text-indigo-100 font-mono">
                        {appraisal.averageQuarterlyScore.toFixed(2)}
                      </span>
                      <span className="text-xs text-indigo-700 dark:text-indigo-300">/ 5.00</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                      Calculated from {appraisal.quarterlyHistory?.length || 4} evaluated quarters
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Rating & Increment Matrix
                    </span>
                    <div className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                      {(appraisal.recommendedRating || 'N/A').replace(/_/g, ' ')}
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Standard Guideline Band:{' '}
                      <strong>
                        {appraisal.suggestedIncrementMin}% - {appraisal.suggestedIncrementMax}%
                      </strong>
                    </p>
                  </div>

                  <div className="p-4 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Current Compensation
                    </span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                      {currencySymbol}{currentCtc.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {currencySymbol}{currentMonthly.toLocaleString()} / month gross
                    </p>
                  </div>
                </div>

                {/* Live Salary Calibration Playground / Approved Settings */}
                <div className="p-5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Compensation & Increment Calibration</span>
                        {isLocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                            <span>Approved & Locked</span>
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isLocked
                          ? 'Approved increment percentage and finalized CTC impact'
                          : 'Adjust proposed increment percentage to simulate CTC budget impact'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {isLocked ? 'Approved Increment' : 'Proposed Increment'}
                      </div>
                      <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">+{incrementPercent.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>0% (No Revision)</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Recommended Band: {appraisal.suggestedIncrementMin}% - {appraisal.suggestedIncrementMax}%
                      </span>
                      <span>25% (Exceptional)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="0.5"
                      value={incrementPercent}
                      disabled={!canEdit}
                      onChange={(e) => setIncrementPercent(parseFloat(e.target.value))}
                      className={`w-full h-2 rounded-lg appearance-none accent-indigo-600 ${
                        !canEdit ? 'bg-slate-300 dark:bg-slate-700 opacity-60 cursor-not-allowed' : 'bg-slate-200 dark:bg-slate-700 cursor-pointer'
                      }`}
                    />
                  </div>

                  {/* Compensation Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase flex items-center justify-between">
                        <span>Annual Increment</span>
                        {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        +{currencySymbol}{incrementAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">+{currencySymbol}{monthlyIncrement.toLocaleString()} / mo</div>
                    </div>

                    <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-800/60 space-y-1">
                      <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold uppercase flex items-center justify-between">
                        <span>Revised Annual CTC</span>
                        {isLocked && <Lock className="w-3 h-3 text-indigo-400" />}
                      </div>
                      <div className="text-lg font-bold text-indigo-950 dark:text-white font-mono">
                        {currencySymbol}{calculatedRevisedCtc.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-indigo-700 dark:text-indigo-300">Gross annual fixed salary</div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase flex items-center justify-between">
                        <span>Revised Monthly</span>
                        {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        {currencySymbol}{revisedMonthly.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Gross monthly pre-tax</div>
                    </div>
                  </div>
                </div>

                {/* Promotion Section */}
                <div className="p-5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Promotion Recommendation</h4>
                      {isLocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>

                    <label className={`flex items-center gap-2 ${!canEdit ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={promotionRecommended}
                        disabled={!canEdit}
                        onChange={(e) => setPromotionRecommended(e.target.checked)}
                        className={`w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 ${
                          !canEdit ? 'cursor-not-allowed' : ''
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-700 select-none">
                        Recommend for Promotion
                      </span>
                    </label>
                  </div>

                  {promotionRecommended && (
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                            Proposed Promoted Designation <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 border border-amber-200/60 dark:border-amber-700/60 px-2 py-0.5 rounded-md">
                            {appraisal.departmentName || 'Current Department'} Track
                          </span>
                        </div>
                        <select
                          value={promotionDesignationId}
                          disabled={!canEdit}
                          onChange={(e) => setPromotionDesignationId(e.target.value)}
                          className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none ${
                            !canEdit ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-850 opacity-90' : 'focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                          }`}
                        >
                          <option value="">-- Select Next Designation Level in {appraisal.departmentName || 'Department'} --</option>
                          {departmentDesignations.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} (Level {d.level})
                            </option>
                          ))}
                        </select>
                        {departmentDesignations.length === 0 && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                            No higher designation progression options found for {appraisal.departmentName}.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Qualitative Justification & Comments */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Manager Recommendation Justification <span className="text-red-500">*</span>
                      </label>
                      {isLocked && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked Record
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={justification}
                      disabled={!canEdit || (!isManager && !isHr)}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Detail annual contributions, leadership milestones, and reason for proposed increment..."
                      className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none ${
                        !canEdit
                          ? 'bg-slate-100/90 dark:bg-slate-850 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-90'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                  </div>

                  {(isHod || hodNotes || isLocked) && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                          HOD Departmental Calibration & Budget Notes
                        </label>
                        {isLocked && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked Record
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={hodNotes}
                        disabled={!canEdit || !(isHr || canHodAct)}
                        onChange={(e) => setHodNotes(e.target.value)}
                        placeholder="Department review notes..."
                        className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none ${
                          !canEdit || !(isHr || canHodAct)
                            ? 'bg-slate-100/90 dark:bg-slate-850 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-90'
                            : 'bg-purple-50/30 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500'
                        }`}
                      />
                    </div>
                  )}

                  {(isHr || hrNotes || isLocked) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Effective Date</label>
                          {isLocked && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                        <input
                          type="date"
                          value={effectiveDate}
                          disabled={isLocked || (userRole !== 'HR' && userRole !== 'SUPER_ADMIN')}
                          onChange={(e) => setEffectiveDate(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none ${
                            isLocked
                              ? 'bg-slate-100/90 dark:bg-slate-850 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-90'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800'
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">HR Compliance Notes</label>
                          {isLocked && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={hrNotes}
                          disabled={isLocked || (userRole !== 'HR' && userRole !== 'SUPER_ADMIN')}
                          onChange={(e) => setHrNotes(e.target.value)}
                          placeholder="HR approval notes / payroll release reference"
                          className={`w-full px-3 py-2 border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none ${
                            isLocked
                              ? 'bg-slate-100/90 dark:bg-slate-850 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-90'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Workflow Actions */}
                {!isLocked ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Current Action Gate:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {appraisal.status === 'PENDING'
                          ? 'Stage 1: Manager Recommendation'
                          : appraisal.status === 'MANAGER_RECOMMENDED'
                          ? 'Stage 2: HOD Calibration'
                          : appraisal.status === 'HOD_CALIBRATED'
                          ? 'Stage 3: HR Final Approval'
                          : 'Stage 4: Final Lock (Super Admin)'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRestrictedFromIncrement ? (
                        <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                          Increments & approvals restricted ({appraisal.employeeStatus})
                        </div>
                      ) : appraisal.status === 'MANAGER_RECOMMENDED' && !appraisal.hodId ? (
                        <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                          No HOD assigned — assign one via Employee Master to unblock calibration
                        </div>
                      ) : (
                        <>
                          {isManager && appraisal.status === 'PENDING' && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleOpenConfirm('MANAGER')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                            >
                              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>Submit Manager Recommendation</span>
                            </button>
                          )}

                          {canHodAct && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleOpenConfirm('HOD_RETURN')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer border border-rose-200 dark:border-rose-800"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Return to Manager</span>
                            </button>
                          )}

                          {canHodAct && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleOpenConfirm('HOD')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                            >
                              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              <span>Submit HOD Calibration</span>
                            </button>
                          )}

                          {isHr && appraisal.status === 'HOD_CALIBRATED' && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleOpenConfirm('HR_APPROVE')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                            >
                              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                              <span>HR Final Approval & Generate Letter</span>
                            </button>
                          )}

                          {appraisal.status === 'HR_APPROVED' && isSuperAdmin && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleOpenConfirm('LOCK')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                            >
                              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                              <span>Lock Appraisal & Release to Employee</span>
                            </button>
                          )}

                          {appraisal.status === 'HR_APPROVED' && !isSuperAdmin && (
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              Awaiting Super Admin final lock
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-emerald-950 dark:text-emerald-100">Appraisal Finalized & Fully Approved</div>
                        <div className="text-emerald-800 dark:text-emerald-300 text-[11px]">
                          All stages passed • Employee profile updated • Settings permanently locked
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLetterModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open Appraisal Letter</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 4-QUARTER PERFORMANCE HISTORY */}
            {activeTab === 'breakdown' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">4-Quarter Performance Reviews Breakdown</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Consolidated immutable quarterly review records evaluating annual performance
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Annual Composite Score:</span>
                    <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {appraisal.averageQuarterlyScore.toFixed(2)} / 5.00
                    </div>
                  </div>
                </div>

                {appraisal.quarterlyHistory && appraisal.quarterlyHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appraisal.quarterlyHistory.map((q, idx) => (
                      <div key={idx} className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{q.periodName}</span>
                          </div>
                          {q.score > 0 ? (
                            <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg font-mono font-bold text-xs border border-indigo-100 dark:border-indigo-800/60">
                              <span>{q.score.toFixed(2)}</span>
                              <span className="text-[10px] text-indigo-400">/ 5.0</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg font-medium text-xs border border-slate-200 dark:border-slate-600">
                              <span>Not Yet Evaluated</span>
                            </div>
                          )}
                        </div>

                        {q.strengths && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400">Key Achievements / Strengths:</span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/60">
                              {q.strengths}
                            </p>
                          </div>
                        )}

                        {q.managerComments && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Manager Evaluation:</span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                              {q.managerComments}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                    No historical reviews found for this cohort.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AUDIT & STAGE SIGN-OFFS */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Stage Calibration Sign-Off Trail</h4>
                  
                  {/* Stage 1: Manager */}
                  <div className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                          1
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Stage 1: Reporting Manager Recommendation</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {appraisal.managerRecommendation ? '✓ Completed' : 'Pending'}
                      </span>
                    </div>
                    {appraisal.managerRecommendation && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
                        <div>Recommended By: <strong>{appraisal.managerRecommendation.recommendedByName}</strong></div>
                        <div>Suggested Increment: <strong>+{appraisal.managerRecommendation.suggestedIncrementPercent}%</strong></div>
                        <div>Promotion: <strong>{appraisal.managerRecommendation.promotionRecommended ? 'YES' : 'NO'}</strong></div>
                        <div>Justification: <em>"{appraisal.managerRecommendation.justification}"</em></div>
                      </div>
                    )}
                  </div>

                  {/* Stage 2: HOD */}
                  <div className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                          2
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Stage 2: HOD Departmental Calibration</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {appraisal.hodCalibration ? '✓ Completed' : 'Pending'}
                      </span>
                    </div>
                    {appraisal.hodCalibration && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-purple-50/50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-100 dark:border-purple-800/60">
                        <div>Calibrated By: <strong>{appraisal.hodCalibration.calibratedByName}</strong></div>
                        <div>Calibrated Increment: <strong>+{appraisal.hodCalibration.calibratedIncrementPercent}%</strong></div>
                        <div>Notes: <em>"{appraisal.hodCalibration.notes}"</em></div>
                      </div>
                    )}
                  </div>

                  {/* Stage 3: HR */}
                  <div className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                          3
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Stage 3: HR Final Approval & Release</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {appraisal.hrApproval ? '✓ Approved' : 'Pending'}
                      </span>
                    </div>
                    {appraisal.hrApproval && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/60">
                        <div>Approved By: <strong>{appraisal.hrApproval.approvedByName}</strong></div>
                        <div>Final Increment: <strong>+{appraisal.hrApproval.finalIncrementPercent}%</strong></div>
                        <div>Revised CTC: <strong>{currencySymbol}{appraisal.hrApproval.revisedCtc.toLocaleString()}</strong></div>
                        <div>Letter Released: <strong>{appraisal.hrApproval.letterGenerated ? 'YES' : 'NO'}</strong></div>
                      </div>
                    )}
                  </div>

                  {/* Stage 4: Final Lock */}
                  <div className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                          4
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Stage 4: Final Lock (Super Admin)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {appraisal.isLocked ? '✓ Locked' : 'Pending'}
                      </span>
                    </div>
                    {appraisal.isLocked && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
                        <div>Locked By: <strong>{appraisal.lockedByName || 'Super Admin'}</strong></div>
                        <div>Locked At: <strong>{appraisal.lockedAt ? new Date(appraisal.lockedAt).toLocaleString() : '—'}</strong></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Printable Appraisal Letter Modal */}
      {showLetterModal && (
        <AppraisalLetterModal
          appraisal={appraisal}
          onClose={() => setShowLetterModal(false)}
        />
      )}

      {/* Workflow Stage Sign-Off In-App Confirmation Modal */}
      {confirmActionType &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 modal-backdrop-enter"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmActionType(null);
            }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 modal-card-enter">
              {confirmActionType === 'HOD_RETURN' ? (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
                      <RotateCcw className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Return to Manager</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sends this appraisal back to the Reporting Manager for rework.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Employee</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {appraisal.employeeName} ({appraisal.employeeCode})
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Reason for return <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={hodReturnReason}
                      onChange={(e) => setHodReturnReason(e.target.value)}
                      rows={3}
                      placeholder="Explain what the manager needs to revisit or correct"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setConfirmActionType(null)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !hodReturnReason.trim()}
                      onClick={handleExecuteConfirmAction}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>Confirm & Return to Manager</span>
                    </button>
                  </div>
                </div>
              ) : (
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      confirmActionType === 'MANAGER'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                        : confirmActionType === 'HOD'
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
                        : confirmActionType === 'HR_APPROVE'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-900 dark:bg-slate-800 border-slate-800 dark:border-slate-700 text-amber-400'
                    }`}
                  >
                    {confirmActionType === 'MANAGER' && <Send className="w-6 h-6" />}
                    {confirmActionType === 'HOD' && <CheckCircle2 className="w-6 h-6" />}
                    {confirmActionType === 'HR_APPROVE' && <ShieldCheck className="w-6 h-6" />}
                    {confirmActionType === 'LOCK' && <Lock className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {confirmActionType === 'MANAGER' && 'Confirm Manager Recommendation'}
                        {confirmActionType === 'HOD' && 'Confirm HOD Calibration'}
                        {confirmActionType === 'HR_APPROVE' && 'Confirm HR Final Approval'}
                        {confirmActionType === 'LOCK' && 'Confirm Final Lock & Release'}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          confirmActionType === 'MANAGER'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : confirmActionType === 'HOD'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                          : confirmActionType === 'HR_APPROVE'
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                          : 'bg-slate-900 dark:bg-slate-800 text-white'
                      }`}
                    >
                      {confirmActionType === 'MANAGER' && 'Stage 1'}
                      {confirmActionType === 'HOD' && 'Stage 2'}
                      {confirmActionType === 'HR_APPROVE' && 'Stage 3'}
                      {confirmActionType === 'LOCK' && 'Final Lock'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {confirmActionType === 'MANAGER' && 'Review and submit manager rating & proposed increment'}
                    {confirmActionType === 'HOD' && 'Review and finalize departmental budget calibration'}
                    {confirmActionType === 'HR_APPROVE' && 'Review and approve compensation revision & letter'}
                    {confirmActionType === 'LOCK' && 'Finalize and lock all approved settings & release letter'}
                  </p>
                </div>
              </div>

              {/* Data Summary Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Employee</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{appraisal.employeeName} ({appraisal.employeeCode})</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Cycle / Cohort</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{appraisal.cycleName} • {appraisal.appraisalYear}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">
                    {confirmActionType === 'MANAGER' ? 'Proposed Increment' : confirmActionType === 'HOD' ? 'Calibrated Increment' : 'Final Increment'}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    +{incrementPercent}% (+{currencySymbol}{incrementAmount.toLocaleString()})
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Revised Annual CTC</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{currencySymbol}{calculatedRevisedCtc.toLocaleString()}</span>
                </div>
                {effectiveDate && (confirmActionType === 'HR_APPROVE' || confirmActionType === 'LOCK') && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Effective Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{effectiveDate}</span>
                  </div>
                )}
                {promotionRecommended && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 dark:text-slate-400">Promotion</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {designations.find((d) => d.id === promotionDesignationId)?.name || appraisal.promotionDesignationName || 'Promoted'}
                    </span>
                  </div>
                )}
              </div>

              {/* Stage Specific Consequence Notice */}
              <div
                className={`p-3 rounded-xl text-[11px] space-y-1 border ${
                  confirmActionType === 'LOCK'
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                    : 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300'
                }`}
              >
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {confirmActionType === 'LOCK' ? 'Critical: Final Lock & System Action' : 'Workflow Next Step'}
                </p>
                {confirmActionType === 'MANAGER' && (
                  <p className="text-indigo-700 dark:text-indigo-300">
                    Submitting this recommendation advances the appraisal to the HOD calibration gate. You can re-open to inspect progress at any time.
                  </p>
                )}
                {confirmActionType === 'HOD' && (
                  <p className="text-indigo-700 dark:text-indigo-300">
                    Confirming departmental calibration forwards this review to HR for final compensation authorization and official letter generation.
                  </p>
                )}
                {confirmActionType === 'HR_APPROVE' && (
                  <p className="text-indigo-700 dark:text-indigo-300">
                    Authorizes the final revised CTC and prepares the official printable appraisal letter. Next, HR can execute the final Lock & Release.
                  </p>
                )}
                {confirmActionType === 'LOCK' && (
                  <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 space-y-0.5 pl-1">
                    <li><strong>Locks all approved settings</strong> permanently in the system (no further modifications).</li>
                    <li><strong>Updates Employee Profile</strong> master data with the new CTC ({currencySymbol}{calculatedRevisedCtc.toLocaleString()}) and new designation.</li>
                    <li><strong>Releases official appraisal letter</strong> to employee portal.</li>
                  </ul>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setConfirmActionType(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteConfirmAction}
                  className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer ${
                    confirmActionType === 'MANAGER'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : confirmActionType === 'HOD'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : confirmActionType === 'HR_APPROVE'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : confirmActionType === 'MANAGER' ? (
                    <Send className="w-3.5 h-3.5" />
                  ) : confirmActionType === 'HOD' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : confirmActionType === 'HR_APPROVE' ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {confirmActionType === 'MANAGER' && 'Confirm & Submit Recommendation'}
                    {confirmActionType === 'HOD' && 'Confirm & Submit Calibration'}
                    {confirmActionType === 'HR_APPROVE' && 'Confirm & Approve Appraisal'}
                    {confirmActionType === 'LOCK' && 'Confirm & Lock Approved Settings'}
                  </span>
                </button>
              </div>
              </div>
              )}
            </div>
          </div>,
        document.body
      )}
    </>,
    document.body
  );
};

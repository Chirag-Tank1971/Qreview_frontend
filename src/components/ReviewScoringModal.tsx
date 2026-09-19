import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  EmployeeReview,
  ReviewKraSnapshot,
  ReviewStatus,
  User,
} from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import { EmployeeStatusBadge } from './ui/StatusBadge';
import {
  X,
  Printer,
  Sparkles,
  Lock,
  AlertCircle,
  RotateCcw,
  Check,
  Clock,
  History,
  ChevronLeft,
  ChevronRight,
  Save,
  UserCheck,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  Step1SelfSection,
  Step2ManagerSection,
  Step3HodSection,
  ScoreSummaryBar,
  StatusRemarksModal,
  AuditTrailDrawer,
} from './reviews/ReviewScoringModal';

export interface ReviewScoringModalProps {
  review: EmployeeReview | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ReviewScoringModal: React.FC<ReviewScoringModalProps> = ({
  review,
  currentUser,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [snapshots, setSnapshots] = useState<ReviewKraSnapshot[]>([]);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [managerComments, setManagerComments] = useState('');
  const [hrComments, setHrComments] = useState('');
  const [employeeComments, setEmployeeComments] = useState('');
  const [statusModalRemarks, setStatusModalRemarks] = useState('');
  const [showStatusModal, setShowStatusModal] = useState<ReviewStatus | null>(null);
  const [isHodReturnFlow, setIsHodReturnFlow] = useState(false);
  const [hodComments, setHodComments] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessNote, setAiSuccessNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  // Forward declaration ref for handleAttemptClose
  const handleAttemptCloseRef = React.useRef<() => void>(() => {});

  // Scroll lock and Escape dismissal
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showUnsavedAlert) {
          setShowUnsavedAlert(false);
        } else if (showStatusModal) {
          setShowStatusModal(null);
        } else if (showAuditModal) {
          setShowAuditModal(false);
        } else {
          handleAttemptCloseRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showStatusModal, showAuditModal, showUnsavedAlert]);

  // Sync state when review prop changes
  useEffect(() => {
    if (review) {
      setSnapshots(
        review.kraSnapshot.map((s) => ({
          ...s,
          rating: s.rating || 0,
          achievement: s.achievement || '',
          comments: s.comments || '',
        }))
      );
      setStrengths(review.strengths || '');
      setImprovements(review.improvements || '');
      setManagerComments(review.managerOverallComments || '');
      setHrComments(review.hrComments || '');
      setEmployeeComments(review.employeeComments || '');
      setErrorMessage('');
      setSuccessMessage('');
      setAiSuccessNote('');

      // Determine initial wizard step:
      if (
        review.status === 'HR_PENDING' ||
        review.status === 'HR_COMPLETED' ||
        review.status === 'HOD_PENDING' ||
        review.status === 'CLOSED'
      ) {
        setWizardStep(3);
      } else if (review.status === 'MANAGER_COMPLETED') {
        setWizardStep(3);
      } else if (review.selfSubmittedAt) {
        setWizardStep(1);
      } else {
        setWizardStep(2);
      }
    }
  }, [review]);

  // Real-time calculated live weighted score
  const computedScore = useMemo(() => {
    let sum = 0;
    snapshots.forEach((item) => {
      const r = item.rating || 0;
      const w = item.weight || 0;
      sum += (r * w) / 100;
    });
    return Number(sum.toFixed(2));
  }, [snapshots]);

  // Score tier label & color
  const scoreTier = useMemo(() => {
    if (computedScore === 0) return { label: 'Unscored', color: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    if (computedScore >= 4.5) return { label: 'Outstanding (5/5 Tier)', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' };
    if (computedScore >= 3.5) return { label: 'Exceeds Expectations', color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800' };
    if (computedScore >= 2.5) return { label: 'Meets Expectations', color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' };
    return { label: 'Needs Improvement', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' };
  }, [computedScore]);

  const unratedCount = useMemo(() => {
    return snapshots.filter((s) => !s.rating || s.rating === 0).length;
  }, [snapshots]);

  if (!isOpen || !review) return null;

  // Permissions: Only assigned Reporting Manager or HR / Super Admin can score and edit KRA ratings.
  // HOD never edits Manager ratings — HOD instead reviews the submitted assessment and
  // approves/returns it via canHodAct below.
  const isHrOrAdmin = currentUser?.role === 'HR' || currentUser?.role === 'SUPER_ADMIN';
  const isManager =
    (currentUser?.role === 'REPORTING_MANAGER' || currentUser?.role === 'MANAGER') &&
    (review.managerId === currentUser?.employeeId || review.managerId === currentUser?.id);
  const canEdit = !review.isClosed && (isHrOrAdmin || isManager);
  const isHod = currentUser?.role === 'HOD' && review.hodId === currentUser?.employeeId;
  const canHodAct = isHod && review.status === 'HOD_PENDING' && !review.isClosed;

  // Detect if user has entered unsaved scores, notes, or commentary
  const hasUnsavedChanges = useMemo(() => {
    if (!canEdit || !review) return false;
    if (strengths !== (review.strengths || '')) return true;
    if (improvements !== (review.improvements || '')) return true;
    if (managerComments !== (review.managerOverallComments || '')) return true;
    if (hrComments !== (review.hrComments || '')) return true;
    if (employeeComments !== (review.employeeComments || '')) return true;

    const origMap = new Map((review.kraSnapshot || []).map((k) => [k.id, k]));
    for (const s of snapshots) {
      const orig = origMap.get(s.id) as any;
      if (!orig) return true;
      if ((s.rating || 0) !== (orig.rating || 0)) return true;
      if ((s.achievement || '') !== (orig.achievement || '')) return true;
      if ((s.comments || '') !== (orig.comments || '')) return true;
    }
    return false;
  }, [canEdit, strengths, improvements, managerComments, hrComments, employeeComments, snapshots, review]);

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedAlert(true);
    } else {
      onClose();
    }
  };

  handleAttemptCloseRef.current = handleAttemptClose;

  const handleKraChange = (index: number, field: keyof ReviewKraSnapshot, value: any) => {
    setSnapshots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // AI Assist Draft Generator
  const handleAiDraftSummary = async () => {
    try {
      setAiLoading(true);
      setErrorMessage('');
      setAiSuccessNote('');

      const kraSummary = snapshots.map((s) => ({
        title: s.kraName || s.title || 'Key Deliverable',
        weightage: s.weight || 0,
        target: s.targetSnapshot || 'Quality delivery within SLA',
      }));

      const res = await api.generateAiReviewSynthesis({
        employeeName: review.employeeName,
        designation: review.designationName,
        department: review.departmentName,
        quarterlyScores: [
          {
            quarter: review.reviewPeriodName || 'Current Quarter',
            score: computedScore || 4.0,
            reviewNotes: snapshots.map((s) => s.achievement).filter(Boolean).join('; '),
          },
        ],
        annualScore: computedScore || 4.0,
        kraSummary,
        perspective: 'manager',
      });

      if (res?.data) {
        if (res.data.suggestedManagerNarrative || res.data.executiveSummary) {
          setManagerComments(res.data.suggestedManagerNarrative || res.data.executiveSummary);
        }
        if (res.data.topStrengths && res.data.topStrengths.length > 0) {
          setStrengths(res.data.topStrengths.map((s) => `• ${s}`).join('\n'));
        }
        if (res.data.growthAreas && res.data.growthAreas.length > 0) {
          setImprovements(res.data.growthAreas.map((g) => `• ${g}`).join('\n'));
        }
        setAiSuccessNote('✨ Review narrative and growth recommendations drafted by Gemini AI Copilot.');
      }
    } catch (err: any) {
      console.warn('AI synthesis fallback:', err);
      const highRatedKras = snapshots.filter((s) => (s.rating || 0) >= 3.5);
      const lowRatedKras = snapshots.filter((s) => (s.rating || 0) > 0 && (s.rating || 0) < 3.5);

      const fallbackStrengths =
        highRatedKras.length > 0
          ? highRatedKras.map((k) => `• Exceptional ownership and execution on ${k.kraName || k.title || 'deliverables'}.`).join('\n')
          : `• Consistently demonstrated dependable execution on core technical deliverables.\n• Proactive team collaboration and consistent attendance in sprint milestones.`;

      const fallbackGrowth =
        lowRatedKras.length > 0
          ? lowRatedKras.map((k) => `• Target deeper consistency and stretch SLA benchmarks for ${k.kraName || k.title || 'targeted deliverables'}.`).join('\n')
          : `• Further enhance autonomous system design and technical documentation.\n• Expand cross-departmental impact and domain knowledge sharing.`;

      setStrengths(fallbackStrengths);
      setImprovements(fallbackGrowth);
      setManagerComments(
        `${review.employeeName} demonstrated dependable ownership and disciplined execution throughout ${review.reviewPeriodName}. Core deliverables align well with department milestones, achieving a weighted rating of ${computedScore > 0 ? computedScore.toFixed(2) : '3.50'}/5.00.`
      );
      setAiSuccessNote('✨ Review narrative and growth recommendations drafted based on current KRA evaluation ratings.');
    } finally {
      setAiLoading(false);
    }
  };

  // Save draft or submit scores
  const handleSaveScores = async (isDraft: boolean) => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (review?.employeeStatus === 'INACTIVE') {
      const msg = 'Cannot submit evaluation for an inactive/offboarded employee.';
      setErrorMessage(msg);
      toast.error(msg, 'Action Restricted');
      setSaving(false);
      return;
    }

    if (!isDraft) {
      const unrated = snapshots.some((s) => !s.rating || s.rating === 0);
      if (unrated) {
        const msg = 'All KRA items must be assigned a rating (1-5) before submitting the evaluation.';
        setErrorMessage(msg);
        toast.warning(msg, 'Incomplete Ratings');
        setSaving(false);
        setWizardStep(2);
        return;
      }
    }

    try {
      await api.scoreReview(review.id, {
        kraSnapshot: snapshots,
        strengths,
        improvements,
        managerOverallComments: managerComments,
        employeeComments,
        hrComments,
        isDraft,
      });

      const succMsg = isDraft ? 'Review draft saved successfully.' : `Quarterly review submitted for ${review.employeeName}!`;
      setSuccessMessage(succMsg);
      if (isDraft) {
        toast.info(succMsg, 'Draft Saved');
      } else {
        toast.success(succMsg, 'Review Submitted');
      }
      setTimeout(() => {
        onSaved();
      }, 700);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to save review scoring.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Submission Error');
    } finally {
      setSaving(false);
    }
  };

  // Transition Review Status
  const handleStatusTransition = async (newStatus: ReviewStatus) => {
    setSaving(true);
    setErrorMessage('');
    try {
      if (canEdit && snapshots.length > 0) {
        await api.scoreReview(review.id, {
          kraSnapshot: snapshots,
          strengths,
          improvements,
          managerOverallComments: managerComments,
          employeeComments,
          hrComments,
          isDraft: true,
        });
      }

      const defaultRemarks =
        newStatus === 'CLOSED'
          ? 'Final review signed off, locked, and closed by HR'
          : newStatus === 'HR_COMPLETED'
          ? 'Review approved by HR Calibration'
          : `Transitioned review status to ${newStatus}`;

      await api.updateReviewStatus(review.id, {
        status: newStatus,
        remarks: statusModalRemarks || defaultRemarks,
      });

      setShowStatusModal(null);
      setStatusModalRemarks('');
      const succMsg =
        newStatus === 'CLOSED'
          ? 'Review successfully finalized, locked, and closed!'
          : newStatus === 'HR_COMPLETED'
          ? 'Review successfully approved by HR!'
          : `Review status updated to ${newStatus}`;
      setSuccessMessage(succMsg);
      toast.success(succMsg, 'Workflow Updated');
      setTimeout(() => {
        onSaved();
      }, 600);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to update review status.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Status Update Error');
    } finally {
      setSaving(false);
    }
  };

  // HOD approves the manager's submitted assessment. Transitions: HOD_PENDING -> HR_PENDING
  const handleHodApprove = async () => {
    setSaving(true);
    setErrorMessage('');
    try {
      await api.hodApproveReview(review.id, { hodComments });
      const succMsg = `Review approved and forwarded to HR for ${review.employeeName}.`;
      setSuccessMessage(succMsg);
      toast.success(succMsg, 'Review Approved');
      setTimeout(() => {
        onSaved();
      }, 600);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to approve review.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Approval Error');
    } finally {
      setSaving(false);
    }
  };

  // HOD returns the review to the reporting manager with a mandatory reason.
  // Transitions: HOD_PENDING -> MANAGER_PENDING
  const handleHodReturn = async (reason: string) => {
    if (!reason || !reason.trim()) {
      const msg = 'A return reason is mandatory. Please provide specific feedback for the manager.';
      setErrorMessage(msg);
      toast.warning(msg, 'Reason Required');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    try {
      await api.hodReturnReview(review.id, { reason });
      setShowStatusModal(null);
      setIsHodReturnFlow(false);
      setStatusModalRemarks('');
      const succMsg = `Review returned to ${review.managerName} for correction.`;
      setSuccessMessage(succMsg);
      toast.success(succMsg, 'Review Returned');
      setTimeout(() => {
        onSaved();
      }, 600);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to return review.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Return Error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleAttemptClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-white">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center space-x-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
              style={{ backgroundColor: review.cycleColor || '#1e3a8a' }}
            >
              {review.cycleCode}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{review.employeeName}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {review.employeeCode}
                </span>
                <EmployeeStatusBadge status={review.employeeStatus} />
                {review.isAppraisalMonthDue && (
                  <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Appraisal Due (Cycle {review.cycleCode})</span>
                  </span>
                )}
                {review.isClosed && (
                  <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <Lock className="w-3 h-3" />
                    <span>Closed & Locked</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {review.designationName} • {review.departmentName} • Period: <span className="font-semibold text-slate-700 dark:text-slate-200">{review.reviewPeriodName}</span> • Manager: <span className="font-semibold text-slate-700 dark:text-slate-200">{review.managerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              title="Print Review Sheet"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleAttemptClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INACTIVE EMPLOYEE SAFEGUARD BANNER */}
        {review.employeeStatus === 'INACTIVE' && (
          <div className="mx-6 mt-3 px-4 py-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Employment Record Inactive (Offboarded / Exited)</p>
              <p className="text-rose-700 dark:text-rose-300 text-[11px] mt-0.5">
                This employee has been marked inactive in the system. Performance review scoring and evaluation submission are disabled to safeguard evaluation integrity. Historical review records remain available for reference.
              </p>
            </div>
          </div>
        )}

        {/* REVIEW RETURNED BANNER */}
        {review.status === 'RETURNED' && (
          <div className="mx-6 mt-3 px-4 py-3 bg-rose-50/90 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-xs rounded-xl flex items-start gap-3 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-xs">Review Returned for Recalibration</span>
                <span className="text-[10px] bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-md font-medium">
                  Needs Revision
                </span>
              </div>
              <p className="text-rose-800 dark:text-rose-300 text-[11px] mt-0.5 leading-relaxed">
                This evaluation was sent back for adjustments. Please check the feedback remarks in Step 3 or review the <strong>Audit Trail</strong> for notes, adjust the scoring or commentary, and resubmit.
              </p>
            </div>
          </div>
        )}

        {/* ALERTS & ERROR MESSAGES */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEPPER WIZARD TABS */}
        <div className="px-6 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                wizardStep === 1
                  ? 'bg-white dark:bg-slate-750 text-indigo-950 dark:text-white shadow-xs font-bold border border-slate-200 dark:border-slate-700 ring-1 ring-black/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                wizardStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                1
              </span>
              <span>Employee Input</span>
              {review.selfSubmittedAt ? (
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" title="Self-Review Completed" />
              ) : (
                <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" title="Self-Review Pending" />
              )}
            </button>

            <span className="text-slate-300 dark:text-slate-600">➔</span>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                wizardStep === 2
                  ? 'bg-white dark:bg-slate-750 text-indigo-950 dark:text-white shadow-xs font-bold border border-slate-200 dark:border-slate-700 ring-1 ring-black/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                wizardStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                2
              </span>
              <span>Manager Scoring</span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded-md border border-indigo-200 dark:border-indigo-800">
                {computedScore.toFixed(2)} ★
              </span>
            </button>

            <span className="text-slate-300 dark:text-slate-600">➔</span>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                wizardStep === 3
                  ? 'bg-white dark:bg-slate-750 text-indigo-950 dark:text-white shadow-xs font-bold border border-slate-200 dark:border-slate-700 ring-1 ring-black/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                wizardStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                3
              </span>
              <span>Growth & Sign-Off</span>
            </button>
          </div>

          {/* Audit trail trigger */}
          <button
            type="button"
            onClick={() => setShowAuditModal(!showAuditModal)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showAuditModal
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit Trail</span>
            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1 rounded">
              {review.actionHistory?.length || 0}
            </span>
          </button>
        </div>

        {/* LIVE SCORE BANNER */}
        {wizardStep >= 2 && (
          <ScoreSummaryBar
            computedScore={computedScore}
            scoreTier={scoreTier}
            unratedCount={unratedCount}
          />
        )}

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {wizardStep === 1 && (
            <Step1SelfSection review={review} snapshots={snapshots} />
          )}

          {wizardStep === 2 && (
            <Step2ManagerSection
              snapshots={snapshots}
              canEdit={canEdit}
              isHrOrAdmin={isHrOrAdmin}
              onKraChange={handleKraChange}
            />
          )}

          {wizardStep === 3 && (
            <Step3HodSection
              review={review}
              computedScore={computedScore}
              strengths={strengths}
              setStrengths={setStrengths}
              improvements={improvements}
              setImprovements={setImprovements}
              managerComments={managerComments}
              setManagerComments={setManagerComments}
              hrComments={hrComments}
              setHrComments={setHrComments}
              canEdit={canEdit}
              isHrOrAdmin={isHrOrAdmin}
              canHodAct={canHodAct}
              hodComments={hodComments}
              setHodComments={setHodComments}
              saving={saving}
              aiLoading={aiLoading}
              aiSuccessNote={aiSuccessNote}
              onAiDraftSummary={handleAiDraftSummary}
              onOpenStatusModal={(status) => setShowStatusModal(status)}
            />
          )}
        </div>

        {/* MODAL FOOTER WITH GUIDED STEPPER NAVIGATION */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          {/* Status Transitions for HR / Admin */}
          <div className="flex items-center space-x-2">
            {isHrOrAdmin && !review.isClosed && (
              <button
                type="button"
                onClick={() => setShowStatusModal('RETURNED')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center space-x-1 cursor-pointer"
                title="Return review to reporting manager for revisions"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Manager</span>
              </button>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {wizardStep > 1 && (
              <button
                type="button"
                onClick={() => setWizardStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {wizardStep < 3 ? (
              <button
                type="button"
                onClick={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Continue to Step {wizardStep + 1}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : canEdit ? (
              review.employeeStatus === 'INACTIVE' ? (
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800">
                  Evaluation submission disabled (Employee Inactive)
                </div>
              ) : isHrOrAdmin ? (
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveScores(true)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>

                  {review.status !== 'HR_COMPLETED' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setShowStatusModal('HR_COMPLETED')}
                      className="px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve (HR)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowStatusModal('CLOSED')}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer ring-2 ring-indigo-500/30"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Final Lock & Close</span>
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveScores(true)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveScores(false)}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Evaluation</span>
                  </button>
                </>
              )
            ) : canHodAct ? (
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setIsHodReturnFlow(true);
                    setStatusModalRemarks('');
                    setShowStatusModal('MANAGER_PENDING');
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return to Manager</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleHodApprove}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approve Review</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* STATUS REMARKS MODAL OVERLAY */}
        <StatusRemarksModal
          isOpen={!!showStatusModal}
          status={showStatusModal}
          review={review}
          remarks={statusModalRemarks}
          setRemarks={setStatusModalRemarks}
          onClose={() => {
            setShowStatusModal(null);
            setIsHodReturnFlow(false);
          }}
          onConfirm={(st) =>
            isHodReturnFlow ? handleHodReturn(statusModalRemarks) : handleStatusTransition(st)
          }
          saving={saving}
        />

        {/* AUDIT TRAIL DRAWER OVERLAY */}
        <AuditTrailDrawer
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          review={review}
        />

        {/* UNSAVED CHANGES CONFIRMATION ALERT */}
        {showUnsavedAlert && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowUnsavedAlert(false);
            }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 text-slate-900 dark:text-white transform scale-100 transition-all">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Unsaved Review Progress
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    You have unsaved changes in this evaluation. If you exit now without saving, your entered scores and feedback will be lost.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUnsavedAlert(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsavedAlert(false);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-colors cursor-pointer"
                >
                  Discard & Exit
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    setShowUnsavedAlert(false);
                    await handleSaveScores(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft & Exit</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

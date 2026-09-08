import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  EmployeeReview,
  ReviewKraSnapshot,
  ReviewStatus,
  User,
  EmployeeStatus,
} from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import {
  X,
  Star,
  CheckCircle2,
  Clock,
  Send,
  Save,
  RotateCcw,
  Lock,
  Award,
  AlertCircle,
  FileText,
  UserCheck,
  History,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Printer,
  Check,
  HelpCircle,
  MessageSquare,
  Zap,
} from 'lucide-react';

interface ReviewScoringModalProps {
  review: EmployeeReview | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const RATING_RUBRIC = [
  { value: 1, label: 'Needs Improvement', desc: 'Consistently below expectations / targets not achieved', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  { value: 2, label: 'Developing', desc: 'Partially meets expectations; inconsistent target achievement', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { value: 3, label: 'Meets Expectations', desc: 'Consistently achieves targets and meets key milestones', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { value: 4, label: 'Exceeds Expectations', desc: 'Exceeds targets with high quality, speed, and ownership', color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
  { value: 5, label: 'Outstanding', desc: 'Significantly outperforms, sets benchmarks, and displays leadership', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
];

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
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessNote, setAiSuccessNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Scroll lock and Escape dismissal
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showStatusModal) {
          setShowStatusModal(null);
        } else if (showAuditModal) {
          setShowAuditModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showStatusModal, showAuditModal, onClose]);

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
        review.status === 'HOD_COMPLETED' ||
        review.status === 'HR_PENDING' ||
        review.status === 'HR_COMPLETED' ||
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

  if (!isOpen || !review) return null;

  // Check user permissions
  const isManager = currentUser?.role === 'MANAGER';
  const isHod = currentUser?.role === 'HOD';
  const isHrOrAdmin = currentUser?.role === 'HR' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGEMENT';

  // If review is HOD_COMPLETED, Manager and HOD can no longer edit; only HR/Admin can calibrate and final-lock
  const isHodCompleted = review.status === 'HOD_COMPLETED';
  const canEdit = !review.isClosed && (isHrOrAdmin || (!isHodCompleted && (isManager || isHod)));

  // Update a single snapshot row
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
        if (!strengths && res.data.topStrengths && res.data.topStrengths.length > 0) {
          setStrengths(res.data.topStrengths.map((s) => `• ${s}`).join('\n'));
        }
        if (!improvements && res.data.growthAreas && res.data.growthAreas.length > 0) {
          setImprovements(res.data.growthAreas.map((g) => `• ${g}`).join('\n'));
        }
        setAiSuccessNote('✨ Review narrative and growth recommendations drafted by Gemini AI Copilot.');
      }
    } catch (err: any) {
      console.warn('AI synthesis fallback:', err);
      setManagerComments(
        `${review.employeeName} demonstrated dependable ownership and disciplined execution throughout ${review.reviewPeriodName}. Core deliverables align well with department milestones, achieving a weighted rating of ${computedScore > 0 ? computedScore.toFixed(2) : '3.50'}/5.00.`
      );
      setAiSuccessNote('✨ Summary draft generated based on current KRA evaluation ratings.');
    } finally {
      setAiLoading(false);
    }
  };

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

    // Validation if submitting
    if (!isDraft) {
      const unrated = snapshots.some((s) => !s.rating || s.rating === 0);
      if (unrated) {
        const msg = 'All KRA items must be assigned a rating (1-5) before submitting the evaluation.';
        setErrorMessage(msg);
        toast.warning(msg, 'Incomplete Ratings');
        setSaving(false);
        setWizardStep(2); // Jump to scoring step
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
      // 1. First persist any edited ratings, strengths, improvements, or HR comments
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

      // 2. Then transition status
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

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
                {getEmployeeStatusBadge(review.employeeStatus)}
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
              onClick={onClose}
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
                <p className="font-bold text-rose-950 dark:text-rose-100 text-xs sm:text-sm">
                  Review Returned to Reporting Manager ({review.managerName})
                </p>
                <button
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="text-[11px] font-semibold underline text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Timeline & Remarks ({review.actionHistory?.length || 0})</span>
                </button>
              </div>
              <p className="text-rose-800 dark:text-rose-300 text-[11px] mt-1">
                This review was returned by HR for revision. Reporting Manager <strong className="font-semibold text-rose-950 dark:text-rose-100">{review.managerName}</strong> must update scoring in Step 2 and submit again.
              </p>
              {(() => {
                const lastReturn = [...(review.actionHistory || [])].reverse().find((a) => a.action === 'RETURNED');
                return lastReturn?.remarks ? (
                  <div className="mt-2 p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/70 border border-rose-200/90 dark:border-rose-800/80 text-slate-800 dark:text-slate-200 text-[11px]">
                    <span className="font-bold text-rose-800 dark:text-rose-300">Return Reason / HR Remarks: </span>
                    <span className="italic">"{lastReturn.remarks}"</span>
                    <div className="text-slate-400 dark:text-slate-500 text-[10px] mt-1 font-mono">
                      By {lastReturn.performedByName} ({lastReturn.performedByRole}) • {new Date(lastReturn.performedAt).toLocaleString()}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* FEEDBACK MESSAGES */}
        {errorMessage && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 3-STEP WIZARD PROGRESS STEPPER */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
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

        {/* LIVE SCORE BANNER (visible on Step 2 and 3) */}
        {wizardStep >= 2 && (
          <div className="px-6 py-2.5 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider block">Live Weighted Score</span>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">{computedScore.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-medium">/ 5.00</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider block">Performance Bracket</span>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold border mt-0.5 ${scoreTier.color}`}>
                  {scoreTier.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Status:</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                {review.status}
              </span>
            </div>
          </div>
        )}

        {/* WIZARD BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40 dark:bg-slate-900/60">

          {/* STEP 1: EMPLOYEE SELF-REVIEW & ACHIEVEMENTS */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                    Step 1: Review Employee Self-Assessment
                  </h3>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                    Carefully review the employee's self-evaluations, achievements, and challenges before scoring in Step 2.
                  </p>
                </div>
              </div>

              {/* Submission Status Card */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Self-Evaluation Status:
                    </span>
                    {review.selfSubmittedAt ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Submitted on {new Date(review.selfSubmittedAt).toLocaleDateString()}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Employee Submission</span>
                      </span>
                    )}
                  </div>

                  {review.selfScore ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-slate-400 dark:text-slate-500">Self-Rating:</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        {review.selfScore.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">/ 5.00</span>
                    </div>
                  ) : null}
                </div>

                {/* Qualitative Self Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                      Accomplishments & Strengths
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {review.selfStrengths || 'No specific strengths self-reported.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                      Growth Areas & Learnings
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {review.selfImprovements || 'No specific growth areas self-reported.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                      Obstacles & Support Needed
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {review.selfObstacles || 'No major blockers reported.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-KRA Self Ratings */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Goal-by-Goal Self-Assessment ({snapshots.length} KRAs)
                </h4>
                <div className="space-y-3">
                  {snapshots.map((item, idx) => (
                    <div key={item.id || idx} className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">{item.kraName || item.title}</h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                            Weight: {item.weight}%
                          </span>
                        </div>
                        {item.selfRating ? (
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                            Employee Self-Score: {item.selfRating} ★
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No self-score</span>
                        )}
                      </div>

                      {item.selfAchievement && (
                        <div className="text-xs bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Employee Note: </span>
                          <span>{item.selfAchievement}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MANAGER KRA SCORING & WEIGHTS */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                    Step 2: Score Key Result Areas (1 to 5 Scale)
                  </h3>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                    Rate each goal based on target delivery and achievement metrics. The final score updates dynamically.
                  </p>
                </div>
              </div>

              {isHodCompleted && !isHrOrAdmin && (
                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs p-3.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <span className="font-bold">HOD Evaluation Completed (Read-Only)</span>
                    <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                      This quarterly review has been calibrated by HOD and submitted to HR. Goal ratings are now locked for manager and HOD roles.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {snapshots.map((item, idx) => {
                  const itemContribution = ((item.rating || 0) * (item.weight || 0)) / 100;
                  return (
                    <div
                      key={item.id || idx}
                      className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-2xs space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.kraName || item.title}</h4>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                              Weight: {item.weight}%
                            </span>
                            {item.selfRating && (
                              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                                Self-Rated: {item.selfRating} ★
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                            Score Contribution
                          </span>
                          <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                            +{itemContribution.toFixed(2)} pts
                          </div>
                        </div>
                      </div>

                      {/* SLA & Rubric */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                            Target Expectation SLA
                          </span>
                          <p className="text-slate-800 dark:text-slate-200 mt-0.5">{item.targetSnapshot || 'Quality execution within SLA'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                            Measurement Criteria / Rubric
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 mt-0.5 font-mono text-[11px]">
                            {item.measurementCriteria || '1: Below SLA | 3: Meets SLA | 5: Exceeds SLA'}
                          </p>
                        </div>
                      </div>

                      {/* 1-5 Rubric Rating Buttons */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Manager Performance Rating (1 to 5 Scale)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                          {RATING_RUBRIC.map((rubric) => {
                            const isSelected = item.rating === rubric.value;
                            return (
                              <button
                                type="button"
                                key={rubric.value}
                                disabled={!canEdit}
                                onClick={() => handleKraChange(idx, 'rating', rubric.value)}
                                className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                                  isSelected
                                    ? `${rubric.color} ring-2 ring-indigo-500 font-bold shadow-xs`
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                                } ${!canEdit ? 'cursor-not-allowed opacity-80' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold">{rubric.value} ★</span>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                                </div>
                                <div className="text-[11px] font-semibold mt-1 leading-tight">{rubric.label}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Remarks & Deliverables */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Key Deliverables / Quantifiable Achievements
                          </label>
                          <textarea
                            rows={2}
                            disabled={!canEdit}
                            value={item.achievement || ''}
                            onChange={(e) => handleKraChange(idx, 'achievement', e.target.value)}
                            placeholder="Specific milestones completed, code releases, or metrics achieved..."
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Manager Notes & Qualitative Feedback
                          </label>
                          <textarea
                            rows={2}
                            disabled={!canEdit}
                            value={item.comments || ''}
                            onChange={(e) => handleKraChange(idx, 'comments', e.target.value)}
                            placeholder="Observations on velocity, code hygiene, and collaboration..."
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: GROWTH FEEDBACK, AI SUMMARY & SUBMISSION */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                      Step 3: Growth Feedback & Overall Recommendations
                    </h3>
                    <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                      Provide constructive growth remarks, recognize standout contributions, and generate an AI draft summary.
                    </p>
                  </div>
                </div>

                {/* AI Assist Action Button */}
                {canEdit && (
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleAiDraftSummary}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/60 hover:bg-violet-200 dark:hover:bg-violet-900/60 border border-violet-300 dark:border-violet-700 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                    <span>{aiLoading ? 'Drafting...' : '✨ AI Draft Summary'}</span>
                  </button>
                )}
              </div>

              {aiSuccessNote && (
                <div className="p-3 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 text-xs rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>{aiSuccessNote}</span>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-2xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Key Strengths & Core Contributions
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Highlight technical depth, leadership qualities, mentorship, and extraordinary accomplishments..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Development Areas & Growth Opportunities
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Identify specific skill gaps, system design areas, communication habits, or stretch goals for next quarter..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Manager Overall Summary & Appraisal Recommendations
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Overarching calibration note</span>
                  </div>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    placeholder="Provide overarching narrative for HOD/HR calibration, promotion readiness, or increment alignment..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                  />
                </div>

                {isHrOrAdmin && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1.5">
                      HR Calibration / Executive Management Remarks (Internal)
                    </label>
                    <textarea
                      rows={2}
                      value={hrComments}
                      onChange={(e) => setHrComments(e.target.value)}
                      placeholder="HR notes regarding cohort normalization, cycle appraisal recommendation, or increment approval..."
                      className="w-full text-xs p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* HR FINAL SIGN-OFF & LOCK ACTION CARD */}
                {isHrOrAdmin && !review.isClosed && (
                  <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-700 shadow-md space-y-3 mt-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            HR Final Sign-Off & Lock Actions
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Current Stage: <span className="font-semibold text-indigo-300">{review.status}</span> • Live Weighted Score: <span className="font-mono font-bold text-white">{computedScore.toFixed(2)}/5.00</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => setShowStatusModal('HR_COMPLETED')}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Approve (HR)</span>
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => setShowStatusModal('CLOSED')}
                          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ring-2 ring-indigo-400/40"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Final Lock & Close</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800 pt-2.5">
                      Click <strong>Final Lock & Close</strong> to complete this appraisal cycle. It saves your feedback, permanently locks the review against further edits, records the timestamp in the audit trail, and archives this quarterly evaluation.
                    </p>
                  </div>
                )}

                {/* HOD / MANAGER READ-ONLY BANNER FOR HOD_COMPLETED */}
                {isHodCompleted && !isHrOrAdmin && (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/70 text-purple-950 dark:text-purple-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>HOD Evaluation Submitted & Locked</span>
                    </div>
                    <p className="text-[11px] text-purple-800 dark:text-purple-300">
                      The departmental HOD has completed the calibration for this review. It is currently with HR for final calibration and permanent lock. Further edits by managers or HODs are restricted.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER WITH GUIDED STEPPER NAVIGATION */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          {/* Status Transitions for HR / Admin */}
          <div className="flex items-center space-x-2">
            {isHrOrAdmin && !review.isClosed && (
              <>
                <button
                  type="button"
                  onClick={() => setShowStatusModal('RETURNED')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusModal('HR_COMPLETED')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approve (HR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusModal('CLOSED')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
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
                /* HR / Admin Step 3 Options with Final Lock prominent button */
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

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowStatusModal('HR_COMPLETED')}
                    className="px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve (HR)</span>
                  </button>

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
                /* Manager Standard Options */
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
                    <span>{currentUser?.role === 'HOD' ? 'Submit HOD Calibration' : 'Submit Evaluation'}</span>
                  </button>
                </>
              )
            ) : null}
          </div>
        </div>

        {/* STATUS REMARKS MODAL OVERLAY */}
        {showStatusModal &&
          createPortal(
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowStatusModal(null);
              }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  {showStatusModal === 'CLOSED' ? (
                    <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  ) : showStatusModal === 'HR_COMPLETED' ? (
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>
                    {showStatusModal === 'CLOSED'
                      ? 'Final Lock & Close Quarterly Review'
                      : showStatusModal === 'HR_COMPLETED'
                      ? 'Approve Review (HR Calibration)'
                      : `Return Review to ${review.managerName}`}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {showStatusModal === 'CLOSED'
                    ? `This will permanently lock the review for ${review.employeeName}. All ratings, scores, and growth comments will be preserved and locked.`
                    : showStatusModal === 'HR_COMPLETED'
                    ? `Mark this review as HR Approved and record calibration remarks in the audit trail:`
                    : `Provide audit remarks or return instructions for ${review.managerName}:`}
                </p>
                <textarea
                  rows={3}
                  value={statusModalRemarks}
                  onChange={(e) => setStatusModalRemarks(e.target.value)}
                  placeholder={
                    showStatusModal === 'CLOSED'
                      ? 'e.g. Approved and final locked by HR following performance calibration...'
                      : showStatusModal === 'HR_COMPLETED'
                      ? 'e.g. Scores aligned with cohort distribution. Approved for appraisal processing...'
                      : 'e.g. Please recalibrate goal scoring based on quarterly achievement metrics...'
                  }
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500"
                />
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setShowStatusModal(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => handleStatusTransition(showStatusModal)}
                    className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs cursor-pointer ${
                      showStatusModal === 'CLOSED'
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : showStatusModal === 'HR_COMPLETED'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {showStatusModal === 'CLOSED'
                      ? 'Confirm & Final Lock'
                      : showStatusModal === 'HR_COMPLETED'
                      ? 'Confirm HR Approval'
                      : 'Confirm Return'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* AUDIT TRAIL MODAL OVERLAY (PORTALED) */}
        {showAuditModal &&
          createPortal(
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowAuditModal(false);
              }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Review Lifecycle & Audit Trail</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                          {review.actionHistory?.length || 0} events
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {review.employeeName} ({review.employeeCode}) • Period: {review.reviewPeriodName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAuditModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body / Timeline */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {(!review.actionHistory || review.actionHistory.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
                      No lifecycle events recorded for this review yet.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                      {review.actionHistory.map((action, idx) => {
                        const isReturned = action.action === 'RETURNED';
                        const isApproved = action.action === 'APPROVED';
                        const isClosed = action.action === 'CLOSED';

                        return (
                          <div key={action.id || idx} className="relative">
                            <div
                              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-850 border-2 flex items-center justify-center shadow-xs ${
                                isReturned
                                  ? 'border-rose-500'
                                  : isApproved
                                  ? 'border-emerald-500'
                                  : isClosed
                                  ? 'border-slate-500'
                                  : 'border-indigo-600'
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isReturned
                                    ? 'bg-rose-500'
                                    : isApproved
                                    ? 'bg-emerald-500'
                                    : isClosed
                                    ? 'bg-slate-500'
                                    : 'bg-indigo-600'
                                }`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                                    isReturned
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                      : isApproved
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                      : isClosed
                                      ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                                  }`}
                                >
                                  {action.action}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {action.performedByName}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                                  {action.performedByRole}
                                </span>
                              </div>

                              {isReturned && (
                                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                  ↩ Returned to Reporting Manager: <span className="font-semibold text-slate-800 dark:text-slate-200">{review.managerName}</span>
                                </div>
                              )}

                              {action.remarks && (
                                <div className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 leading-relaxed">
                                  <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Remarks / Reason:</span>
                                  {action.remarks}
                                </div>
                              )}

                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                                {new Date(action.performedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAuditModal(false)}
                    className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

      </div>
    </div>,
    document.body
  );
};

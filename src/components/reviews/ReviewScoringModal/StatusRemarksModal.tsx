import React from 'react';
import { createPortal } from 'react-dom';
import { Lock, UserCheck, RotateCcw } from 'lucide-react';
import { EmployeeReview, ReviewStatus } from '../../../types';

interface StatusRemarksModalProps {
  isOpen: boolean;
  status: ReviewStatus | null;
  review: EmployeeReview;
  remarks: string;
  setRemarks: (val: string) => void;
  onClose: () => void;
  onConfirm: (status: ReviewStatus) => void;
  saving: boolean;
  /** Only relevant when status === 'RETURNED' and this is an HR-initiated return (not the HOD return flow). */
  showTargetSelector?: boolean;
  returnTarget?: 'MANAGER' | 'HOD';
  setReturnTarget?: (target: 'MANAGER' | 'HOD') => void;
  hodAvailable?: boolean;
}

export const StatusRemarksModal: React.FC<StatusRemarksModalProps> = ({
  isOpen,
  status,
  review,
  remarks,
  setRemarks,
  onClose,
  onConfirm,
  saving,
  showTargetSelector,
  returnTarget = 'MANAGER',
  setReturnTarget,
  hodAvailable = true,
}) => {
  if (!isOpen || !status) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          {status === 'CLOSED' ? (
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          ) : status === 'HR_COMPLETED' ? (
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          )}
          <span>
            {status === 'CLOSED'
              ? 'Final Lock & Close Quarterly Review'
              : status === 'HR_COMPLETED'
              ? 'Approve Review (HR Calibration)'
              : showTargetSelector
              ? `Return Review to ${returnTarget === 'HOD' ? review.hodName || 'HOD' : review.managerName}`
              : `Return Review to ${review.managerName}`}
          </span>
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {status === 'CLOSED'
            ? `This will permanently lock the review for ${review.employeeName}. All ratings, scores, and growth comments will be preserved and locked.`
            : status === 'HR_COMPLETED'
            ? `Mark this review as HR Approved and record calibration remarks in the audit trail:`
            : showTargetSelector
            ? `Choose who should recalibrate this review, then provide the reason:`
            : `Provide audit remarks or return instructions for ${review.managerName}:`}
        </p>

        {showTargetSelector && setReturnTarget && (
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setReturnTarget('MANAGER')}
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                returnTarget === 'MANAGER'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Manager ({review.managerName})
            </button>
            <button
              type="button"
              disabled={!hodAvailable}
              onClick={() => setReturnTarget('HOD')}
              title={!hodAvailable ? 'No HOD is configured for this employee' : undefined}
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                returnTarget === 'HOD'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              HOD {review.hodName ? `(${review.hodName})` : ''}
            </button>
          </div>
        )}

        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={
            status === 'CLOSED'
              ? 'e.g. Approved and final locked by HR following performance calibration...'
              : status === 'HR_COMPLETED'
              ? 'e.g. Scores aligned with cohort distribution. Approved for appraisal processing...'
              : 'e.g. Please recalibrate goal scoring based on quarterly achievement metrics...'
          }
          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500"
        />
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={() => onConfirm(status)}
            className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs cursor-pointer ${
              status === 'CLOSED'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : status === 'HR_COMPLETED'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {status === 'CLOSED'
              ? 'Confirm & Final Lock'
              : status === 'HR_COMPLETED'
              ? 'Confirm HR Approval'
              : 'Confirm Return'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

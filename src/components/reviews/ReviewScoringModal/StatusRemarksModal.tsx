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
              : `Return Review to ${review.managerName}`}
          </span>
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {status === 'CLOSED'
            ? `This will permanently lock the review for ${review.employeeName}. All ratings, scores, and growth comments will be preserved and locked.`
            : status === 'HR_COMPLETED'
            ? `Mark this review as HR Approved and record calibration remarks in the audit trail:`
            : `Provide audit remarks or return instructions for ${review.managerName}:`}
        </p>
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

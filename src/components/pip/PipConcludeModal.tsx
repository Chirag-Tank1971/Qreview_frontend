import React, { useState } from 'react';
import { BaseModal } from '../ui/BaseModal';
import { Award, AlertTriangle, CheckCircle2, UserX, Clock } from 'lucide-react';
import { PipRecord } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';

interface PipConcludeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pip: PipRecord | null;
  onConcluded: (updatedPip: PipRecord) => void;
}

export const PipConcludeModal: React.FC<PipConcludeModalProps> = ({
  isOpen,
  onClose,
  pip,
  onConcluded,
}) => {
  const [outcome, setOutcome] = useState<'PASSED' | 'EXTENDED' | 'SEPARATED'>('PASSED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !pip) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.warning('Please enter final conclusion remarks for the audit dossier.', 'Remarks Required');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.concludePip(pip.id, { outcome, notes });
      const toastMsg =
        outcome === 'PASSED'
          ? `PIP successfully concluded! ${pip.employeeName} restored to active status.`
          : outcome === 'EXTENDED'
          ? `PIP extended for 30 additional days with coaching milestones.`
          : `Formal separation workflow initiated for ${pip.employeeName}.`;

      toast.success(toastMsg, 'Governance Concluded');
      onConcluded(updated);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to conclude PIP', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Conclude Performance Improvement Plan"
      subtitle={`Finalize governance determination for ${pip.employeeName} (${pip.employeeCode})`}
      icon={<Award className="w-5 h-5" />}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Outcome Selector */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider text-[11px]">
            Final Governance Determination
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Passed */}
            <button
              type="button"
              onClick={() => setOutcome('PASSED')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                outcome === 'PASSED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <CheckCircle2 className={`w-4 h-4 ${outcome === 'PASSED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold uppercase">Option A</span>
              </div>
              <div className="font-bold">Passed / Cleared</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Restore to regular status</div>
            </button>

            {/* Extended */}
            <button
              type="button"
              onClick={() => setOutcome('EXTENDED')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                outcome === 'EXTENDED'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Clock className={`w-4 h-4 ${outcome === 'EXTENDED' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold uppercase">Option B</span>
              </div>
              <div className="font-bold">Extend Plan</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">+30 days coaching</div>
            </button>

            {/* Separated */}
            <button
              type="button"
              onClick={() => setOutcome('SEPARATED')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                outcome === 'SEPARATED'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <UserX className={`w-4 h-4 ${outcome === 'SEPARATED' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold uppercase">Option C</span>
              </div>
              <div className="font-bold">Separate / Exit</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Unsuccessful criteria</div>
            </button>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
            Final Review Remarks & Justification
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              outcome === 'PASSED'
                ? 'e.g. Employee demonstrated substantial recovery in KRA targets and SLA adherence...'
                : outcome === 'EXTENDED'
                ? 'e.g. Partial improvement achieved. Extension granted to finalize 3rd enterprise contract...'
                : 'e.g. Core targets were unmet across 60 days. Escalating to separation protocol with legal compliance...'
            }
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 ${
              outcome === 'PASSED'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : outcome === 'EXTENDED'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <span>{isSubmitting ? 'Recording Conclusion...' : 'Confirm Determination & Close Plan'}</span>
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

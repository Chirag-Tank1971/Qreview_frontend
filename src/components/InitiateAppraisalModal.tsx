import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, AlertCircle, Loader2, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { Cycle } from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

interface InitiateAppraisalModalProps {
  cycles: Cycle[];
  onClose: () => void;
  onSuccess: () => void;
}

export const InitiateAppraisalModal: React.FC<InitiateAppraisalModalProps> = ({
  cycles,
  onClose,
  onSuccess,
}) => {
  const [selectedCycleId, setSelectedCycleId] = useState<string>(cycles[5]?.id || cycles[0]?.id || 'cycle_f');
  const [appraisalYear, setAppraisalYear] = useState<number>(2026);
  const [overrideExisting, setOverrideExisting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    message: string;
    cycleName: string;
    createdCount: number;
    updatedCount: number;
    totalEligible: number;
  } | null>(null);

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId) || cycles[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId) {
      setError('Please select an appraisal cycle.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.initiateAppraisalCycle({
        cycleId: selectedCycleId,
        appraisalYear,
        overrideExisting,
      });
      setResult(res);
      toast.success(res.message || `Appraisal cohort initiated for Cycle ${selectedCycle?.name || ''}!`, 'Cohort Initiated');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to initiate cycle appraisals';
      setError(errMsg);
      toast.error(errMsg, 'Initiation Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] overflow-y-auto bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Initiate Annual Appraisal Cohort</h3>
              <p className="text-xs text-slate-300">8-Cycle Automated 4-Quarter Rollup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">{result.message}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generated {result.createdCount} new appraisal records ({result.updatedCount} updated) for {result.cycleName}.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                Rolling 4-Quarter aggregation & increment brackets calculated
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100/80 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Automated 4-Quarter Performance Aggregation</span>
              </div>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
                The Appraisal Engine will pull all 4 quarterly review snapshots for active employees in the selected cycle, calculate their average composite performance score, and auto-assign recommended increment brackets (0-20%).
              </p>
            </div>

            {/* Cycle Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select 8-Cycle Cohort <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {cycles.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCycleId(c.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedCycleId === c.id
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.colorHex || '#4f46e5' }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Appraisal: Month {c.appraisalMonth}</div>
                      </div>
                    </div>
                    {selectedCycleId === c.id && <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Appraisal Year */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Appraisal Fiscal Year</label>
                <select
                  value={appraisalYear}
                  onChange={(e) => setAppraisalYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value={2026} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">2026 (Current)</option>
                  <option value={2025} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">2025</option>
                  <option value={2027} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">2027</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Target Cycle Month</label>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Month {selectedCycle?.appraisalMonth || '9'} (Due for Annual Review)
                </div>
              </div>
            </div>

            {/* Overwrite Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="overrideExisting"
                type="checkbox"
                checked={overrideExisting}
                onChange={(e) => setOverrideExisting(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-indigo-500"
              />
              <label htmlFor="overrideExisting" className="text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                Recalculate & overwrite existing pending appraisal drafts in this cycle
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aggregating Reviews...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Initiate {selectedCycle?.name || 'Cohort'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

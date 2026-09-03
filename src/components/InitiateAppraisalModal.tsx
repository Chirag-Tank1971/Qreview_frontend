import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { Cycle } from '../types';
import { api } from '../services/api';

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
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate cycle appraisals');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
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
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900">{result.message}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Generated {result.createdCount} new appraisal records ({result.updatedCount} updated) for {result.cycleName}.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                Rolling 4-Quarter aggregation & increment brackets calculated
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 text-xs text-indigo-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-indigo-950">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Automated 4-Quarter Performance Aggregation</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                The Appraisal Engine will pull all 4 quarterly review snapshots for active employees in the selected cycle, calculate their average composite performance score, and auto-assign recommended increment brackets (0-20%).
              </p>
            </div>

            {/* Cycle Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Select 8-Cycle Cohort <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {cycles.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCycleId(c.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      selectedCycleId === c.id
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.colorHex || '#4f46e5' }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">Appraisal: Month {c.appraisalMonth}</div>
                      </div>
                    </div>
                    {selectedCycleId === c.id && <ChevronRight className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Appraisal Year */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Appraisal Fiscal Year</label>
                <select
                  value={appraisalYear}
                  onChange={(e) => setAppraisalYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value={2026}>2026 (Current)</option>
                  <option value={2025}>2025</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Target Cycle Month</label>
                <div className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-medium text-slate-700 border border-slate-200">
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
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="overrideExisting" className="text-xs text-slate-600 select-none">
                Recalculate & overwrite existing pending appraisal drafts in this cycle
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
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
    </div>
  );
};

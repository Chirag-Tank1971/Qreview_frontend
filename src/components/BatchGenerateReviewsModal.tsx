import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ReviewPeriod, Department, Cycle, Employee } from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import {
  X,
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building2,
  Calendar,
  RotateCw,
} from 'lucide-react';

interface BatchGenerateReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
  periods: ReviewPeriod[];
  departments: Department[];
  cycles: Cycle[];
  employees: Employee[];
}

export const BatchGenerateReviewsModal: React.FC<BatchGenerateReviewsModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
  periods,
  departments,
  cycles,
  employees,
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ALL');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('ALL');
  const [overrideExisting, setOverrideExisting] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Default to active period
  useEffect(() => {
    if (periods.length > 0) {
      const active = periods.find((p) => p.status === 'ACTIVE') || periods[0];
      setSelectedPeriodId(active.id);
    }
  }, [periods]);

  // Calculate target employee count
  const eligibleEmployees = employees.filter((emp) => {
    if (emp.status !== 'ACTIVE' && emp.status !== 'PROBATION') return false;
    if (selectedDepartmentId !== 'ALL' && emp.departmentId !== selectedDepartmentId) return false;
    if (selectedCycleId !== 'ALL' && emp.cycleId !== selectedCycleId) return false;
    return true;
  });

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId) {
      setErrorMessage('Please select a target review period.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.generateBatchReviews({
        reviewPeriodId: selectedPeriodId,
        departmentId: selectedDepartmentId !== 'ALL' ? selectedDepartmentId : undefined,
        cycleId: selectedCycleId !== 'ALL' ? selectedCycleId : undefined,
        overrideExisting,
      });

      setSuccessMessage(res.message);
      toast.success(res.message || 'Review batch generated successfully!', 'Batch Generation');
      setTimeout(() => {
        onGenerated();
      }, 900);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to initiate review batch.';
      setErrorMessage(errMsg);
      toast.error(errMsg, 'Batch Error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Initiate Quarterly Reviews</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate review sheets & freeze immutable KRA snapshots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="p-6 space-y-5">
            {/* MESSAGES */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* IMMUTABLE SNAPSHOT EXPLANATION BANNER */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-3.5 rounded-lg flex items-start space-x-3 text-xs text-indigo-900 dark:text-indigo-200">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-semibold">Immutable KRA Snapshot Engine:</strong> Generating reviews takes a frozen snapshot of each employee's designated KRA template at this point in time. Subsequent template edits will not distort ongoing or past quarterly reviews.
              </p>
            </div>

            {/* TARGET REVIEW PERIOD SELECTOR */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Target Review Period *</span>
              </label>
              <select
                required
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {p.name} {p.status === 'ACTIVE' ? '(ACTIVE)' : `(${p.status})`}
                  </option>
                ))}
              </select>
            </div>

            {/* COHORT FILTERS: DEPARTMENT & CYCLE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Target Department</span>
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 font-medium"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Departments (Entire Company)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Appraisal Cycle Cohort</span>
                </label>
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 font-medium"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Cycles (A through H)</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RE-SNAPSHOT OVERRIDE CHECKBOX */}
            <div className="flex items-start space-x-2.5 pt-1">
              <input
                id="override-reviews"
                type="checkbox"
                checked={overrideExisting}
                onChange={(e) => setOverrideExisting(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="override-reviews" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Re-snapshot existing reviews</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  If checked, un-scored existing reviews for this period will be updated with the latest KRA template.
                </span>
              </label>
            </div>

            {/* BATCH SCOPE SUMMARY CARD */}
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Eligible Employees in Scope:</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                {eligibleEmployees.length} employees
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || eligibleEmployees.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate {eligibleEmployees.length} Reviews</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};

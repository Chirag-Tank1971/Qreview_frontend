import React, { useState, useEffect } from 'react';
import { ReviewPeriod, Department, Cycle, Employee } from '../types';
import { api } from '../services/api';
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
  if (!isOpen) return null;

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ALL');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('ALL');
  const [overrideExisting, setOverrideExisting] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      setTimeout(() => {
        onGenerated();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate review batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Initiate Quarterly Reviews</h2>
              <p className="text-xs text-slate-500">Generate review sheets & freeze immutable KRA snapshots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="p-6 space-y-5">
            {/* MESSAGES */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* IMMUTABLE SNAPSHOT EXPLANATION BANNER */}
            <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-lg flex items-start space-x-3 text-xs text-indigo-900">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-semibold">Immutable KRA Snapshot Engine:</strong> Generating reviews takes a frozen snapshot of each employee's designated KRA template at this point in time. Subsequent template edits will not distort ongoing or past quarterly reviews.
              </p>
            </div>

            {/* TARGET REVIEW PERIOD SELECTOR */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Target Review Period *</span>
              </label>
              <select
                required
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'ACTIVE' ? '(ACTIVE)' : `(${p.status})`}
                  </option>
                ))}
              </select>
            </div>

            {/* COHORT FILTERS: DEPARTMENT & CYCLE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Target Department</span>
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 font-medium"
                >
                  <option value="ALL">All Departments (Entire Company)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Appraisal Cycle Cohort</span>
                </label>
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 font-medium"
                >
                  <option value="ALL">All Cycles (A through H)</option>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
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
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="override-reviews" className="text-xs text-slate-600 cursor-pointer">
                <span className="font-semibold text-slate-800">Re-snapshot existing reviews</span>
                <span className="block text-[11px] text-slate-500">
                  If checked, un-scored existing reviews for this period will be updated with the latest KRA template.
                </span>
              </label>
            </div>

            {/* BATCH SCOPE SUMMARY CARD */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Eligible Employees in Scope:</span>
              </div>
              <span className="text-sm font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                {eligibleEmployees.length} employees
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || eligibleEmployees.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
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
    </div>
  );
};

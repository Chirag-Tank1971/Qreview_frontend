import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Plus, Trash2, CheckCircle2, Briefcase, Building2, Users, UserCheck, Calendar, Hash, Loader2 } from 'lucide-react';
import { toast } from '../context/ToastContext';

export interface CustomKraRow {
  id: string;
  title: string;
  weight: number | string;
  target: string;
  description?: string;
  measurementCriteria?: string;
}

interface CustomKraScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: (rows: CustomKraRow[]) => void | Promise<void>;
  initialKras: CustomKraRow[];
  employeeCode: string;
  name: string;
  designationName?: string;
  departmentName?: string;
  managerName?: string;
  hodName?: string;
  cycleName?: string;
}

const blankRow = (weight: number = 10): CustomKraRow => ({
  id: `kra_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  title: '',
  weight,
  target: '100% Target SLA',
  measurementCriteria: '',
});

/**
 * Standalone "fill the scorecard" modal, laid out like the paper/Excel KRA sheets
 * (Emp Id, Name, Designation, Reporting Manager, HOD, Department, Appraisal Cycle
 * header block, followed by the S.No / KRA / Weightage table) so HR can transcribe
 * an existing scorecard 1:1. Opened from the "Custom Scorecard" toggle in
 * EmployeeModal; only commits back to the parent form when "Done" is pressed.
 */
export const CustomKraScorecardModal: React.FC<CustomKraScorecardModalProps> = ({
  isOpen,
  onClose,
  onDone,
  initialKras,
  employeeCode,
  name,
  designationName,
  departmentName,
  managerName,
  hodName,
  cycleName,
}) => {
  const [rows, setRows] = useState<CustomKraRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRows(
        initialKras && initialKras.length > 0
          ? initialKras.map((k) => ({ ...k, id: k.id || `kra_${Date.now()}_${Math.random().toString(36).substr(2, 6)}` }))
          : [blankRow(25), blankRow(25), blankRow(25), blankRow(25)]
      );
      setIsSubmitting(false);
    }
  }, [isOpen, initialKras]);

  if (!isOpen) return null;

  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  const isBalanced = totalWeight === 100;

  const handleAddRow = () => setRows((prev) => [...prev, blankRow(0)]);
  const handleRemoveRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));
  const handleUpdateRow = (index: number, field: keyof CustomKraRow, value: any) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDone = async () => {
    const filtered = rows
      .map((r) => ({
        ...r,
        title: r.title.trim(),
        target: r.target.trim() || '100% Target SLA',
        weight: Number(r.weight) || 0,
      }))
      .filter((r) => r.title.length > 0);

    if (filtered.length === 0) {
      toast.warning('Please add at least one Key Result Area.', 'Validation Error');
      return;
    }

    const sum = filtered.reduce((s, r) => s + r.weight, 0);
    if (sum !== 100) {
      toast.warning(`Total weightage is ${sum}%. It must sum to exactly 100%.`, 'Weightage Mismatch');
      return;
    }

    setIsSubmitting(true);
    try {
      await onDone(filtered);
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerFields: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    { label: 'Emp Id', value: employeeCode || '—', icon: <Hash className="w-3 h-3" /> },
    { label: 'Name', value: name || '—', icon: <Users className="w-3 h-3" /> },
    { label: 'Designation', value: designationName || '—', icon: <Briefcase className="w-3 h-3" /> },
    { label: 'Department', value: departmentName || '—', icon: <Building2 className="w-3 h-3" /> },
    { label: 'Reporting Manager', value: managerName || '—', icon: <UserCheck className="w-3 h-3" /> },
    { label: 'HOD', value: hodName || '—', icon: <UserCheck className="w-3 h-3" /> },
    { label: 'Appraisal Cycle', value: cycleName || '—', icon: <Calendar className="w-3 h-3" /> },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9995] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">KRA Performance Scorecard</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fill in the Key Result Areas for this employee's appraisal cycle.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Employee Detail Header Block (mirrors the standard KRA sheet layout) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {headerFields.map((f) => (
              <div key={f.label} className="bg-slate-50 dark:bg-slate-850 px-3 py-2">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {f.icon}
                  {f.label}
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate" title={f.value}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          {/* Live Weightage Indicator */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Weightage:</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isBalanced
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                }`}
              >
                {totalWeight}% / 100% {isBalanced ? '✓ Balanced' : `(Diff: ${100 - totalWeight > 0 ? `+${100 - totalWeight}` : 100 - totalWeight}%)`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add KRA
            </button>
          </div>

          {/* KRA Table (S.No / Key Result Area / Weightage / Target) */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="col-span-1">S.No</div>
              <div className="col-span-5">Key Result Area</div>
              <div className="col-span-2">Weightage</div>
              <div className="col-span-3">Target / SLA</div>
              <div className="col-span-1"></div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {rows.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-slate-50 dark:hover:bg-slate-850/60">
                  <div className="col-span-1 text-xs font-bold text-slate-400 dark:text-slate-500 text-center">{idx + 1}</div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="e.g. Ownership of breakdown calls"
                      value={row.title}
                      onChange={(e) => handleUpdateRow(idx, 'title', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Wt"
                        value={row.weight}
                        onChange={(e) => handleUpdateRow(idx, 'weight', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg pl-2 pr-5 py-1.5 text-xs text-slate-900 dark:text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="absolute right-1.5 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Target SLA"
                      value={row.target}
                      onChange={(e) => handleUpdateRow(idx, 'target', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      disabled={rows.length <= 1}
                      onClick={() => handleRemoveRow(idx)}
                      title="Delete KRA"
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Weightage across all KRAs must total exactly 100% before this scorecard can be assigned.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDone}
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Done — Assign Scorecard
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

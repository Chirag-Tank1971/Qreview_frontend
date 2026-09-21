import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Search } from 'lucide-react';
import { Employee, Cycle } from '../types';
import { CustomKraScorecardModal, CustomKraRow } from './CustomKraScorecardModal';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

interface AssignKraModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Full employee roster — filtered down to those with no KRA scorecard yet for the picker step. */
  employees: Employee[];
  /** Used to resolve a reliable cycle display name — an employee's own denormalized cycleName can be stale/empty. */
  cycles: Cycle[];
  /** Called after a scorecard is successfully created/updated, so the caller can refresh master data. */
  onAssigned: () => void;
  /**
   * Skips the employee-picker step and edits/assigns this employee's scorecard directly —
   * used for the per-row "Assign" action and for editing an existing employee-owned template.
   */
  preselectedEmployee?: Employee | null;
  /** Pre-fills the scorecard builder — used when editing an existing employee-owned template. */
  initialKras?: CustomKraRow[];
}

/**
 * Standalone "create & assign a KRA scorecard" flow for the KRA Templates configuration
 * page. Unlike the old KraTemplateBuilderModal (which created department/designation-scoped
 * library blueprints), this always assigns an exclusive, employee-owned scorecard — matching
 * the backend invariant that every employee's KRA template belongs to them alone. When no
 * employee is preselected, it first asks HR to pick one of the employees who don't have a
 * scorecard yet, then hands off to the same CustomKraScorecardModal used from the employee
 * profile editor.
 */
export const AssignKraModal: React.FC<AssignKraModalProps> = ({
  isOpen,
  onClose,
  employees,
  cycles,
  onAssigned,
  preselectedEmployee = null,
  initialKras = [],
}) => {
  const [search, setSearch] = useState('');
  const [pickedEmployee, setPickedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPickedEmployee(null);
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeEmployee = preselectedEmployee || pickedEmployee;

  if (activeEmployee) {
    const resolvedCycleName =
      cycles.find((c) => c.id === activeEmployee.cycleId)?.name ||
      activeEmployee.cycleName ||
      activeEmployee.cycleCode;

    return (
      <CustomKraScorecardModal
        isOpen
        onClose={() => (preselectedEmployee ? onClose() : setPickedEmployee(null))}
        onDone={async (rows) => {
          try {
            await api.updateEmployee(activeEmployee.id, { customKras: rows });
            toast.success(`KRA scorecard assigned to ${activeEmployee.name}.`, 'Scorecard Assigned');
            onAssigned();
            onClose();
          } catch (err: any) {
            toast.error(err?.message || 'Failed to assign the KRA scorecard.', 'Assignment Failed');
          }
        }}
        initialKras={initialKras}
        employeeCode={activeEmployee.employeeCode}
        name={activeEmployee.name}
        designationName={activeEmployee.designationName}
        departmentName={activeEmployee.departmentName}
        managerName={activeEmployee.managerName}
        hodName={activeEmployee.hodName}
        cycleName={resolvedCycleName}
      />
    );
  }

  const unassigned = employees.filter((e) => !e.currentKraTemplateId && e.status !== 'INACTIVE');
  const filtered = unassigned.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q);
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[9994] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Assign New KRA Scorecard</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pick an employee who doesn't have a KRA scorecard yet.
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

        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search unassigned employees..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              {unassigned.length === 0
                ? 'Every active employee already has a KRA scorecard assigned.'
                : 'No employees match your search.'}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {filtered.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setPickedEmployee(emp)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{emp.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {emp.employeeCode} • {emp.designationName || 'Employee'} • {emp.departmentName || 'General'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

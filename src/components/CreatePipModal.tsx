import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ClipboardList, Search, Plus, Trash2, Loader2, Send, Save } from 'lucide-react';
import { Employee, PerformanceImprovementPlan } from '../types';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

interface CreatePipModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  existingPlans: PerformanceImprovementPlan[];
  onCreated: () => void;
}

interface GoalRow {
  id: string;
  description: string;
  targetMetric: string;
  dueDate: string;
}

const blankGoal = (): GoalRow => ({
  id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  description: '',
  targetMetric: '',
  dueDate: '',
});

const ACTIVE_STATUSES: PerformanceImprovementPlan['status'][] = ['ACTIVE', 'EXTENDED'];

export const CreatePipModal: React.FC<CreatePipModalProps> = ({
  isOpen,
  onClose,
  employees,
  existingPlans,
  onCreated,
}) => {
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState<number | ''>(30);
  const [goals, setGoals] = useState<GoalRow[]>([blankGoal(), blankGoal()]);
  const [isSubmitting, setIsSubmitting] = useState<'draft' | 'publish' | null>(null);

  if (!isOpen) return null;

  const employeesOnActivePip = useMemo(
    () => new Set(existingPlans.filter((p) => ACTIVE_STATUSES.includes(p.status)).map((p) => p.employeeId)),
    [existingPlans]
  );

  const eligibleEmployees = employees.filter((e) => e.status !== 'INACTIVE' && !employeesOnActivePip.has(e.id));
  const filteredEmployees = eligibleEmployees.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q);
  });

  const endDatePreview = useMemo(() => {
    if (!startDate || durationDays === '' || Number(durationDays) <= 0) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + Number(durationDays));
    return d;
  }, [startDate, durationDays]);

  const handleAddGoal = () => setGoals((prev) => [...prev, blankGoal()]);
  const handleRemoveGoal = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));
  const handleUpdateGoal = (id: string, field: keyof GoalRow, value: string) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const validate = (): string | null => {
    if (!selectedEmployee) return 'Please select an employee.';
    if (!reason.trim() || reason.trim().length < 10) return 'Reason must be at least 10 characters.';
    if (!startDate) return 'Start date is required.';
    if (durationDays === '' || Number(durationDays) < 7) return 'Duration must be at least 7 days.';
    if (Number(durationDays) > 365) return 'Duration cannot exceed 365 days.';
    const validGoals = goals.filter((g) => g.description.trim().length > 0);
    if (validGoals.length === 0) return 'Please add at least one improvement goal.';
    return null;
  };

  const handleSubmit = async (publish: boolean) => {
    const error = validate();
    if (error) {
      toast.warning(error, 'Validation Error');
      return;
    }

    setIsSubmitting(publish ? 'publish' : 'draft');
    try {
      await api.createPip({
        employeeId: selectedEmployee!.id,
        reason: reason.trim(),
        category: category.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        durationDays: Number(durationDays),
        goals: goals
          .filter((g) => g.description.trim().length > 0)
          .map((g) => ({
            description: g.description.trim(),
            targetMetric: g.targetMetric.trim() || undefined,
            dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : undefined,
          })),
        publish,
      });
      toast.success(
        publish
          ? `Performance improvement plan published for ${selectedEmployee!.name}.`
          : `Draft plan saved for ${selectedEmployee!.name}.`,
        publish ? 'Plan Published' : 'Draft Saved'
      );
      onCreated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create performance improvement plan.', 'Creation Failed');
    } finally {
      setIsSubmitting(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9994] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Start Performance Improvement Plan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                While active, the employee is not eligible for annual appraisal processing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!!isSubmitting}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Employee picker */}
          {!selectedEmployee ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Employee</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee name or code..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-100 dark:border-slate-800 rounded-xl p-1.5">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    No eligible employees found (already-on-PIP employees are excluded).
                  </div>
                ) : (
                  filteredEmployees.slice(0, 50).map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployee(emp)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {emp.employeeCode} • {emp.designationName || 'Employee'} • {emp.departmentName || 'General'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{selectedEmployee.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedEmployee.employeeCode} • {selectedEmployee.designationName || 'Employee'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason for Plan</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Consistently missed quarterly delivery targets over the last two review cycles..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Productivity"
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Duration (days)</label>
              <input
                type="number"
                min={7}
                max={365}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 30, 45, 60, 90"
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {endDatePreview && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Plan will run through <strong className="text-slate-600 dark:text-slate-300">{endDatePreview.toLocaleDateString()}</strong>.
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Improvement Goals</label>
              <button
                type="button"
                onClick={handleAddGoal}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Goal
              </button>
            </div>
            <div className="space-y-2">
              {goals.map((goal, idx) => (
                <div key={goal.id} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 w-4 shrink-0">{idx + 1}.</span>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={goal.description}
                      onChange={(e) => handleUpdateGoal(goal.id, 'description', e.target.value)}
                      placeholder="Goal description, e.g. Close 90% of assigned tickets within SLA"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={goal.targetMetric}
                        onChange={(e) => handleUpdateGoal(goal.id, 'targetMetric', e.target.value)}
                        placeholder="Target metric (optional)"
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="date"
                        value={goal.dueDate}
                        onChange={(e) => handleUpdateGoal(goal.id, 'dueDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  {goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(goal.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={!!isSubmitting}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={!!isSubmitting}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            {isSubmitting === 'draft' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={!!isSubmitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            {isSubmitting === 'publish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publish & Notify Employee
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

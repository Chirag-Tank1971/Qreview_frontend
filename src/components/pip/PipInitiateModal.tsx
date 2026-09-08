import React, { useState, useEffect } from 'react';
import { BaseModal } from '../ui/BaseModal';
import { ShieldCheck, Plus, Trash2, AlertTriangle, Calendar, Target } from 'lucide-react';
import { Employee, PipRecord } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';

interface PipInitiateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  existingPips: PipRecord[];
  onCreated: (newPip: PipRecord) => void;
}

export const PipInitiateModal: React.FC<PipInitiateModalProps> = ({
  isOpen,
  onClose,
  employees,
  existingPips,
  onCreated,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [durationDays, setDurationDays] = useState<30 | 60 | 90>(60);
  const [coreGaps, setCoreGaps] = useState<string[]>([
    'Shortfall in core quarterly KRA target achievement metrics',
    'Needs improvement in collaboration velocity and SLA adherence',
  ]);
  const [newGapText, setNewGapText] = useState('');
  const [milestones, setMilestones] = useState<Array<{ title: string; targetMetric: string; dueDate: string }>>([
    {
      title: 'Target Delivery Baseline',
      targetMetric: 'Achieve 100% adherence to weekly sprint/sales deliverables',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    },
    {
      title: 'Quality & Process Compliance',
      targetMetric: 'Maintain zero high-severity defects/SLA misses across 30 consecutive days',
      dueDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    },
  ]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneMetric, setNewMilestoneMetric] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Check if selected employee has prior historical PIPs
  const priorPips = existingPips.filter((p) => p.employeeId === selectedEmployeeId);
  const isRepeatPip = priorPips.length > 0;
  const cycleNumber = priorPips.length + 1;

  const handleAddGap = () => {
    if (!newGapText.trim()) return;
    setCoreGaps([...coreGaps, newGapText.trim()]);
    setNewGapText('');
  };

  const handleRemoveGap = (idx: number) => {
    setCoreGaps(coreGaps.filter((_, i) => i !== idx));
  };

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim() || !newMilestoneMetric.trim()) return;
    setMilestones([
      ...milestones,
      {
        title: newMilestoneTitle.trim(),
        targetMetric: newMilestoneMetric.trim(),
        dueDate: new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0],
      },
    ]);
    setNewMilestoneTitle('');
    setNewMilestoneMetric('');
  };

  const handleRemoveMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    if (coreGaps.length === 0) {
      toast.warning('Please specify at least one area of concern/deficiency.', 'Gaps Required');
      return;
    }

    if (milestones.length === 0) {
      toast.warning('Please establish at least one measurable milestone.', 'Milestones Required');
      return;
    }

    setIsSubmitting(true);
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const targetEndDate = new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0];

      const newPip = await api.createPip({
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        employeeCode: selectedEmployee.employeeCode,
        department: selectedEmployee.departmentName || 'Operations',
        designation: selectedEmployee.designationName || 'Specialist',
        managerId: selectedEmployee.managerId || 'usr_manager',
        managerName: selectedEmployee.managerName || 'Reporting Manager',
        durationDays,
        startDate,
        targetEndDate,
        coreGaps,
        milestones: milestones.map((m, idx) => ({
          id: `ms_${Date.now()}_${idx}`,
          title: m.title,
          targetMetric: m.targetMetric,
          dueDate: m.dueDate,
          status: 'pending',
        })),
        checkins: [],
      });

      toast.success(`Performance Improvement Plan initiated for ${selectedEmployee.name}`, 'PIP Initiated');
      onCreated(newPip);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate PIP', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Performance Improvement Plan (PIP)"
      subtitle="Establish structured coaching targets, SLA adherence milestones, and governance sign-offs"
      icon={<ShieldCheck className="w-5 h-5" />}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Employee Picker */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
            Target Employee Profile
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeCode}) • {emp.departmentName || 'General'} — {emp.designationName || 'Specialist'}
              </option>
            ))}
          </select>
        </div>

        {/* Repeat PIP Detection Banner */}
        {isRepeatPip && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Notice: Prior PIP Record Found (Cycle {cycleNumber} Repeat Plan)</span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                This employee previously completed {priorPips.length} PIP cycle(s). The system will link this new plan as <strong>Cycle {cycleNumber}</strong> while maintaining complete historical access to past records.
              </p>
            </div>
          </div>
        )}

        {/* Plan Duration & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
              Plan Duration (Calendar Days)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDurationDays(d as any)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    durationDays === d
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
              Target End Date (Auto-calculated)
            </label>
            <div className="flex items-center gap-2 py-2 px-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono font-medium">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{new Date(Date.now() + durationDays * 86400000).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Core Performance Gaps */}
        <div className="space-y-2">
          <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
            1. Core Deficiencies & Performance Gaps
          </label>
          <div className="space-y-1.5">
            {coreGaps.map((gap, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <span>• {gap}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGap(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGapText}
              onChange={(e) => setNewGapText(e.target.value)}
              placeholder="Add deficiency area (e.g., missed SLA deadline frequency)..."
              className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddGap}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* SMART Milestones */}
        <div className="space-y-2">
          <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
            2. Measurable SMART Milestones
          </label>
          <div className="space-y-1.5">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-indigo-950 dark:text-indigo-200">
                    {idx + 1}. {m.title}
                  </div>
                  <div className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                    Target: {m.targetMetric} | Due: {m.dueDate}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <input
              type="text"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="Milestone Title (e.g., Code Quality Adherence)"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestoneMetric}
                onChange={(e) => setNewMilestoneMetric(e.target.value)}
                placeholder="Measurable metric / target criteria..."
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Milestone
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Initiating Plan...' : 'Initiate PIP & Establish Governance'}</span>
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

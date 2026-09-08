import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  Check,
  FileText,
} from 'lucide-react';
import { PipRecord, User } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import { downloadPipDossierPdf } from '../../utils/pipExport';

interface PipCardProps {
  pip: PipRecord;
  currentUser: User | null;
  onOpenCheckin: (pip: PipRecord) => void;
  onOpenConclude: (pip: PipRecord) => void;
  onUpdated: (updatedPip: PipRecord) => void;
}

export const PipCard: React.FC<PipCardProps> = ({
  pip,
  currentUser,
  onOpenCheckin,
  onOpenConclude,
  onUpdated,
}) => {
  const [isUpdatingMilestone, setIsUpdatingMilestone] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const isHrOrAdmin = currentUser?.role === 'HR' || currentUser?.role === 'SUPER_ADMIN';
  const isEmployee = currentUser?.employeeId === pip.employeeId;
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'HOD';

  const isConcluded = pip.status === 'completed_successfully' || pip.status === 'escalated_action';
  const isRepeat = (pip.cycleNumber && pip.cycleNumber > 1) || !!pip.previousPipId;

  const handleToggleMilestone = async (milestoneId: string, currentStatus: string) => {
    if (isConcluded) return;
    const nextStatus = currentStatus === 'met' ? 'in_progress' : currentStatus === 'in_progress' ? 'met' : 'in_progress';

    setIsUpdatingMilestone(true);
    try {
      const updated = await api.updatePipMilestone(pip.id, milestoneId, { status: nextStatus });
      toast.success(`Milestone updated to ${nextStatus.toUpperCase()}`, 'Milestone Updated');
      onUpdated(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update milestone', 'Error');
    } finally {
      setIsUpdatingMilestone(false);
    }
  };

  const handleEmployeeAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      const updated = await api.signPip(pip.id, {
        role: 'EMPLOYEE',
        comments: 'I have reviewed the targets, deliverables, and coaching timeline.',
      });
      toast.success('Performance Improvement Plan acknowledged successfully.', 'Acknowledged');
      onUpdated(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge PIP', 'Error');
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div
      id={`pip_row_${pip.id}`}
      className={`p-5 rounded-2xl border transition-all space-y-4 ${
        pip.status === 'completed_successfully'
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
          : pip.status === 'escalated_action'
          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80 shadow-2xs'
          : isRepeat
          ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80 shadow-sm'
          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-sm'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>{pip.employeeName}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">({pip.employeeCode})</span>
            
            {/* Duration Tag */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {pip.durationDays}-Day Plan
            </span>

            {/* Cycle / Repeat Badge */}
            {isRepeat ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Cycle {pip.cycleNumber} (Repeat PIP)</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Cycle 1
              </span>
            )}

            {/* Status Tag */}
            {pip.status === 'completed_successfully' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>PASSED & RESTORED</span>
              </span>
            ) : pip.status === 'escalated_action' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                SEPARATION INITIATED
              </span>
            ) : pip.status === 'extended' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                EXTENDED (+30 Days)
              </span>
            ) : null}
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>Manager: <strong className="text-slate-800 dark:text-slate-200">{pip.managerName}</strong></span>
            <span>•</span>
            <span>Dept: {pip.department}</span>
            <span>•</span>
            <span>Target Completion: <strong className="text-slate-800 dark:text-slate-200">{pip.targetEndDate}</strong></span>
            {pip.previousPipOutcome && (
              <>
                <span>•</span>
                <span className="text-amber-700 dark:text-amber-400 font-medium">Prior Record: {pip.previousPipOutcome}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Employee Acknowledgment Button */}
          {isEmployee && !pip.signatures?.employeeAck && !isConcluded && (
            <button
              onClick={handleEmployeeAcknowledge}
              disabled={isAcknowledging}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAcknowledging ? 'Acknowledging...' : 'Acknowledge Plan'}</span>
            </button>
          )}

          {/* Add Checkin Button */}
          {(isManager || isHrOrAdmin) && !isConcluded && (
            <button
              id={`btn_manage_pip_${pip.id}`}
              onClick={() => onOpenCheckin(pip)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Check-in</span>
            </button>
          )}

          {/* Conclude Button (HR) */}
          {isHrOrAdmin && !isConcluded && (
            <button
              onClick={() => onOpenConclude(pip)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Conclude Plan</span>
            </button>
          )}

          {/* PDF Legal Dossier Export Button */}
          <button
            onClick={() => downloadPipDossierPdf(pip)}
            title="Download Official Legal PIP Dossier (PDF)"
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Legal Dossier (PDF)</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-slate-600 dark:text-slate-400">Milestone Progression</span>
          <span className="text-indigo-700 dark:text-indigo-400 font-mono font-bold">{pip.overallProgress}% Completed</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pip.status === 'completed_successfully'
                ? 'bg-emerald-500'
                : pip.status === 'escalated_action'
                ? 'bg-rose-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${pip.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Milestones Chips with Click-to-Toggle Status */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Target Milestones & SLA Adherence (Click chip to toggle progress)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {pip.milestones.map((m) => (
            <div
              key={m.id}
              onClick={() => (isManager || isHrOrAdmin) && handleToggleMilestone(m.id, m.status)}
              className={`p-3 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                isManager || isHrOrAdmin ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500' : ''
              } ${
                m.status === 'met'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div>
                <div className="font-bold text-[11px] flex items-center gap-1">
                  {m.status === 'met' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                  <span>{m.title}</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Target: {m.targetMetric}</div>
                <div className="text-[9px] text-slate-400 font-mono mt-1">Due: {m.dueDate}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                  m.status === 'met'
                    ? 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                }`}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Bi-Weekly Check-in */}
      {pip.checkins.length > 0 && (
        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 space-y-1">
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Latest Bi-Weekly Check-in ({pip.checkins.length} recorded)</span>
          </div>
          <div className="text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-start justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                Week {pip.checkins[pip.checkins.length - 1].weekNumber} ({pip.checkins[pip.checkins.length - 1].date}):
              </span>{' '}
              <span>{pip.checkins[pip.checkins.length - 1].managerNotes}</span>
              {pip.checkins[pip.checkins.length - 1].actionItems && (
                <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium mt-1">
                  Action Item: {pip.checkins[pip.checkins.length - 1].actionItems}
                </div>
              )}
            </div>
            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              {pip.checkins[pip.checkins.length - 1].ratingOutOf5} ★
            </span>
          </div>
        </div>
      )}

      {/* Tri-Party Legal Sign-Off Status Bar */}
      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Manager Sign */}
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Manager Sign-off: <strong className="text-slate-900 dark:text-white">{pip.signatures?.managerSign?.signedBy || pip.managerName}</strong></span>
          </div>

          {/* HR Sign */}
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>HR Sign-off: <strong className="text-slate-900 dark:text-white">{pip.signatures?.hrSign?.signedBy || 'HR Compliance'}</strong></span>
          </div>

          {/* Employee Ack */}
          <div className="flex items-center gap-1">
            {pip.signatures?.employeeAck ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Employee Acknowledged ({new Date(pip.signatures.employeeAck.signedAt).toLocaleDateString()})</span>
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Employee Acknowledgment</span>
              </span>
            )}
          </div>
        </div>

        {pip.finalOutcome && (
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Concluded by <strong>{pip.finalOutcome.decidedBy}</strong> on {new Date(pip.finalOutcome.decidedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

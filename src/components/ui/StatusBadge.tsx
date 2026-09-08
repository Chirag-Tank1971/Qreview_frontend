import React from 'react';
import { Clock, CheckCircle2, Award, UserCheck, Lock, Check } from 'lucide-react';
import { ReviewStatus, EmployeeStatus } from '../../types';

interface ReviewStatusBadgeProps {
  status: ReviewStatus | string;
  managerName?: string;
  className?: string;
}

export const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({
  status,
  managerName,
  className = '',
}) => {
  switch (status) {
    case 'DRAFT':
    case 'ASSIGNED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}>
          Draft
        </span>
      );
    case 'MANAGER_PENDING':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1 ${className}`}>
          <Clock className="w-3 h-3" />
          <span>Mgr Pending</span>
        </span>
      );
    case 'MANAGER_COMPLETED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1 ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          <span>Mgr Completed</span>
        </span>
      );
    case 'HOD_COMPLETED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center space-x-1 ${className}`}>
          <Award className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          <span>HOD Completed</span>
        </span>
      );
    case 'HR_PENDING':
    case 'HR_COMPLETED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1 ${className}`}>
          <UserCheck className="w-3 h-3" />
          <span>HR Review</span>
        </span>
      );
    case 'RETURNED':
      return (
        <div className={`flex flex-col gap-0.5 ${className}`}>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 w-max">
            Returned
          </span>
          {managerName && (
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium px-1">
              to {managerName.split(' ')[0]}
            </span>
          )}
        </div>
      );
    case 'CLOSED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1 ${className}`}>
          <Lock className="w-3 h-3" />
          <span>Closed</span>
        </span>
      );
    default:
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ${className}`}>
          {status}
        </span>
      );
  }
};

interface AppraisalStatusBadgeProps {
  status: string;
  className?: string;
}

export const AppraisalStatusBadge: React.FC<AppraisalStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1 ${className}`}>
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>
      );
    case 'MANAGER_RECOMMENDED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1 ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          <span>Mgr Rec</span>
        </span>
      );
    case 'HOD_CALIBRATED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center space-x-1 ${className}`}>
          <Award className="w-3 h-3" />
          <span>HOD Calibrated</span>
        </span>
      );
    case 'HR_APPROVED':
    case 'APPROVED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1 ${className}`}>
          <UserCheck className="w-3 h-3" />
          <span>HR Approved</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1 ${className}`}>
          <Check className="w-3 h-3" />
          <span>Completed</span>
        </span>
      );
    case 'LOCKED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center space-x-1 ${className}`}>
          <Lock className="w-3 h-3" />
          <span>Locked</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}>
          Rejected
        </span>
      );
    default:
      return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ${className}`}>
          {status}
        </span>
      );
  }
};

interface EmployeeStatusBadgeProps {
  status?: EmployeeStatus | string;
  className?: string;
}

export const EmployeeStatusBadge: React.FC<EmployeeStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  if (!status || status === 'ACTIVE') return null;

  switch (status) {
    case 'INACTIVE':
      return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 tracking-wide flex items-center gap-0.5 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>INACTIVE</span>
        </span>
      );
    case 'NOTICE':
      return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 tracking-wide flex items-center gap-0.5 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>NOTICE</span>
        </span>
      );
    case 'PROBATION':
      return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 tracking-wide flex items-center gap-0.5 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>PROBATION</span>
        </span>
      );
    default:
      return null;
  }
};

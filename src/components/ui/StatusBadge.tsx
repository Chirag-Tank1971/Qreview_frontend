import React from 'react';
import { Clock, CheckCircle2, Award, UserCheck, Lock, Check } from 'lucide-react';
import { ReviewStatus, EmployeeStatus } from '../../types';
import { cn } from '../../utils/cn';

export interface StatusBadgeProps {
  status: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  tone = 'default',
  size = 'md',
  icon,
  className = '',
  children,
}) => {
  const toneClasses = {
    default:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary:
      'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    success:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger:
      'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    info:
      'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  }[tone];

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.2',
    md: 'text-[11px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-[4px] border select-none tabular-nums',
        sizeClasses,
        toneClasses,
        className
      )}
    >
      {icon}
      <span>{children || status}</span>
    </span>
  );
};

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
        <StatusBadge status="Draft" tone="default" className={className} />
      );
    case 'MANAGER_PENDING':
      return (
        <StatusBadge
          status="Mgr Pending"
          tone="warning"
          icon={<Clock className="w-3 h-3" />}
          className={className}
        />
      );
    case 'MANAGER_COMPLETED':
      return (
        <StatusBadge
          status="Mgr Completed"
          tone="primary"
          icon={<CheckCircle2 className="w-3 h-3" />}
          className={className}
        />
      );
    case 'HR_PENDING':
      return (
        <StatusBadge
          status="HR Review"
          tone="info"
          icon={<UserCheck className="w-3 h-3" />}
          className={className}
        />
      );
    case 'HR_COMPLETED':
      return (
        <StatusBadge
          status="HR Approved"
          tone="success"
          icon={<CheckCircle2 className="w-3 h-3" />}
          className={className}
        />
      );
    case 'RETURNED':
      return (
        <div className={cn('flex flex-col gap-0.5', className)}>
          <StatusBadge status="Returned" tone="danger" />
          {managerName && (
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium px-0.5">
              to {managerName.split(' ')[0]}
            </span>
          )}
        </div>
      );
    case 'CLOSED':
      return (
        <StatusBadge
          status="Closed"
          tone="success"
          icon={<Lock className="w-3 h-3" />}
          className={className}
        />
      );
    default:
      return (
        <StatusBadge status={status} tone="default" className={className} />
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
        <StatusBadge
          status="Pending"
          tone="warning"
          icon={<Clock className="w-3 h-3" />}
          className={className}
        />
      );
    case 'MANAGER_RECOMMENDED':
      return (
        <StatusBadge
          status="Mgr Rec"
          tone="primary"
          icon={<CheckCircle2 className="w-3 h-3" />}
          className={className}
        />
      );
    case 'HOD_CALIBRATED':
      return (
        <StatusBadge
          status="HOD Calibrated"
          tone="info"
          icon={<Award className="w-3 h-3" />}
          className={className}
        />
      );
    case 'HR_APPROVED':
    case 'APPROVED':
      return (
        <StatusBadge
          status="HR Approved"
          tone="primary"
          icon={<UserCheck className="w-3 h-3" />}
          className={className}
        />
      );
    case 'COMPLETED':
      return (
        <StatusBadge
          status="Completed"
          tone="success"
          icon={<Check className="w-3 h-3" />}
          className={className}
        />
      );
    case 'LOCKED':
      return (
        <StatusBadge
          status="Locked"
          tone="default"
          icon={<Lock className="w-3 h-3" />}
          className={className}
        />
      );
    case 'REJECTED':
      return (
        <StatusBadge status="Rejected" tone="danger" className={className} />
      );
    default:
      return (
        <StatusBadge status={status} tone="default" className={className} />
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
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 select-none tabular-nums',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>INACTIVE</span>
        </span>
      );
    case 'NOTICE':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 select-none tabular-nums',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>NOTICE</span>
        </span>
      );
    case 'PROBATION':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 select-none tabular-nums',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>PROBATION</span>
        </span>
      );
    default:
      return null;
  }
};

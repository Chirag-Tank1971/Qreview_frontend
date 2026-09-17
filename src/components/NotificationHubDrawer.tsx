import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  Briefcase,
  Building2,
  Award,
  DollarSign,
  FileText,
  X,
  Sparkles,
  Layers,
  BarChart3,
  FileSpreadsheet,
  CheckSquare,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Notification, User } from '../types';
import { api } from '../services/api';

export interface WorkflowNavigationTarget {
  tab: 'portal' | 'appraisals' | 'reviews' | 'kras' | 'employees' | 'reports';
  sectionLabel: string;
  badgeLabel: string;
  badgeColor: string;
  config?: Record<string, any>;
}

interface NotificationHubDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigate?: (tab: string, options?: any) => void;
}

export const NotificationHubDrawer: React.FC<NotificationHubDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, currentUser]);

  // Pending Deletion with 3s Undo State
  interface PendingDeletion {
    notification: Notification;
    index: number;
    timeoutId: ReturnType<typeof setTimeout>;
    intervalId: ReturnType<typeof setInterval>;
    secondsRemaining: number;
  }

  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const pendingRef = useRef<PendingDeletion | null>(null);
  pendingRef.current = pendingDeletion;

  const isDeletingRef = useRef(false);
  const isUndoingRef = useRef(false);

  // Cleanup on unmount - commit any pending deletion
  useEffect(() => {
    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timeoutId);
        clearInterval(pendingRef.current.intervalId);
        api.deleteNotification(pendingRef.current.notification.id).catch(console.error);
      }
    };
  }, []);

  const handleRemoveNotification = (id: string, e?: React.SyntheticEvent | MouseEvent) => {
    if (e) e.stopPropagation();

    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    setTimeout(() => {
      isDeletingRef.current = false;
    }, 400);

    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timeoutId);
      clearInterval(pendingRef.current.intervalId);
      api.deleteNotification(pendingRef.current.notification.id).catch(console.error);
    }

    const notifIndex = notifications.findIndex((n) => n.id === id);
    const targetNotif = notifications[notifIndex];
    if (!targetNotif) return;

    // Optimistically remove from visible list
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    let secondsLeft = 3;
    const intervalId = setInterval(() => {
      secondsLeft -= 1;
      setPendingDeletion((prev) => {
        if (!prev) return null;
        return { ...prev, secondsRemaining: Math.max(0, secondsLeft) };
      });
    }, 1000);

    const timeoutId = setTimeout(async () => {
      clearInterval(intervalId);
      try {
        await api.deleteNotification(targetNotif.id);
      } catch (err) {
        console.error('Failed to commit deletion on server:', err);
      }
      setPendingDeletion(null);
    }, 3000);

    setPendingDeletion({
      notification: targetNotif,
      index: notifIndex,
      timeoutId,
      intervalId,
      secondsRemaining: 3,
    });
  };

  const handleUndoDelete = (e?: React.SyntheticEvent | MouseEvent | TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isUndoingRef.current) return;
    isUndoingRef.current = true;
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 400);

    const currentPending = pendingRef.current || pendingDeletion;
    if (!currentPending) return;

    clearTimeout(currentPending.timeoutId);
    clearInterval(currentPending.intervalId);

    const restored = currentPending.notification;
    const originalIdx = currentPending.index;

    setNotifications((prev) => {
      if (prev.some((n) => n.id === restored.id)) return prev;
      const next = [...prev];
      if (originalIdx >= 0 && originalIdx <= next.length) {
        next.splice(originalIdx, 0, restored);
      } else {
        next.unshift(restored);
      }
      return next;
    });

    pendingRef.current = null;
    setPendingDeletion(null);
  };

  const handleDismissUndoToast = (e?: React.SyntheticEvent | MouseEvent | TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const currentPending = pendingRef.current || pendingDeletion;
    if (!currentPending) return;

    clearTimeout(currentPending.timeoutId);
    clearInterval(currentPending.intervalId);
    api.deleteNotification(currentPending.notification.id).catch(console.error);
    pendingRef.current = null;
    setPendingDeletion(null);
  };

  const handleCompleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.completeNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to complete notification:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || (n as any)._id === id ? { ...n, isRead: true } : n))
    );
    const unreadRemaining = notifications.filter((n) => !n.isRead && n.id !== id && (n as any)._id !== id).length;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { count: unreadRemaining } }));
    }
    try {
      await api.markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { count: 0 } }));
    }
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'HOD_ACTION_REQUIRED':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'BUDGET_ALERT':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'CALIBRATION_WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'APPRAISAL_DUE':
        return <Award className="w-4 h-4 text-indigo-600" />;
      case 'LETTER_ACKNOWLEDGED':
      case 'LETTER_RELEASED':
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'HIGH') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
          Action Required
        </span>
      );
    }
    if (priority === 'MEDIUM') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Alert
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
        Info
      </span>
    );
  };

  /**
   * Determine exact target workflow destination and configuration based on notification metadata
   */
  const getWorkflowTarget = (notif: Notification): WorkflowNavigationTarget => {
    const meta = notif.metadata || {};

    switch (notif.type) {
      case 'BUDGET_ALERT':
        return {
          tab: 'appraisals',
          sectionLabel: 'Department Budget Pool Tracking',
          badgeLabel: 'Budget Controls',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          config: {
            activeSection: meta.activeSection || 'bellCurveAnalytics',
            cycleId: meta.cycleId || 'cycle_f',
            ...meta,
          },
        };

      case 'CALIBRATION_WARNING':
        return {
          tab: 'appraisals',
          sectionLabel: 'Bell Curve Normalization & Distribution',
          badgeLabel: 'Bell Curve',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          config: {
            activeSection: meta.activeSection || 'bellCurveAnalytics',
            departmentId: meta.departmentId || 'dept_sales',
            ...meta,
          },
        };

      case 'HOD_ACTION_REQUIRED':
        return {
          tab: 'appraisals',
          sectionLabel: 'HOD Departmental Calibration',
          badgeLabel: 'Appraisal List',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          config: {
            activeSection: 'appraisals',
            status: meta.status === 'CALIBRATED' || meta.status === 'HOD_CALIBRATED' ? 'HOD_CALIBRATED' : (meta.status || 'ALL'),
            cycleId: meta.cycleId || 'ALL',
            appraisalId: meta.appraisalId,
            openDetail: true,
            ...meta,
          },
        };

      case 'LETTER_ACKNOWLEDGED':
        return {
          tab: 'appraisals',
          sectionLabel: 'Appraisal Letters & Acknowledgements',
          badgeLabel: 'Digital Letters',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          config: {
            activeSection: 'appraisals',
            status: 'ALL',
            appraisalId: meta.appraisalId || '',
            openLetter: meta.openLetter !== undefined ? meta.openLetter : !!meta.appraisalId,
            ...meta,
          },
        };

      case 'LETTER_RELEASED':
        if (currentUser?.role === 'EMPLOYEE') {
          return {
            tab: 'portal',
            sectionLabel: 'Employee Appraisal Letter',
            badgeLabel: 'ESS Portal',
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            config: {
              subTab: meta.subTab || 'appraisal',
              appraisalId: meta.appraisalId,
              openLetter: meta.openLetter !== undefined ? meta.openLetter : true,
              ...meta,
            },
          };
        }
        return {
          tab: 'appraisals',
          sectionLabel: 'Appraisal Letters Release',
          badgeLabel: 'Letter Release',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          config: {
            activeSection: 'appraisals',
            status: 'HR_APPROVED',
            appraisalId: meta.appraisalId,
            openDetail: true,
            ...meta,
          },
        };

      case 'APPRAISAL_DUE':
        if (currentUser?.role === 'EMPLOYEE') {
          return {
            tab: 'portal',
            sectionLabel: 'Annual Appraisal Rollup',
            badgeLabel: 'ESS Portal',
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            config: { subTab: meta.subTab || 'appraisal', ...meta },
          };
        }
        return {
          tab: 'appraisals',
          sectionLabel: 'Annual Appraisal Cycle Cohort',
          badgeLabel: 'Appraisals',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          config: {
            activeSection: meta.activeSection || 'appraisals',
            cycleId: meta.cycleId || 'cycle_f',
            ...meta,
          },
        };

      case 'REVIEW_ASSIGNED':
      case 'DUE_SOON':
      case 'OVERDUE':
        if (currentUser?.role === 'EMPLOYEE') {
          return {
            tab: 'portal',
            sectionLabel: 'Employee Self-Assessment',
            badgeLabel: 'ESS Portal',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            config: {
              ...meta,
              subTab: 'reviews',
              periodId: meta.periodId || 'period_2026_q1',
              reviewId: meta.reviewId,
            },
          };
        }
        return {
          tab: 'reviews',
          sectionLabel: 'Quarterly Reviews (Scoring)',
          badgeLabel: 'Quarterly Reviews',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          config: {
            ...meta,
            status: meta.reviewId ? 'ALL' : (meta.status === 'SELF_ASSESSED' ? 'MANAGER_PENDING' : (meta.status || 'ALL')),
            periodId: meta.periodId || 'period_2026_q1',
            reviewId: meta.reviewId,
          },
        };

      case 'MANAGER_SUBMITTED':
        return {
          tab: 'reviews',
          sectionLabel: 'HR Calibration & Review Approval',
          badgeLabel: 'Quarterly Reviews',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          config: {
            ...meta,
            status: meta.reviewId ? 'ALL' : (meta.status || 'HR_PENDING'),
            periodId: meta.periodId,
            reviewId: meta.reviewId,
          },
        };

      case 'RETURNED':
        if (currentUser?.role === 'EMPLOYEE') {
          return {
            tab: 'portal',
            sectionLabel: 'Returned Self-Assessment',
            badgeLabel: 'ESS Portal',
            badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
            config: {
              subTab: 'reviews',
              status: 'RETURNED',
              reviewId: meta.reviewId,
              ...meta,
            },
          };
        }
        return {
          tab: 'reviews',
          sectionLabel: 'Returned Quarterly Reviews',
          badgeLabel: 'Review Action',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          config: {
            ...meta,
            status: meta.reviewId ? 'ALL' : (meta.status || 'RETURNED'),
            reviewId: meta.reviewId,
          },
        };

      case 'HR_COMPLETED':
        if (currentUser?.role === 'EMPLOYEE') {
          return {
            tab: 'portal',
            sectionLabel: 'Completed Performance Review',
            badgeLabel: 'ESS Portal',
            badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
            config: {
              subTab: 'reviews',
              status: 'HR_COMPLETED',
              reviewId: meta.reviewId,
              ...meta,
            },
          };
        }
        return {
          tab: 'reviews',
          sectionLabel: 'Completed Reviews Archive',
          badgeLabel: 'Archived Reviews',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          config: {
            ...meta,
            status: meta.reviewId ? 'ALL' : (meta.status || 'HR_COMPLETED'),
            reviewId: meta.reviewId,
          },
        };

      default:
        if (notif.title.toLowerCase().includes('report') || notif.message.toLowerCase().includes('report')) {
          return {
            tab: 'reports',
            sectionLabel: 'Executive & Compliance Reports',
            badgeLabel: 'Reports Center',
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          };
        }
        if (notif.title.toLowerCase().includes('kra') || notif.message.toLowerCase().includes('kra')) {
          return {
            tab: 'kras',
            sectionLabel: 'KRA Templates & Goal Library',
            badgeLabel: 'KRA Goal Library',
            badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          };
        }
        return {
          tab: 'portal',
          sectionLabel: 'Employee Self-Service',
          badgeLabel: 'ESS Portal',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const handleOpenWorkflow = (notif: Notification) => {
    const target = getWorkflowTarget(notif);
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    onClose();
    if (onNavigate) {
      onNavigate(target.tab, target.config);
    }
  };

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return (
    <>
      {createPortal(
        <div
          className="fixed inset-0 z-[9999] overflow-hidden flex justify-end bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={onClose}
        >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-screen shadow-overlay flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-180"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Notifications Hub</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-[4px] text-[10px] font-semibold tabular-nums">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Workflow alerts, calibration requests, and cycle milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[4px] transition-colors cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Account: <strong className="text-slate-800 dark:text-slate-200 font-medium">{currentUser?.name}</strong></span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px] cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">All caught up</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">No pending workflow actions for your role.</p>
            </div>
          ) : (
            notifications.map((notif, idx) => {
              const target = getWorkflowTarget(notif);
              return (
                <div
                  key={`${notif.id || (notif as any)._id || 'notif'}_${idx}`}
                  className={`p-3 rounded-[6px] transition-colors border ${notif.isRead
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50 text-slate-900 dark:text-white'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-1 rounded-[4px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-0.5 shrink-0">
                        {getIconForType(notif.type)}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white break-words">{notif.title}</span>
                          {getPriorityBadge(notif.priority)}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">{notif.message}</p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3 shrink-0" />
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 font-semibold px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-md shadow-2xs hover:bg-indigo-50 dark:hover:bg-indigo-950/60 cursor-pointer"
                          title="Mark as read"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={(e) => handleRemoveNotification(notif.id, e)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200/60 dark:border-rose-800/60 transition-colors cursor-pointer shadow-2xs"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Direct Action Link & Destination Badge */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-400 dark:text-slate-500 font-medium shrink-0">Target:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border truncate ${target.badgeColor}`}
                        title={target.sectionLabel}
                      >
                        {target.sectionLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id={`btn-open-workflow-${notif.id}`}
                        onClick={() => handleOpenWorkflow(notif)}
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800 transition-colors shrink-0 cursor-pointer shadow-2xs"
                      >
                        <span>Open Workflow</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Automated Notifications & Workflow Actions</span>
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">● Active Engine</span>
        </div>
      </div>
    </div>,
    document.body
  )}

      {/* Floating 3-Second Undo Notification Snackbar */}
      {pendingDeletion && typeof document !== 'undefined' && createPortal(
        <div
          className="pointer-events-auto"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '12px',
            right: '12px',
            maxWidth: '460px',
            marginLeft: 'auto',
            marginRight: 'auto',
            zIndex: 9999999,
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-2xl px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-3 ring-2 ring-indigo-500/40">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <Trash2 className="w-4 h-4" />
              </div>

              <div className="flex flex-col min-w-0 flex-1 pr-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">
                    Notification removed
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-slate-800 text-indigo-400 border border-slate-700 shrink-0">
                    {pendingDeletion.secondsRemaining}s
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 truncate">
                  "{pendingDeletion.notification.title}"
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUndoDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer transform active:scale-95 touch-manipulation select-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={handleDismissUndoToast}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer touch-manipulation"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { api } from '../services/api';
import { NotificationHubDrawer } from './NotificationHubDrawer';
import {
  Shield,
  UserCheck,
  Building2,
  Briefcase,
  Layers,
  LogOut,
  ChevronDown,
  Sparkles,
  Bell,
  LogIn,
  User as UserIcon,
  Calendar,
} from 'lucide-react';

interface HeaderProps {
  onNavigate?: (tab: string, options?: any) => void;
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenLogin }) => {
  const { user, employeeProfile, logout, isLoading } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const notifs = await api.getNotifications();
      if (Array.isArray(notifs)) {
        setUnreadNotifCount(notifs.filter((n) => !n.isRead).length);
      }
    } catch (e) {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const roleConfigs: Record<
    UserRole,
    { label: string; icon: React.ComponentType<{ className?: string }>; badgeColor: string }
  > = {
    SUPER_ADMIN: { label: 'Super Admin', icon: Shield, badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    HR: { label: 'HR Manager', icon: UserCheck, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    MANAGER: { label: 'Reporting Manager', icon: Briefcase, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    HOD: { label: 'Department Head (HOD)', icon: Building2, badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    EMPLOYEE: { label: 'Individual Contributor', icon: Layers, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    MANAGEMENT: { label: 'Executive Management', icon: Sparkles, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const currentRoleConfig = user ? roleConfigs[user.role] : roleConfigs.EMPLOYEE;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand / Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
                Quarterly Review & Appraisal Management
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Enterprise Performance & Calibration Portal
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <>
                {/* Workflow Notifications Bell Button */}
                <button
                  onClick={() => setIsNotificationOpen(true)}
                  id="workflow-notifications-btn"
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                  )}
                </button>

                {/* User Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    disabled={isLoading}
                    id="user-profile-menu-btn"
                    className="flex items-center space-x-2.5 p-1 pl-2 pr-3 rounded-full hover:bg-slate-50 transition-all text-xs font-medium border border-transparent hover:border-slate-200 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-2xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {currentRoleConfig.label}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Identity Card */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${currentRoleConfig.badgeColor}`}>
                            <RoleIcon className="w-3 h-3" />
                            {currentRoleConfig.label}
                          </span>
                          {employeeProfile?.cycleCode && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              Cycle {employeeProfile.cycleCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Employee Organization Metadata */}
                      {employeeProfile && (
                        <div className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Employee ID:</span>
                            <span className="font-mono font-medium text-slate-800">{employeeProfile.employeeCode}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Designation:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[150px]">{employeeProfile.designationName}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Department:</span>
                            <span className="font-medium text-slate-800">{employeeProfile.departmentName}</span>
                          </div>
                          {employeeProfile.cycleName && (
                            <div className="flex items-center justify-between text-slate-600 pt-0.5">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Cohort:
                              </span>
                              <span className="font-semibold text-indigo-700">{employeeProfile.cycleName}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Menu Actions */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onNavigate?.('portal');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>My Self-Service Portal</span>
                        </button>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-slate-100 pt-1 mt-1 px-1">
                        <button
                          onClick={async () => {
                            setIsProfileMenuOpen(false);
                            await logout();
                          }}
                          id="logout-btn"
                          className="w-full text-left px-3.5 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                id="header-sign-in-btn"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Automated Notifications & Workflow Actions Drawer */}
      <NotificationHubDrawer
        isOpen={isNotificationOpen}
        onClose={() => {
          setIsNotificationOpen(false);
          fetchUnreadCount();
        }}
        currentUser={user}
        onNavigate={onNavigate}
      />
    </header>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  Users,
  Check,
  Zap,
  Sun,
  Moon,
  Monitor,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onNavigate?: (tab: string, options?: any) => void;
  onOpenLogin?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenLogin, onOpenMobileMenu }) => {
  const { user, employeeProfile, logout, switchRole, isLoading } = useAuth();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const personaDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(event.target as Node)) {
        setIsPersonaMenuOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; badgeColor: string }
  > = {
    SUPER_ADMIN: { label: 'Super Admin', shortLabel: 'Admin', icon: Shield, badgeColor: 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60' },
    HR: { label: 'HR Manager', shortLabel: 'HR Mgr', icon: UserCheck, badgeColor: 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60' },
    MANAGER: { label: 'Reporting Manager', shortLabel: 'Manager', icon: Briefcase, badgeColor: 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60' },
    HOD: { label: 'Department Head (HOD)', shortLabel: 'HOD', icon: Building2, badgeColor: 'bg-purple-50/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60' },
    EMPLOYEE: { label: 'Individual Contributor', shortLabel: 'Employee', icon: Layers, badgeColor: 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60' },
    MANAGEMENT: { label: 'Executive Management', shortLabel: 'Executive', icon: Sparkles, badgeColor: 'bg-rose-50/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60' },
  };

  const currentRoleConfig = user ? roleConfigs[user.role] : roleConfigs.EMPLOYEE;
  const RoleIcon = currentRoleConfig.icon;

  const quickPersonas = [
    { role: 'SUPER_ADMIN' as UserRole, name: 'System Admin', title: 'Super Admin', userId: 'usr_sa', icon: Shield, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900' },
    { role: 'HR' as UserRole, name: 'Frank HR Manager', title: 'HR Manager', userId: 'usr_mgr_hr', icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900' },
    { role: 'MANAGER' as UserRole, name: 'Dave Eng Manager', title: 'Reporting Manager', userId: 'usr_mgr_eng', icon: Briefcase, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-900' },
    { role: 'HOD' as UserRole, name: 'Alice Engineering HOD', title: 'Dept Head (HOD)', userId: 'usr_hod_eng', icon: Building2, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-100 dark:border-purple-900' },
    { role: 'MANAGEMENT' as UserRole, name: 'Executive Management', title: 'C-Suite / Board', userId: 'usr_mgmt_persona', icon: Sparkles, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-900' },
    { role: 'EMPLOYEE' as UserRole, name: 'Grace Engineer', title: 'Employee (ESS)', userId: 'usr_com_1', icon: Layers, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900' },
  ];

  const handleQuickSwitch = async (p: typeof quickPersonas[0]) => {
    try {
      setIsSwitchingRole(true);
      setIsPersonaMenuOpen(false);
      await switchRole(p.role, p.userId);
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 sticky top-0 z-40 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand / Title */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
            {/* Mobile Hamburger Drawer Button */}
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors md:hidden cursor-pointer"
              aria-label="Open navigation menu"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-500/25 ring-1 ring-black/5 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  <span className="hidden sm:inline">Performance & Appraisal System</span>
                  <span className="inline sm:hidden">Appraisal System</span>
                </h1>
                <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block font-medium truncate">
                Continuous 4-Quarter Reviews & Staggered Cohort Calibration
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {user ? (
              <>
                {/* Quick Persona Switcher */}
                <div className="relative" ref={personaDropdownRef}>
                  <button
                    onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                    disabled={isSwitchingRole || isLoading}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                    title="Quick Role Persona Switcher"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400 font-medium">Role:</span>
                    <span className="text-slate-900 dark:text-white font-semibold hidden xs:inline">{currentRoleConfig.shortLabel}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  {isPersonaMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
                      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Fast Persona Switcher</span>
                        </div>
                        <span className="text-[10px] text-slate-400">RBAC Demo</span>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {quickPersonas.map((p) => {
                          const IconComponent = p.icon;
                          const isCurrent = user.role === p.role;
                          return (
                            <button
                              key={p.role}
                              onClick={() => handleQuickSwitch(p)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-semibold border border-indigo-200/60 dark:border-indigo-800/60'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${p.color}`}>
                                  <IconComponent className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-left">
                                  <div className="text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100">{p.name}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{p.title}</div>
                                </div>
                              </div>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 1-Click Universal Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  id="theme-toggle-btn"
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 active:scale-95"
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle Theme"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
                  )}
                </button>

                {/* Workflow Notifications Bell Button */}
                <button
                  onClick={() => setIsNotificationOpen(true)}
                  id="workflow-notifications-btn"
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 active:scale-95"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                  )}
                </button>

                {/* User Profile Menu */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    disabled={isLoading}
                    id="user-profile-menu-btn"
                    className="flex items-center space-x-2 p-1 pl-2 pr-2.5 rounded-full hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all text-xs font-medium border border-slate-200/60 dark:border-slate-700/70 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {currentRoleConfig.label}
                      </p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5 dark:ring-white/5">
                      {/* User Identity Card */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-slate-700 shadow-2xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">{user.email}</p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${currentRoleConfig.badgeColor}`}>
                            <RoleIcon className="w-3 h-3" />
                            {currentRoleConfig.label}
                          </span>
                          {employeeProfile?.cycleCode && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Cycle {employeeProfile.cycleCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Employee Organization Metadata */}
                      {employeeProfile && (
                        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span className="text-slate-400 dark:text-slate-500">Employee ID:</span>
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{employeeProfile.employeeCode}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span className="text-slate-400 dark:text-slate-500">Designation:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{employeeProfile.designationName}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                            <span className="text-slate-400 dark:text-slate-500">Department:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{employeeProfile.departmentName}</span>
                          </div>
                          {employeeProfile.cycleName && (
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-0.5">
                              <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Cohort:
                              </span>
                              <span className="font-semibold text-indigo-700 dark:text-indigo-400">{employeeProfile.cycleName}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Menu Actions */}
                      <div className="py-1 px-1">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onNavigate?.('portal');
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>My Self-Service Portal</span>
                        </button>
                      </div>

                      {/* Theme Mode Selector Inside Dropdown */}
                      <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Theme Appearance</span>
                          <span className="capitalize text-slate-500 dark:text-slate-400 font-semibold">{theme}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setTheme('light')}
                            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                              theme === 'light'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Sun className="w-3 h-3" />
                            <span>Light</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme('dark')}
                            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Moon className="w-3 h-3" />
                            <span>Dark</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme('system')}
                            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                              theme === 'system'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Monitor className="w-3 h-3" />
                            <span>Auto</span>
                          </button>
                        </div>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 px-1">
                        <button
                          onClick={async () => {
                            setIsProfileMenuOpen(false);
                            await logout();
                          }}
                          id="logout-btn"
                          className="w-full text-left px-3.5 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 font-medium transition-colors cursor-pointer"
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
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-indigo-500/20 active:scale-95"
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

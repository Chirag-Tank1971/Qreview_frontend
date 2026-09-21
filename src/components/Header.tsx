import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';
import { UserRole } from '../types';
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
  Sun,
  Moon,
  Monitor,
  Menu,
  Award,
  TrendingUp,
  BarChart3,
  Target,
  Upload,
  Settings,
  Grid,
} from 'lucide-react';

interface HeaderProps {
  currentView?: string;
  onSelectView?: (view: any) => void;
  onNavigate?: (tab: string, options?: any) => void;
  onOpenLogin?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onNavigate,
  onOpenLogin,
  onOpenMobileMenu,
}) => {
  const { user, employeeProfile, logout, switchRole, isLoading } = useAuth();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const { unreadCount: unreadNotifCount } = useNotifications();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const personaDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(event.target as Node)) {
        setIsPersonaMenuOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPersonaMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsAdminOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const roleConfigs: Record<
    UserRole,
    { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    SUPER_ADMIN: { label: 'Super Admin', shortLabel: 'Admin', icon: Shield },
    HR: { label: 'HR Manager', shortLabel: 'HR Mgr', icon: UserCheck },
    MANAGER: { label: 'Reporting Manager', shortLabel: 'Manager', icon: Briefcase },
    REPORTING_MANAGER: { label: 'Reporting Manager', shortLabel: 'Manager', icon: Briefcase },
    HOD: { label: 'Department Head (HOD)', shortLabel: 'HOD', icon: Building2 },
    EMPLOYEE: { label: 'Individual Contributor', shortLabel: 'Employee', icon: Layers },
    MANAGEMENT: { label: 'Executive Management', shortLabel: 'Executive', icon: Sparkles },
  };

  const currentRoleConfig = user ? roleConfigs[user.role] : roleConfigs.EMPLOYEE;

  const quickPersonas = [
    { role: 'SUPER_ADMIN' as UserRole, name: 'System Admin', title: 'Super Admin', userId: 'usr_sa', icon: Shield },
    { role: 'HR' as UserRole, name: 'Frank HR Manager', title: 'HR Manager', userId: 'usr_mgr_hr', icon: UserCheck },
    { role: 'MANAGER' as UserRole, name: 'Dave Eng Manager', title: 'Reporting Manager', userId: 'usr_mgr_eng', icon: Briefcase },
    { role: 'HOD' as UserRole, name: 'Nikhilesh Srivastava', title: 'Dept Head (HOD)', userId: 'usr_hod_nikhilesh', icon: Building2 },
    { role: 'MANAGEMENT' as UserRole, name: 'Executive Management', title: 'C-Suite / Board', userId: 'usr_mgmt_persona', icon: Sparkles },
    { role: 'EMPLOYEE' as UserRole, name: 'Grace Engineer', title: 'Employee (ESS)', userId: 'usr_com_1', icon: Layers },
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

  const handleSelectTab = (viewId: string) => {
    if (onSelectView) {
      onSelectView(viewId);
    } else if (onNavigate) {
      onNavigate(viewId);
    }
  };

  const viewTitles: Record<string, { group: string; label: string }> = {
    portal: { group: 'Work', label: 'My Workspace' },
    management: { group: 'Work', label: 'Executive Analytics' },
    reviews: { group: 'Work', label: user?.role === 'EMPLOYEE' ? 'My Reviews' : 'Quarterly Reviews' },
    appraisals: { group: 'Work', label: 'Annual Appraisals' },
    reports: { group: 'Work', label: 'Reports Center' },
    employees: { group: 'People', label: 'Employee Directory' },
    hierarchy: { group: 'People', label: 'Department & Hierarchy' },
    kras: { group: 'Configuration', label: 'Goal Templates (KRAs)' },
    bulk: { group: 'Configuration', label: 'Bulk Data Manager' },
    ai_performance: { group: 'Configuration', label: 'AI Copilot & 360' },
    audit: { group: 'System', label: user?.role === 'HR' ? 'Appraisal Lifecycle' : 'Compliance & Audit Trail' },
    notifications: { group: 'System', label: 'Notifications Hub' },
  };

  const isCurrentViewAdmin = ['employees', 'hierarchy', 'kras', 'bulk', 'audit'].includes(currentView || '');

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 sticky top-0 z-40 transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Brand + Location Breadcrumbs */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Mobile Hamburger Drawer Button */}
              <button
                onClick={onOpenMobileMenu}
                className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden cursor-pointer"
                aria-label="Open navigation menu"
                title="Open Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Brand Logo & Title */}
              <button
                onClick={() => handleSelectTab('portal')}
                className="flex items-center gap-2.5 shrink-0 cursor-pointer text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:bg-blue-500 transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  MintReview System
                </span>
              </button>

              {/* Enterprise Location Breadcrumbs */}
              {currentView && viewTitles[currentView] && (
                <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">{viewTitles[currentView].group}</span>
                  <span className="text-slate-300 dark:text-slate-600 font-normal">/</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewTitles[currentView].label}</span>
                </div>
              )}
            </div>

            {/* Right: Utility Controls */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {user ? (
                <>
                  {/* Role Indicator / Switcher Pill */}
                  {(!import.meta.env.PROD || import.meta.env.VITE_ENABLE_DEMO_PERSONAS === 'true') ? (
                    <div className="relative" ref={personaDropdownRef}>
                      <button
                        onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                        disabled={isSwitchingRole || isLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                        title="Switch Persona Role"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="text-slate-500 dark:text-slate-400 hidden xs:inline">Role:</span>
                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[100px]">{currentRoleConfig.shortLabel}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>

                      {isPersonaMenuOpen && (
                        <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-[6px] shadow-dropdown border border-slate-200 dark:border-slate-800 p-1 z-50 animate-in fade-in duration-120">
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Switch Role
                          </div>
                          <div className="space-y-0.5 mt-0.5">
                            {quickPersonas.map((p) => {
                              const IconComponent = p.icon;
                              const isCurrent = user.role === p.role;
                              return (
                                <button
                                  key={p.role}
                                  onClick={() => handleQuickSwitch(p)}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] text-xs transition-colors cursor-pointer ${isCurrent
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-3.5 h-3.5 text-slate-500" />
                                    <div className="text-left">
                                      <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                                      <div className="text-[10px] text-slate-400">{p.title}</div>
                                    </div>
                                  </div>
                                  {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 select-none"
                      title={`Role: ${currentRoleConfig.label}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="text-slate-500 dark:text-slate-400 hidden xs:inline">Role:</span>
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-[100px]">{currentRoleConfig.shortLabel}</span>
                    </div>
                  )}

                  {/* Theme Toggle Button */}
                  <button
                    onClick={toggleTheme}
                    id="theme-toggle-btn"
                    className="p-1.5 rounded-[6px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle Theme"
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  {/* Workflow Notifications Bell Button */}
                  <button
                    onClick={() => onNavigate?.('notifications')}
                    id="workflow-notifications-btn"
                    className="relative p-1.5 rounded-[6px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={unreadNotifCount > 0 ? `${unreadNotifCount} unread notification${unreadNotifCount === 1 ? '' : 's'}` : 'Notifications'}
                    aria-label={`Notifications${unreadNotifCount > 0 ? ` (${unreadNotifCount} unread)` : ''}`}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-600 text-white text-[10px] font-semibold rounded-[4px] leading-none tabular-nums">
                        {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* User Profile Menu */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      disabled={isLoading}
                      id="user-profile-menu-btn"
                      className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-[6px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-medium text-[11px]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white hidden lg:inline max-w-[120px] truncate">
                        {user.name}
                      </span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-[6px] shadow-dropdown border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in duration-120">
                        {/* User Identity */}
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {currentRoleConfig.label}
                            </span>
                            {employeeProfile?.cycleCode && (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                Cycle {employeeProfile.cycleCode}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Employee Metadata */}
                        {employeeProfile && (
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                              <span className="text-slate-400">ID:</span>
                              <span className="font-mono">{employeeProfile.employeeCode}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                              <span className="text-slate-400">Role:</span>
                              <span className="truncate max-w-[150px]">{employeeProfile.designationName}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                              <span className="text-slate-400">Dept:</span>
                              <span>{employeeProfile.departmentName}</span>
                            </div>
                          </div>
                        )}

                        {/* Menu Actions */}
                        <div className="py-1 px-1">
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              handleSelectTab('portal');
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>My Space</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onNavigate?.('notifications');
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Bell className="w-3.5 h-3.5 text-slate-400" />
                              <span>Notifications</span>
                            </div>
                            {unreadNotifCount > 0 && (
                              <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full">
                                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Theme Mode Selector */}
                        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2">
                          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                            Appearance
                          </div>
                          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                            <button
                              type="button"
                              onClick={() => setTheme('light')}
                              className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] cursor-pointer ${theme === 'light'
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                                  : 'text-slate-500'
                                }`}
                            >
                              <Sun className="w-3 h-3" />
                              <span>Light</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTheme('dark')}
                              className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] cursor-pointer ${theme === 'dark'
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                                  : 'text-slate-500'
                                }`}
                            >
                              <Moon className="w-3 h-3" />
                              <span>Dark</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTheme('system')}
                              className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] cursor-pointer ${theme === 'system'
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                                  : 'text-slate-500'
                                }`}
                            >
                              <Monitor className="w-3 h-3" />
                              <span>Auto</span>
                            </button>
                          </div>
                        </div>

                        {/* Sign Out */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-1 px-1">
                          <button
                            onClick={async () => {
                              setIsProfileMenuOpen(false);
                              await logout();
                            }}
                            id="logout-btn"
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium cursor-pointer"
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
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Bottom Navigation Bar (Visible only on Mobile screens < md) */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 transition-colors duration-150">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* Tab 1: My Space */}
            <button
              onClick={() => handleSelectTab('portal')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${currentView === 'portal'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <UserIcon className="w-4 h-4" />
              <span className="text-[10px]">My Space</span>
            </button>

            {/* Tab 2: Reviews */}
            <button
              onClick={() => handleSelectTab('reviews')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${currentView === 'reviews'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <Award className="w-4 h-4" />
              <span className="text-[10px]">Reviews</span>
            </button>

            {/* Tab 3: Appraisals / Analytics */}
            {['SUPER_ADMIN', 'HR', 'MANAGEMENT'].includes(user.role) ? (
              <button
                onClick={() => handleSelectTab('appraisals')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${currentView === 'appraisals'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px]">Appraisals</span>
              </button>
            ) : user.role === 'HOD' ? (
              <button
                onClick={() => handleSelectTab('reports')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${currentView === 'reports'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-[10px]">Analytics</span>
              </button>
            ) : null}

            {/* Tab 4: Analytics (if Admin or HR) */}
            {['SUPER_ADMIN', 'HR'].includes(user.role) && (
              <button
                onClick={() => handleSelectTab('reports')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${currentView === 'reports'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-[10px]">Analytics</span>
              </button>
            )}

            {/* Tab 5: Menu / Admin */}
            <button
              onClick={onOpenMobileMenu}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer relative ${isCurrentViewAdmin
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <Grid className="w-4 h-4" />
              <span className="text-[10px]">Menu</span>
              {isCurrentViewAdmin && (
                <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
              )}
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
